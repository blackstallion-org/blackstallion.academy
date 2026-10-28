# Database architecture (Supabase project `tgwadczrfbljnepoaqtb`, 24 Oct 2026)

One Supabase project is shared by the website and the academy's operations apps (mobile apps and an operations
console, which are not in this repository). This document describes what is **live** today, which part the website
added, and how to change it safely. Evidence: `supabase/live/baseline/20261023_live_snapshot.sql` (read-only replica of
the live schema), `supabase/live/migrations/`, the replica test suite `supabase/live/tests/` and
`docs/evidence/2026-10-23-live-supabase-check.md`.

> **Rule:** the live project takes **only** `supabase/live/migrations/` (additive, versioned, tested on the replica
> first). `supabase/migrations/` and `supabase/combined/` describe the website's original stand-alone schema for a
> fresh project and must **never** be applied to this one.

## 1. Two layers

| Layer | Owner | Where defined | Status |
| --- | --- | --- | --- |
| Operations schema (19 tables, roles, RLS) | operations apps | replica: `supabase/live/baseline/20261023_live_snapshot.sql` | LIVE (pre-existing) |
| Website layer (intake, audit, documents, media, verification, buckets) | website | `supabase/live/migrations/20261023001000_website_layer.sql` | LIVE (applied 23 Oct, owner-approved) |
| Security fixes for the operations schema (F1, F2) | shared | `supabase/live/migrations/20261023001100_security_fixes.sql` | LIVE (applied 23 Oct, owner-approved) |
| Anonymous privacy hardening | shared | `supabase/live/migrations/20261023001200_anon_privacy_hardening.sql` | **PREPARED, not applied** (needs approval) |

## 2. Operations schema (pre-existing)

Identity: `auth.users` (Supabase Auth) → `public.users (id = auth.users.id, full_name, email, phone_number, role,
hub_id)`. `role` ∈ `PARENT · INSTRUCTOR · GROOM · SCHOOL_ADMIN · SUPER_ADMIN`. Helpers used by every policy:
`public.current_role_name()` and `public.current_hub_id()` (SECURITY DEFINER, read the caller's `users` row).
A trigger `on_auth_user_created` → `public.handle_new_user()` creates the `users` row at sign-up. An event trigger
`ensure_rls` (`public.rls_auto_enable()`) turns RLS on for every new public table.

| Table | Purpose | Key relations | Who can read (RLS) |
| --- | --- | --- | --- |
| `school_hubs` | partner schools/campuses | — | everyone (incl. anonymous); super admin all |
| `users` | profile + role | → auth.users, → school_hubs | self; super admin |
| `cadets` | enrolled children, `passport_code`, `current_rank` | → users (parent), → school_hubs, → equine_fleet | parent (own), instructor/school admin (own hub), super admin |
| `equine_fleet` | horses, microchip, stall CCTV link | → school_hubs | everyone for active horses; super admin |
| `achievements` | awards per cadet | → cadets, → school_hubs | everyone; super admin |
| `training_sessions`, `session_skills`, `skills` | session records and skill catalogue | → cadets, users, equine_fleet | per role; `session_skills` everyone |
| `rank_history` | promotions | → cadets, users | instructor insert, super admin |
| `consent_records` | parental consent | → users, cadets | parent (own) |
| `payment_records` | gateway orders, invoices | → cadets, users | parent (own), super admin |
| `device_tokens` | push tokens | → users | owner |
| `groom_daily_logs`, `staff_attendance`, `system_anomalies` | field operations | → hubs, users, horses | per role |
| `mou_requests`, `executive_appointments`, `qr_lead_captures` | inbound requests | — | anonymous **insert**; super admin read |
| `site_settings` | key/value switches (e.g. `verify_public`) | — | everyone |

Storage (operations): `session-videos`, `proof-photos`, `invoices` (private, no object policies → service role only)
and `site-assets` (public).

## 3. Website layer (live)

All objects are additive; nothing existing was altered except the two security fixes in §4.

| Object | Kind | Notes |
| --- | --- | --- |
| `public.onboarding_leads` | table | every website enquiry: `lead_type` (cadet, school, board_audit), `gate`, `status` (new → reviewing → contacted → qualified/closed/rejected), contact fields, `payload` jsonb, `attribution` jsonb (path, hub, campaign, qr, referrer host, utm_*), `privacy_notice_version`, `consent_at` (required), `idempotency_key` (unique), `assigned_to`. RLS: staff read; staff may update **only** `status` and `assigned_to` (column grants). No anonymous access. |
| `public.submit_lead_v2(...)` | SECURITY DEFINER RPC | the only way anonymous visitors write: validates consent, gate, name, email/phone, payload size, attribution allow-list; idempotent (returns `duplicate`); mirrors into the operations tables (best effort, own sub-transaction): MOU → `mou_requests`, board audit → `executive_appointments`, cadet enquiries with a hub/QR code → `qr_lead_captures`. |
| `public.consume_rate_limit(bucket, max, window)` | RPC | shared fixed-window limiter (`app_private.rate_limits`, hashed keys). |
| `public.verify_passport(code)` | RPC | public verification over `cadets.passport_code`: returns `valid` + rank + issue date, or `unknown`, or `unavailable` when `site_settings.verify_public` is off. Never returns names or contacts. |
| `public.audit_events` | table | append-only (update/delete rejected by trigger); records who changed which row and which columns, never values. Staff read. |
| `public.generated_documents` | table | MOU PDFs stored in `private-documents` (path, title, `lead_reference` = enquiry idempotency key). Staff read/insert. |
| `public.media_assets` | table | images uploaded through `/admin/media` into `website-assets`. Public read, staff insert/delete. |
| `app_private` schema | helpers | `is_website_staff()` (= `SUPER_ADMIN`), audit helpers, rate-limit table; not exposed through the API. |
| buckets | storage | `website-assets` (public read, staff write; PNG/JPEG/WebP ≤ 4 MB), `user-uploads` (owner folder only; + PDF), `private-documents` (staff only; PDF ≤ 20 MB). Nine `storage.objects` policies. |

Website staff = operations users with `role = 'SUPER_ADMIN'` (`lib/auth/admin.ts`, `app_private.is_website_staff()`).

## 4. Security fixes applied to the operations schema (live)

- **F1** `users_guard_privileges` trigger (`app_private.guard_user_privileges`): a signed-in user can no longer change
  their own `role`, `hub_id`, `email` or `id` through the `own_profile_update` policy; only a super admin (or SQL run
  without a user JWT, e.g. the dashboard or the service role) can.
- **F2** `handle_new_user()` now takes the role from `raw_app_meta_data` (server-controlled) and defaults to `PARENT`;
  a sign-up can no longer ask for `SUPER_ADMIN` through user metadata.

## 5. Prepared, not applied: anonymous privacy hardening (001200)

Changes only what **anonymous** visitors can do (signed-in behaviour is byte-for-byte unchanged, tested):
- `equine_fleet`: anonymous column grants exclude `stall_cctv_rtsp_url` and `microchip_iso_id`.
- `school_hubs`: anonymous column grants exclude `revenue_share_percentage` and `contact_email`.
- `achievements`, `session_skills`: no anonymous read.
- `mou_requests`, `executive_appointments`, `qr_lead_captures`: anonymous insert stays, with NOT VALID format checks
  and a per-client rate limit (5 rows / 10 min / table); `submit_lead_v2` is exempt.
Impact on other apps, pre-flight queries, verification and rollback: `supabase/live/HARDENING_NOTES.md`. Replica
suite: 179/179. The read-only pre-flight queries were run against the live project on 24 Oct and came back clean, and the
project's API logs for the previous 24 hours showed no other client using the restricted tables (`docs/SECURITY_AUDIT.md`,
"Live evidence"). **Remaining exposure even after it** (`HARDENING_NOTES.md` §9): any signed-in user (anyone who can
sign up becomes a parent) can still read camera links, microchips, revenue shares, school e-mails and all achievements;
direct anonymous inserts can still set any column of the intake tables; `anon` and `authenticated` keep Supabase's default
`TRUNCATE`/`REFERENCES`/`TRIGGER` grants; and the limiter uses fixed windows (a burst of up to twice the limit across a
boundary; clients behind one address share a bucket). Fixing the first needs role-based policies agreed with the app
owners.

