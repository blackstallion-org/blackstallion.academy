-- Rollback of 20261023001200 (rollback applied twice) brings back the previous behaviour exactly. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  cadet   uuid := (select id from public.cadets where passport_code = 'BSAH-TEST-0001');
  keep_qr uuid[] := array(select id from public.qr_lead_captures);
  i int; ok int := 0;
begin
  perform t.eq('rollback 001200: anon privileges identical to before the migration', t.acl_fingerprint('anon'), (select v from t.snap where k = 'acl_anon_before_001200'));
  perform t.eq('rollback 001200: authenticated privileges identical to before', t.acl_fingerprint('authenticated'), (select v from t.snap where k = 'acl_authenticated_before_001200'));
  perform t.eq('rollback 001200: operations policies, functions and columns unchanged', t.ops_fingerprint(), (select v from t.snap where k = 'ops_before_001200'));
  perform t.eq('rollback 001200: triggers, functions, salt and checks removed',
    (select count(*) from pg_trigger where tgname like 'anon_insert_guard_%') || ' triggers, '
    || (select count(*) from pg_proc where proname like 'anon_insert_guard_%') || ' functions, '
    || (select count(*) from pg_constraint where conname = any (t.hardening_checks())) || ' checks, salt '
    || coalesce(to_regclass('app_private.anon_insert_guard_salt')::text, 'gone'), '0 triggers, 0 functions, 0 checks, salt gone');
  perform t.eq('rollback 001200: the limiter''s own counters removed', (select count(*)::text from app_private.rate_limits where bucket ~ '^(anonqr|anonmou|anonappt):'), '0');

  perform t.eq('rollback 001200: anon reads the stall-cam link again (old behaviour)', t.scalar(null, 'anon',
    $q$select stall_cctv_rtsp_url from public.equine_fleet where name = 'Chetak'$q$), 'rtsp://stall-cam.example/chetak');
  perform t.eq('rollback 001200: anon select * on equine_fleet works again', t.scalar(null, 'anon', 'select count(*) from (select * from public.equine_fleet) s'), '1');
  perform t.eq('rollback 001200: anon reads revenue share and contact e-mail again', t.scalar(null, 'anon',
    $q$select revenue_share_percentage || ' ' || contact_email from public.school_hubs where slug = 'test-hub'$q$), '25.00 office@test-hub.example');
  perform t.eq('rollback 001200: anon reads achievements and session_skills again', t.scalar(null, 'anon',
    format($q$select (select title from public.achievements where cadet_id = %L) || ' ' || (select count(*) from public.session_skills)$q$, cadet)), 'First canter 1');

  perform t.client('{"x-forwarded-for":"198.51.100.10"}');
  perform t.eq('rollback 001200: unchecked rows accepted again (old behaviour)', t.dml(null, 'anon',
    $q$insert into public.qr_lead_captures (hub_slug, parent_name) values ('bad slug!', '  ')$q$), 'OK:1');
  for i in 1..6 loop
    if t.dml(null, 'anon', $q$insert into public.qr_lead_captures (hub_slug, parent_name) values ('test-hub', 'Kiran Rao')$q$) = 'OK:1' then ok := ok + 1; end if;
  end loop;
  perform t.eq('rollback 001200: no rate limit any more (6 of 6 from one client)', ok::text, '6');
  perform t.client(null);
  delete from public.qr_lead_captures where id <> all (keep_qr);
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
