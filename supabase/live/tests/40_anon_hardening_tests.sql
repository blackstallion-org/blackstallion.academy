-- Anon privacy hardening (20261023001200), applied twice. Uses the fixtures and helpers of 35_anon_hardening_evidence.sql.
-- Everything runs in one transaction, so every rate-limit hit below falls into the same window. Rows written to the
-- intake tables are removed at the end. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  admin  uuid := '00000000-0000-0000-0000-0000000000a1';
  parent uuid := '00000000-0000-0000-0000-0000000000b1';
  coach  uuid := '00000000-0000-0000-0000-0000000000b3';
  cadet  uuid := (select id from public.cadets where passport_code = 'BSAH-TEST-0001');
  keep_qr   uuid[] := array(select id from public.qr_lead_captures);
  keep_mou  uuid[] := array(select id from public.mou_requests);
  keep_appt uuid[] := array(select id from public.executive_appointments);
  qr   text := $q$insert into public.qr_lead_captures (hub_slug, parent_name, parent_phone, device_info) values (%L, %L, %L, %L)$q$;
  mou  text := $q$insert into public.mou_requests (school_name, representative_name, email, phone_number, notes) values (%L, %L, %L, %L, %L)$q$;
  appt text := $q$insert into public.executive_appointments (school_name, representative_name, designation, phone_number, email,
                 preferred_date, preferred_time_slot) values (%L, %L, 'Principal', %L, %L, '2026-12-01', '10:00')$q$;
  call text := $q$select public.submit_lead_v2(%L::public.lead_type, %L, %L, %L, %L, %L::jsonb, '2026-10-draft', true, %L::jsonb, %L)::text$q$;
  client_a text := '{"x-forwarded-for":"198.51.100.10, 10.0.0.1"}';
  client_e text := '{"x-forwarded-for":"198.51.100.30"}';
  i int; ok int; hits_before bigint;
