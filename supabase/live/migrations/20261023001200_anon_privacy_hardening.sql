-- Anonymous-access privacy hardening for the LIVE operations project (tgwadczrfbljnepoaqtb). Prepared 23 Oct 2026.
-- NOT APPLIED. Apply only with the owner's explicit approval, after the pre-flight queries in
-- supabase/live/HARDENING_NOTES.md. Needs 20261023001000_website_layer.sql (public.consume_rate_limit) first.
--
-- PURPOSE: unauthenticated internet users (database role anon) can read sensitive operations data and spam the three
-- public intake tables. This migration only takes capabilities away from anon (plus a rate limit on direct inserts by
-- signed-in users without a staff role). What authenticated users can READ is unchanged, and no RLS policy, function
-- body, column or row of the operations schema is altered or deleted.
--
--   1 equine_fleet    anon reads every column EXCEPT stall_cctv_rtsp_url and microchip_iso_id (column privileges;
--                     policy public_read_horses still limits anon to active horses).
--   2 school_hubs     anon reads every column EXCEPT revenue_share_percentage and contact_email.
--   3 achievements    anon can no longer read it (children's achievements per cadet_id).
--   4 session_skills  anon can no longer read it.
--   5 mou_requests, executive_appointments, qr_lead_captures: anonymous INSERT stays allowed (a QR flyer page may
--     depend on it), but
--     a) NOT VALID CHECK constraints refuse blank names, malformed e-mails, phones and hub slugs, and oversized free
--        text. They bind EVERY writer, so they only encode what valid data already satisfies; existing rows are not
--        re-checked when the constraint is added.
--     b) a per-client rate limit on direct API inserts: 5 rows per 10 minutes per client per table. Client = salted
--        hash of cf-connecting-ip, else the first x-forwarded-for hop (IPv6 grouped per /64); requests with no usable
--        address share one bucket per table (100 rows per 10 minutes). It counts inserts made as anon, or as
--        authenticated by a user who is not staff. Exempt: staff (SUPER_ADMIN, SCHOOL_ADMIN, INSTRUCTOR, GROOM),
--        service_role, the dashboard, and every insert made inside a SECURITY DEFINER function, such as the
--        website's public.submit_lead_v2 mirror (there current_user is the function owner). Over the limit:
--        SQLSTATE P0001 "rate limit exceeded: ..." (PostgREST answers HTTP 400).
--
-- IMPACT ON OTHER APPS (who could be affected and how to adapt: supabase/live/HARDENING_NOTES.md):
--   * An anonymous client that selects * from equine_fleet or school_hubs now gets 42501 "permission denied"
--     (HTTP 401) and must list columns. select=* is PostgREST's default when no select= is given, and supabase-js
--     .select() sends it. Filtering or ordering on a hidden column fails the same way.
--   * Anonymous reads of achievements and session_skills fail with 42501.
--   * Rows that break a new CHECK are refused with 23514 (HTTP 400) for every role, on INSERT and on UPDATE (an
--     UPDATE of an older row that breaks a check fails too).
--   * A server that inserts with the anon key on behalf of many people counts as ONE client: it should use the
--     service role, or that table's limit must be raised (trigger arguments in section 5b).
--
-- Re-runnable and atomic (one transaction). lock_timeout makes it fail fast instead of queueing behind a
-- long-running query; just run it again. ROLLBACK: supabase/live/rollback/20261023001200_anon_privacy_hardening_rollback.sql
-- restores anon's table-level SELECT and drops the triggers, functions, salt table and NOT VALID constraints.

begin;
set local lock_timeout = '5s';
set local client_min_messages = warning;

