-- 20261104001500: phone and Google sign-ups get an operations row; nothing else changes. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  holder uuid := '00000000-0000-0000-0000-0000000000d2';
  phoneuser uuid := '00000000-0000-0000-0000-0000000000d3';
  dup uuid := '00000000-0000-0000-0000-0000000000d4';
  goog uuid := '00000000-0000-0000-0000-0000000000d5';
  goog2 uuid := '00000000-0000-0000-0000-0000000000d6';
  inj uuid := '00000000-0000-0000-0000-0000000000d7';
  adm uuid := '00000000-0000-0000-0000-0000000000d8';
  long uuid := '00000000-0000-0000-0000-0000000000d9';
  r text;
begin
  insert into auth.users (id, email, phone, raw_user_meta_data, raw_app_meta_data) values
    (holder, 'holder@example.test', null, '{"full_name":"Holder"}', '{}');
  update public.users set phone_number = '+919000000001' where id = holder;
  insert into auth.users (id, email, phone, raw_user_meta_data, raw_app_meta_data) values
    (phoneuser, null, '919876543210', '{}', '{"provider":"phone"}'),
    (dup, null, '919000000001', '{}', '{"provider":"phone"}'),
    (goog, 'asha.google@example.test', null, '{"full_name":"Asha Rao","name":"Asha R","email_verified":true}', '{"provider":"google"}'),
    (goog2, 'only.name@example.test', null, '{"name":"Only Name"}', '{"provider":"google"}'),
    (inj, null, '919000000002', '{"role":"SUPER_ADMIN","full_name":"Mallory"}', '{"provider":"phone"}'),
    (adm, null, '919000000003', '{}', '{"provider":"phone","role":"ADMISSIONS"}');

  perform t.eq('phone: a phone-only sign-up creates an operations row', (select count(*)::text from public.users where id = phoneuser), '1');
  perform t.eq('phone: it is a PARENT (least privilege)', (select role from public.users where id = phoneuser), 'PARENT');
  perform t.eq('phone: the placeholder address can never receive mail', (select email from public.users where id = phoneuser), 'phone-919876543210@phone.invalid');
  perform t.eq('phone: the verified number is stored in E.164', (select phone_number from public.users where id = phoneuser), '+919876543210');
  perform t.eq('phone: the name falls back to the neutral default', (select full_name from public.users where id = phoneuser), 'New User');
  perform t.eq('phone: a number already held by another account is not taken over', (select coalesce(phone_number, 'NULL') from public.users where id = dup), 'NULL');
  perform t.eq('phone: and the holder keeps it', (select phone_number from public.users where id = holder), '+919000000001');
  perform t.eq('phone: the sign-up still got its own row', (select count(*)::text from public.users where id = dup), '1');
  perform t.eq('phone: a role typed into sign-up data is ignored', (select role from public.users where id = inj), 'PARENT');
  perform t.eq('phone: ADMISSIONS from app metadata is still honoured', (select role from public.users where id = adm), 'ADMISSIONS');
  perform t.eq('google: full_name is used first', (select full_name from public.users where id = goog), 'Asha Rao');
  perform t.eq('google: the e-mail is kept as it is', (select email from public.users where id = goog), 'asha.google@example.test');
  perform t.eq('google: with only a name claim the name is used', (select full_name from public.users where id = goog2), 'Only Name');
  perform t.eq('google: a Google user has no phone number', (select coalesce(phone_number, 'NULL') from public.users where id = goog), 'NULL');
  perform t.eq('rls: the new phone user reads exactly their own row', t.scalar(phoneuser, 'authenticated', $q$select count(*) from public.users$q$), '1');
  perform t.eq('rls: and cannot raise their own role', t.dml(phoneuser, 'authenticated', format($q$update public.users set role = 'SUPER_ADMIN' where id = %L$q$, phoneuser)), 'ERR:42501');
  perform t.eq('code: the role is read from app metadata only', (select (prosrc not like '%raw_user_meta_data->>''role''%')::text from pg_proc where proname = 'handle_new_user'), 'true');
  begin
    insert into auth.users (id, email, phone, raw_user_meta_data, raw_app_meta_data) values (long, null, '1234567890123456789012', '{}', '{}');
    r := (select coalesce(phone_number, 'NULL') from public.users where id = long);
  exception when others then r := 'ERR:' || sqlstate; end;
  perform t.eq('phone: a number too long for the column is dropped instead of failing the sign-up', r, 'NULL');
end $$;
select t.eq('policies: no policy on any public table changed', (select md5(string_agg(tablename || policyname || cmd || coalesce(qual, '') || coalesce(with_check, ''), '|' order by tablename, policyname)) from pg_policies where schemaname = 'public'), (select v from t.snap where k = 'policies_before_phone'));
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
