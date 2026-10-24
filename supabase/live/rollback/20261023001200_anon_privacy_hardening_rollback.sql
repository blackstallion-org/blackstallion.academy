-- ROLLBACK for 20261023001200_anon_privacy_hardening.sql on the live project. Only run with the owner's approval.
-- Puts anon back exactly where it was: table-level SELECT on equine_fleet, school_hubs, achievements and
-- session_skills (anon's other privileges were never touched). Drops the anon_insert_guard triggers and functions,
-- the salt table, the limiter's own counters and the NOT VALID check constraints. Rows in the intake tables and every
-- operations policy, function and column stay as they are. Re-runnable.
--
-- Order with the website layer: roll this back BEFORE 20261023001000_website_layer_rollback.sql. If the website layer
-- goes first, this migration's rate limit fails open (a LOG line per insert) while its checks keep applying.

begin;
set local lock_timeout = '5s';
set local client_min_messages = warning;

-- ------------------------------------------------------------------ 5b: rate limit
drop trigger if exists anon_insert_guard_2_limit on public.qr_lead_captures;
drop trigger if exists anon_insert_guard_1_mark on public.qr_lead_captures;
drop trigger if exists anon_insert_guard_2_limit on public.mou_requests;
drop trigger if exists anon_insert_guard_1_mark on public.mou_requests;
drop trigger if exists anon_insert_guard_2_limit on public.executive_appointments;
drop trigger if exists anon_insert_guard_1_mark on public.executive_appointments;
drop function if exists app_private.anon_insert_guard_limit();
drop function if exists app_private.anon_insert_guard_mark();
drop table if exists app_private.anon_insert_guard_salt;
do $$
begin
  if to_regclass('app_private.rate_limits') is not null then
    delete from app_private.rate_limits where bucket ~ '^(anonqr|anonmou|anonappt):';
  end if;
end $$;

-- ------------------------------------------------------------------ 5a: checks
alter table public.qr_lead_captures
  drop constraint if exists qr_lead_captures_hub_slug_format,
  drop constraint if exists qr_lead_captures_parent_name_not_blank,
  drop constraint if exists qr_lead_captures_parent_phone_format,
  drop constraint if exists qr_lead_captures_device_info_length;
alter table public.mou_requests
  drop constraint if exists mou_requests_school_name_not_blank,
  drop constraint if exists mou_requests_representative_name_not_blank,
  drop constraint if exists mou_requests_email_format,
  drop constraint if exists mou_requests_phone_format,
  drop constraint if exists mou_requests_notes_length;
alter table public.executive_appointments
  drop constraint if exists executive_appointments_school_name_not_blank,
  drop constraint if exists executive_appointments_representative_name_not_blank,
  drop constraint if exists executive_appointments_email_format,
  drop constraint if exists executive_appointments_phone_format;

-- ------------------------------------------------------------------ 1-4: previous grants
-- The table-level REVOKE clears the column-level grants; the GRANT restores the table-level SELECT anon had.
revoke select on public.equine_fleet, public.school_hubs from anon;
grant select on public.equine_fleet, public.school_hubs, public.achievements, public.session_skills to anon;

notify pgrst, 'reload schema';
commit;
