-- Evidence BEFORE 20261104001500: a phone-only sign-up fails on the live trigger. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
-- real Supabase Auth keeps the verified number on auth.users.phone (digits only, no "+"); the stub did not need it until now
alter table auth.users add column if not exists phone text;
do $$
declare r text;
begin
  begin
    insert into auth.users (id, email, phone, raw_user_meta_data, raw_app_meta_data)
    values ('00000000-0000-0000-0000-0000000000d1', null, '919876543210', '{}', '{"provider":"phone"}');
    r := 'created';
  exception when others then r := 'ERR:' || sqlstate;
  end;
  perform t.eq('before: a phone-only sign-up is refused by the current trigger (users.email is NOT NULL)', r, 'ERR:23502');
  perform t.eq('before: and no account row was left behind', (select count(*)::text from public.users where id = '00000000-0000-0000-0000-0000000000d1'), '0');
end $$;
insert into t.snap values ('policies_before_phone', (select md5(string_agg(tablename || policyname || cmd || coalesce(qual, '') || coalesce(with_check, ''), '|' order by tablename, policyname)) from pg_policies where schemaname = 'public'));
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
