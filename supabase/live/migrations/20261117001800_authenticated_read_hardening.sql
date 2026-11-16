-- Signed-in read hardening (security audit S7 / H1, written 17 Nov 2026). NOT APPLIED ANYWHERE.
-- Apply only with the owner's approval, AFTER 20261023001200_anon_privacy_hardening.sql (this file refuses to run before it).
-- Rollback: supabase/live/rollback/20261117001800_authenticated_read_hardening_rollback.sql. Replica test: tests/run.sh (stage 90).
--
-- Why: anyone can create an account (phone, Google, e-mail) and every new account is a PARENT. Before this file, any signed-in
-- account could read, through the publishable key:
--   achievements      every child's achievements, at every school                       (policy public_read_achievements: true)
--   session_skills    every training session's skill list                               (policy read_session_skills: true)
--   equine_fleet      every active horse, including microchip_iso_id and stall_cctv_rtsp_url  (public_read_horses, to public)
--   school_hubs       every hub, including revenue_share_percentage and contact_email   (public_read_hubs + table grant)
-- 001200 closes these for anon only; it deliberately leaves signed-in reads unchanged. This file closes them for signed-in users.
--
-- After it, for the authenticated role (PostgREST with a user session):
--   achievements    the parent of the cadet; SCHOOL_ADMIN and INSTRUCTOR of the achievement's hub; SUPER_ADMIN (unchanged policy)
--   session_skills  whoever can see the training session (training_sessions RLS decides: parent, instructor, hub admin, super admin)
--   equine_fleet    the parent of a cadet the horse is assigned to; SCHOOL_ADMIN, INSTRUCTOR and GROOM of the horse's hub;
--                   SUPER_ADMIN (unchanged). Anon keeps active horses with 001200's safe columns.
--   school_hubs     every hub row still (the enrolment form lists campuses), but not revenue_share_percentage or contact_email;
--                   staff read those through the dashboard / service role, not the public API.
-- Not changed: site_settings (key/value configuration: review the live values; if any is sensitive, restrict it separately),
-- consent_records (L3: parents can edit their own consent rows; changing that needs a decision on consent withdrawal).
--
-- PRE-FLIGHT on the live project (the website itself needs none of the removed reads; checked in code on 17 Nov 2026):
--   1. Confirm no signed-in client (mobile app, ops tool) selects school_hubs.revenue_share_percentage / contact_email, or reads
--      horses / achievements outside the rules above. A client that does will get "permission denied" or fewer rows.
--   2. Run tests/run.sh on the replica (PG_BIN=/opt/homebrew/opt/postgresql@18/bin on a Mac): all PASS.
begin;

do $$
begin
  -- order: 001200 first (it hides the horse and hub columns from anon; this file relies on that for the anon horse policy)
  if has_column_privilege('anon', 'public.equine_fleet', 'microchip_iso_id', 'select') then
    raise exception 'apply 20261023001200_anon_privacy_hardening.sql first: anon can still read equine_fleet.microchip_iso_id';
  end if;
  -- the school_hubs column list below is explicit: refuse if the table has a column this file does not know
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'school_hubs'
             and column_name not in ('id', 'school_name', 'slug', 'architectural_tier', 'address', 'latitude', 'longitude',
                                     'contact_email', 'revenue_share_percentage', 'is_active', 'created_at')) then
    raise exception 'school_hubs has a column this migration does not know: decide whether signed-in users may read it, then edit the list';
  end if;
end $$;

-- 1. achievements: own child, or hub staff (SUPER_ADMIN keeps super_admin_all)
drop policy if exists public_read_achievements on public.achievements;
drop policy if exists parent_own_achievements on public.achievements;
create policy parent_own_achievements on public.achievements as permissive for select to authenticated
  using (cadet_id in (select c.id from public.cadets c where c.parent_id = (select auth.uid())));
drop policy if exists hub_staff_achievements on public.achievements;
create policy hub_staff_achievements on public.achievements as permissive for select to authenticated
  using ((select public.current_role_name()) in ('SCHOOL_ADMIN', 'INSTRUCTOR') and hub_id = (select public.current_hub_id()));

-- 2. session_skills: visible with the session (the subquery runs under training_sessions' own RLS)
drop policy if exists read_session_skills on public.session_skills;
drop policy if exists visible_session_skills on public.session_skills;
create policy visible_session_skills on public.session_skills as permissive for select to authenticated
  using (session_id in (select s.id from public.training_sessions s));

-- 3. equine_fleet: anon keeps the active-horse list (columns limited by 001200); signed-in users see only their own horses
alter policy public_read_horses on public.equine_fleet to anon;
drop policy if exists parent_assigned_horses on public.equine_fleet;
create policy parent_assigned_horses on public.equine_fleet as permissive for select to authenticated
  using (id in (select c.assigned_horse_id from public.cadets c where c.parent_id = (select auth.uid())));
drop policy if exists hub_staff_horses on public.equine_fleet;
create policy hub_staff_horses on public.equine_fleet as permissive for select to authenticated
  using ((select public.current_role_name()) in ('SCHOOL_ADMIN', 'INSTRUCTOR', 'GROOM') and hub_id = (select public.current_hub_id()));

-- 4. school_hubs: rows stay readable; the two business columns do not
revoke select on public.school_hubs from authenticated;
revoke select (contact_email, revenue_share_percentage) on public.school_hubs from authenticated;
grant select (id, school_name, slug, architectural_tier, address, latitude, longitude, is_active, created_at) on public.school_hubs to authenticated;

do $$
begin
  if has_column_privilege('authenticated', 'public.school_hubs', 'revenue_share_percentage', 'select')
     or has_column_privilege('authenticated', 'public.school_hubs', 'contact_email', 'select') then
    raise exception 'signed-in users can still read a protected school_hubs column (a grant to PUBLIC or another role?)';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public'
             and ((tablename = 'achievements' and policyname = 'public_read_achievements')
               or (tablename = 'session_skills' and policyname = 'read_session_skills')
               or (tablename = 'equine_fleet' and policyname = 'public_read_horses' and roles <> '{anon}'))) then
    raise exception 'an open read policy is still in place';
  end if;
end $$;

commit;
