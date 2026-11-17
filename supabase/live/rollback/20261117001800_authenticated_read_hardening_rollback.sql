-- Rollback of 20261117001800_authenticated_read_hardening.sql: puts the signed-in reads back exactly as the 23 Oct baseline had
-- them (re-runnable). Anon is not touched (001200 and its own rollback decide that).
begin;

drop policy if exists parent_own_achievements on public.achievements;
drop policy if exists hub_staff_achievements on public.achievements;
drop policy if exists public_read_achievements on public.achievements;
create policy public_read_achievements on public.achievements as permissive for select to public using (true);

drop policy if exists visible_session_skills on public.session_skills;
drop policy if exists read_session_skills on public.session_skills;
create policy read_session_skills on public.session_skills as permissive for select to public using (true);

drop policy if exists parent_assigned_horses on public.equine_fleet;
drop policy if exists hub_staff_horses on public.equine_fleet;
alter policy public_read_horses on public.equine_fleet to public;

-- the baseline had only the table-level grant: drop the column grants first, then restore it
revoke select (id, school_name, slug, architectural_tier, address, latitude, longitude, is_active, created_at) on public.school_hubs from authenticated;
grant select on public.school_hubs to authenticated;

commit;
