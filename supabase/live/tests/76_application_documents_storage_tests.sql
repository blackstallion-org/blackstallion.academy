-- Application-document storage follows the application's status (20261104001600, security audit F-10). THROWAWAY Postgres only.
-- Runs after 70_registration_tests.sql: the guardian's first application is past the editable states there.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  g uuid := '00000000-0000-0000-0000-0000000000c1';       -- guardian (applicant)
  parent1 uuid := '00000000-0000-0000-0000-0000000000b1'; -- another parent
  adm uuid := '00000000-0000-0000-0000-0000000000c2';     -- ADMISSIONS
  kid uuid; draft uuid; done uuid;
begin
  -- a fresh draft for the guardian, created through RLS as the guardian
  perform t.eq('setup: the guardian adds a child', t.dml(g, 'authenticated',
    $q$insert into public.guardian_children (first_name, last_name, date_of_birth) values ('Storage', 'Check', '2014-05-01')$q$), 'OK:1');
  select id into kid from public.guardian_children where guardian_id = g and first_name = 'Storage' and last_name = 'Check';
  perform t.eq('setup: the guardian starts a draft', t.dml(g, 'authenticated',
    format($q$insert into public.applications (kind, child_id) values ('cadet', %L)$q$, kid)), 'OK:1');
  select id into draft from public.applications where child_id = kid;
  -- the application whose folder holds the proof of age uploaded in 70_registration_tests.sql (submitted there, then decided)
  select a.id into done from public.applications a
    join storage.objects o on o.bucket_id = 'application-documents' and o.name = g::text || '/' || a.id::text || '/birth.pdf'
   where a.applicant_id = g;
  perform t.eq('setup: that application is past editing', (select status::text not in ('draft', 'info_required') from public.applications where id = done)::text, 'true');

  -- uploads
  perform t.eq('storage F-10: upload into an own draft is allowed', t.dml(g, 'authenticated',
    format($q$insert into storage.objects (bucket_id, name) values ('application-documents', %L)$q$, g::text || '/' || draft::text || '/photo.jpg')), 'OK:1');
  perform t.eq('storage F-10: upload into a submitted application is refused', t.dml(g, 'authenticated',
    format($q$insert into storage.objects (bucket_id, name) values ('application-documents', %L)$q$, g::text || '/' || done::text || '/late.pdf')), 'ERR:42501');
  perform t.eq('storage F-10: upload under a made-up application id is refused', t.dml(g, 'authenticated',
    format($q$insert into storage.objects (bucket_id, name) values ('application-documents', %L)$q$, g::text || '/' || gen_random_uuid()::text || '/x.pdf')), 'ERR:42501');
  perform t.eq('storage F-10: upload straight into the folder root is refused', t.dml(g, 'authenticated',
    format($q$insert into storage.objects (bucket_id, name) values ('application-documents', %L)$q$, g::text || '/loose.pdf')), 'ERR:42501');
  perform t.eq('storage F-10: another parent still cannot upload into the guardian''s draft', t.dml(parent1, 'authenticated',
    format($q$insert into storage.objects (bucket_id, name) values ('application-documents', %L)$q$, g::text || '/' || draft::text || '/fake.pdf')), 'ERR:42501');

  -- deletes
  perform t.eq('storage F-10: a file behind a submitted application cannot be deleted', t.dml(g, 'authenticated',
    format($q$delete from storage.objects where bucket_id = 'application-documents' and name = %L$q$, g::text || '/' || done::text || '/birth.pdf')), 'OK:0');
  perform t.eq('storage F-10: the submitted file is still there', (select count(*)::text from storage.objects where bucket_id = 'application-documents' and name = g::text || '/' || done::text || '/birth.pdf'), '1');
  perform t.eq('storage F-10: another parent cannot delete the draft file', t.dml(parent1, 'authenticated',
    format($q$delete from storage.objects where bucket_id = 'application-documents' and name = %L$q$, g::text || '/' || draft::text || '/photo.jpg')), 'OK:0');
  perform t.eq('storage F-10: the guardian deletes a file from the own draft', t.dml(g, 'authenticated',
    format($q$delete from storage.objects where bucket_id = 'application-documents' and name = %L$q$, g::text || '/' || draft::text || '/photo.jpg')), 'OK:1');

  -- reads are unchanged
  perform t.eq('storage F-10: the guardian still reads the submitted file', t.scalar(g, 'authenticated',
    format($q$select count(*) from storage.objects where bucket_id = 'application-documents' and name = %L$q$, g::text || '/' || done::text || '/birth.pdf')), '1');
  perform t.eq('storage F-10: admissions still reads it', t.scalar(adm, 'authenticated',
    format($q$select count(*) from storage.objects where bucket_id = 'application-documents' and name = %L$q$, g::text || '/' || done::text || '/birth.pdf')), '1');
  perform t.eq('storage F-10: another parent still reads nothing', t.scalar(parent1, 'authenticated',
    $q$select count(*) from storage.objects where bucket_id = 'application-documents'$q$), '0');
  perform t.eq('storage F-10: anonymous still reads nothing', t.scalar(null, 'anon',
    $q$select count(*) from storage.objects where bucket_id = 'application-documents'$q$), '0');

  -- clean up the fixture (as postgres) so the later registration checks see the data they expect
  delete from public.applications where id = draft;
  delete from public.guardian_children where id = kid;
end $$;
select case when ok then 'PASS  ' else 'FAIL  ' end || name || case when ok then '' else '  (' || detail || ')' end
  from t.results where n > :start_n order by n;
