-- Self-service member accounts (student, parent, teacher, school). THROWAWAY Postgres only. Runs after 10_ to 40_.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  ops uuid := '00000000-0000-0000-0000-0000000000a1';
  stu uuid := '00000000-0000-0000-0000-00000000b001';
  par uuid := '00000000-0000-0000-0000-00000000b002';
  tea uuid := '00000000-0000-0000-0000-00000000b003';
  sch uuid := '00000000-0000-0000-0000-00000000b004';
  bad uuid := '00000000-0000-0000-0000-00000000b005';
  big uuid := '00000000-0000-0000-0000-00000000b006';
  unc uuid := '00000000-0000-0000-0000-00000000b007';
begin
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
    (stu, 'asha.student@example.test', now(), '{"member_kind":"student","full_name":"Asha Rao","city":"Hyderabad","details":{"age_band":"10-12"}}'),
    (par, 'ravi.parent@example.test', now(), '{"member_kind":"parent","full_name":"Ravi Kumar","phone":"+91 90000 11111","details":{"children":"Meera (9)"}}'),
    (tea, 'tina.teacher@example.test', now(), '{"member_kind":"teacher","full_name":"Tina Joseph","organisation":"Greenfield School"}'),
    (sch, 'office@school.example.test', now(), '{"member_kind":"school","full_name":"Greenfield School","organisation":"Greenfield School","city":"Pune"}'),
    (bad, 'mallory@example.test', now(), '{"member_kind":"executive_admin","full_name":"Mallory"}'),
    (unc, 'unconfirmed@example.test', null, '{"member_kind":"student","full_name":"Unconfirmed"}');
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
    values (big, 'big@example.test', now(), jsonb_build_object('member_kind', 'parent', 'full_name', 'Big Details', 'details', jsonb_build_object('x', repeat('y', 5000))));

  -- what the sign-up trigger makes of the metadata
  perform t.eq('members: every sign-up still gets a profile', (select count(*)::text from public.profiles where id in (stu, par, tea, sch, bad, big, unc)), '7');
  perform t.eq('members: self-service sign-ups stay least-privilege', (select count(*)::text from public.profiles where id in (stu, par, tea, sch, bad, big, unc) and role = 'cadet'), '7');
  perform t.eq('members: display name comes from the form', (select display_name from public.profiles where id = stu), 'Asha Rao');
  perform t.eq('members: student is active at once', (select status::text from public.member_accounts where profile_id = stu), 'active');
  perform t.eq('members: parent is active at once', (select status::text from public.member_accounts where profile_id = par), 'active');
  perform t.eq('members: teacher waits for review', (select status::text from public.member_accounts where profile_id = tea), 'pending');
  perform t.eq('members: school waits for review', (select status::text from public.member_accounts where profile_id = sch), 'pending');
  perform t.eq('members: unknown kind creates no member row', (select count(*)::text from public.member_accounts where profile_id = bad), '0');
  perform t.eq('members: a self-claimed admin kind is not a staff role', t.scalar(bad, 'authenticated', 'select app_private.is_admin()::text'), 'false');
  perform t.eq('members: oversize details are dropped, account kept', (select details::text from public.member_accounts where profile_id = big), '{}');
  perform t.eq('members: bad phone is dropped, account kept', (select coalesce(phone, 'none') from public.member_accounts where profile_id = stu), 'none');
  perform t.eq('members: phone kept when valid', (select phone from public.member_accounts where profile_id = par), '+91 90000 11111');
  perform t.eq('members: school keeps organisation and city', (select organisation || '|' || city from public.member_accounts where profile_id = sch), 'Greenfield School|Pune');

  -- who can read
  perform t.eq('members: member reads only own row', t.scalar(stu, 'authenticated', 'select count(*) from public.member_accounts'), '1');
  perform t.eq('members: staff read every row', t.scalar(ops, 'authenticated', 'select count(*) from public.member_accounts'), '6');
  perform t.eq('members: anon reads nothing', t.scalar(null, 'anon', 'select count(*) from public.member_accounts'), 'ERR:42501');

  -- who can write
  perform t.eq('members: member edits own city', t.dml(stu, 'authenticated', format($q$update public.member_accounts set city = 'Secunderabad' where profile_id = %L$q$, stu)), 'OK:1');
  perform t.eq('members: member cannot approve self', t.dml(tea, 'authenticated', format($q$update public.member_accounts set status = 'active' where profile_id = %L$q$, tea)), 'ERR:42501');
  perform t.eq('members: member cannot change kind', t.dml(stu, 'authenticated', format($q$update public.member_accounts set kind = 'school' where profile_id = %L$q$, stu)), 'ERR:42501');
  perform t.eq('members: member cannot edit another member', t.dml(stu, 'authenticated', format($q$update public.member_accounts set city = 'X' where profile_id = %L$q$, par)), 'OK:0');
  perform t.eq('members: member cannot insert a row for themselves', t.dml(bad, 'authenticated', format($q$insert into public.member_accounts (profile_id, kind, full_name) values (%L, 'student', 'Mallory')$q$, bad)), 'ERR:42501');
  perform t.eq('members: member cannot delete', t.dml(stu, 'authenticated', format($q$delete from public.member_accounts where profile_id = %L$q$, stu)), 'ERR:42501');

  -- staff review
  perform t.eq('members: member cannot review', t.scalar(tea, 'authenticated', format($q$select public.review_member_account(%L, 'active')::text$q$, tea)), 'ERR:42501');
  perform t.eq('members: anon cannot review', t.scalar(null, 'anon', format($q$select public.review_member_account(%L, 'active')::text$q$, tea)), 'ERR:42501');
  perform t.eq('members: staff approve a teacher', t.scalar(ops, 'authenticated', format($q$select public.review_member_account(%L, 'active')::text$q$, tea)), '');
  perform t.eq('members: approval is stored', (select status::text from public.member_accounts where profile_id = tea), 'active');
  perform t.eq('members: approval records the reviewer', (select (reviewed_by = ops)::text from public.member_accounts where profile_id = tea), 'true');
  perform t.eq('members: approval is audited', (select count(*)::text from public.audit_events where action = 'member.status_changed' and entity_id = tea::text), '1');
  perform t.eq('members: staff can suspend', t.scalar(ops, 'authenticated', format($q$select public.review_member_account(%L, 'suspended')::text$q$, par)), '');
  perform t.eq('members: a suspended member cannot edit own row', t.dml(par, 'authenticated', format($q$update public.member_accounts set city = 'Z' where profile_id = %L$q$, par)), 'OK:0');
  perform t.eq('members: unknown account is reported', t.scalar(ops, 'authenticated', $q$select public.review_member_account('00000000-0000-0000-0000-00000000ffff', 'active')::text$q$), 'ERR:P0002');
  perform t.eq('members: an unchanged status is a no-op', t.scalar(ops, 'authenticated', format($q$select public.review_member_account(%L, 'active')::text$q$, tea)), '');
  perform t.eq('members: an unchanged status writes no second audit row', (select count(*)::text from public.audit_events where action = 'member.status_changed' and entity_id = tea::text), '1');

  -- a member's own enquiries
  insert into public.onboarding_leads (lead_type, status, contact_name, email, privacy_notice_version) values
    ('cadet', 'new', 'Asha Rao', 'Asha.Student@Example.Test', 'v1'),
    ('school', 'rejected', 'Asha Rao', 'asha.student@example.test', 'v1'),
    ('cadet', 'qualified', 'Somebody Else', 'other@example.test', 'v1'),
    ('cadet', 'new', 'Unconfirmed', 'unconfirmed@example.test', 'v1');
  perform t.eq('members: enquiries by the confirmed e-mail are listed (case-insensitive)', t.scalar(stu, 'authenticated', 'select count(*) from public.my_enquiries()'), '2');
  perform t.eq('members: progress is coarse, never the internal status', t.scalar(stu, 'authenticated', $q$select string_agg(distinct progress, ',' order by progress) from public.my_enquiries()$q$), 'closed,received');
  perform t.eq('members: an unconfirmed e-mail sees nothing', t.scalar(unc, 'authenticated', 'select count(*) from public.my_enquiries()'), '0');
  perform t.eq('members: anon cannot list enquiries', t.scalar(null, 'anon', 'select count(*) from public.my_enquiries()'), 'ERR:42501');
  perform t.eq('members: a member still cannot read the lead table', t.scalar(stu, 'authenticated', 'select count(*) from public.onboarding_leads'), '0');
end $$;

select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end as result
from t.results where n > :start_n order by n;
