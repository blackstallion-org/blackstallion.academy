# Anon privacy hardening (20261023001200): notes for the owner

**Status: prepared 23 Oct 2026, NOT applied anywhere.** Apply only with the owner's explicit approval, after the
pre-flight checks in section 4.

| File | Role |
| --- | --- |
| `migrations/20261023001200_anon_privacy_hardening.sql` | the migration (one transaction, re-runnable) |
| `rollback/20261023001200_anon_privacy_hardening_rollback.sql` | puts everything back (re-runnable) |
| `tests/35_anon_hardening_evidence.sql` | reproduces the five findings on the replica before the fix |
| `tests/40_anon_hardening_tests.sql` | behaviour after the migration has run twice |
| `tests/41_anon_hardening_rollback_tests.sql` | behaviour after the rollback has run twice (old behaviour back, privileges identical) |
| `tests/50_anon_hardening_after_layer_rollback_tests.sql` | migration re-applied, then the website layer rolled back underneath it |

Replica run (`bash supabase/live/tests/run.sh` as a non-root user): **179 passed, 0 failed** (75 existing + 104 new).

## 1. What changes, for which role

Only `anon` loses capabilities. What signed-in users can read is unchanged; no RLS policy, function body, column or
row of the operations schema is altered (the tests compare a fingerprint of all of them before and after).

| Who | Before | After |
| --- | --- | --- |
| **anon** (no login, publishable/anon key) | Reads every column of active horses, including `stall_cctv_rtsp_url` and `microchip_iso_id`; every hub column, including `revenue_share_percentage` and `contact_email`; all `achievements`; all `session_skills`. Inserts anything into `mou_requests`, `executive_appointments`, `qr_lead_captures`, without limit | Reads only the safe columns (below). `achievements`, `session_skills`: permission denied. Inserts still allowed, but must pass the 13 checks and are limited to 5 rows per 10 minutes per client per table |
| **authenticated**, role PARENT or no `public.users` row (anyone who signs up) | Reads per the existing policies | Reads unchanged. Direct inserts into the three intake tables: the checks, plus the same per-client limit as anon |
| **authenticated staff**: SUPER_ADMIN, SCHOOL_ADMIN, INSTRUCTOR, GROOM | Reads per the existing policies | Reads unchanged. Inserts: the checks only, never rate limited |
| **service_role**, dashboard (`postgres`), migrations | Unrestricted | The checks only |
| **Website** `submit_lead_v2` (SECURITY DEFINER, mirrors via `app_private.mirror_lead`) | Mirrors every lead it can | Never counted by the limiter (inside it `current_user` is the owner). Mirrored rows must pass the checks. A `?qr=` code that is not slug-like (spaces, dots, slashes, non-ASCII) is no longer mirrored; the lead itself is still stored |

**Columns anon can still read**

- `equine_fleet`: `id, hub_id, name, breed, height_hands, temperament, is_active, created_at` (RLS still shows anon
  active horses only). Hidden: `stall_cctv_rtsp_url`, `microchip_iso_id`.
- `school_hubs`: `id, school_name, slug, architectural_tier, address, latitude, longitude, is_active, created_at`.
  Hidden: `revenue_share_percentage`, `contact_email`.

The lists are explicit. The migration refuses to run if either table has a column the 23 Oct snapshot does not know
(decide whether anon may read it, then edit the list). It also aborts if anon can still read a protected column
afterwards, for example through a grant to PUBLIC or through membership in another role. Columns added later are not
readable by anon until someone grants them.

**The 13 NOT VALID checks** (they bind every role, on INSERT and UPDATE; existing rows are not scanned when they are added)

