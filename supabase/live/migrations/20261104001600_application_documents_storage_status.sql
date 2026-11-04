-- Application-document storage follows the application's status (security audit F-10, 4 Nov 2026).
-- NOT APPLIED. Apply only with the owner's explicit approval, after 20261104001400_registration_admissions.sql.
--
-- Before: an applicant could add or delete objects anywhere in their own folder of the private bucket
-- application-documents, whatever happened to the application: files could be removed from behind a submitted
-- application (the public.application_documents row stays, the file is gone), and the folder took uploads that belong
-- to no application at all. The table policies on public.application_documents already allow changes only while the
-- application is the applicant's own and still editable (draft or info_required); the storage policies now say the same.
--
-- Changes: the two owner policies on storage.objects for this bucket (insert, delete) gain one condition: the second path
-- segment (<user id>/<application id>/<file>) must be one of the caller's applications in draft or info_required. Reads
-- (owner or ADMISSIONS / SUPER_ADMIN) are unchanged. No table, column, row, grant or function changes. The website's
-- uploadDocument and removeDocument (app/enroll/actions.ts) already work only on editable applications, so nothing it
-- does today is refused. ROLLBACK: supabase/live/rollback/20261104001600_application_documents_storage_status_rollback.sql
begin;
set local lock_timeout = '5s';
do $$
begin
  if to_regclass('public.applications') is null or not exists (select 1 from storage.buckets where id = 'application-documents') then
    raise exception 'apply 20261104001400_registration_admissions.sql first';
  end if;
end $$;

drop policy if exists "application-documents owner insert" on storage.objects;
create policy "application-documents owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'application-documents'
              and (storage.foldername(name))[1] = (select auth.uid())::text
              and exists (select 1 from public.applications a
                           where a.id::text = (storage.foldername(name))[2]
                             and a.applicant_id = (select auth.uid())
                             and a.status in ('draft', 'info_required')));

drop policy if exists "application-documents owner delete" on storage.objects;
create policy "application-documents owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'application-documents'
         and (storage.foldername(name))[1] = (select auth.uid())::text
         and exists (select 1 from public.applications a
                      where a.id::text = (storage.foldername(name))[2]
                        and a.applicant_id = (select auth.uid())
                        and a.status in ('draft', 'info_required')));

notify pgrst, 'reload schema';
commit;
