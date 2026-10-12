-- Audit coverage and "fresh role read" tests. Runs after 10_authorization_tests.sql in the same database.
select coalesce(max(n), 0) as start_n from t.results \gset

do $$
declare
  ops uuid := '00000000-0000-0000-0000-0000000000a1';
  exe uuid := '00000000-0000-0000-0000-0000000000a2';
  g1  uuid := '00000000-0000-0000-0000-0000000000c1';
  c1  uuid := '00000000-0000-0000-0000-00000000f001';
  hub uuid; before bigint; cols jsonb; seed_lead uuid;
begin
  select id into hub from public.school_hubs where code = '01B';
  select id into seed_lead from public.onboarding_leads limit 1;

  -- audit rows cannot be forged by app roles
  perform t.eq('audit: authenticated cannot insert audit rows', t.dml(ops, 'authenticated', $q$insert into public.audit_events (action, entity_type) values ('forged','x')$q$), 'ERR:42501');
  perform t.eq('audit: row-change function not callable by users', t.scalar(ops, 'authenticated', 'select public.audit_row_change()::text'), 'ERR:42501');

  -- guardian link changes are audited without values
  select count(*) into before from public.audit_events where entity_type = 'cadet_guardians';
  perform t.eq('audit: admin can change guardian link flag', t.dml(ops, 'authenticated', format($q$update public.cadet_guardians set can_view_records = false where cadet_id = %L$q$, c1)), 'OK:1');
  perform t.eq('audit: guardian link change recorded', (select (count(*) - before)::text from public.audit_events where entity_type = 'cadet_guardians'), '1');
  select metadata into cols from public.audit_events where entity_type = 'cadet_guardians' order by id desc limit 1;
  perform t.eq('audit: only column names are logged', cols::text, '{"changed_columns": ["can_view_records"]}');
  perform t.eq('audit: acting user recorded', (select actor_profile_id::text from public.audit_events where entity_type = 'cadet_guardians' order by id desc limit 1), ops::text);
  perform t.eq('access: guardian with can_view_records=false loses the child immediately', t.scalar(g1, 'authenticated', 'select count(*) from public.cadets'), '0');
  update public.cadet_guardians set can_view_records = true where cadet_id = c1;

  -- assignments / hub members / lead status / claims
  perform t.eq('audit: assignment removal recorded', t.dml(ops, 'authenticated', format($q$delete from public.instructor_assignments where cadet_id = %L$q$, c1)), 'OK:1');
  perform t.eq('audit: delete event exists', (select count(*)::text from public.audit_events where entity_type = 'instructor_assignments' and action = 'row.delete'), '1');
  perform t.eq('audit: lead status change recorded', t.dml(ops, 'authenticated', format($q$update public.onboarding_leads set status = 'contacted' where id = %L$q$, seed_lead)), 'OK:1');
  perform t.eq('audit: lead audit stores no contact data', (select (metadata::text !~ '@') ::text from public.audit_events where entity_type = 'onboarding_leads' order by id desc limit 1), 'true');
  select count(*) into before from public.audit_events;
  perform t.eq('audit: no-op update accepted', t.dml(ops, 'authenticated', format($q$update public.cadet_guardians set can_view_records = true where cadet_id = %L$q$, c1)), 'OK:1');
  perform t.eq('audit: no-op update writes nothing', (select (count(*) - before)::text from public.audit_events), '0');
  perform t.eq('audit: claim draft insert recorded', (select (count(*) >= 1)::text from public.audit_events where entity_type = 'approved_claims'), 'true');

  -- fresh role read: demotion applies to the same session immediately
  perform t.eq('role: ops reads leads while operations', (t.scalar(ops, 'authenticated', 'select count(*) from public.onboarding_leads')::int > 0)::text, 'true');
  update public.profiles set role = 'cadet' where id = ops;        -- trusted context
  perform t.eq('role: same user loses lead access right after demotion', t.scalar(ops, 'authenticated', 'select count(*) from public.onboarding_leads'), '0');
  perform t.eq('role: demoted user cannot issue credentials', t.scalar(ops, 'authenticated', format($q$select public.issue_passport_credential(%L,'x')$q$, c1)), 'ERR:42501');
  update public.profiles set role = 'operations' where id = ops;
  perform t.eq('role: access returns right after promotion', (t.scalar(ops, 'authenticated', 'select count(*) from public.onboarding_leads')::int > 0)::text, 'true');
  perform t.eq('role: role changes were audited (4 in total)', (select count(*)::text from public.audit_events where action = 'profile.role_changed'), '4');
end $$;

-- 12 Oct 2026 hardening: the old view is closed to app roles; the function exposes labels only.
do $$ begin
  perform t.eq('view: public_hub_labels closed to anon', t.scalar(null, 'anon', 'select count(*) from public.public_hub_labels'), 'ERR:42501');
  perform t.eq('fn: list_public_hubs has no contract or finance columns',
    (select count(*)::text from information_schema.routines r join information_schema.parameters p on p.specific_name = r.specific_name
      where r.routine_name = 'list_public_hubs' and p.parameter_mode = 'OUT' and p.parameter_name in ('contract_reference','revenue_share_pct','zero_capex_invested')), '0');
end $$;

select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end as result
from t.results where n > :start_n order by n;
