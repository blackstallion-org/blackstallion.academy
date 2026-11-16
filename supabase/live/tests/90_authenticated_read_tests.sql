-- Signed-in read hardening (20261117001800). Run twice by run.sh: once after the migration (:'phase' = 'after'), once after its
-- rollback (:'phase' = 'rolled-back'), where the old open reads must be back. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
select set_config('t.phase', :'phase', false);
do $$
declare
  hub uuid := '00000000-0000-0000-0000-0000000000e1';
  other_hub uuid := '00000000-0000-0000-0000-0000000000e9';
  parent uuid := '00000000-0000-0000-0000-0000000000b1';
  stranger uuid := '00000000-0000-0000-0000-0000000000f1';
  school uuid := '00000000-0000-0000-0000-0000000000b2';
  coach uuid := '00000000-0000-0000-0000-0000000000b3';
  groom uuid := '00000000-0000-0000-0000-0000000000b4';
  admin uuid := '00000000-0000-0000-0000-0000000000a1';
  after boolean := current_setting('t.phase') = 'after';
  cadet uuid;
  sess uuid;
  skill uuid;
begin
  -- fixtures (idempotent): a second hub, a signed-up stranger, staff placed in the test hub, two horses, an achievement, a session
  insert into public.school_hubs (id, school_name, slug, contact_email, revenue_share_percentage)
    values (other_hub, 'Other Hub School', 'other-hub', 'head@other.test', 30) on conflict (id) do nothing;
  update public.school_hubs set contact_email = 'head@test.test' where id = hub;
  insert into auth.users (id, email, raw_user_meta_data) values (stranger, 'stranger@example.test', '{"full_name":"Stranger"}') on conflict (id) do nothing;
  update public.users set role = 'PARENT' where id = stranger;
  update public.users set hub_id = hub where id in (school, coach, groom);
  insert into public.equine_fleet (id, hub_id, name, microchip_iso_id, stall_cctv_rtsp_url) values
    ('00000000-0000-0000-0000-00000000aa01', hub, 'Toofan', 'CHIP-TEST-1', 'rtsp://cam.test/1'),
    ('00000000-0000-0000-0000-00000000aa02', other_hub, 'Badal', 'CHIP-TEST-2', 'rtsp://cam.test/2') on conflict (id) do nothing;
  select id into cadet from public.cadets where parent_id = parent limit 1;
  update public.cadets set assigned_horse_id = '00000000-0000-0000-0000-00000000aa01' where id = cadet;
  insert into public.achievements (id, cadet_id, hub_id, achievement_type, title) values
    ('00000000-0000-0000-0000-00000000ac01', cadet, hub, 'RANK', 'First canter') on conflict (id) do nothing;
  insert into public.skills (id, name, category) values ('00000000-0000-0000-0000-00000000ab01', 'Rising trot', 'RIDING') on conflict (id) do nothing;
  insert into public.training_sessions (id, cadet_id, instructor_id, horse_id) values
    ('00000000-0000-0000-0000-00000000ad01', cadet, coach, '00000000-0000-0000-0000-00000000aa01') on conflict (id) do nothing;
  insert into public.session_skills (session_id, skill_id) values ('00000000-0000-0000-0000-00000000ad01', '00000000-0000-0000-0000-00000000ab01') on conflict do nothing;

  if after then
    -- a signed-up stranger (every new account is a PARENT) sees none of it
    perform t.eq('S7 stranger: achievements of other children are hidden', t.scalar(stranger, 'authenticated', 'select count(*) from public.achievements'), '0');
    perform t.eq('S7 stranger: session skills are hidden', t.scalar(stranger, 'authenticated', 'select count(*) from public.session_skills'), '0');
    perform t.eq('S7 stranger: horses are hidden', t.scalar(stranger, 'authenticated', 'select count(*) from public.equine_fleet'), '0');
    perform t.eq('S7 stranger: hub rows still list (the enrolment form needs them)', t.scalar(stranger, 'authenticated', 'select count(*) from public.school_hubs where id in (''00000000-0000-0000-0000-0000000000e1'', ''00000000-0000-0000-0000-0000000000e9'')'), '2');
    perform t.eq('S7 stranger: hub names and slugs readable', t.scalar(stranger, 'authenticated', 'select school_name from public.school_hubs where slug = ''other-hub'''), 'Other Hub School');
    perform t.eq('S7 stranger: revenue share is refused', t.scalar(stranger, 'authenticated', 'select revenue_share_percentage::text from public.school_hubs limit 1'), 'ERR:42501');
    perform t.eq('S7 stranger: hub contact e-mail is refused', t.scalar(stranger, 'authenticated', 'select contact_email from public.school_hubs limit 1'), 'ERR:42501');
    perform t.eq('S7 stranger: select * on hubs is refused (no column leaks through *)', t.scalar(stranger, 'authenticated', 'select count(*) from (select * from public.school_hubs) x'), 'ERR:42501');
    -- the parent sees their own child's records and horse (with its stall camera), nothing else
    perform t.eq('S7 parent: own child''s achievement', t.scalar(parent, 'authenticated', 'select count(*) from public.achievements where id = ''00000000-0000-0000-0000-00000000ac01'''), '1');
    perform t.eq('S7 parent: own child''s session skills', t.scalar(parent, 'authenticated', 'select count(*) from public.session_skills where session_id = ''00000000-0000-0000-0000-00000000ad01'''), '1');
    perform t.eq('S7 parent: only the horse assigned to their child', t.scalar(parent, 'authenticated', 'select string_agg(name, '','') from public.equine_fleet'), 'Toofan');
    perform t.eq('S7 parent: that horse''s stall camera', t.scalar(parent, 'authenticated', 'select stall_cctv_rtsp_url from public.equine_fleet'), 'rtsp://cam.test/1');
    -- hub staff see their hub only
    perform t.eq('S7 school admin: own hub''s achievements', t.scalar(school, 'authenticated', 'select count(*) from public.achievements where id = ''00000000-0000-0000-0000-00000000ac01'''), '1');
    perform t.eq('S7 instructor: own hub''s horse, not the other hub''s', t.scalar(coach, 'authenticated', 'select string_agg(name, '','') from public.equine_fleet where id::text like ''00000000-0000-0000-0000-00000000aa0%'''), 'Toofan');
    perform t.eq('S7 groom: own hub''s horse, not the other hub''s', t.scalar(groom, 'authenticated', 'select string_agg(name, '','') from public.equine_fleet where id::text like ''00000000-0000-0000-0000-00000000aa0%'''), 'Toofan');
    perform t.eq('S7 instructor: skills of their own sessions', t.scalar(coach, 'authenticated', 'select count(*) from public.session_skills where session_id = ''00000000-0000-0000-0000-00000000ad01'''), '1');
    perform t.eq('S7 groom: no achievements (not an academic role)', t.scalar(groom, 'authenticated', 'select count(*) from public.achievements'), '0');
    -- super admin keeps everything through super_admin_all (rows), but not the two hub columns through the API
    perform t.eq('S7 super admin: every horse', t.scalar(admin, 'authenticated', 'select count(*) from public.equine_fleet where id::text like ''00000000-0000-0000-0000-00000000aa0%'''), '2');
    perform t.eq('S7 super admin: every achievement', t.scalar(admin, 'authenticated', 'select count(*) from public.achievements where id = ''00000000-0000-0000-0000-00000000ac01'''), '1');
    -- anon: unchanged by this file (001200's rules)
    perform t.eq('S7 anon: active horses still listed', t.scalar(null, 'anon', 'select count(*) from public.equine_fleet where id::text like ''00000000-0000-0000-0000-00000000aa0%'''), '2');
    perform t.eq('S7 anon: microchip still hidden (001200)', t.scalar(null, 'anon', 'select microchip_iso_id from public.equine_fleet limit 1'), 'ERR:42501');
    perform t.eq('S7 anon: achievements still refused (001200)', t.scalar(null, 'anon', 'select count(*) from public.achievements'), 'ERR:42501');
    -- writes are not affected
    perform t.eq('S7 instructor: can still add a session skill', t.dml(coach, 'authenticated', 'insert into public.session_skills (session_id, skill_id) select ''00000000-0000-0000-0000-00000000ad01'', id from public.skills where id = ''00000000-0000-0000-0000-00000000ab01'' on conflict do nothing'), 'OK:0');
  else
    perform t.eq('S7 rollback: a stranger reads every achievement again', t.scalar(stranger, 'authenticated', 'select count(*) from public.achievements where id = ''00000000-0000-0000-0000-00000000ac01'''), '1');
    perform t.eq('S7 rollback: a stranger reads every horse again', t.scalar(stranger, 'authenticated', 'select count(*) from public.equine_fleet where id::text like ''00000000-0000-0000-0000-00000000aa0%'''), '2');
    perform t.eq('S7 rollback: a stranger reads revenue share again', t.scalar(stranger, 'authenticated', 'select revenue_share_percentage::text from public.school_hubs where slug = ''other-hub'''), '30.00');
    perform t.eq('S7 rollback: no column-level grants left on school_hubs for authenticated', (select count(*)::text from information_schema.column_privileges where table_schema = 'public' and table_name = 'school_hubs' and grantee = 'authenticated' and privilege_type = 'SELECT' and is_grantable = 'NO' and not has_table_privilege('authenticated', 'public.school_hubs', 'select')), '0');
    perform t.eq('S7 rollback: the horse list policy is for everyone again', (select roles::text from pg_policies where tablename = 'equine_fleet' and policyname = 'public_read_horses'), '{public}');
  end if;
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
