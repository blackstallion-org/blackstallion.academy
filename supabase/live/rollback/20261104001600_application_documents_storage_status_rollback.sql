-- Rollback of 20261104001600_application_documents_storage_status.sql: restores the two owner policies exactly as
-- 20261104001400_registration_admissions.sql created them (own folder only, whatever the application's status).
begin;
set local lock_timeout = '5s';
drop policy if exists "application-documents owner insert" on storage.objects;
create policy "application-documents owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'application-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "application-documents owner delete" on storage.objects;
create policy "application-documents owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'application-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
notify pgrst, 'reload schema';
commit;
