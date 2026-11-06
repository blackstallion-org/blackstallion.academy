-- Motion Lab (20261106001700): sessions and recordings are private to their owner. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  ua uuid := '00000000-0000-0000-0000-0000000000e1';
  ub uuid := '00000000-0000-0000-0000-0000000000e2';
  ca uuid := '11111111-1111-1111-1111-111111111111';
  sess uuid;
  ins text := $q$insert into public.motion_sessions (owner_id, client_id, name, source, recorded_at, duration_ms, summary, models) values (%L, %L, 'Trial', 'camera', now(), 12000, '{"durationMs":12000}', '{"pose":"x"}')$q$;
begin
  insert into auth.users (id, email, raw_user_meta_data) values (ua, 'ml.a@example.test', '{"full_name":"A"}'), (ub, 'ml.b@example.test', '{"full_name":"B"}');
  perform t.eq('table: motion_sessions exists with RLS on', (select relrowsecurity::text from pg_class where oid = 'public.motion_sessions'::regclass), 'true');
  perform t.eq('bucket: private, 50 MB, JSON and video only', (select (not public and file_size_limit = 52428800 and 'application/json' = any (allowed_mime_types) and not 'text/html' = any (allowed_mime_types))::text from storage.buckets where id = 'motion-lab'), 'true');
  perform t.eq('anon: cannot read sessions', t.scalar(null, 'anon', 'select count(*) from public.motion_sessions'), 'ERR:42501');
  perform t.eq('anon: cannot save a session', t.dml(null, 'anon', format(ins, ua, ca)), 'ERR:42501');
  perform t.eq('owner: can save their own session', t.dml(ua, 'authenticated', format(ins, ua, ca)), 'OK:1');
  perform t.eq('owner: a second save of the same browser session is refused (one row per client id)', t.dml(ua, 'authenticated', format(ins, ua, ca)), 'ERR:23505');
  perform t.eq('owner: cannot save a row in someone else''s name', t.dml(ua, 'authenticated', format(ins, ub, '22222222-2222-2222-2222-222222222222')), 'ERR:42501');
  perform t.eq('owner: reads their own row', t.scalar(ua, 'authenticated', 'select count(*) from public.motion_sessions'), '1');
  perform t.eq('other user: sees nothing of it', t.scalar(ub, 'authenticated', 'select count(*) from public.motion_sessions'), '0');
  select id into sess from public.motion_sessions where owner_id = ua;
  perform t.eq('other user: cannot change it', t.dml(ub, 'authenticated', format($q$update public.motion_sessions set name = 'mine now' where id = %L$q$, sess)), 'OK:0');
  perform t.eq('other user: cannot delete it', t.dml(ub, 'authenticated', format($q$delete from public.motion_sessions where id = %L$q$, sess)), 'OK:0');
  perform t.eq('owner: cannot hand the row to someone else', t.dml(ua, 'authenticated', format($q$update public.motion_sessions set owner_id = %L where id = %L$q$, ub, sess)), 'ERR:42501');
  perform t.eq('owner: can complete the row after uploading', t.dml(ua, 'authenticated', format($q$update public.motion_sessions set status = 'complete' where id = %L$q$, sess)), 'OK:1');
  perform t.eq('staff: SUPER_ADMIN gets no special read access to recordings', t.scalar('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'select count(*) from public.motion_sessions'), '0');
  perform t.eq('rules: a negative duration is refused', t.dml(ub, 'authenticated', format($q$insert into public.motion_sessions (owner_id, client_id, name, source, recorded_at, duration_ms, summary, models) values (%L, gen_random_uuid(), 'x', 'camera', now(), -1, '{}', '{}')$q$, ub)), 'ERR:23514');
  perform t.eq('rules: a source other than camera or upload is refused', t.dml(ub, 'authenticated', format($q$insert into public.motion_sessions (owner_id, client_id, name, source, recorded_at, duration_ms, summary, models) values (%L, gen_random_uuid(), 'x', 'drone', now(), 1, '{}', '{}')$q$, ub)), 'ERR:23514');
  perform t.eq('rules: a storage path that escapes the owner folder shape is refused', t.dml(ub, 'authenticated', format($q$insert into public.motion_sessions (owner_id, client_id, name, source, recorded_at, duration_ms, summary, models, samples_path) values (%L, gen_random_uuid(), 'x', 'camera', now(), 1, '{}', '{}', '../../etc/passwd')$q$, ub)), 'ERR:23514');
  perform t.eq('rules: an over-large summary is refused', t.dml(ub, 'authenticated', format($q$insert into public.motion_sessions (owner_id, client_id, name, source, recorded_at, duration_ms, summary, models) values (%L, gen_random_uuid(), 'x', 'camera', now(), 1, jsonb_build_object('pad', repeat('x', 25000)), '{}')$q$, ub)), 'ERR:23514');

  -- storage objects: the first folder must be the caller's own id
  perform t.eq('storage: owner can add a file in their own folder', t.dml(ua, 'authenticated', format($q$insert into storage.objects (bucket_id, name) values ('motion-lab', %L)$q$, ua || '/' || ca || '/samples.json')), 'OK:1');
  perform t.eq('storage: owner cannot add a file in someone else''s folder', t.dml(ua, 'authenticated', format($q$insert into storage.objects (bucket_id, name) values ('motion-lab', %L)$q$, ub || '/' || ca || '/samples.json')), 'ERR:42501');
  perform t.eq('storage: owner reads their file', t.scalar(ua, 'authenticated', $q$select count(*) from storage.objects where bucket_id = 'motion-lab'$q$), '1');
  perform t.eq('storage: another user cannot see it', t.scalar(ub, 'authenticated', $q$select count(*) from storage.objects where bucket_id = 'motion-lab'$q$), '0');
  perform t.eq('storage: another user cannot delete it', t.dml(ub, 'authenticated', $q$delete from storage.objects where bucket_id = 'motion-lab'$q$), 'OK:0');
  perform t.eq('storage: anonymous visitors cannot add or read', t.scalar(null, 'anon', $q$select count(*) from storage.objects where bucket_id = 'motion-lab'$q$), '0');
  perform t.eq('storage: the policies do not touch other buckets', (select count(*)::text from pg_policies where schemaname = 'storage' and policyname like 'motion-lab%' and qual not like '%motion-lab%'), '0');
  delete from auth.users where id = ua;
  perform t.eq('cascade: deleting the account deletes its sessions', (select count(*)::text from public.motion_sessions where owner_id = ua), '0');
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
