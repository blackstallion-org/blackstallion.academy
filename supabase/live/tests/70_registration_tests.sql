-- Registration and admissions (20261104001400). THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
-- the real auth.users records e-mail confirmation; the stub did not need it until now
alter table auth.users add column if not exists email_confirmed_at timestamptz;
grant select on auth.users to postgres;
do $$
begin
  insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, email_confirmed_at) values
    ('00000000-0000-0000-0000-0000000000c1', 'guardian@example.test', '{"full_name":"Guardian Two"}', '{}', now()),
    ('00000000-0000-0000-0000-0000000000c2', 'admissions@example.test', '{"full_name":"Admissions"}', '{"role":"ADMISSIONS"}', now()),
    ('00000000-0000-0000-0000-0000000000c3', 'coach-applicant@example.test', '{"full_name":"Coach Applicant","role":"SUPER_ADMIN"}', '{}', now()),
    ('00000000-0000-0000-0000-0000000000c4', 'unconfirmed@example.test', '{"full_name":"Not Confirmed"}', '{}', null),
    ('00000000-0000-0000-0000-0000000000c5', 'claims@example.test', '{"full_name":"Claims","role":"ADMISSIONS"}', '{}', now());
  update auth.users set email_confirmed_at = now() where id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1');
end $$;

do $$
declare
  admin uuid := '00000000-0000-0000-0000-0000000000a1';
  parent1 uuid := '00000000-0000-0000-0000-0000000000b1';
  coach uuid := '00000000-0000-0000-0000-0000000000b3';
  g uuid := '00000000-0000-0000-0000-0000000000c1';
  adm uuid := '00000000-0000-0000-0000-0000000000c2';
  staffapp uuid := '00000000-0000-0000-0000-0000000000c3';
  unconf uuid := '00000000-0000-0000-0000-0000000000c4';
  child uuid; child2 uuid; app uuid; app2 uuid; sapp uuid; prog uuid; cad uuid; r text;