-- ------------------------------------------------------------------ preconditions
do $$
declare v_unknown text;
begin
  if to_regprocedure('public.consume_rate_limit(text,integer,integer)') is null then
    raise exception 'public.consume_rate_limit is missing: apply 20261023001000_website_layer.sql first';
  end if;
  if to_regprocedure('public.current_role_name()') is null then
    raise exception 'public.current_role_name() is missing: this is not the operations schema this migration targets';
  end if;
  -- The anon column lists below are explicit. Refuse to guess when the live tables differ from the 23 Oct snapshot:
  -- review whether the new column is safe for anonymous readers, then add it to the list (or not).
  select string_agg(format('%s.%s', c.relname, a.attname), ', ' order by c.relname, a.attnum) into v_unknown
    from pg_attribute a join pg_class c on c.oid = a.attrelid
   where c.oid in ('public.equine_fleet'::regclass, 'public.school_hubs'::regclass)
     and a.attnum > 0 and not a.attisdropped
     and format('%s.%s', c.relname, a.attname) <> all (array[
       'equine_fleet.id', 'equine_fleet.hub_id', 'equine_fleet.name', 'equine_fleet.breed',
       'equine_fleet.microchip_iso_id', 'equine_fleet.stall_cctv_rtsp_url', 'equine_fleet.height_hands',
       'equine_fleet.temperament', 'equine_fleet.is_active', 'equine_fleet.created_at',
       'school_hubs.id', 'school_hubs.school_name', 'school_hubs.slug', 'school_hubs.architectural_tier',
       'school_hubs.address', 'school_hubs.latitude', 'school_hubs.longitude', 'school_hubs.contact_email',
       'school_hubs.revenue_share_percentage', 'school_hubs.is_active', 'school_hubs.created_at']);
  if v_unknown is not null then
    raise exception 'columns not in the 23 Oct 2026 snapshot: %. Decide whether anon may read them, then edit this migration', v_unknown;
  end if;
end $$;

-- ------------------------------------------------------------------ 1, 2: column-level read access for anon
-- A table-level REVOKE also removes any column-level grant, so revoke + grant converges on re-runs.
revoke select on public.equine_fleet from anon;
grant select (id, hub_id, name, breed, height_hands, temperament, is_active, created_at)
  on public.equine_fleet to anon;

revoke select on public.school_hubs from anon;
grant select (id, school_name, slug, architectural_tier, address, latitude, longitude, is_active, created_at)
  on public.school_hubs to anon;

-- ------------------------------------------------------------------ 3, 4: no anonymous reads
revoke select on public.achievements, public.session_skills from anon;

