-- Test helpers (same contract as supabase/tests) and fixtures that mirror the live data shape (one user per role).
create schema t;
create table t.results (n serial, name text, ok boolean, detail text);
create table t.snap (k text primary key, v text);
create function t.as_user(uid uuid, r text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  execute format('set local role %I', r);
end $$;
create function t.scalar(uid uuid, r text, q text) returns text language plpgsql as $$
declare v text;
begin
  perform t.as_user(uid, r);
  begin execute q into v;
  exception when others then reset role; perform set_config('request.jwt.claim.sub', '', true); return 'ERR:' || sqlstate; end;
  reset role; perform set_config('request.jwt.claim.sub', '', true);
  return coalesce(v, 'NULL');
end $$;
create function t.dml(uid uuid, r text, q text) returns text language plpgsql as $$
declare n bigint;
begin
  perform t.as_user(uid, r);
  begin execute q; get diagnostics n = row_count;
  exception when others then reset role; perform set_config('request.jwt.claim.sub', '', true); return 'ERR:' || sqlstate; end;
  reset role; perform set_config('request.jwt.claim.sub', '', true);
  return 'OK:' || n;
end $$;
create function t.eq(nm text, got text, want text) returns void language sql as $$
  insert into t.results (name, ok, detail) values (nm, got is not distinct from want, 'got=' || coalesce(got,'<null>') || ' want=' || want) $$;
-- Fingerprint of every pre-existing policy, function body and trigger, to prove the website layer leaves them untouched.
create function t.ops_fingerprint() returns text language sql as $$
  select md5(coalesce((select string_agg(tablename || policyname || cmd || coalesce(qual, '') || coalesce(with_check, ''), '|' order by tablename, policyname)
    from pg_policies where schemaname = 'public' and tablename in (select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and relname in ('achievements','cadets','consent_records','device_tokens','equine_fleet','executive_appointments',
        'groom_daily_logs','mou_requests','payment_records','qr_lead_captures','rank_history','school_hubs','session_skills','site_settings',
        'skills','staff_attendance','system_anomalies','training_sessions','users'))), '')
  || coalesce((select string_agg(pg_get_functiondef(p.oid), '|' order by proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and proname in ('current_role_name','current_hub_id','handle_new_user','rls_auto_enable')), '')
  || coalesce((select string_agg(column_name || data_type, '|' order by table_name, ordinal_position) from information_schema.columns
      where table_schema = 'public' and table_name in ('users','cadets','mou_requests','executive_appointments','qr_lead_captures')), ''))
$$;

do $$
begin
  -- the live baseline trigger copies the role from user metadata, exactly as production does today
  insert into auth.users (id, email, raw_user_meta_data) values
    ('00000000-0000-0000-0000-0000000000a1', 'admin@example.test',   '{"full_name":"Admin","role":"SUPER_ADMIN"}'),
    ('00000000-0000-0000-0000-0000000000b1', 'parent@example.test',  '{"full_name":"Parent","role":"PARENT"}'),
    ('00000000-0000-0000-0000-0000000000b2', 'school@example.test',  '{"full_name":"School","role":"SCHOOL_ADMIN"}'),
    ('00000000-0000-0000-0000-0000000000b3', 'coach@example.test',   '{"full_name":"Coach","role":"INSTRUCTOR"}'),
    ('00000000-0000-0000-0000-0000000000b4', 'groom@example.test',   '{"full_name":"Groom","role":"GROOM"}');
  insert into public.school_hubs (id, school_name, slug) values ('00000000-0000-0000-0000-0000000000e1', 'Test Hub School', 'test-hub');
  insert into public.cadets (parent_id, hub_id, first_name, last_name, passport_code, current_rank, created_at)
  values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 'Asha', 'Test', 'BSAH-TEST-0001', 'CADET_RIDER', '2026-09-01T10:00:00Z');
  insert into public.site_settings (key, value) values ('verify_public', 'true');
  insert into t.snap values ('before', t.ops_fingerprint());
end $$;