begin
  -- roles
  perform t.eq('roles: ADMISSIONS comes from app metadata', (select role from public.users where id = adm), 'ADMISSIONS');
  perform t.eq('roles: a role typed into the sign-up form is ignored', (select role from public.users where id = staffapp), 'PARENT');
  perform t.eq('roles: ADMISSIONS typed into the sign-up form is ignored', (select role from public.users where id = '00000000-0000-0000-0000-0000000000c5'), 'PARENT');
  perform t.eq('roles: an applicant cannot make themselves ADMISSIONS', t.dml(g, 'authenticated', format($q$update public.users set role = 'ADMISSIONS' where id = %L$q$, g)), 'ERR:42501');

  -- programmes
  select id into prog from public.programs where code = 'foundation';
  perform t.eq('programmes: the public sees the open programme', t.scalar(null, 'anon', $q$select count(*) from public.programs$q$), '1');
  perform t.eq('programmes: a parent cannot create one', t.dml(g, 'authenticated', $q$insert into public.programs (code, name) values ('x1', 'Fake')$q$), 'ERR:42501');
  perform t.eq('programmes: ADMISSIONS cannot set prices', t.dml(adm, 'authenticated', $q$update public.programs set enrolment_fee_paise = 1$q$), 'OK:0');
  perform t.eq('programmes: SUPER_ADMIN sets the fee', t.dml(admin, 'authenticated', $q$update public.programs set enrolment_fee_paise = 250000 where code = 'foundation'$q$), 'OK:1');

  -- children belong to their guardian; minors have no login
  perform t.eq('children: guardian adds a child', t.dml(g, 'authenticated',
    $q$insert into public.guardian_children (first_name, last_name, date_of_birth, riding_experience) values ('Meera', 'Two', current_date - interval '10 years', 'none')$q$), 'OK:1');
  select id into child from public.guardian_children where guardian_id = g and first_name = 'Meera';
  perform t.eq('children: guardian adds a second child', t.dml(g, 'authenticated',
    $q$insert into public.guardian_children (first_name, last_name, date_of_birth) values ('Kabir', 'Two', current_date - interval '4 years')$q$), 'OK:1');
  select id into child2 from public.guardian_children where guardian_id = g and first_name = 'Kabir';
  perform t.eq('children: a guardian cannot file a child under someone else', t.dml(g, 'authenticated',
    format($q$insert into public.guardian_children (guardian_id, first_name, last_name, date_of_birth) values (%L, 'X', 'Y', '2015-01-01')$q$, parent1)), 'ERR:42501');
  perform t.eq('children: another parent cannot see them', t.scalar(parent1, 'authenticated', $q$select count(*) from public.guardian_children$q$), '0');
  perform t.eq('children: the guardian sees both', t.scalar(g, 'authenticated', $q$select count(*) from public.guardian_children$q$), '2');
  perform t.eq('children: admissions sees them', t.scalar(adm, 'authenticated', $q$select count(*) from public.guardian_children$q$), '2');
  perform t.eq('children: a guardian cannot link a cadet record', t.dml(g, 'authenticated', format($q$update public.guardian_children set cadet_id = (select id from public.cadets limit 1) where id = %L$q$, child)), 'ERR:42501');
  perform t.eq('children: anonymous visitors cannot read them', t.scalar(null, 'anon', $q$select count(*) from public.guardian_children$q$), 'ERR:42501');

  -- a cadet application
  perform t.eq('apply: the guardian starts a draft', t.dml(g, 'authenticated',
    format($q$insert into public.applications (kind, child_id, program_id, payload) values ('cadet', %L, %L, '{"preferred_days":"weekends"}')$q$, child, prog)), 'OK:1');
  select id into app from public.applications where child_id = child;
  perform t.eq('apply: the name and e-mail are stamped from the account', (select applicant_email from public.applications where id = app), 'guardian@example.test');
  perform t.eq('apply: nobody can start a submitted application', t.dml(g, 'authenticated',
    format($q$insert into public.applications (kind, status, child_id) values ('cadet', 'submitted', %L)$q$, child2)), 'ERR:42501');
  perform t.eq('apply: another parent cannot apply for this child', t.dml(parent1, 'authenticated',
    format($q$insert into public.applications (kind, child_id) values ('cadet', %L)$q$, child2)), 'ERR:42501');
  perform t.eq('apply: a second open application for the same child is refused', t.dml(g, 'authenticated',
    format($q$insert into public.applications (kind, child_id) values ('cadet', %L)$q$, child)), 'ERR:23505');
  perform t.eq('apply: the applicant cannot set the status', t.dml(g, 'authenticated', format($q$update public.applications set status = 'approved' where id = %L$q$, app)), 'ERR:42501');
  perform t.eq('apply: the applicant cannot set the payment state', t.dml(g, 'authenticated', format($q$update public.applications set payment_status = 'paid' where id = %L$q$, app)), 'ERR:42501');
  perform t.eq('apply: another parent cannot see it', t.scalar(parent1, 'authenticated', $q$select count(*) from public.applications$q$), '0');
  perform t.eq('apply: an instructor cannot see it', t.scalar(coach, 'authenticated', $q$select count(*) from public.applications$q$), '0');

  -- documents
  perform t.eq('documents: a path outside the applicant''s folder is refused', t.dml(g, 'authenticated',
    format($q$insert into public.application_documents (application_id, doc_type, storage_path, file_name, mime_type, size_bytes) values (%L, 'proof_of_age', %L, 'b.pdf', 'application/pdf', 1000)$q$, app, parent1::text || '/' || app::text || '/b.pdf')), 'ERR:42501');
  perform t.eq('documents: an executable file type is refused', t.dml(g, 'authenticated',
    format($q$insert into public.application_documents (application_id, doc_type, storage_path, file_name, mime_type, size_bytes) values (%L, 'proof_of_age', %L, 'b.exe', 'application/x-msdownload', 1000)$q$, app, g::text || '/' || app::text || '/b.exe')), 'ERR:23514');
  perform t.eq('submit: refused without proof of age', t.scalar(g, 'authenticated', format($q$select public.application_submit(%L, 'v1')$q$, app)), 'ERR:22023');
  perform t.eq('documents: the applicant files proof of age', t.dml(g, 'authenticated',
    format($q$insert into public.application_documents (application_id, doc_type, storage_path, file_name, mime_type, size_bytes) values (%L, 'proof_of_age', %L, 'birth.pdf', 'application/pdf', 20000)$q$, app, g::text || '/' || app::text || '/birth.pdf')), 'OK:1');
  perform t.eq('storage: the applicant uploads into their own folder', t.dml(g, 'authenticated',
    format($q$insert into storage.objects (bucket_id, name) values ('application-documents', %L)$q$, g::text || '/' || app::text || '/birth.pdf')), 'OK:1');
  perform t.eq('storage: nobody uploads into another person''s folder', t.dml(parent1, 'authenticated',
    format($q$insert into storage.objects (bucket_id, name) values ('application-documents', %L)$q$, g::text || '/' || app::text || '/fake.pdf')), 'ERR:42501');
  perform t.eq('storage: another parent cannot read the file', t.scalar(parent1, 'authenticated', $q$select count(*) from storage.objects where bucket_id = 'application-documents'$q$), '0');
  perform t.eq('storage: admissions reads the file', t.scalar(adm, 'authenticated', $q$select count(*) from storage.objects where bucket_id = 'application-documents'$q$), '1');
  perform t.eq('storage: the bucket is private', (select public::text from storage.buckets where id = 'application-documents'), 'false');

  -- submit
  perform t.eq('submit: refused without consent', t.scalar(g, 'authenticated', format($q$select public.application_submit(%L, '')$q$, app)), 'ERR:22023');
  perform t.eq('submit: refused for someone else''s application', t.scalar(parent1, 'authenticated', format($q$select public.application_submit(%L, 'v1')$q$, app)), 'ERR:P0002');
  perform t.eq('submit: the guardian submits', t.scalar(g, 'authenticated', format($q$select public.application_submit(%L, 'v1')$q$, app)), 'submitted');
  perform t.eq('submit: guardian consent is recorded against the application', (select count(*)::text from public.consent_records where application_id = app and consent_text_version = 'v1'), '1');
  perform t.eq('submit: a submitted application cannot be edited', t.dml(g, 'authenticated', format($q$update public.applications set payload = '{}' where id = %L$q$, app)), 'OK:0');
  perform t.eq('submit: documents cannot be added after submission', t.dml(g, 'authenticated',
    format($q$insert into public.application_documents (application_id, doc_type, storage_path, file_name, mime_type, size_bytes) values (%L, 'photo', %L, 'p.jpg', 'image/jpeg', 2000)$q$, app, g::text || '/' || app::text || '/p.jpg')), 'ERR:42501');
  perform t.eq('submit: cannot submit twice', t.scalar(g, 'authenticated', format($q$select public.application_submit(%L, 'v1')$q$, app)), 'ERR:22023');

  -- review
  perform t.eq('review: a parent cannot review', t.scalar(g, 'authenticated', format($q$select public.application_review(%L, 'approved')$q$, app)), 'ERR:42501');
  perform t.eq('review: a school admin cannot review', t.scalar('00000000-0000-0000-0000-0000000000b2', 'authenticated', format($q$select public.application_review(%L, 'approved')$q$, app)), 'ERR:42501');
  perform t.eq('review: no jump straight to enrolled', t.scalar(adm, 'authenticated', format($q$select public.application_review(%L, 'enrolled')$q$, app)), 'ERR:22023');
  perform t.eq('review: admissions takes it under review', t.scalar(adm, 'authenticated', format($q$select public.application_review(%L, 'under_review', 'checking documents')$q$, app)), 'under_review');
  perform t.eq('review: asking for information needs a note', t.scalar(adm, 'authenticated', format($q$select public.application_review(%L, 'info_required', '')$q$, app)), 'ERR:22023');
  perform t.eq('review: admissions asks for more information', t.scalar(adm, 'authenticated', format($q$select public.application_review(%L, 'info_required', 'Please add a recent photo.')$q$, app)), 'info_required');
  perform t.eq('review: the applicant can edit again', t.dml(g, 'authenticated', format($q$update public.applications set payload = '{"preferred_days":"saturday"}' where id = %L$q$, app)), 'OK:1');
  perform t.eq('review: the applicant adds the photo', t.dml(g, 'authenticated',
    format($q$insert into public.application_documents (application_id, doc_type, storage_path, file_name, mime_type, size_bytes) values (%L, 'photo', %L, 'p.jpg', 'image/jpeg', 2000)$q$, app, g::text || '/' || app::text || '/p.jpg')), 'OK:1');
  perform t.eq('review: the applicant resubmits', t.scalar(g, 'authenticated', format($q$select public.application_submit(%L, 'v1')$q$, app)), 'submitted');
  perform t.eq('review: admissions approves', t.scalar(adm, 'authenticated', format($q$select public.application_review(%L, 'approved')$q$, app)), 'approved');
  perform t.eq('review: approval fixes the programme fee and a pending payment', (select fee_paise || '/' || payment_status from public.applications where id = app), '250000/pending');
  perform t.eq('review: a decided application cannot be reviewed again', t.scalar(adm, 'authenticated', format($q$select public.application_review(%L, 'rejected')$q$, app)), 'ERR:22023');
  perform t.eq('history: the applicant sees their visible steps only', t.scalar(g, 'authenticated', format($q$select count(*) from public.application_events where application_id = %L$q$, app)), '4');
  perform t.eq('history: admissions sees every step', t.scalar(adm, 'authenticated', format($q$select count(*) from public.application_events where application_id = %L$q$, app)), '5');
  perform t.eq('history: append-only, even for a SUPER_ADMIN', t.dml(admin, 'authenticated', format($q$delete from public.application_events where application_id = %L$q$, app)), 'ERR:42501');
  perform t.eq('audit: every step is in the audit trail', (select (count(*) >= 5)::text from public.audit_events where entity_type = 'application' and entity_id = app::text), 'true');

  -- payment, then enrolment
  perform t.eq('enrol: refused before the fee is paid', t.scalar(adm, 'authenticated', format($q$select public.application_enrol(%L)$q$, app)), 'ERR:22023');
  insert into public.payment_records (cadet_id, parent_id, gateway_order_id, amount_paid, gst_amount, payment_type, status, application_id, amount_paise)
  values (null, g, 'order_TEST1', 2950.00, 450.00, 'ONBOARDING', 'PENDING', app, 295000);
  perform t.eq('payment: a signed-in user cannot ingest gateway events', t.scalar(g, 'authenticated', $q$select public.ingest_payment_event('evt_1', 'order_TEST1', 'payment.captured', 'pay_1', 295000)$q$), 'ERR:42501');
  perform t.eq('payment: the parent cannot mark their payment paid', t.dml(g, 'authenticated', $q$update public.payment_records set status = 'PAID' where gateway_order_id = 'order_TEST1'$q$), 'OK:0');
  perform t.eq('payment: a wrong amount is not accepted', public.ingest_payment_event('evt_0', 'order_TEST1', 'payment.captured', 'pay_0', 1000), 'amount_mismatch');
  perform t.eq('payment: the verified capture marks it paid', public.ingest_payment_event('evt_1', 'order_TEST1', 'payment.captured', 'pay_1', 295000), 'paid');
  perform t.eq('payment: a replayed event changes nothing', public.ingest_payment_event('evt_1', 'order_TEST1', 'payment.captured', 'pay_1', 295000), 'duplicate');
  perform t.eq('payment: a second capture event is harmless', public.ingest_payment_event('evt_2', 'order_TEST1', 'order.paid', 'pay_1', 295000), 'already_paid');
  perform t.eq('payment: a late failure does not undo a payment', public.ingest_payment_event('evt_3', 'order_TEST1', 'payment.failed', 'pay_1', 295000), 'ignored');
  perform t.eq('payment: the application shows paid and an invoice number exists', (select a.payment_status || '/' || (p.invoice_number is not null)::text from public.applications a join public.payment_records p on p.application_id = a.id where a.id = app), 'paid/true');
  perform t.eq('payment: the parent sees their own payment', t.scalar(g, 'authenticated', $q$select count(*) from public.payment_records where gateway_order_id = 'order_TEST1'$q$), '1');
  perform t.eq('payment: another parent does not', t.scalar(parent1, 'authenticated', $q$select count(*) from public.payment_records where gateway_order_id = 'order_TEST1'$q$), '0');

  select t.scalar(adm, 'authenticated', format($q$select public.application_enrol(%L)$q$, app)) into r;
  perform t.eq('enrol: admissions enrols the paid application', (r ~ '^[0-9a-f-]{36}$')::text, 'true');
  cad := r::uuid;
  perform t.eq('enrol: the operations cadet exists under the guardian', (select (parent_id = g and passport_code like 'BSAH-%')::text from public.cadets where id = cad), 'true');
  perform t.eq('enrol: the child record is linked', (select cadet_id::text from public.guardian_children where id = child), cad::text);
  perform t.eq('enrol: the application is enrolled', (select status::text from public.applications where id = app), 'enrolled');
  perform t.eq('enrol: the guardian sees the cadet (existing policy)', t.scalar(g, 'authenticated', format($q$select count(*) from public.cadets where id = %L$q$, cad)), '1');
  perform t.eq('enrol: the guardian sees the enrolment', t.scalar(g, 'authenticated', $q$select count(*) from public.enrollments$q$), '1');
  perform t.eq('enrol: another parent does not', t.scalar(parent1, 'authenticated', $q$select count(*) from public.enrollments$q$), '0');
  perform t.eq('enrol: cannot enrol twice', t.scalar(adm, 'authenticated', format($q$select public.application_enrol(%L)$q$, app)), 'ERR:22023');
  perform t.eq('children: a linked child cannot be edited by the guardian', t.dml(g, 'authenticated', format($q$update public.guardian_children set first_name = 'Changed' where id = %L$q$, child)), 'OK:0');

  -- the younger child is outside the programme's ages
  perform t.eq('apply: the guardian starts a draft for the younger child', t.dml(g, 'authenticated',
    format($q$insert into public.applications (kind, child_id, program_id) values ('cadet', %L, %L)$q$, child2, prog)), 'OK:1');
  select id into app2 from public.applications where child_id = child2;
  insert into public.application_documents (application_id, doc_type, storage_path, file_name, mime_type, size_bytes, uploaded_by)
  values (app2, 'proof_of_age', g::text || '/' || app2::text || '/k.pdf', 'k.pdf', 'application/pdf', 100, g);
  perform t.eq('submit: refused when the child is outside the programme''s ages', t.scalar(g, 'authenticated', format($q$select public.application_submit(%L, 'v1')$q$, app2)), 'ERR:22023');
  perform t.eq('withdraw: the guardian withdraws it', t.scalar(g, 'authenticated', format($q$select public.application_withdraw(%L)$q$, app2)), 'withdrawn');
  perform t.eq('withdraw: an enrolled application cannot be withdrawn', t.scalar(g, 'authenticated', format($q$select public.application_withdraw(%L)$q$, app)), 'ERR:22023');

  -- staff application and activation
  perform t.eq('staff: an unconfirmed account cannot submit', t.dml(unconf, 'authenticated', $q$insert into public.applications (kind, payload) values ('staff', '{"role":"instructor"}')$q$), 'OK:1');
  perform t.eq('staff: ...and is stopped at submit', t.scalar(unconf, 'authenticated', $q$select public.application_submit((select id from public.applications where kind = 'staff' limit 1), 'v1')$q$), 'ERR:42501');
  perform t.eq('staff: the applicant starts an application', t.dml(staffapp, 'authenticated', $q$insert into public.applications (kind, payload) values ('staff', '{"role":"instructor","years":"12"}')$q$), 'OK:1');
  select id into sapp from public.applications where applicant_id = staffapp;
  perform t.eq('staff: one open application per person', t.dml(staffapp, 'authenticated', $q$insert into public.applications (kind, payload) values ('staff', '{}')$q$), 'ERR:23505');
  perform t.eq('staff: someone else''s child cannot be attached', t.dml(staffapp, 'authenticated', format($q$update public.applications set child_id = %L where id = %L$q$, child2, sapp)), 'ERR:42501');
  perform t.eq('apply: a child belongs only on a cadet application', t.dml(g, 'authenticated', format($q$insert into public.applications (kind, child_id) values ('partner', %L)$q$, child2)), 'ERR:23514');
  perform t.eq('staff: refused without a CV', t.scalar(staffapp, 'authenticated', format($q$select public.application_submit(%L, 'v1')$q$, sapp)), 'ERR:22023');
  insert into public.application_documents (application_id, doc_type, storage_path, file_name, mime_type, size_bytes, uploaded_by)
  values (sapp, 'cv', staffapp::text || '/' || sapp::text || '/cv.pdf', 'cv.pdf', 'application/pdf', 100, staffapp);
  perform t.eq('staff: submitted with a CV', t.scalar(staffapp, 'authenticated', format($q$select public.application_submit(%L, 'v1')$q$, sapp)), 'submitted');
  perform t.eq('staff: submitting grants no role', (select role from public.users where id = staffapp), 'PARENT');
  perform t.eq('staff: admissions approves', t.scalar(adm, 'authenticated', format($q$select public.application_review(%L, 'approved')$q$, sapp)), 'approved');
  perform t.eq('staff: approval alone grants no role', (select role from public.users where id = staffapp), 'PARENT');
  perform t.eq('staff: ADMISSIONS cannot activate accounts', t.scalar(adm, 'authenticated', format($q$select public.application_activate_account(%L, 'INSTRUCTOR')$q$, sapp)), 'ERR:42501');
  perform t.eq('staff: activation never hands out SUPER_ADMIN', t.scalar(admin, 'authenticated', format($q$select public.application_activate_account(%L, 'SUPER_ADMIN')$q$, sapp)), 'ERR:22023');
  perform t.eq('staff: a staff applicant cannot become a school admin', t.scalar(admin, 'authenticated', format($q$select public.application_activate_account(%L, 'SCHOOL_ADMIN')$q$, sapp)), 'ERR:22023');
  perform t.eq('staff: SUPER_ADMIN activates the instructor', t.scalar(admin, 'authenticated', format($q$select public.application_activate_account(%L, 'INSTRUCTOR')$q$, sapp)), '');
  perform t.eq('staff: the account is now an INSTRUCTOR', (select role from public.users where id = staffapp), 'INSTRUCTOR');

  -- notification log and misc
  insert into public.notification_log (recipient_user_id, application_id, template, status) values (g, app, 'application_received', 'sent');
  perform t.eq('notifications: a parent cannot read the log', t.scalar(g, 'authenticated', $q$select count(*) from public.notification_log$q$), '0');
  perform t.eq('notifications: admissions reads it', t.scalar(adm, 'authenticated', $q$select count(*) from public.notification_log$q$), '1');
  perform t.eq('payments: payment events are SUPER_ADMIN only', t.scalar(adm, 'authenticated', $q$select count(*) from public.payment_events$q$), '0');
  perform t.eq('anon: applications are closed to anonymous visitors', t.scalar(null, 'anon', $q$select count(*) from public.applications$q$), 'ERR:42501');
  perform t.eq('anon: cannot call submit', t.scalar(null, 'anon', format($q$select public.application_submit(%L, 'v1')$q$, app)), 'ERR:42501');
  perform t.eq('ops: the parent policy on cadets still works for the old parent', t.scalar(parent1, 'authenticated', $q$select count(*) from public.cadets$q$), '1');
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
