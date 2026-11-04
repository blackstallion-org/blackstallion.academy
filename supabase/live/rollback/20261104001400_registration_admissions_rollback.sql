-- Rollback of 20261104001400_registration_admissions.sql. Re-runnable. Removes only what that migration added.
-- It refuses while ADMISSIONS accounts exist (narrowing the role check would fail on them): change their role first.
-- Application data (applications, children, documents, enrolments, events, the log) is DELETED with its tables, and the
-- objects in the application-documents bucket must be removed through the Storage API beforehand (the bucket row is kept
-- if objects remain). Cadets created by enrolment stay: they are operations records now.
do $$ begin
  if exists (select 1 from public.users where role = 'ADMISSIONS') then
    raise exception 'ADMISSIONS accounts exist: change their role before rolling back';
  end if;
end $$;

drop function if exists public.ingest_payment_event(text, text, text, text, integer);
drop function if exists public.application_activate_account(uuid, text, uuid);
drop function if exists public.application_enrol(uuid);
drop function if exists public.application_review(uuid, public.application_status, text);
drop function if exists public.application_withdraw(uuid);
drop function if exists public.application_submit(uuid, text);

drop policy if exists "application-documents owner insert" on storage.objects;
drop policy if exists "application-documents owner or reviewer read" on storage.objects;
drop policy if exists "application-documents owner delete" on storage.objects;
delete from storage.buckets b where b.id = 'application-documents'
  and not exists (select 1 from storage.objects o where o.bucket_id = b.id);

alter table if exists public.payment_records drop column if exists application_id;
alter table if exists public.payment_records drop column if exists invoice_number;
alter table if exists public.payment_records drop column if exists amount_paise;
alter table if exists public.payment_records drop column if exists paid_at;
alter table if exists public.payment_records drop column if exists refunded_paise;
alter table if exists public.consent_records drop column if exists application_id;

drop policy if exists children_guardian_delete on public.guardian_children;   -- it refers to applications
drop table if exists public.notification_log;
drop table if exists public.payment_events;
drop table if exists public.enrollments;
drop table if exists public.application_documents;
drop table if exists public.application_events;
drop table if exists public.applications;
drop table if exists public.guardian_children;
drop table if exists public.programs;
drop function if exists app_private.log_application(uuid, public.application_status, public.application_status, text, boolean);
drop function if exists app_private.application_stamp();
drop type if exists public.application_status;
drop type if exists public.application_kind;
drop function if exists app_private.is_admissions();
drop function if exists app_private.is_super_admin();

-- back to the F2 sign-up trigger and the five operations roles
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
declare v_role text := upper(coalesce(new.raw_app_meta_data->>'role', ''));
begin
  if v_role not in ('PARENT', 'INSTRUCTOR', 'GROOM', 'SCHOOL_ADMIN', 'SUPER_ADMIN') then v_role := 'PARENT'; end if;
  insert into public.users (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New User'), new.email, v_role);
  return new;
end;
$function$;
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role::text = any (array[
  'PARENT', 'INSTRUCTOR', 'GROOM', 'SCHOOL_ADMIN', 'SUPER_ADMIN']::text[]));
