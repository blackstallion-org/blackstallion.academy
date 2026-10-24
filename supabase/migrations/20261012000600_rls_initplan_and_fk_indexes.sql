-- Applied 12 Oct 2026: evaluate auth.uid() once per statement in RLS, and index every foreign key.
alter policy profiles_read on public.profiles using (id = (select auth.uid()) or app_private.is_admin());
alter policy profiles_update_self on public.profiles
  using (id = (select auth.uid()) or app_private.is_exec()) with check (id = (select auth.uid()) or app_private.is_exec());
alter policy guardians_read on public.cadet_guardians using (guardian_profile_id = (select auth.uid()) or app_private.is_admin());
alter policy assignments_read on public.instructor_assignments using (instructor_profile_id = (select auth.uid()) or app_private.is_admin());
alter policy hub_members_read on public.hub_members using (profile_id = (select auth.uid()) or app_private.is_admin());
alter policy sessions_write on public.training_sessions
  with check (app_private.is_admin()
    or (app_private.my_role() = 'instructor' and instructor_profile_id = (select auth.uid()) and app_private.is_assigned_instructor(cadet_id)));
alter policy sessions_update on public.training_sessions
  using (app_private.is_admin() or (instructor_profile_id = (select auth.uid()) and app_private.is_assigned_instructor(cadet_id)))
  with check (app_private.is_admin() or (instructor_profile_id = (select auth.uid()) and app_private.is_assigned_instructor(cadet_id)));
alter policy pillar_logs_insert on public.session_pillar_logs
  with check (assessed_by = (select auth.uid()) and app_private.can_assess_session(session_id));
alter policy pillar_logs_update on public.session_pillar_logs
  using (app_private.can_assess_session(session_id))
  with check (assessed_by = (select auth.uid()) and app_private.can_assess_session(session_id));
alter policy rank_history_admin_insert on public.cadet_rank_history
  with check (app_private.is_admin() and assessor_profile_id = (select auth.uid()));

create index if not exists approved_claims_approved_by_idx on public.approved_claims (approved_by);
create index if not exists audit_events_actor_idx on public.audit_events (actor_profile_id);
create index if not exists cadet_rank_history_assessor_idx on public.cadet_rank_history (assessor_profile_id);
create index if not exists cadets_home_zone_idx on public.cadets (home_zone_id);
create index if not exists hub_members_hub_idx on public.hub_members (hub_id);
create index if not exists onboarding_leads_assigned_idx on public.onboarding_leads (assigned_to);
create index if not exists passport_credentials_issued_by_idx on public.passport_credentials (issued_by);
create index if not exists session_pillar_logs_assessed_by_idx on public.session_pillar_logs (assessed_by);
create index if not exists training_sessions_instructor_idx on public.training_sessions (instructor_profile_id);