| Table | Constraint | Rule |
| --- | --- | --- |
| qr_lead_captures | `qr_lead_captures_hub_slug_format` | `^[A-Za-z0-9_-]{2,100}$` |
| | `qr_lead_captures_parent_name_not_blank` | at least one non-space character (NULL allowed) |
| | `qr_lead_captures_parent_phone_format` | phone rule (NULL allowed) |
| | `qr_lead_captures_device_info_length` | at most 10,000 characters |
| mou_requests | `mou_requests_school_name_not_blank`, `mou_requests_representative_name_not_blank` | at least one non-space character |
| | `mou_requests_email_format` | `btrim(email) ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'` (the pattern `submit_lead_v2` already enforces) |
| | `mou_requests_phone_format` | phone rule |
| | `mou_requests_notes_length` | at most 10,000 characters |
| executive_appointments | `..._school_name_not_blank`, `..._representative_name_not_blank`, `..._email_format`, `..._phone_format` | as for mou_requests |

Phone rule: only ASCII digits, spaces (including no-break and other Unicode spaces), `+ - ( ) . /`, and at least 7
digits. It accepts everything the website's own validation lets through (`^\+?[\d\s-]+$`, 8 to 16 digits).
`hub_slug`: the documented slug format is lowercase (`dps-vijayawada`). The rule also accepts capitals and `_` because
the website mirror copies the `?qr=` campaign code verbatim into `hub_slug`, and the website's own tests use `Q-17`.
Columns typed `varchar(n)` already refused longer values before this migration (SQLSTATE 22001).

**Rate limit**

- Applies to direct inserts by `anon`, and by `authenticated` users who are not staff. Inserts made inside SECURITY
  DEFINER functions are never counted, because there `current_user` is the function owner. The replica proves this for
  `submit_lead_v2`: a client already over its limit still gets 6 of 6 leads stored and mirrored.
- Client = SHA-256 of a secret salt, the table and the client address. The address comes from PostgREST's
  `request.headers`: `cf-connecting-ip` (set by Cloudflare in front of Supabase; a client cannot forge it), else the
  first `x-forwarded-for` hop. IPv6 addresses are grouped per /64. A missing address, or one that is not a valid IP,
  goes to one shared bucket per table. The salt (`app_private.anon_insert_guard_salt`) cannot be read by anon or
  authenticated, so nobody can compute another client's bucket and use it up through the public `consume_rate_limit`
  RPC.
- Limits (arguments of the `anon_insert_guard_2_limit` trigger): 5 rows per 600 s per client per table; the shared
  bucket allows 100 rows per 600 s per table. Fixed windows, the website layer's `public.consume_rate_limit` over
  `app_private.rate_limits` (counters expire after 2 days).
- Over the limit: `ERROR P0001 rate limit exceeded: too many new <table> rows from this client` (detail gives the limit,
  hint says to wait). PostgREST answers HTTP 400. P0001 rather than 54000: PostgREST maps 54000 to HTTP 500, which
  clients and monitoring treat as a server fault and retry.
- Attempts that are refused, or that fail a check, use no quota (the statement is rolled back with its counter).
- Two triggers per table, fired in name order: `anon_insert_guard_1_mark` (SECURITY INVOKER) records who is inserting,
  and `anon_insert_guard_2_limit` (SECURITY DEFINER, so it can read the salt) counts. One trigger cannot do both: a
  SECURITY DEFINER function always sees its owner as `current_user`. Nothing new is granted to anon or authenticated.

## 2. Who could be affected, and how to adapt

The other apps are not in this repository. The list comes from `docs/reference/architecture-guide.md` and the PRDs.