-- ------------------------------------------------------------------ 5a: NOT VALID checks on the intake tables
-- Each rule accepts everything the website mirror (app_private.mirror_lead after the app's zod validation) writes:
--   names     at least one non-space character;
--   e-mail    the same pattern public.submit_lead_v2 enforces (surrounding spaces tolerated);
--   phone     digits, spaces (including no-break spaces), + - ( ) . / only, and at least 7 digits;
--   hub_slug  a slug-like code: letters (either case), digits, '-' or '_', 2-100 characters. The documented slug
--             format is lowercase ('dps-vijayawada'); upper case and '_' are accepted because the website mirror copies
--             the ?qr= campaign code verbatim (its own tests use 'Q-17');
--   free text (device_info, notes, unbounded "text" columns) at most 10,000 characters.
-- Columns typed varchar(n) already refuse longer values (SQLSTATE 22001).
alter table public.qr_lead_captures
  drop constraint if exists qr_lead_captures_hub_slug_format,
  add constraint qr_lead_captures_hub_slug_format check (hub_slug ~ '^[A-Za-z0-9_-]{2,100}$') not valid,
  drop constraint if exists qr_lead_captures_parent_name_not_blank,
  add constraint qr_lead_captures_parent_name_not_blank check (parent_name ~ '\S') not valid,
  drop constraint if exists qr_lead_captures_parent_phone_format,
  add constraint qr_lead_captures_parent_phone_format check (
    parent_phone !~ '[^0-9+()./[:space:]\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff-]'
    and length(regexp_replace(parent_phone, '[^0-9]', '', 'g')) >= 7) not valid,
  drop constraint if exists qr_lead_captures_device_info_length,
  add constraint qr_lead_captures_device_info_length check (length(device_info) <= 10000) not valid;

alter table public.mou_requests
  drop constraint if exists mou_requests_school_name_not_blank,
  add constraint mou_requests_school_name_not_blank check (school_name ~ '\S') not valid,
  drop constraint if exists mou_requests_representative_name_not_blank,
  add constraint mou_requests_representative_name_not_blank check (representative_name ~ '\S') not valid,
  drop constraint if exists mou_requests_email_format,
  add constraint mou_requests_email_format check (btrim(email) ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') not valid,
  drop constraint if exists mou_requests_phone_format,
  add constraint mou_requests_phone_format check (
    phone_number !~ '[^0-9+()./[:space:]\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff-]'
    and length(regexp_replace(phone_number, '[^0-9]', '', 'g')) >= 7) not valid,
  drop constraint if exists mou_requests_notes_length,
  add constraint mou_requests_notes_length check (length(notes) <= 10000) not valid;

alter table public.executive_appointments
  drop constraint if exists executive_appointments_school_name_not_blank,
  add constraint executive_appointments_school_name_not_blank check (school_name ~ '\S') not valid,
  drop constraint if exists executive_appointments_representative_name_not_blank,
  add constraint executive_appointments_representative_name_not_blank check (representative_name ~ '\S') not valid,
  drop constraint if exists executive_appointments_email_format,
  add constraint executive_appointments_email_format check (btrim(email) ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') not valid,
  drop constraint if exists executive_appointments_phone_format,
  add constraint executive_appointments_phone_format check (
    phone_number !~ '[^0-9+()./[:space:]\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff-]'
    and length(regexp_replace(phone_number, '[^0-9]', '', 'g')) >= 7) not valid;

-- ------------------------------------------------------------------ 5b: per-client rate limit on direct inserts
-- Two BEFORE INSERT triggers per table, fired in name order:
--   anon_insert_guard_1_mark  (SECURITY INVOKER) runs as the inserting role, so current_user tells who inserts. It
--                             flags the row for counting only for anon and for non-staff authenticated users.
--   anon_insert_guard_2_limit (SECURITY DEFINER) counts the flagged row in a salted bucket of the website layer's
--                             limiter (public.consume_rate_limit over app_private.rate_limits) and refuses it when
--                             the client is over the limit.
-- The split is needed because a SECURITY DEFINER function sees its owner as current_user, while the salt has to stay
-- unreadable by anon: with a guessable bucket name anybody could pre-exhaust another client's quota through the
-- public consume_rate_limit RPC. No privilege is granted to anon or authenticated; trigger functions need none.

create table if not exists app_private.anon_insert_guard_salt (
  id boolean primary key default true check (id),
  salt text not null check (length(salt) >= 32)
);
comment on table app_private.anon_insert_guard_salt is
  'Secret salt for the anon insert rate-limit buckets (20261023001200). Never expose; replacing it resets the counters.';
alter table app_private.anon_insert_guard_salt enable row level security; -- no policies: only the owner reads it
revoke all on app_private.anon_insert_guard_salt from public, anon, authenticated;
insert into app_private.anon_insert_guard_salt (salt)
values (encode(sha256(convert_to(gen_random_uuid()::text || gen_random_uuid()::text || clock_timestamp()::text, 'UTF8')), 'hex'))
on conflict (id) do nothing;

create or replace function app_private.anon_insert_guard_mark() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  -- Inside SECURITY DEFINER functions (public.submit_lead_v2 -> app_private.mirror_lead) current_user is the owner,
  -- so those inserts are never flagged; neither are service_role, the dashboard (postgres) or migrations.
  perform set_config('bsah.anon_insert_guard',
    case when current_user = 'anon'
           or (current_user = 'authenticated'
               and coalesce(public.current_role_name(), '') not in ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'INSTRUCTOR', 'GROOM'))
         then tg_relid::text else '' end,
    true);
  return new;
end $$;
comment on function app_private.anon_insert_guard_mark() is
  'BEFORE INSERT trigger (20261023001200): flags direct inserts by anon / non-staff authenticated for anon_insert_guard_limit.';

-- Trigger arguments: bucket prefix, per-client limit, window in seconds, limit of the shared no-address bucket.
create or replace function app_private.anon_insert_guard_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_headers jsonb;
  v_addr text;
  v_ip inet;
  v_client text;
  v_limit integer;
  v_salt text;
begin
  if current_setting('bsah.anon_insert_guard', true) is distinct from tg_relid::text then
    return new; -- not a direct end-user insert (see app_private.anon_insert_guard_mark)
  end if;
  perform set_config('bsah.anon_insert_guard', '', true);
  if to_regprocedure('public.consume_rate_limit(text,integer,integer)') is null then
    -- The website layer was rolled back underneath this migration: fail open (the CHECK constraints still apply).
    raise log 'anon_insert_guard: public.consume_rate_limit is missing, insert into % not rate limited', tg_table_name;
    return new;
  end if;

  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb; -- set by PostgREST for API requests
  exception when others then
    v_headers := null;
  end;
  -- cf-connecting-ip is set by Cloudflare in front of the Supabase API and cannot be forged by the client; the first
  -- x-forwarded-for hop is the fallback. Anything that is not an IP address goes to the shared bucket, so random
  -- strings cannot mint fresh buckets.
  v_addr := coalesce(nullif(btrim(v_headers ->> 'cf-connecting-ip'), ''),
                     nullif(btrim(split_part(v_headers ->> 'x-forwarded-for', ',', 1)), ''));
  if v_addr ~ '^[0-9A-Fa-f:.]{2,45}$' then
    begin
      v_ip := v_addr::inet;
    exception when others then
      v_ip := null;
    end;
  end if;
  if v_ip is null then
    v_client := 'shared';
    v_limit := tg_argv[3]::integer;
  elsif family(v_ip) = 6 and not v_ip <<= '::ffff:0.0.0.0/96'::inet then
    v_client := network(set_masklen(v_ip, 64))::text; -- one bucket per IPv6 /64
    v_limit := tg_argv[1]::integer;
  else
    v_client := host(v_ip);
    v_limit := tg_argv[1]::integer;
  end if;

  select salt into v_salt from app_private.anon_insert_guard_salt;
  if not public.consume_rate_limit(
       tg_argv[0] || ':' || encode(sha256(convert_to(concat_ws('|', v_salt, tg_table_name, v_client), 'UTF8')), 'hex'),
       v_limit, tg_argv[2]::integer) then
    raise exception 'rate limit exceeded: too many new % rows from this client', tg_table_name
      using errcode = 'P0001',
            detail = format('At most %s new rows per %s seconds per client.', v_limit, tg_argv[2]),
            hint = 'Wait a few minutes before trying again.';
  end if;
  return new;
end $$;
comment on function app_private.anon_insert_guard_limit() is
  'BEFORE INSERT trigger (20261023001200): per-client rate limit for rows flagged by anon_insert_guard_mark. Args: prefix, limit, window s, shared limit.';

revoke all on function app_private.anon_insert_guard_mark(), app_private.anon_insert_guard_limit()
  from public, anon, authenticated;

-- To change a limit, re-create that table's _2_limit trigger with other arguments (prefix, limit, window, shared).
-- Emergency switch without a rollback: alter table <t> disable trigger anon_insert_guard_2_limit;
drop trigger if exists anon_insert_guard_1_mark on public.qr_lead_captures;
create trigger anon_insert_guard_1_mark before insert on public.qr_lead_captures
  for each row execute function app_private.anon_insert_guard_mark();
drop trigger if exists anon_insert_guard_2_limit on public.qr_lead_captures;
create trigger anon_insert_guard_2_limit before insert on public.qr_lead_captures
  for each row execute function app_private.anon_insert_guard_limit('anonqr', '5', '600', '100');

drop trigger if exists anon_insert_guard_1_mark on public.mou_requests;
create trigger anon_insert_guard_1_mark before insert on public.mou_requests
  for each row execute function app_private.anon_insert_guard_mark();
drop trigger if exists anon_insert_guard_2_limit on public.mou_requests;
create trigger anon_insert_guard_2_limit before insert on public.mou_requests
  for each row execute function app_private.anon_insert_guard_limit('anonmou', '5', '600', '100');

drop trigger if exists anon_insert_guard_1_mark on public.executive_appointments;
create trigger anon_insert_guard_1_mark before insert on public.executive_appointments
  for each row execute function app_private.anon_insert_guard_mark();
drop trigger if exists anon_insert_guard_2_limit on public.executive_appointments;
create trigger anon_insert_guard_2_limit before insert on public.executive_appointments
  for each row execute function app_private.anon_insert_guard_limit('anonappt', '5', '600', '100');

-- ------------------------------------------------------------------ postcondition
-- Aborts the whole transaction if anon can still read a protected column after all, for example through a grant to
-- PUBLIC or through membership in another role (the snapshot shows neither, the live project could differ).
do $$
begin
  if has_column_privilege('anon', 'public.equine_fleet', 'stall_cctv_rtsp_url', 'select')
     or has_column_privilege('anon', 'public.equine_fleet', 'microchip_iso_id', 'select')
     or has_column_privilege('anon', 'public.school_hubs', 'revenue_share_percentage', 'select')
     or has_column_privilege('anon', 'public.school_hubs', 'contact_email', 'select')
     or has_any_column_privilege('anon', 'public.achievements', 'select')
     or has_any_column_privilege('anon', 'public.session_skills', 'select') then
    raise exception 'anon can still read a protected column (granted to PUBLIC or via another role?): nothing was applied';
  end if;
end $$;

-- PostgREST keeps a schema cache; ask it to reload (delivered at commit).
notify pgrst, 'reload schema';
commit;
