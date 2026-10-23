-- EVIDENCE for 20261023001200_anon_privacy_hardening.sql, on the replica BEFORE it is applied (website layer and
-- security fixes in place). Each EVIDENCE check PASSES when the finding is present. Also adds the fixtures and helpers
-- that 40/41/50 use and snapshots privileges and fingerprints. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset

create or replace function t.hardening_tables() returns oid[] language sql stable as $$
  select array['public.equine_fleet'::regclass, 'public.school_hubs'::regclass, 'public.achievements'::regclass,
    'public.session_skills'::regclass, 'public.mou_requests'::regclass, 'public.executive_appointments'::regclass,
    'public.qr_lead_captures'::regclass]::oid[]
$$;
-- Privileges of one role on the seven affected tables, table- and column-level, in a stable text form.
create or replace function t.acl_fingerprint(p_role text) returns text language sql stable as $$
  select coalesce(string_agg(x, '|' order by x), '') from (
    select c.relname || '.*:' || e.privilege_type as x
      from pg_class c cross join lateral aclexplode(c.relacl) e
     where c.oid = any (t.hardening_tables()) and e.grantee = p_role::regrole
    union all
    select c.relname || '.' || a.attname || ':' || e.privilege_type
      from pg_attribute a join pg_class c on c.oid = a.attrelid cross join lateral aclexplode(a.attacl) e
     where c.oid = any (t.hardening_tables()) and a.attnum > 0 and not a.attisdropped and e.grantee = p_role::regrole) s
$$;
-- Columns a role may SELECT, in column order.
create or replace function t.readable_columns(p_role text, p_table regclass) returns text language sql stable as $$
  select coalesce(string_agg(attname, ',' order by attnum), '') from pg_attribute
   where attrelid = p_table and attnum > 0 and not attisdropped and has_column_privilege(p_role, p_table, attnum, 'select')
$$;
-- Like t.dml, but returns the error message too ('OK' on success).
create or replace function t.dml_msg(uid uuid, r text, q text) returns text language plpgsql as $$
begin
  perform t.as_user(uid, r);
  begin execute q;
  exception when others then reset role; perform set_config('request.jwt.claim.sub', '', true); return sqlstate || ' ' || sqlerrm; end;
  reset role; perform set_config('request.jwt.claim.sub', '', true);
  return 'OK';