| Consumer | Effect | What to do |
| --- | --- | --- |
| **Any anonymous client of `equine_fleet` / `school_hubs`** | `select=*` (PostgREST's default when no `select=` is sent; supabase-js `.select()` with no argument) fails with HTTP 401, code 42501, "permission denied for table ...". So does filtering or ordering on a hidden column | Name the columns: `?select=id,name,breed,...` / `.select('id,name,breed')` |
| **Public fleet / studbook page** (`/fleet`: horses joined to hubs, "microchip verification", "stall-cam status") | Microchip numbers and camera links are no longer readable without login | List safe columns. Microchip lookup → a SECURITY DEFINER RPC that answers "is chip X registered" without listing chips. Stall-cam status → server side (the guide's `GET /api/v1/horses/:horseId/stall-cam`) |
| **QR flyer landing page** (`/hub/[schoolSlug]`, writes `qr_lead_captures`) | Reading the hub by slug needs a column list. Inserts must pass the checks and are limited to 5 per 10 min per visitor address | `select=id,school_name,slug`. Send a lowercase slug, a non-blank name and a real phone number. Expect HTTP 400 with 23514 (bad data) or P0001 (limit). **If it inserts from its own server with the anon key, every visitor shares that server's address**: use the service role there (not limited), or raise the table's limit (section 6). Events on one school Wi-Fi share one address too |
| **Campus configurator** (`/hubs`) | Revenue share no longer readable by anon | Use the tier numbers in code (as the guide intends), or read it signed in |
| **Achievement / leaderboard banner** ("Sovereign Leaderboard Ticker") | Anonymous reads of `achievements` fail | A SECURITY DEFINER RPC or view with no cadet identifiers, or a signed-in context |
| **Other front ends** writing `executive_appointments` / `mou_requests` as anon | Checks and the per-client limit apply | Valid e-mail, phone with 7 or more digits, non-blank names |
| **Mobile apps** (signed in) | Reads unchanged (parents still see the stall cam). Direct inserts into the three intake tables: checks; PARENT users limited per address; staff not limited | Nothing, unless they write odd data |
| **Operations console** (SUPER_ADMIN) | Reads unchanged (revenue shares, camera links, microchips). Inserts not limited | Nothing, unless it writes odd data |
| **Service-role backends** (payments webhook, stream-token service) | Checks apply, also to UPDATEs: updating an older row that breaks a check fails (for example flipping `converted_to_enrollment` on a legacy row with a malformed `hub_slug`) | Run the pre-flight query 4. Fix such rows first, or relax that check |
| **This website** | No anonymous reads of these tables. `submit_lead_v2` is not limited by the trigger | QR codes on flyers: letters, digits, `-` and `_` only. Optional follow-up: slugify `qr` in `mirror_lead` |
| **GraphQL (pg_graphql) / Realtime as anon** | GraphQL hides the hidden columns and the two closed tables from anon. Anonymous Realtime subscriptions to these tables may stop or lose fields | Re-test any such subscription |

## 3. Assumptions

- The live tables equal the 23 Oct 2026 snapshot (the migration checks the columns and aborts otherwise).
- `request.headers` carries `cf-connecting-ip` on the hosted project. If it does not, the first `x-forwarded-for` hop is
  used. That hop can be supplied by the client, so rotating it evades the per-client limit. Garbage values only reach
  the shared bucket.
- `submit_lead_v2` / `mirror_lead` are owned by `postgres` (or any role other than anon/authenticated); query 7 checks this.
- The website layer (001000) is applied; the migration aborts otherwise.

## 4. Before applying: read-only pre-flight on live

Run these in the SQL editor. None of them writes anything.

```sql
-- 1. Columns: must be exactly the snapshot's (equine_fleet 10, school_hubs 11 columns).
select table_name, string_agg(column_name, ', ' order by ordinal_position) as columns
  from information_schema.columns
 where table_schema = 'public' and table_name in ('equine_fleet', 'school_hubs')
 group by table_name;

-- 2. Today's read privileges. Expect true in every cell; the rollback restores exactly this.
select t as table_name, has_table_privilege('anon', t, 'select') as anon_select,
       has_table_privilege('authenticated', t, 'select') as authenticated_select
  from unnest(array['public.equine_fleet', 'public.school_hubs', 'public.achievements', 'public.session_skills']) as t;

-- 3. Inherited access the REVOKE could not remove. Expect 0 rows from both.
select c.relname, e.privilege_type from pg_class c cross join lateral aclexplode(c.relacl) e
 where c.oid in ('public.equine_fleet'::regclass, 'public.school_hubs'::regclass, 'public.achievements'::regclass,
                 'public.session_skills'::regclass)
   and e.grantee = 0;  -- 0 = PUBLIC
select r.rolname as anon_is_member_of from pg_auth_members m join pg_roles r on r.oid = m.roleid
 where m.member = 'anon'::regrole;

-- 4. Existing rows that break the new checks. NOT VALID keeps them, but any later UPDATE of such a row will fail.
--    Expect 0 everywhere. Otherwise fix those rows, or relax that check before applying.
select 'qr_lead_captures' as table_name,
       count(*) filter (where (hub_slug ~ '^[A-Za-z0-9_-]{2,100}$') is false) as hub_slug,
       count(*) filter (where (parent_name ~ '\S') is false) as parent_name,
       count(*) filter (where (parent_phone !~ '[^0-9+()./[:space:]\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff-]'
                               and length(regexp_replace(parent_phone, '[^0-9]', '', 'g')) >= 7) is false) as parent_phone,
       count(*) filter (where (length(device_info) <= 10000) is false) as device_info
  from public.qr_lead_captures;
select 'mou_requests' as table_name,
       count(*) filter (where (school_name ~ '\S') is false) as school_name,
       count(*) filter (where (representative_name ~ '\S') is false) as representative_name,
       count(*) filter (where (btrim(email) ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') is false) as email,
       count(*) filter (where (phone_number !~ '[^0-9+()./[:space:]\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff-]'
                               and length(regexp_replace(phone_number, '[^0-9]', '', 'g')) >= 7) is false) as phone_number,
       count(*) filter (where (length(notes) <= 10000) is false) as notes
  from public.mou_requests;
select 'executive_appointments' as table_name,
       count(*) filter (where (school_name ~ '\S') is false) as school_name,
       count(*) filter (where (representative_name ~ '\S') is false) as representative_name,
       count(*) filter (where (btrim(email) ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') is false) as email,
       count(*) filter (where (phone_number !~ '[^0-9+()./[:space:]\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff-]'
                               and length(regexp_replace(phone_number, '[^0-9]', '', 'g')) >= 7) is false) as phone_number
  from public.executive_appointments;

-- 5. Are 5 rows per 10 minutes per client realistic? Largest burst so far (qr per stored ip_address; the other two
--    tables store no address, so this is all clients together, an upper bound). Above 5: raise that table's limit.
select 'qr_lead_captures' as table_name, coalesce(max(n), 0) as max_rows_in_one_10_min_window
  from (select count(*) as n from public.qr_lead_captures
         group by ip_address, floor(extract(epoch from created_at) / 600)) s
union all
select 'mou_requests (all clients)', coalesce(max(n), 0)
  from (select count(*) as n from public.mou_requests group by floor(extract(epoch from created_at) / 600)) s
union all
select 'executive_appointments (all clients)', coalesce(max(n), 0)
  from (select count(*) as n from public.executive_appointments group by floor(extract(epoch from created_at) / 600)) s;

-- 6. Website QR / hub codes that would no longer be mirrored into qr_lead_captures. Expect 0 rows.
select coalesce(nullif(attribution ->> 'qr', ''), nullif(attribution ->> 'hub', '')) as code, count(*)
  from public.onboarding_leads
 where lead_type = 'cadet'
   and left(coalesce(nullif(attribution ->> 'qr', ''), nullif(attribution ->> 'hub', '')), 100) !~ '^[A-Za-z0-9_-]{2,100}$'
 group by 1;

-- 7. The website exemption relies on these running as their owner. Expect owner postgres, security_definer true.
select p.oid::regprocedure as function, pg_get_userbyid(p.proowner) as owner, p.prosecdef as security_definer
  from pg_proc p
 where p.oid in ('public.submit_lead_v2(public.lead_type,text,text,text,text,jsonb,text,boolean,jsonb,text)'::regprocedure,
                 'app_private.mirror_lead(text,public.lead_type,text,text,text,jsonb,jsonb,text)'::regprocedure);
```

Also check in the API edge logs (Logs Explorer) that requests carry `cf-connecting-ip`. If they do not, read the
`x-forwarded-for` note in section 3.

## 5. Applying

Paste the whole migration into the SQL editor and run it once. It is one transaction. `lock_timeout` is 5 s, so the
migration gives up instead of queueing behind a long query. If it stops, or a precondition or postcondition fails,
nothing has been applied: read the message, fix the cause, run it again. Running it twice is harmless. At commit it
asks PostgREST to reload its schema cache (`notify pgrst, 'reload schema'`).

## 6. Verify on live after applying (read-only)

```sql
-- 1. Who reads what: anon false for the 4 hidden columns and every column of achievements / session_skills,
--    authenticated true everywhere.
select c.relname as table_name, a.attname as column_name,
       has_column_privilege('anon', c.oid, a.attnum, 'select') as anon_reads,
       has_column_privilege('authenticated', c.oid, a.attnum, 'select') as authenticated_reads
  from pg_class c join pg_attribute a on a.attrelid = c.oid
 where c.oid in ('public.equine_fleet'::regclass, 'public.school_hubs'::regclass, 'public.achievements'::regclass,
                 'public.session_skills'::regclass)
   and a.attnum > 0 and not a.attisdropped
 order by c.relname, a.attnum;

-- 2. The 13 checks, all convalidated = false.
select conrelid::regclass as table_name, conname, convalidated, pg_get_constraintdef(oid) as definition
  from pg_constraint
 where conrelid in ('public.qr_lead_captures'::regclass, 'public.mou_requests'::regclass, 'public.executive_appointments'::regclass)
   and conname ~ '_(format|not_blank|length)$'
 order by 1, 2;

-- 3. Six triggers, tgenabled = 'O'.
select tgrelid::regclass as table_name, tgname, tgenabled, pg_get_triggerdef(oid) as definition
  from pg_trigger where tgname like 'anon_insert_guard_%' order by 1, 2;

-- 4. mark = invoker, limit = definer, both search_path=""; EXECUTE for the owner only. Salt present (never select it).
select p.proname, p.prosecdef as security_definer, p.proconfig, pg_get_userbyid(p.proowner) as owner, p.proacl
  from pg_proc p where p.pronamespace = 'app_private'::regnamespace and p.proname like 'anon_insert_guard_%';
select count(*) = 1 as salt_present from app_private.anon_insert_guard_salt;

-- 5. Limiter activity in the last hour (hashed buckets only; no address is stored).
select count(*) as active_buckets, coalesce(sum(hits), 0) as hits
  from app_private.rate_limits where bucket ~ '^(anonqr|anonmou|anonappt):' and window_start > now() - interval '1 hour';
```

From outside, with the publishable (anon) key. These are GET requests and change nothing:

```sh
K="$SUPABASE_PUBLISHABLE_KEY"; U="$SUPABASE_URL/rest/v1"
curl -s -o /dev/null -w '%{http_code}\n' "$U/equine_fleet?select=stall_cctv_rtsp_url&limit=1" -H "apikey: $K"   # 401
curl -s -o /dev/null -w '%{http_code}\n' "$U/equine_fleet?limit=1" -H "apikey: $K"                             # 401 (select=*)
curl -s -o /dev/null -w '%{http_code}\n' "$U/equine_fleet?select=id,name,breed&limit=1" -H "apikey: $K"        # 200
curl -s -o /dev/null -w '%{http_code}\n' "$U/school_hubs?select=revenue_share_percentage&limit=1" -H "apikey: $K"  # 401
curl -s -o /dev/null -w '%{http_code}\n' "$U/school_hubs?select=school_name,slug&limit=1" -H "apikey: $K"      # 200
curl -s -o /dev/null -w '%{http_code}\n' "$U/achievements?select=id&limit=1" -H "apikey: $K"                   # 401
curl -s -o /dev/null -w '%{http_code}\n' "$U/session_skills?select=session_id&limit=1" -H "apikey: $K"         # 401
```

Optional write-path smoke test. It leaves nothing behind: like the earlier live check, it ends by raising its report,
which rolls back every row and counter it wrote. Expected message: `ok ok ok ok ok P0001 | stall-cam 42501`.

```sql
do $$
declare r text := ''; i int;
begin
  perform set_config('request.headers', '{"cf-connecting-ip":"198.51.100.250"}', true);  -- documentation address
  set local role anon;
  for i in 1..6 loop
    begin
      insert into public.qr_lead_captures (hub_slug, parent_name, source) values ('smoke-test', 'Smoke Test', 'hardening-smoke');
      r := r || 'ok ';
    exception when others then r := r || sqlstate || ' ';
    end;
  end loop;
  begin
    perform stall_cctv_rtsp_url from public.equine_fleet limit 1;
    r := r || '| stall-cam readable';
  exception when others then r := r || '| stall-cam ' || sqlstate;
  end;
  reset role;
  raise exception 'hardening smoke test, rolled back: %', r;
end $$;
```

Monitoring: refusals show in the Postgres and API logs as `rate limit exceeded` (HTTP 400) and as `violates check
constraint` (23514). `anon_insert_guard: public.consume_rate_limit is missing` (LOG) means the website layer was rolled
back while this migration stayed: the limit is then off and the checks still apply.

## 7. Tuning and emergency switch

```sql
-- Raise a limit (arguments: bucket prefix, per-client limit, window in seconds, shared-bucket limit).
begin;
drop trigger if exists anon_insert_guard_2_limit on public.qr_lead_captures;
create trigger anon_insert_guard_2_limit before insert on public.qr_lead_captures
  for each row execute function app_private.anon_insert_guard_limit('anonqr', '20', '600', '300');
commit;

-- Switch the limit off for one table and keep the checks (the opposite is "enable trigger").
alter table public.qr_lead_captures disable trigger anon_insert_guard_2_limit;
```

Re-running the migration resets the limits to 5 / 600 / 100 and re-enables a disabled limit trigger.

## 8. Rollback

Run `rollback/20261023001200_anon_privacy_hardening_rollback.sql` (one transaction, re-runnable). It restores anon's
table-level SELECT on the four tables (anon's other privileges were never touched), and drops the six triggers, the two
functions, the salt table, the limiter's own counters and the 13 checks. Rows in the intake tables stay. The replica
proves that anon's and authenticated's privileges afterwards are identical to before the migration.

Roll it back **before** `20261023001000_website_layer_rollback.sql`. If the website layer goes first, this migration's
limit fails open (LOG line above), and the privacy part and the checks keep working (tests/50).

## 9. Not fixed here (follow-ups)

1. **Signed-in users still read everything anon used to read.** The policies `public_read_horses`, `public_read_hubs`,
   `public_read_achievements` and `read_session_skills` are `to public`, and that stays (by design here). Anyone who can
   sign up (if e-mail sign-up is open, sign-ups become PARENT) still reads every camera link, microchip, revenue share,
   school e-mail, child achievement and session skill. Next step: role-scoped policies or column grants for
   authenticated. Camera links through the stream-token service; revenue share for SUPER_ADMIN and the hub's own
   SCHOOL_ADMIN; achievements for the cadet's parent and hub staff.
2. **Anonymous inserts may still set any column**, for example `status = 'SIGNED'`, `converted_to_enrollment = true`,
   a back-dated `created_at`, or a made-up `ip_address`. Next step: column-level INSERT grants for anon (check first
   which columns the QR page sends).
3. anon and authenticated still hold TRUNCATE, REFERENCES and TRIGGER on all public tables (Supabase default). RLS does
   not cover TRUNCATE, but PostgREST cannot reach it. Defense in depth: revoke them.
4. Fixed windows allow a burst of up to twice the limit across a window boundary. Clients behind one address (school
   Wi-Fi, carrier NAT, a server using the anon key) share a bucket.
