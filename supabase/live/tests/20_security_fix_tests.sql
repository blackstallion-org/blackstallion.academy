-- Security fixes (20261023001100). THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  admin  uuid := '00000000-0000-0000-0000-0000000000a1';
  parent uuid := '00000000-0000-0000-0000-0000000000b1';
  coach  uuid := '00000000-0000-0000-0000-0000000000b3';
begin
  perform t.eq('F1: parent cannot promote themself', t.dml(parent, 'authenticated', format($q$update public.users set role = 'SUPER_ADMIN' where id = %L$q$, parent)), 'ERR:42501');
  perform t.eq('F1: parent cannot move themself to another hub', t.dml(parent, 'authenticated', format($q$update public.users set hub_id = '00000000-0000-0000-0000-0000000000e1' where id = %L$q$, parent)), 'ERR:42501');
  perform t.eq('F1: parent can still edit own name and phone', t.dml(parent, 'authenticated', format($q$update public.users set full_name = 'Parent Renamed', phone_number = '+91 90000 22222' where id = %L$q$, parent)), 'OK:1');
  perform t.eq('F1: instructor cannot promote themself', t.dml(coach, 'authenticated', format($q$update public.users set role = 'SUPER_ADMIN' where id = %L$q$, coach)), 'ERR:42501');
  perform t.eq('F1: SUPER_ADMIN can change a role', t.dml(admin, 'authenticated', format($q$update public.users set role = 'SCHOOL_ADMIN' where id = %L$q$, coach)), 'OK:1');
  perform t.eq('F1: trusted server context (no JWT) can change a role', t.dml(null, 'postgres', format($q$update public.users set role = 'INSTRUCTOR' where id = %L$q$, coach)), 'OK:1');
  perform t.eq('F1: parent is still PARENT', (select role from public.users where id = parent), 'PARENT');

  insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-00000000ee02', 'attacker2@example.test', '{"role":"SUPER_ADMIN","full_name":"Mallory"}');
  perform t.eq('F2: sign-up metadata no longer grants a role', (select role from public.users where id = '00000000-0000-0000-0000-00000000ee02'), 'PARENT');
  insert into auth.users (id, email, raw_app_meta_data) values ('00000000-0000-0000-0000-00000000ee03', 'new.coach@example.test', '{"role":"instructor"}');
  perform t.eq('F2: role provisioned through app metadata is honoured', (select role from public.users where id = '00000000-0000-0000-0000-00000000ee03'), 'INSTRUCTOR');
  insert into auth.users (id, email, raw_app_meta_data) values ('00000000-0000-0000-0000-00000000ee04', 'odd@example.test', '{"role":"ROOT"}');
  perform t.eq('F2: unknown role falls back to PARENT', (select role from public.users where id = '00000000-0000-0000-0000-00000000ee04'), 'PARENT');
  perform t.eq('F2: full name still taken from sign-up', (select full_name from public.users where id = '00000000-0000-0000-0000-00000000ee02'), 'Mallory');

  perform t.eq('fixes: website staff check still works', t.scalar(admin, 'authenticated', 'select app_private.is_website_staff()::text'), 'true');
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