end $$;
-- The client address PostgREST would pass in (transaction-local, like PostgREST's own setting).
create or replace function t.client(p_headers text) returns void language plpgsql as $$
begin perform set_config('request.headers', coalesce(p_headers, ''), true); end $$;
-- Names of the 13 NOT VALID checks the hardening adds.
create or replace function t.hardening_checks() returns text[] language sql immutable as $$
  select array['qr_lead_captures_hub_slug_format', 'qr_lead_captures_parent_name_not_blank', 'qr_lead_captures_parent_phone_format',
    'qr_lead_captures_device_info_length', 'mou_requests_school_name_not_blank', 'mou_requests_representative_name_not_blank',
    'mou_requests_email_format', 'mou_requests_phone_format', 'mou_requests_notes_length', 'executive_appointments_school_name_not_blank',
    'executive_appointments_representative_name_not_blank', 'executive_appointments_email_format', 'executive_appointments_phone_format']
$$;

do $$
declare
  hub    uuid := '00000000-0000-0000-0000-0000000000e1';
  coach  uuid := '00000000-0000-0000-0000-0000000000b3';
  cadet  uuid := (select id from public.cadets where passport_code = 'BSAH-TEST-0001');
  i int; ok int := 0;
begin
  -- fixtures: one active and one retired horse with camera links and microchips, hub commercial terms, a child's
  -- achievement and a session with a skill (live data shape)
  update public.school_hubs set contact_email = 'office@test-hub.example', revenue_share_percentage = 25.00 where id = hub;
  insert into public.equine_fleet (id, hub_id, name, microchip_iso_id, stall_cctv_rtsp_url, height_hands, temperament)
  values ('00000000-0000-0000-0000-0000000000f1', hub, 'Chetak', '356098112004912', 'rtsp://stall-cam.example/chetak', 15.2, 'Calm');
  insert into public.equine_fleet (id, hub_id, name, microchip_iso_id, stall_cctv_rtsp_url, is_active)
  values ('00000000-0000-0000-0000-0000000000f2', hub, 'Retired Mare', '356098112004999', 'rtsp://stall-cam.example/retired', false);
  update public.cadets set assigned_horse_id = '00000000-0000-0000-0000-0000000000f1' where id = cadet;
  insert into public.achievements (cadet_id, hub_id, achievement_type, title) values (cadet, hub, 'MILESTONE', 'First canter');
  insert into public.skills (id, name, category) values ('00000000-0000-0000-0000-0000000000c1', 'Rising trot', 'RIDING');
  insert into public.training_sessions (id, cadet_id, instructor_id, horse_id, riding_score)
  values ('00000000-0000-0000-0000-0000000000d1', cadet, coach, '00000000-0000-0000-0000-0000000000f1', 7);
  insert into public.session_skills (session_id, skill_id) values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1');

  -- findings 1-4: what an anonymous visitor can read today
  perform t.eq('EVIDENCE 001200: anon reads a live stall-cam stream link', t.scalar(null, 'anon',
    $q$select stall_cctv_rtsp_url from public.equine_fleet where name = 'Chetak'$q$), 'rtsp://stall-cam.example/chetak');
  perform t.eq('EVIDENCE 001200: anon reads horse microchip ids', t.scalar(null, 'anon',
    $q$select microchip_iso_id from public.equine_fleet where name = 'Chetak'$q$), '356098112004912');
  perform t.eq('EVIDENCE 001200: anon reads a hub revenue share and contact e-mail', t.scalar(null, 'anon',
    $q$select revenue_share_percentage || ' ' || contact_email from public.school_hubs where slug = 'test-hub'$q$), '25.00 office@test-hub.example');
  perform t.eq('EVIDENCE 001200: anon reads a child''s achievements by cadet_id', t.scalar(null, 'anon',
    format($q$select title from public.achievements where cadet_id = %L$q$, cadet)), 'First canter');
  perform t.eq('EVIDENCE 001200: anon reads session_skills', t.scalar(null, 'anon', 'select count(*) from public.session_skills'), '1');

  -- finding 5: open anonymous inserts take junk and bursts
  perform t.client('{"x-forwarded-for":"192.0.2.50"}');
  perform t.eq('EVIDENCE 001200: anon stores a junk QR capture (blank name, bad slug, 20 kB text)', t.dml(null, 'anon',
    format($q$insert into public.qr_lead_captures (hub_slug, parent_name, device_info, source) values ('<b>spam</b> http://x', '  ', %L, 'evidence-35')$q$,
      repeat('x', 20000))), 'OK:1');
  for i in 1..10 loop
    if t.dml(null, 'anon', $q$insert into public.qr_lead_captures (hub_slug, parent_name, source) values ('test-hub', 'Burst', 'evidence-35')$q$) = 'OK:1' then ok := ok + 1; end if;
  end loop;
  perform t.eq('EVIDENCE 001200: anon bursts 10 QR captures from one address, all accepted', ok::text, '10');
  perform t.eq('EVIDENCE 001200: anon stores an MOU request with a blank school, bad e-mail and bad phone', t.dml(null, 'anon',
    $q$insert into public.mou_requests (school_name, representative_name, email, phone_number, notes) values (' ', 'x', 'not-an-email', 'call me', 'evidence-35')$q$), 'OK:1');
  perform t.client(null);
  delete from public.qr_lead_captures where source = 'evidence-35';
  delete from public.mou_requests where notes = 'evidence-35';

  -- a row that predates the checks and breaks them (the migration must still apply: NOT VALID)
  insert into public.qr_lead_captures (hub_slug, parent_name, source) values ('Legacy Slug!', '  ', 'legacy-fixture');

  insert into t.snap values ('ops_before_001200', t.ops_fingerprint()),
    ('acl_anon_before_001200', t.acl_fingerprint('anon')), ('acl_authenticated_before_001200', t.acl_fingerprint('authenticated'));
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
