-- Website layer on the live operations schema. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  admin  uuid := '00000000-0000-0000-0000-0000000000a1';
  parent uuid := '00000000-0000-0000-0000-0000000000b1';
  school uuid := '00000000-0000-0000-0000-0000000000b2';
  r jsonb; c text;
  call text := $q$select public.submit_lead_v2(%L::public.lead_type, %L, %L, %L, %L, %L::jsonb, '2026-10-draft', %L, %L::jsonb, %L)::text$q$;
begin
  -- existing operations objects untouched
  perform t.eq('layer: existing policies, functions and columns unchanged', t.ops_fingerprint(), (select v from t.snap where k = 'before'));
  perform t.eq('layer: RLS on every new public table', (select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and relname in ('onboarding_leads','audit_events','generated_documents','media_assets') and relrowsecurity), '4');

  -- anon: no direct table access, only the RPC
  perform t.eq('leads: anon cannot read leads', t.scalar(null, 'anon', 'select count(*) from public.onboarding_leads'), 'ERR:42501');
  perform t.eq('leads: anon cannot insert directly', t.dml(null, 'anon',
    $q$insert into public.onboarding_leads (lead_type, gate, contact_name, email, privacy_notice_version, consent_at, idempotency_key) values ('school','mou','X Y','x@example.test','v',now(),'aaaaaaaaaaaaaaaa')$q$), 'ERR:42501');

  -- submit + dedupe
  c := t.scalar(null, 'anon', format(call, 'school', 'mou', 'Meera Rao', 'meera@example.test', '+91 98765 43210',
    '{"organisation":"Test School, Pune","message":"Two acres","mou_tier":"citadel"}', true, '{"path":"/schools/mou","utm_source":"qa","evil":"x"}', 'idem-mou-000000000001'));
  perform t.eq('leads: MOU stored and mirrored', c, '{"mirror": "mou_requests", "status": "stored"}');
  perform t.eq('leads: same key again is a duplicate', t.scalar(null, 'anon', format(call, 'school', 'mou', 'Meera Rao', 'meera@example.test', '+91 98765 43210',
    '{"organisation":"Test School"}', true, '{}', 'idem-mou-000000000001')), '{"status": "duplicate"}');
  perform t.eq('leads: one row for the key', (select count(*)::text from public.onboarding_leads where idempotency_key = 'idem-mou-000000000001'), '1');
  perform t.eq('leads: unknown attribution keys dropped', (select attribution::text from public.onboarding_leads where idempotency_key = 'idem-mou-000000000001'), '{"path": "/schools/mou", "utm_source": "qa"}');
  perform t.eq('mirror: mou_requests row with reference', (select count(*)::text from public.mou_requests where school_name = 'Test School, Pune' and notes like 'Website MOU enquiry. Reference %' and campus_tier = 'citadel'), '1');

  perform t.eq('leads: MOU without phone stored, mirror skipped', t.scalar(null, 'anon', format(call, 'school', 'mou', 'Ravi Iyer', 'ravi@example.test', null,
    '{"organisation":"No Phone School"}', true, '{}', 'idem-mou-000000000002')), '{"mirror": "skipped", "status": "stored"}');
  perform t.eq('leads: board audit mirrored to executive_appointments', t.scalar(null, 'anon', format(call, 'board_audit', 'audit', 'Anil Mehta', 'anil@example.test', '+91 99999 00000',
    '{"organisation":"Circuit A","designation":"Trustee","date":"2026-12-01","slot":"10:00"}', true, '{}', 'idem-audit-00000000001')), '{"mirror": "executive_appointments", "status": "stored"}');
  perform t.eq('mirror: appointment date and slot', (select preferred_date::text || ' ' || preferred_time_slot from public.executive_appointments where school_name = 'Circuit A'), '2026-12-01 10:00');
  perform t.eq('leads: QR parent enquiry mirrored to qr_lead_captures', t.scalar(null, 'anon', format(call, 'cadet', 'hub', 'Priya Nair', null, '+91 90000 11111',
    '{"student":"Kabir, 11"}', true, '{"qr":"test-hub","path":"/hub/test-hub"}', 'idem-qr-0000000000001')), '{"mirror": "qr_lead_captures", "status": "stored"}');
  perform t.eq('mirror: QR capture source and hub', (select hub_slug || ' ' || source from public.qr_lead_captures where parent_name = 'Priya Nair'), 'test-hub website-qr');
  perform t.eq('leads: plain parent enquiry has no mirror', t.scalar(null, 'anon', format(call, 'cadet', 'parents', 'Sunil Rao', 'sunil@example.test', null,
    '{"student":"Ira, 9"}', true, '{}', 'idem-parent-000000001')), '{"mirror": "none", "status": "stored"}');

  -- validation
  perform t.eq('leads: refused without consent', t.scalar(null, 'anon', format(call, 'school', 'mou', 'No Consent', 'a@example.test', null, '{}', false, '{}', 'idem-noconsent-000001')), 'ERR:P0001');
  perform t.eq('leads: refused with bad email', t.scalar(null, 'anon', format(call, 'school', 'mou', 'Bad Mail', 'not-an-email', null, '{}', true, '{}', 'idem-bademail-0000001')), 'ERR:P0001');
  perform t.eq('leads: refused without any contact', t.scalar(null, 'anon', format(call, 'school', 'mou', 'No Contact', null, null, '{}', true, '{}', 'idem-nocontact-000001')), 'ERR:P0001');
  perform t.eq('leads: refused with bad key', t.scalar(null, 'anon', format(call, 'school', 'mou', 'Bad Key', 'k@example.test', null, '{}', true, '{}', 'short')), 'ERR:P0001');

  -- staff access
  perform t.eq('leads: SUPER_ADMIN reads all leads', t.scalar(admin, 'authenticated', 'select count(*) from public.onboarding_leads'), '5');
  perform t.eq('leads: parent reads none', t.scalar(parent, 'authenticated', 'select count(*) from public.onboarding_leads'), '0');
  perform t.eq('leads: school admin reads none', t.scalar(school, 'authenticated', 'select count(*) from public.onboarding_leads'), '0');
  perform t.eq('leads: SUPER_ADMIN updates status', t.dml(admin, 'authenticated', $q$update public.onboarding_leads set status = 'reviewing' where idempotency_key = 'idem-mou-000000000001'$q$), 'OK:1');
  perform t.eq('leads: parent cannot update status', t.dml(parent, 'authenticated', $q$update public.onboarding_leads set status = 'closed'$q$), 'OK:0');
  perform t.eq('leads: contact details are read-only even for staff', t.dml(admin, 'authenticated', $q$update public.onboarding_leads set email = 'x@example.test'$q$), 'ERR:42501');

  -- audit trail
  perform t.eq('audit: each stored lead audited', (select count(*)::text from public.audit_events where action = 'lead.submitted'), '5');
  perform t.eq('audit: status change audited without values', (select metadata::text from public.audit_events where entity_type = 'onboarding_leads' and action = 'row.update' limit 1), '{"changed_columns": ["status"]}'); -- now() is fixed inside one transaction, so updated_at is unchanged here
  perform t.eq('audit: staff can read the trail', t.scalar(admin, 'authenticated', 'select (count(*) > 0)::text from public.audit_events'), 'true');
  perform t.eq('audit: parent cannot read the trail', t.scalar(parent, 'authenticated', 'select count(*) from public.audit_events'), '0');
  perform t.eq('audit: trail is append-only', t.dml(null, 'postgres', 'delete from public.audit_events'), 'ERR:42501');

  -- rate limiter
  perform t.eq('rate: first hit allowed', t.scalar(null, 'anon', $q$select public.consume_rate_limit('lead:' || repeat('a', 40), 2, 600)::text$q$), 'true');
  perform t.scalar(null, 'anon', $q$select public.consume_rate_limit('lead:' || repeat('a', 40), 2, 600)::text$q$);
  perform t.eq('rate: over the limit refused', t.scalar(null, 'anon', $q$select public.consume_rate_limit('lead:' || repeat('a', 40), 2, 600)::text$q$), 'false');
  perform t.eq('rate: malformed bucket rejected', t.scalar(null, 'anon', $q$select public.consume_rate_limit('raw-ip-1.2.3.4', 2, 600)::text$q$), 'ERR:P0001');
  perform t.eq('rate: anon cannot read the counters', t.scalar(null, 'anon', 'select count(*) from app_private.rate_limits'), 'ERR:42501');

  -- verification
  perform t.eq('verify: known passport is valid with rank and date only', t.scalar(null, 'anon', $q$select public.verify_passport('bsah-test-0001')::text$q$),
    '{"rank": "rider", "status": "valid", "issued_at": "2026-09-01", "credential_type": "passport"}');
  perform t.eq('verify: unknown code', t.scalar(null, 'anon', $q$select public.verify_passport('BSAH-NOPE-9999')::text$q$), '{"status": "unknown"}');
  perform t.eq('verify: malformed code', t.scalar(null, 'anon', $q$select public.verify_passport('x'' or 1=1 --')::text$q$), '{"status": "unknown"}');
  update public.site_settings set value = 'false' where key = 'verify_public';
  perform t.eq('verify: switched off by site_settings', t.scalar(null, 'anon', $q$select public.verify_passport('BSAH-TEST-0001')::text$q$), '{"status": "unavailable"}');
  update public.site_settings set value = 'true' where key = 'verify_public';

  -- buckets and storage policies
  perform t.eq('storage: existing buckets kept', (select count(*)::text from storage.buckets where id in ('session-videos','proof-photos','invoices','site-assets')), '4');
  perform t.eq('storage: three website buckets added', (select count(*)::text from storage.buckets where id in ('website-assets','user-uploads','private-documents')), '3');
  perform t.eq('storage: staff adds a website asset', t.dml(admin, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('website-assets', 'site/2026/10/a.webp')$q$), 'OK:1');
  perform t.eq('storage: parent cannot add a website asset', t.dml(parent, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('website-assets', 'site/2026/10/b.webp')$q$), 'ERR:42501');
  perform t.eq('storage: anon cannot add a website asset', t.dml(null, 'anon', $q$insert into storage.objects (bucket_id, name) values ('website-assets', 'site/2026/10/c.webp')$q$), 'ERR:42501');
  perform t.eq('storage: parent uploads into own folder', t.dml(parent, 'authenticated', format($q$insert into storage.objects (bucket_id, name) values ('user-uploads', '%s/p.jpg')$q$, parent)), 'OK:1');
  perform t.eq('storage: parent cannot upload into another folder', t.dml(parent, 'authenticated', format($q$insert into storage.objects (bucket_id, name) values ('user-uploads', '%s/p.jpg')$q$, school)), 'ERR:42501');
  perform t.eq('storage: school admin cannot see the parent upload', t.scalar(school, 'authenticated', $q$select count(*) from storage.objects where bucket_id = 'user-uploads'$q$), '0');
  perform t.eq('storage: staff stores a private document', t.dml(admin, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('private-documents', 'mou/2026/10/x.pdf')$q$), 'OK:1');
  perform t.eq('storage: parent cannot read private documents', t.scalar(parent, 'authenticated', $q$select count(*) from storage.objects where bucket_id = 'private-documents'$q$), '0');
  perform t.eq('storage: operations buckets stay closed to the website roles', t.dml(admin, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('invoices', 'x/inv.pdf')$q$), 'ERR:42501');

  -- documents and media
  perform t.eq('docs: staff records a document', t.dml(admin, 'authenticated', format($q$insert into public.generated_documents (kind, title, storage_path, created_by) values ('mou_draft', 'MOU draft', 'mou/2026/10/x.pdf', %L)$q$, admin)), 'OK:1');
  perform t.eq('docs: staff cannot attribute to someone else', t.dml(admin, 'authenticated', format($q$insert into public.generated_documents (kind, title, storage_path, created_by) values ('mou_draft', 'Spoof', 'mou/2026/10/z.pdf', %L)$q$, parent)), 'ERR:42501');
  perform t.eq('docs: parent cannot read documents', t.scalar(parent, 'authenticated', 'select count(*) from public.generated_documents'), '0');
  perform t.eq('docs: path traversal rejected', t.dml(admin, 'authenticated', format($q$insert into public.generated_documents (kind, title, storage_path, created_by) values ('mou_draft', 'Bad', '../../etc/passwd', %L)$q$, admin)), 'ERR:23514');
  perform t.eq('media: staff records an asset', t.dml(admin, 'authenticated', format($q$insert into public.media_assets (storage_path, alt_text, mime_type, bytes, uploaded_by) values ('site/2026/10/a.webp', 'A stallion at dusk', 'image/webp', 1200, %L)$q$, admin)), 'OK:1');
  perform t.eq('media: anon lists public assets', t.scalar(null, 'anon', 'select count(*) from public.media_assets'), '1');
  perform t.eq('media: parent cannot add assets', t.dml(parent, 'authenticated', format($q$insert into public.media_assets (storage_path, alt_text, mime_type, bytes, uploaded_by) values ('site/2026/10/b.webp', 'Alt text', 'image/webp', 10, %L)$q$, parent)), 'ERR:42501');
  perform t.eq('media: svg refused', t.dml(admin, 'authenticated', format($q$insert into public.media_assets (storage_path, alt_text, mime_type, bytes, uploaded_by) values ('site/2026/10/c.svg', 'Alt text', 'image/svg+xml', 10, %L)$q$, admin)), 'ERR:23514');
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