## 6. Migration process

1. Write an additive, idempotent migration in `supabase/live/migrations/` and its rollback in `supabase/live/rollback/`.
2. Extend `supabase/live/tests/` and run `bash supabase/live/tests/run.sh` (non-root user, Postgres 16 binaries; CI
   runs it on every push). The website schema suite `bash supabase/tests/run.sh` must stay green too.
3. Run the read-only pre-flight queries against live (SQL editor), get the owner's approval, apply in the SQL editor,
   then run the verification queries. Record the result under `docs/evidence/`.
Migration tracking: the live project has no `supabase_migrations` history from this repository; the record of what is
applied is §1 of this file plus `docs/evidence/`. (The operations apps' own migration history lives in their repo.)

## 7. Backups and recovery

- Plan: the project is on the **Free plan** (region `ap-northeast-2`, Seoul). On the Free plan Supabase keeps **no
  downloadable backups and no point-in-time recovery**; on Pro there are daily backups (7 days) and PITR as an add-on
  (Pro starts at about $25 per month per organisation; PITR is extra). Upgrading is a paid change → owner decision
  (`docs/LAUNCH_INSTRUCTIONS.md` G12).
- Until then, a logical backup can be taken from the Mac: `pg_dump "$DATABASE_URL" --schema=public --schema=app_private
  --no-owner -Fc -f bsah-$(date +%F).dump` (connection string from Supabase → Connect; store the file encrypted, never in
  git; it contains children's data). **Do not restore it the naive way**: the tested procedure with the extra steps is
  `docs/DEPLOYMENT_RUNBOOK.md` §8.3–§8.4. Storage objects (the private MOU PDFs) are not part of a database dump and need
  their own copy.
- Schema-only recovery is always possible from the repository: baseline snapshot + `supabase/live/migrations/` in order.
- **Rehearsal (24 Oct, local Postgres 16, synthetic data; `bash supabase/live/tests/backup_restore_rehearsal.sh`, 12/12
  and part of CI):** dump the replica, restore it into a second database by the runbook steps, and compare. Row counts,
  row-level security flags, 64 policies, schema/table/column/default privileges, 16 functions with their execute grants
  and the audit rows are identical, and anonymous visitors still cannot read enquiries. The same run restores *without*
  the extra steps (a naive `pg_restore`) as a control: 9 policy lines and 16 privilege lines differ and anonymous
  visitors regain read access to enquiries, which is why the steps matter.
- What the rehearsal cannot prove: restoring into a real Supabase project (needs the database password and a scratch
  project, owner). That one rehearsal is gate G12 and should be done once before launch.
