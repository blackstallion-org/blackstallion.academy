-- After the phone sign-up rollback: the trigger is exactly the 001400 one again. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare r text;
begin
  begin
    insert into auth.users (id, email, phone, raw_user_meta_data, raw_app_meta_data)
    values ('00000000-0000-0000-0000-0000000000da', null, '919876543299', '{}', '{"provider":"phone"}');
    r := 'created';
  exception when others then r := 'ERR:' || sqlstate; end;
  perform t.eq('rollback: a phone-only sign-up is refused again, as before the change', r, 'ERR:23502');
  perform t.eq('rollback: the function no longer mentions the placeholder address', (select (prosrc not like '%phone.invalid%')::text from pg_proc where proname = 'handle_new_user'), 'true');
  perform t.eq('rollback: e-mail sign-ups still work', (select count(*)::text from (select 1 from public.users where email = 'asha.google@example.test') x), '1');
  perform t.eq('rollback: accounts made while it was applied are kept', (select count(*)::text from public.users where email like '%@phone.invalid'), '5');
  perform t.eq('rollback: ADMISSIONS still comes from app metadata only', (select (prosrc like '%ADMISSIONS%' and prosrc not like '%raw_user_meta_data->>''role''%')::text from pg_proc where proname = 'handle_new_user'), 'true');
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