begin
  -- ------------------------------------------------------------ structure (after two runs)
  perform t.eq('hardening: operations policies, functions and columns unchanged', t.ops_fingerprint(), (select v from t.snap where k = 'ops_before_001200'));
  perform t.eq('hardening: authenticated privileges unchanged', t.acl_fingerprint('authenticated'), (select v from t.snap where k = 'acl_authenticated_before_001200'));
  perform t.eq('hardening: applied twice, every object exists once',
    (select count(*) from pg_trigger where tgname like 'anon_insert_guard_%') || ' triggers, '
    || (select count(*) from pg_constraint where conname = any (t.hardening_checks())) || ' checks, '
    || (select count(*) from app_private.anon_insert_guard_salt) || ' salt', '6 triggers, 13 checks, 1 salt');
  perform t.eq('hardening: all 13 checks are NOT VALID', (select count(*)::text from pg_constraint where conname = any (t.hardening_checks()) and not convalidated), '13');
  perform t.eq('hardening: an older row that breaks the checks is kept', (select count(*)::text from public.qr_lead_captures where source = 'legacy-fixture'), '1');
  perform t.eq('hardening: mark trigger runs as the inserting role, limit trigger as owner, both pin search_path',
    (select string_agg(proname || '=' || case when prosecdef then 'definer' else 'invoker' end || ':' || array_to_string(proconfig, ','), ' ' order by proname)
       from pg_proc where pronamespace = 'app_private'::regnamespace and proname like 'anon_insert_guard_%'),
    'anon_insert_guard_limit=definer:search_path="" anon_insert_guard_mark=invoker:search_path=""');
  perform t.eq('hardening: anon cannot read the salt', t.scalar(null, 'anon', 'select count(*) from app_private.anon_insert_guard_salt'), 'ERR:42501');
  perform t.eq('hardening: authenticated cannot read the salt', t.scalar(parent, 'authenticated', 'select count(*) from app_private.anon_insert_guard_salt'), 'ERR:42501');
  perform t.eq('hardening: anon keeps INSERT on the three intake tables', (has_table_privilege('anon', 'public.qr_lead_captures', 'insert')
    and has_table_privilege('anon', 'public.mou_requests', 'insert') and has_table_privilege('anon', 'public.executive_appointments', 'insert'))::text, 'true');

  -- ------------------------------------------------------------ 1, 2: anon column privileges
  perform t.eq('anon: cannot read equine_fleet.stall_cctv_rtsp_url', t.scalar(null, 'anon', 'select stall_cctv_rtsp_url from public.equine_fleet limit 1'), 'ERR:42501');
  perform t.eq('anon: cannot read equine_fleet.microchip_iso_id', t.scalar(null, 'anon', 'select microchip_iso_id from public.equine_fleet limit 1'), 'ERR:42501');
  perform t.eq('anon: select * from equine_fleet is refused', t.scalar(null, 'anon', 'select count(*) from (select * from public.equine_fleet) s'), 'ERR:42501');
  perform t.eq('anon: cannot filter on a hidden column (no microchip oracle)', t.scalar(null, 'anon',
    $q$select count(*) from public.equine_fleet where microchip_iso_id = '356098112004912'$q$), 'ERR:42501');
  perform t.eq('anon: cannot reach hidden columns through a whole-row reference', t.scalar(null, 'anon', 'select row_to_json(f)::text from public.equine_fleet f limit 1'), 'ERR:42501');
  perform t.eq('anon: reads every safe column of active horses only', t.scalar(null, 'anon',
    $q$select string_agg(concat_ws('/', id, hub_id, name, breed, height_hands, temperament, is_active, created_at is not null), ',') from public.equine_fleet$q$),
    '00000000-0000-0000-0000-0000000000f1/00000000-0000-0000-0000-0000000000e1/Chetak/Marwari/15.2/Calm/t/t');
  perform t.eq('anon: counts active horses', t.scalar(null, 'anon', 'select count(*) from public.equine_fleet'), '1');
  perform t.eq('anon: joins horses to hubs on safe columns', t.scalar(null, 'anon',
    'select h.school_name from public.equine_fleet f join public.school_hubs h on h.id = f.hub_id'), 'Test Hub School');
  perform t.eq('anon: readable equine_fleet columns are exactly the safe list', t.readable_columns('anon', 'public.equine_fleet'),
    'id,hub_id,name,breed,height_hands,temperament,is_active,created_at');
  perform t.eq('anon: cannot read school_hubs.revenue_share_percentage', t.scalar(null, 'anon', 'select revenue_share_percentage from public.school_hubs limit 1'), 'ERR:42501');
  perform t.eq('anon: cannot read school_hubs.contact_email', t.scalar(null, 'anon', 'select contact_email from public.school_hubs limit 1'), 'ERR:42501');
  perform t.eq('anon: select * from school_hubs is refused', t.scalar(null, 'anon', 'select count(*) from (select * from public.school_hubs) s'), 'ERR:42501');
  perform t.eq('anon: reads hub names and slugs', t.scalar(null, 'anon', $q$select school_name || ' ' || slug from public.school_hubs where slug = 'test-hub'$q$),
    'Test Hub School test-hub');
  perform t.eq('anon: readable school_hubs columns are exactly the safe list', t.readable_columns('anon', 'public.school_hubs'),
    'id,school_name,slug,architectural_tier,address,latitude,longitude,is_active,created_at');

  -- ------------------------------------------------------------ 3, 4
  perform t.eq('anon: cannot read achievements', t.scalar(null, 'anon', 'select count(*) from public.achievements'), 'ERR:42501');
  perform t.eq('anon: cannot read session_skills', t.scalar(null, 'anon', 'select count(*) from public.session_skills'), 'ERR:42501');

  -- ------------------------------------------------------------ signed-in users read exactly what they read before
  perform t.eq('parent: still reads a horse stall-cam link (as today)', t.scalar(parent, 'authenticated',
    $q$select stall_cctv_rtsp_url from public.equine_fleet where name = 'Chetak'$q$), 'rtsp://stall-cam.example/chetak');
  perform t.eq('parent: select * on equine_fleet still works (active horses, as today)', t.scalar(parent, 'authenticated',
    'select count(*) from (select * from public.equine_fleet) s'), '1');
  perform t.eq('parent: still reads achievements (as today)', t.scalar(parent, 'authenticated',
    format($q$select title from public.achievements where cadet_id = %L$q$, cadet)), 'First canter');
  perform t.eq('parent: still reads session_skills (as today)', t.scalar(parent, 'authenticated', 'select count(*) from public.session_skills'), '1');
  perform t.eq('instructor: still reads microchip ids (as today)', t.scalar(coach, 'authenticated',
    $q$select microchip_iso_id from public.equine_fleet where name = 'Chetak'$q$), '356098112004912');
  perform t.eq('SUPER_ADMIN: still reads revenue share and contact e-mail', t.scalar(admin, 'authenticated',
    $q$select revenue_share_percentage || ' ' || contact_email from public.school_hubs where slug = 'test-hub'$q$), '25.00 office@test-hub.example');
  perform t.eq('SUPER_ADMIN: still reads every horse column, retired horses included', t.scalar(admin, 'authenticated',
    $q$select count(*) || ' ' || string_agg(microchip_iso_id || '@' || stall_cctv_rtsp_url, ',' order by name) from (select * from public.equine_fleet) s$q$),
    '2 356098112004912@rtsp://stall-cam.example/chetak,356098112004999@rtsp://stall-cam.example/retired');

  -- ------------------------------------------------------------ 5a: checks (client A); 5b: rate limit
  perform t.client(client_a);
  perform t.eq('insert: anon stores a valid QR capture', t.dml(null, 'anon', format(qr, 'test-hub', 'Kiran Rao', '+91 98765 43210', 'Mozilla/5.0 (Linux; Android 14)')), 'OK:1');
  perform t.eq('insert: blank parent name refused', t.dml(null, 'anon', format(qr, 'test-hub', '   ', '+91 98765 43210', null)), 'ERR:23514');
  perform t.eq('insert: hub slug with spaces or markup refused', t.dml(null, 'anon', format(qr, '<b>spam</b> http://x', 'Kiran Rao', null, null)), 'ERR:23514');
  perform t.eq('insert: one-character hub slug refused', t.dml(null, 'anon', format(qr, 'x', 'Kiran Rao', null, null)), 'ERR:23514');
  perform t.eq('insert: oversized device_info refused', t.dml(null, 'anon', format(qr, 'test-hub', 'Kiran Rao', null, repeat('x', 10001))), 'ERR:23514');
  perform t.eq('insert: oversized name refused (column type, as before)', t.dml(null, 'anon', format(qr, 'test-hub', repeat('x', 256), null, null)), 'ERR:22001');
  perform t.eq('insert: phone with letters refused', t.dml(null, 'anon', format(qr, 'test-hub', 'Kiran Rao', 'call me maybe', null)), 'ERR:23514');
  perform t.eq('insert: phone with too few digits refused', t.dml(null, 'anon', format(qr, 'test-hub', 'Kiran Rao', '12-34', null)), 'ERR:23514');
  perform t.eq('insert: QR campaign code in capitals accepted', t.dml(null, 'anon', format(qr, 'Q-17', 'Kiran Rao', null, null)), 'OK:1');
  perform t.eq('insert: phone with spaces, a no-break space, parentheses and hyphens accepted', t.dml(null, 'anon',
    format(qr, 'test-hub', 'Kiran Rao', E'+91\u00a0(98765) 432-10', null)), 'OK:1');
  perform t.eq('insert: name and phone may still be left empty (NULL)', t.dml(null, 'anon', format(qr, 'test-hub', null, null, null)), 'OK:1');
  perform t.eq('rate: 5th insert from one client allowed', t.dml(null, 'anon', format(qr, 'test-hub', 'Kiran Rao', null, null)), 'OK:1');
  perform t.eq('rate: 6th insert in the window from the same client refused', t.dml(null, 'anon', format(qr, 'test-hub', 'Kiran Rao', null, null)), 'ERR:P0001');
  perform t.eq('rate: the refusal says what happened', t.dml_msg(null, 'anon', format(qr, 'test-hub', 'Kiran Rao', null, null)),
    'P0001 rate limit exceeded: too many new qr_lead_captures rows from this client');
  perform t.eq('rate: refused and invalid attempts use no quota (5 hits, salted bucket)', (select hits::text from app_private.rate_limits
    where bucket = 'anonqr:' || encode(sha256(convert_to(concat_ws('|', (select salt from app_private.anon_insert_guard_salt), 'qr_lead_captures', '198.51.100.10'), 'UTF8')), 'hex')), '5');
  perform t.client('{"x-forwarded-for":"198.51.100.11"}');
  perform t.eq('rate: a different client is allowed', t.dml(null, 'anon', format(qr, 'test-hub', 'Asha Iyer', null, null)), 'OK:1');
  perform t.client('{"cf-connecting-ip":"198.51.100.10","x-forwarded-for":"203.0.113.99"}');
  perform t.eq('rate: cf-connecting-ip wins over a forged x-forwarded-for', t.dml(null, 'anon', format(qr, 'test-hub', 'Kiran Rao', null, null)), 'ERR:P0001');
  perform t.client(client_a);
  perform t.eq('rate: limits are per table (same client, MOU request)', t.dml(null, 'anon',
    format(mou, 'Green Valley School', 'Ritu Sharma', 'ritu@example.test', '+91 98765 00001', 'Two acres')), 'OK:1');
  perform t.eq('rate: dashboard / postgres inserts are not limited', t.dml(null, 'postgres', format(qr, 'test-hub', 'Office entry', null, null)), 'OK:1');

  ok := 0;
  for i in 1..5 loop
    perform t.client(format('{"cf-connecting-ip":"2001:db8:1:2::%s"}', i));
    if t.dml(null, 'anon', format(qr, 'test-hub', 'IPv6 visitor', null, null)) = 'OK:1' then ok := ok + 1; end if;
  end loop;
  perform t.client('{"cf-connecting-ip":"2001:db8:1:2::ffff"}');
  perform t.eq('rate: IPv6 addresses in one /64 count as one client', ok || ' then ' || t.dml(null, 'anon', format(qr, 'test-hub', 'IPv6 visitor', null, null)), '5 then ERR:P0001');
  perform t.client('{"cf-connecting-ip":"2001:db8:1:3::1"}');
  perform t.eq('rate: another /64 is another client', t.dml(null, 'anon', format(qr, 'test-hub', 'IPv6 visitor', null, null)), 'OK:1');

  perform t.client(null);
  ok := 0;
  for i in 1..100 loop
    if t.dml(null, 'anon', format(qr, 'test-hub', 'No address', null, null)) = 'OK:1' then ok := ok + 1; end if;
  end loop;
  perform t.eq('rate: requests without an address share one generous bucket (100 per window)',
    ok || ' then ' || t.dml(null, 'anon', format(qr, 'test-hub', 'No address', null, null)), '100 then ERR:P0001');
  perform t.client('{"x-forwarded-for":"not-an-ip, 10.0.0.1"}');
  perform t.eq('rate: an address that is not an IP falls into the shared bucket', t.dml(null, 'anon', format(qr, 'test-hub', 'No address', null, null)), 'ERR:P0001');
  perform t.client('{broken json');
  perform t.eq('rate: malformed request.headers falls back to the shared bucket (no crash)', t.dml(null, 'anon', format(qr, 'test-hub', 'No address', null, null)), 'ERR:P0001');

  perform t.client('{"x-forwarded-for":"198.51.100.20"}');
  ok := 0;
  for i in 1..6 loop
    if t.dml(admin, 'authenticated', format(qr, 'test-hub', 'Staff entry', null, null)) = 'OK:1' then ok := ok + 1; end if;
    if t.dml(coach, 'authenticated', format(qr, 'test-hub', 'Coach entry', null, null)) = 'OK:1' then ok := ok + 1; end if;
  end loop;
  perform t.eq('rate: staff (SUPER_ADMIN, INSTRUCTOR) are not limited (12 of 12 from one client)', ok::text, '12');
  perform t.client('{"x-forwarded-for":"198.51.100.21"}');
  ok := 0;
  for i in 1..5 loop
    if t.dml(parent, 'authenticated', format(qr, 'test-hub', 'Parent entry', null, null)) = 'OK:1' then ok := ok + 1; end if;
  end loop;
  perform t.eq('rate: signed-in parents are limited like anon', ok || ' then ' || t.dml(parent, 'authenticated', format(qr, 'test-hub', 'Parent entry', null, null)), '5 then ERR:P0001');

  -- ------------------------------------------------------------ MOU requests and executive appointments (client E)
  perform t.client(client_e);
  perform t.eq('insert: anon stores a valid MOU request', t.dml(null, 'anon', format(mou, 'Green Valley School', 'Ritu Sharma', 'ritu@example.test', '+91 98765 00001', 'Call after 4 pm')), 'OK:1');
  perform t.eq('insert: MOU request with a malformed e-mail refused', t.dml(null, 'anon', format(mou, 'Green Valley School', 'Ritu Sharma', 'ritu(at)example', '+91 98765 00001', null)), 'ERR:23514');
  perform t.eq('insert: MOU request with a blank school name refused', t.dml(null, 'anon', format(mou, ' ', 'Ritu Sharma', 'ritu@example.test', '+91 98765 00001', null)), 'ERR:23514');
  perform t.eq('insert: MOU request with a blank representative refused', t.dml(null, 'anon', format(mou, 'Green Valley School', '', 'ritu@example.test', '+91 98765 00001', null)), 'ERR:23514');
  perform t.eq('insert: MOU request with a non-numeric phone refused', t.dml(null, 'anon', format(mou, 'Green Valley School', 'Ritu Sharma', 'ritu@example.test', 'ring reception', null)), 'ERR:23514');
  perform t.eq('insert: MOU request with oversized notes refused', t.dml(null, 'anon', format(mou, 'Green Valley School', 'Ritu Sharma', 'ritu@example.test', '+91 98765 00001', repeat('x', 10001))), 'ERR:23514');
  perform t.eq('insert: anon stores a valid executive appointment', t.dml(null, 'anon', format(appt, 'Green Valley School', 'Ritu Sharma', '+91 98765 00001', 'ritu@example.test')), 'OK:1');
  perform t.eq('insert: appointment with a malformed e-mail refused', t.dml(null, 'anon', format(appt, 'Green Valley School', 'Ritu Sharma', '+91 98765 00001', 'ritu@example')), 'ERR:23514');
  perform t.eq('insert: appointment with a blank school name refused', t.dml(null, 'anon', format(appt, '  ', 'Ritu Sharma', '+91 98765 00001', 'ritu@example.test')), 'ERR:23514');
  perform t.eq('insert: appointment with a three-digit phone refused', t.dml(null, 'anon', format(appt, 'Green Valley School', 'Ritu Sharma', '123', 'ritu@example.test')), 'ERR:23514');
  ok := 0;
  for i in 2..5 loop
    if t.dml(null, 'anon', format(mou, 'Green Valley School', 'Ritu Sharma', 'ritu@example.test', '+91 98765 00001', null)) = 'OK:1' then ok := ok + 1; end if;
  end loop;
  perform t.eq('rate: 6th MOU request from one client refused', ok || ' then ' || t.dml(null, 'anon',
    format(mou, 'Green Valley School', 'Ritu Sharma', 'ritu@example.test', '+91 98765 00001', null)), '4 then ERR:P0001');

  -- ------------------------------------------------------------ the website path is exempt (current_user = owner)
  hits_before := (select coalesce(sum(hits), 0) from app_private.rate_limits where bucket ~ '^(anonqr|anonmou|anonappt):');
  perform t.client(client_a); -- over its qr_lead_captures limit
  ok := 0;
  for i in 1..6 loop
    if t.scalar(null, 'anon', format(call, 'cadet', 'hub', 'Website Parent ' || i, null, '+91 90000 1111' || i, '{"student":"Kabir, 11"}',
         '{"qr":"test-hub","path":"/hub/test-hub"}', 'idem-hardening-qr-00' || i)) = '{"mirror": "qr_lead_captures", "status": "stored"}' then ok := ok + 1; end if;
  end loop;
  perform t.eq('website: submit_lead_v2 from a client over its limit still stores and mirrors (6 of 6)', ok::text, '6');
  perform t.eq('website: the six mirrors are in qr_lead_captures', (select count(*)::text from public.qr_lead_captures
    where parent_name like 'Website Parent %' and source = 'website-qr' and hub_slug = 'test-hub'), '6');
  perform t.client(client_e); -- over its mou_requests limit
  perform t.eq('website: MOU enquiry still mirrored into mou_requests', t.scalar(null, 'anon', format(call, 'school', 'mou', 'Meera Rao', 'meera.h@example.test',
    '+91 98765 43210', '{"organisation":"Hardening School, Pune","message":"Two acres"}', '{"path":"/schools/mou"}', 'idem-hardening-mou-001')),
    '{"mirror": "mou_requests", "status": "stored"}');
  perform t.eq('website: board audit still mirrored into executive_appointments', t.scalar(null, 'anon', format(call, 'board_audit', 'audit', 'Anil Mehta',
    'anil.h@example.test', '+91 99999 00000', '{"organisation":"Hardening Circuit","designation":"Trustee","date":"2026-12-02","slot":"11:00"}', '{}',
    'idem-hardening-audit-01')), '{"mirror": "executive_appointments", "status": "stored"}');
  perform t.eq('website: QR code Q-17 still mirrored', t.scalar(null, 'anon', format(call, 'cadet', 'hub', 'Website Parent Q', 'q@example.test', null, '{}',
    '{"qr":"Q-17"}', 'idem-hardening-qr-q17')), '{"mirror": "qr_lead_captures", "status": "stored"}');
  perform t.eq('website: mirrors use no anon quota', (select coalesce(sum(hits), 0) from app_private.rate_limits where bucket ~ '^(anonqr|anonmou|anonappt):')::text, hits_before::text);
  perform t.eq('website: a QR code that is not slug-like is stored but not mirrored (documented)', t.scalar(null, 'anon', format(call, 'cadet', 'hub',
    'Website Parent Space', null, '+91 90000 22222', '{}', '{"qr":"flyer 2"}', 'idem-hardening-qr-space')), '{"mirror": "failed", "status": "stored"}');

  -- ------------------------------------------------------------ documented caveat of NOT VALID
  perform t.eq('caveat: an UPDATE of an older row that breaks a check is refused', t.dml(null, 'postgres',
    $q$update public.qr_lead_captures set converted_to_enrollment = true where source = 'legacy-fixture'$q$), 'ERR:23514');

  -- ------------------------------------------------------------ clean up the intake tables
  perform t.client(null);
  delete from public.qr_lead_captures where id <> all (keep_qr) or source = 'legacy-fixture';
  delete from public.mou_requests where id <> all (keep_mou);
  delete from public.executive_appointments where id <> all (keep_appt);
  perform t.eq('cleanup: intake tables back to their earlier rows',
    (select count(*) from public.qr_lead_captures) || '/' || (select count(*) from public.mou_requests) || '/' || (select count(*) from public.executive_appointments),
    (cardinality(keep_qr) - 1) || '/' || cardinality(keep_mou) || '/' || cardinality(keep_appt));
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
