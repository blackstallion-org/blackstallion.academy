-- EVIDENCE against the unmodified live baseline (before 20261023001100_security_fixes.sql). Each check PASSES when
-- the vulnerability is present, documenting why the fix is needed. State is restored afterwards.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare parent uuid := '00000000-0000-0000-0000-0000000000b1';
begin
  perform t.eq('EVIDENCE baseline: a parent can promote themself to SUPER_ADMIN',
    t.dml(parent, 'authenticated', format($q$update public.users set role = 'SUPER_ADMIN' where id = %L$q$, parent)), 'OK:1');
  update public.users set role = 'PARENT' where id = parent;
  insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-00000000ee01', 'attacker@example.test', '{"role":"SUPER_ADMIN"}');
  perform t.eq('EVIDENCE baseline: sign-up metadata grants SUPER_ADMIN',
    (select role from public.users where id = '00000000-0000-0000-0000-00000000ee01'), 'SUPER_ADMIN');
  delete from auth.users where id = '00000000-0000-0000-0000-00000000ee01';
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
