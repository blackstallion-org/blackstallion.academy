-- Registration and admissions for the LIVE operations project (tgwadczrfbljnepoaqtb). 4 Nov 2026.
--
-- Additive layer on the operations schema (see ../baseline/20261023_live_snapshot.sql) and the website layer. Re-runnable.
-- It changes two existing objects, both by widening only, so it needs the owner's approval like 001100:
--   * users_role_check gains 'ADMISSIONS' (reviews applications; cannot grant roles, cannot read the users table);
--   * public.handle_new_user() (F2) accepts 'ADMISSIONS' from app metadata. Sign-up data still never sets a role.
-- Everything else is new: programmes, guardian-held children, applications (cadet, school, staff, partner) with an
-- append-only history, documents in a private bucket, enrolments that create the operations cadet, payment events for an
-- idempotent Razorpay webhook, and a notification log.
--
-- Rules it enforces (tests: ../tests/70_registration_tests.sql):
--   * a person who signs up is PARENT (least privilege), whatever they apply for; submitting a form grants nothing;
--   * minors never hold an account: children are records owned by their guardian;
--   * an applicant edits only their own application, and only while it is a draft or more information was asked for;
--     status, decisions, fees and payment state are never writable by the applicant (column grants + functions);
--   * one open application per child (cadet kind) and one per person for the other kinds;
--   * every status change goes through a function that checks the caller, the allowed transition, and writes the history
--     and the audit trail;
--   * only a verified payment event (service role) marks an application paid; enrolment requires paid or no fee.

create schema if not exists app_private;

-- ------------------------------------------------------------------ roles: ADMISSIONS
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role::text = any (array[
  'PARENT', 'INSTRUCTOR', 'GROOM', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'ADMISSIONS']::text[]));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
declare v_role text := upper(coalesce(new.raw_app_meta_data->>'role', ''));
begin
  if v_role not in ('PARENT', 'INSTRUCTOR', 'GROOM', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'ADMISSIONS') then v_role := 'PARENT'; end if;
  insert into public.users (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New User'), new.email, v_role);
  return new;
end;
$function$;

create or replace function app_private.is_admissions() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_role_name() in ('SUPER_ADMIN', 'ADMISSIONS'), false)
$$;
revoke all on function app_private.is_admissions() from public, anon, authenticated;
grant execute on function app_private.is_admissions() to authenticated;

create or replace function app_private.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_role_name() = 'SUPER_ADMIN', false)
$$;
revoke all on function app_private.is_super_admin() from public, anon, authenticated;
grant execute on function app_private.is_super_admin() to authenticated;

-- ------------------------------------------------------------------ types
do $$ begin create type public.application_kind as enum ('cadet', 'school', 'staff', 'partner');
exception when duplicate_object then null; end $$;
do $$ begin create type public.application_status as enum
  ('draft', 'submitted', 'under_review', 'info_required', 'approved', 'rejected', 'enrolled', 'withdrawn');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------ programmes (campuses are public.school_hubs)
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 2 and 120),
  description text check (char_length(description) <= 1000),
  min_age smallint not null default 6 check (min_age between 3 and 25),
  max_age smallint not null default 18 check (max_age between 3 and 25),
  enrolment_fee_paise integer not null default 0 check (enrolment_fee_paise between 0 and 100000000),
  gst_rate numeric(4,3) not null default 0.18 check (gst_rate between 0 and 0.5),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint programs_age_order check (min_age <= max_age)
);
alter table public.programs enable row level security;
revoke all on public.programs from anon, authenticated;
grant select on public.programs to anon, authenticated;
grant insert, update, delete on public.programs to authenticated;
drop policy if exists programs_public_read on public.programs;
create policy programs_public_read on public.programs for select to anon using (active);
drop policy if exists programs_member_read on public.programs;
create policy programs_member_read on public.programs for select to authenticated using (active or (select app_private.is_admissions()));
drop policy if exists programs_admin_write on public.programs;
create policy programs_admin_write on public.programs for all to authenticated
  using ((select app_private.is_super_admin())) with check ((select app_private.is_super_admin()));

-- ------------------------------------------------------------------ children held by their guardian (no login for minors)
create table if not exists public.guardian_children (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  first_name text not null check (char_length(btrim(first_name)) between 1 and 80),
  last_name text not null check (char_length(btrim(last_name)) between 1 and 80),
  date_of_birth date not null check (date_of_birth > date '1995-01-01'),
  current_school text check (char_length(current_school) <= 160),
  grade text check (char_length(grade) <= 20),
  riding_experience text check (riding_experience in ('none', 'some', 'regular', 'competitive')),
  medical_notes text check (char_length(medical_notes) <= 1000),
  cadet_id uuid unique references public.cadets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists guardian_children_guardian_idx on public.guardian_children (guardian_id);
drop trigger if exists guardian_children_updated on public.guardian_children;
create trigger guardian_children_updated before update on public.guardian_children
  for each row execute function app_private.set_updated_at();
alter table public.guardian_children enable row level security;
revoke all on public.guardian_children from anon, authenticated;
grant select, delete on public.guardian_children to authenticated;
grant insert (first_name, last_name, date_of_birth, current_school, grade, riding_experience, medical_notes) on public.guardian_children to authenticated;
grant update (first_name, last_name, date_of_birth, current_school, grade, riding_experience, medical_notes) on public.guardian_children to authenticated;
drop policy if exists children_guardian_read on public.guardian_children;
create policy children_guardian_read on public.guardian_children for select to authenticated
  using (guardian_id = (select auth.uid()) or (select app_private.is_admissions()));
drop policy if exists children_guardian_insert on public.guardian_children;
create policy children_guardian_insert on public.guardian_children for insert to authenticated
  with check (guardian_id = (select auth.uid()));
drop policy if exists children_guardian_update on public.guardian_children;
create policy children_guardian_update on public.guardian_children for update to authenticated
  using (guardian_id = (select auth.uid()) and cadet_id is null)
  with check (guardian_id = (select auth.uid()));

-- ------------------------------------------------------------------ applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('BSAH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  kind public.application_kind not null,
  status public.application_status not null default 'draft',
  applicant_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  applicant_name text,
  applicant_email text,
  child_id uuid references public.guardian_children (id) on delete restrict,
  program_id uuid references public.programs (id),
  hub_id uuid references public.school_hubs (id),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 16000),
  consent_version text,
  consented_at timestamptz,
  submitted_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references public.users (id),
  info_request text check (char_length(info_request) <= 2000),
  fee_paise integer check (fee_paise is null or fee_paise >= 0),
  payment_status text not null default 'not_required' check (payment_status in ('not_required', 'pending', 'paid', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_child_only_for_cadet check (kind = 'cadet' or child_id is null)
);
create index if not exists applications_applicant_idx on public.applications (applicant_id, created_at desc);
create index if not exists applications_status_idx on public.applications (kind, status, created_at desc);
create index if not exists applications_child_idx on public.applications (child_id);
create index if not exists applications_program_idx on public.applications (program_id);
create index if not exists applications_hub_idx on public.applications (hub_id);
create index if not exists applications_decided_by_idx on public.applications (decided_by);
-- duplicate prevention: one open application per child; one open application per person for the other kinds
create unique index if not exists applications_one_open_per_child on public.applications (child_id)
  where kind = 'cadet' and status not in ('rejected', 'withdrawn');
create unique index if not exists applications_one_open_per_kind on public.applications (applicant_id, kind)
  where kind <> 'cadet' and status not in ('rejected', 'withdrawn');
drop trigger if exists applications_updated on public.applications;
create trigger applications_updated before update on public.applications
  for each row execute function app_private.set_updated_at();

-- the applicant's name and e-mail as they were when they applied (reviewers cannot read public.users)
create or replace function app_private.application_stamp() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select u.full_name, u.email into new.applicant_name, new.applicant_email from public.users u where u.id = new.applicant_id;
  if new.child_id is not null and not exists (select 1 from public.guardian_children c where c.id = new.child_id and c.guardian_id = new.applicant_id) then
    raise exception 'that child is not on this account' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function app_private.application_stamp() from public, anon, authenticated;
drop trigger if exists applications_stamp on public.applications;
create trigger applications_stamp before insert or update of child_id, applicant_id on public.applications
  for each row execute function app_private.application_stamp();

alter table public.applications enable row level security;
revoke all on public.applications from anon, authenticated;
grant select, delete on public.applications to authenticated;
grant insert (kind, child_id, program_id, hub_id, payload) on public.applications to authenticated;
grant update (child_id, program_id, hub_id, payload) on public.applications to authenticated;
drop policy if exists applications_read on public.applications;
create policy applications_read on public.applications for select to authenticated
  using (applicant_id = (select auth.uid()) or (select app_private.is_admissions()));
drop policy if exists applications_insert_own on public.applications;
create policy applications_insert_own on public.applications for insert to authenticated
  with check (applicant_id = (select auth.uid()) and status = 'draft');
drop policy if exists applications_update_own_editable on public.applications;
create policy applications_update_own_editable on public.applications for update to authenticated
  using (applicant_id = (select auth.uid()) and status in ('draft', 'info_required'))
  with check (applicant_id = (select auth.uid()) and status in ('draft', 'info_required'));
drop policy if exists applications_delete_own_draft on public.applications;
create policy applications_delete_own_draft on public.applications for delete to authenticated
  using (applicant_id = (select auth.uid()) and status = 'draft');

-- a guardian may delete a child record only while no application for it is under way (needs applications, so it is here)
drop policy if exists children_guardian_delete on public.guardian_children;
create policy children_guardian_delete on public.guardian_children for delete to authenticated
  using (guardian_id = (select auth.uid()) and cadet_id is null
         and not exists (select 1 from public.applications a where a.child_id = guardian_children.id and a.status not in ('draft', 'withdrawn')));

-- ------------------------------------------------------------------ history (append-only)
create table if not exists public.application_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  actor_id uuid,
  note text check (char_length(note) <= 2000),
  visible_to_applicant boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists application_events_app_idx on public.application_events (application_id, created_at);
alter table public.application_events enable row level security;
revoke all on public.application_events from anon, authenticated;
grant select on public.application_events to authenticated;
drop policy if exists application_events_read on public.application_events;
create policy application_events_read on public.application_events for select to authenticated
  using ((select app_private.is_admissions())
         or (visible_to_applicant and exists (select 1 from public.applications a where a.id = application_id and a.applicant_id = (select auth.uid()))));
drop trigger if exists application_events_no_update on public.application_events;
create trigger application_events_no_update before update or delete on public.application_events
  for each row execute function app_private.reject_mutation();

-- ------------------------------------------------------------------ documents (private bucket application-documents)
create table if not exists public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  doc_type text not null check (doc_type in ('proof_of_age', 'photo', 'medical_fitness', 'school_letter', 'cv', 'qualification', 'id_proof', 'organisation_profile', 'other')),
  storage_path text not null unique check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,120}$'),
  file_name text not null check (char_length(file_name) between 1 and 160),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  uploaded_by uuid not null default auth.uid() references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists application_documents_app_idx on public.application_documents (application_id);
create index if not exists application_documents_uploader_idx on public.application_documents (uploaded_by);
alter table public.application_documents enable row level security;
revoke all on public.application_documents from anon, authenticated;
grant select, delete on public.application_documents to authenticated;
grant insert (application_id, doc_type, storage_path, file_name, mime_type, size_bytes) on public.application_documents to authenticated;
drop policy if exists application_documents_read on public.application_documents;
create policy application_documents_read on public.application_documents for select to authenticated
  using ((select app_private.is_admissions())
         or exists (select 1 from public.applications a where a.id = application_id and a.applicant_id = (select auth.uid())));
drop policy if exists application_documents_insert_own on public.application_documents;
create policy application_documents_insert_own on public.application_documents for insert to authenticated
  with check (uploaded_by = (select auth.uid())
              and split_part(storage_path, '/', 1) = (select auth.uid())::text
              and split_part(storage_path, '/', 2) = application_id::text
              and exists (select 1 from public.applications a where a.id = application_id and a.applicant_id = (select auth.uid())
                          and a.status in ('draft', 'info_required')));
drop policy if exists application_documents_delete_own on public.application_documents;
create policy application_documents_delete_own on public.application_documents for delete to authenticated
  using (uploaded_by = (select auth.uid())
         and exists (select 1 from public.applications a where a.id = application_id and a.status in ('draft', 'info_required')));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('application-documents', 'application-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- objects live at <user id>/<application id>/<file>; the owner writes into their own folder only, reviewers read
drop policy if exists "application-documents owner insert" on storage.objects;
create policy "application-documents owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'application-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "application-documents owner or reviewer read" on storage.objects;
create policy "application-documents owner or reviewer read" on storage.objects for select to authenticated
  using (bucket_id = 'application-documents'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or (select app_private.is_admissions())));
drop policy if exists "application-documents owner delete" on storage.objects;
create policy "application-documents owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'application-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ------------------------------------------------------------------ enrolments
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete restrict,
  cadet_id uuid not null references public.cadets (id) on delete cascade,
  program_id uuid references public.programs (id),
  hub_id uuid references public.school_hubs (id),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'withdrawn')),
  enrolled_at timestamptz not null default now(),
  enrolled_by uuid references public.users (id)
);
create index if not exists enrollments_cadet_idx on public.enrollments (cadet_id);
create index if not exists enrollments_program_idx on public.enrollments (program_id);
create index if not exists enrollments_hub_idx on public.enrollments (hub_id);
create index if not exists enrollments_by_idx on public.enrollments (enrolled_by);
alter table public.enrollments enable row level security;
revoke all on public.enrollments from anon, authenticated;
grant select on public.enrollments to authenticated;
drop policy if exists enrollments_read on public.enrollments;
create policy enrollments_read on public.enrollments for select to authenticated
  using ((select app_private.is_admissions())
         or exists (select 1 from public.cadets c where c.id = cadet_id and c.parent_id = (select auth.uid())));

-- ------------------------------------------------------------------ payments: link, invoice fields, idempotent events
alter table public.payment_records add column if not exists application_id uuid references public.applications (id) on delete set null;
alter table public.payment_records add column if not exists invoice_number text;
alter table public.payment_records add column if not exists amount_paise integer check (amount_paise is null or amount_paise > 0);
alter table public.payment_records add column if not exists paid_at timestamptz;
alter table public.payment_records add column if not exists refunded_paise integer not null default 0 check (refunded_paise >= 0);
create unique index if not exists payment_records_invoice_number_key on public.payment_records (invoice_number) where invoice_number is not null;
create index if not exists payment_records_application_idx on public.payment_records (application_id);
alter table public.consent_records add column if not exists application_id uuid references public.applications (id) on delete set null;
create index if not exists consent_records_application_idx on public.consent_records (application_id);

create table if not exists public.payment_events (
  gateway_event_id text primary key check (char_length(gateway_event_id) between 4 and 120),
  gateway_order_id text not null,
  event_type text not null,
  amount_paise integer,
  outcome text not null,
  received_at timestamptz not null default now()
);
create index if not exists payment_events_order_idx on public.payment_events (gateway_order_id);
alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;
grant select on public.payment_events to authenticated;
drop policy if exists payment_events_staff_read on public.payment_events;
create policy payment_events_staff_read on public.payment_events for select to authenticated using ((select app_private.is_super_admin()));

-- ------------------------------------------------------------------ notification log (no message content, no addresses)
create table if not exists public.notification_log (
  id bigint generated always as identity primary key,
  recipient_user_id uuid references public.users (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  template text not null check (template ~ '^[a-z_]{2,48}$'),
  channel text not null default 'email' check (channel in ('email', 'sms', 'whatsapp')),
  status text not null check (status in ('sent', 'failed', 'skipped')),
  detail text check (char_length(detail) <= 120),
  created_at timestamptz not null default now()
);
create index if not exists notification_log_app_idx on public.notification_log (application_id, created_at desc);
create index if not exists notification_log_recipient_idx on public.notification_log (recipient_user_id);
alter table public.notification_log enable row level security;
revoke all on public.notification_log from anon, authenticated;
grant select on public.notification_log to authenticated;
drop policy if exists notification_log_staff_read on public.notification_log;
create policy notification_log_staff_read on public.notification_log for select to authenticated using ((select app_private.is_admissions()));

-- ------------------------------------------------------------------ workflow functions
create or replace function app_private.log_application(p_app uuid, p_from public.application_status, p_to public.application_status,
  p_note text, p_visible boolean default true) returns void
language sql security definer set search_path = '' as $$
  insert into public.application_events (application_id, from_status, to_status, actor_id, note, visible_to_applicant)
  values (p_app, p_from, p_to, auth.uid(), nullif(btrim(coalesce(p_note, '')), ''), p_visible);
  select app_private.audit('application.' || p_to::text, 'application', p_app::text,
    jsonb_build_object('from', p_from, 'to', p_to));
$$;
revoke all on function app_private.log_application(uuid, public.application_status, public.application_status, text, boolean) from public, anon, authenticated;

-- Applicant: draft or info_required -> submitted. Checks what each kind needs and records guardian consent.
create or replace function public.application_submit(p_application uuid, p_consent_version text) returns public.application_status
language plpgsql security definer set search_path = '' as $$
declare a public.applications; c public.guardian_children; p public.programs; age int; needed text[]; missing text[];
begin
  if auth.uid() is null then raise exception 'sign in first' using errcode = '42501'; end if;
  select * into a from public.applications where id = p_application for update;
  if not found or a.applicant_id <> auth.uid() then raise exception 'application not found' using errcode = 'P0002'; end if;
  if a.status not in ('draft', 'info_required') then raise exception 'this application cannot be submitted now' using errcode = '22023'; end if;
  if coalesce(btrim(p_consent_version), '') !~ '^[a-z0-9.-]{1,20}$' then raise exception 'consent is required' using errcode = '22023'; end if;
  if not exists (select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null) then
    raise exception 'confirm your e-mail address first' using errcode = '42501';
  end if;

  needed := case a.kind when 'cadet' then array['proof_of_age'] when 'staff' then array['cv'] else array[]::text[] end;
  select array_agg(n) into missing from unnest(needed) n
   where not exists (select 1 from public.application_documents d where d.application_id = a.id and d.doc_type = n);
  if missing is not null then raise exception 'documents still needed: %', array_to_string(missing, ', ') using errcode = '22023'; end if;

  if a.kind = 'cadet' then
    if a.child_id is null or a.program_id is null then raise exception 'choose the child and the programme' using errcode = '22023'; end if;
    select * into c from public.guardian_children where id = a.child_id;
    select * into p from public.programs where id = a.program_id and active;
    if not found then raise exception 'that programme is not open' using errcode = '22023'; end if;
    age := extract(year from age(current_date, c.date_of_birth))::int;
    if age < p.min_age or age > p.max_age then raise exception 'this programme takes ages % to %', p.min_age, p.max_age using errcode = '22023'; end if;
    insert into public.consent_records (parent_id, cadet_id, consent_type, consent_text_version, application_id)
    values (auth.uid(), c.cadet_id, 'ENROLMENT_APPLICATION', p_consent_version, a.id);
  end if;

  update public.applications set status = 'submitted', submitted_at = now(), consent_version = p_consent_version, consented_at = now()
   where id = a.id;
  perform app_private.log_application(a.id, a.status, 'submitted', null);
  return 'submitted';
end $$;
revoke all on function public.application_submit(uuid, text) from public, anon;
grant execute on function public.application_submit(uuid, text) to authenticated;

-- Applicant: withdraw anything not yet decided.
create or replace function public.application_withdraw(p_application uuid) returns public.application_status
language plpgsql security definer set search_path = '' as $$
declare a public.applications;
begin
  select * into a from public.applications where id = p_application for update;
  if not found or a.applicant_id is distinct from auth.uid() then raise exception 'application not found' using errcode = 'P0002'; end if;
  if a.status not in ('draft', 'submitted', 'under_review', 'info_required') then raise exception 'this application can no longer be withdrawn' using errcode = '22023'; end if;
  update public.applications set status = 'withdrawn' where id = a.id;
  perform app_private.log_application(a.id, a.status, 'withdrawn', null);
  return 'withdrawn';
end $$;
revoke all on function public.application_withdraw(uuid) from public, anon;
grant execute on function public.application_withdraw(uuid) to authenticated;

-- Reviewer (ADMISSIONS / SUPER_ADMIN): the allowed transitions only. Approving a cadet application fixes its fee.
create or replace function public.application_review(p_application uuid, p_to public.application_status, p_note text default null)
returns public.application_status
language plpgsql security definer set search_path = '' as $$
declare a public.applications; fee int;
begin
  if not app_private.is_admissions() then raise exception 'admissions staff only' using errcode = '42501'; end if;
  select * into a from public.applications where id = p_application for update;
  if not found then raise exception 'application not found' using errcode = 'P0002'; end if;
  if not ((a.status = 'submitted' and p_to in ('under_review', 'info_required', 'approved', 'rejected'))
       or (a.status = 'under_review' and p_to in ('info_required', 'approved', 'rejected'))) then
    raise exception 'cannot move an application from % to %', a.status, p_to using errcode = '22023';
  end if;
  if p_to = 'info_required' and coalesce(btrim(p_note), '') = '' then raise exception 'say what is needed' using errcode = '22023'; end if;
  if p_to = 'approved' and a.kind = 'cadet' then
    select enrolment_fee_paise into fee from public.programs where id = a.program_id;
    update public.applications set fee_paise = coalesce(fee, 0),
      payment_status = case when coalesce(fee, 0) > 0 then 'pending' else 'not_required' end where id = a.id;
  end if;
  update public.applications set status = p_to,
    info_request = case when p_to = 'info_required' then left(btrim(p_note), 2000) else info_request end,
    decided_at = case when p_to in ('approved', 'rejected') then now() else decided_at end,
    decided_by = case when p_to in ('approved', 'rejected') then auth.uid() else decided_by end
   where id = a.id;
  perform app_private.log_application(a.id, a.status, p_to, p_note, p_to in ('info_required', 'approved', 'rejected'));
  return p_to;
end $$;
revoke all on function public.application_review(uuid, public.application_status, text) from public, anon;
grant execute on function public.application_review(uuid, public.application_status, text) to authenticated;

-- Reviewer: enrol an approved cadet application whose fee is paid (or that has none). Creates the operations cadet.
create or replace function public.application_enrol(p_application uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare a public.applications; c public.guardian_children; new_cadet uuid; code text;
begin
  if not app_private.is_admissions() then raise exception 'admissions staff only' using errcode = '42501'; end if;
  select * into a from public.applications where id = p_application for update;
  if not found then raise exception 'application not found' using errcode = 'P0002'; end if;
  if a.kind <> 'cadet' or a.status <> 'approved' then raise exception 'only an approved cadet application can be enrolled' using errcode = '22023'; end if;
  if a.payment_status not in ('paid', 'not_required') then raise exception 'the enrolment fee is not paid' using errcode = '22023'; end if;
  select * into c from public.guardian_children where id = a.child_id for update;
  new_cadet := c.cadet_id;
  if new_cadet is null then
    loop
      code := 'BSAH-' || to_char(now(), 'YY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      exit when not exists (select 1 from public.cadets where passport_code = code);
    end loop;
    insert into public.cadets (parent_id, hub_id, first_name, last_name, passport_code)
    values (a.applicant_id, a.hub_id, c.first_name, c.last_name, code) returning id into new_cadet;
    update public.guardian_children set cadet_id = new_cadet where id = c.id;
  end if;
  insert into public.enrollments (application_id, cadet_id, program_id, hub_id, enrolled_by)
  values (a.id, new_cadet, a.program_id, a.hub_id, auth.uid()) on conflict (application_id) do nothing;
  update public.applications set status = 'enrolled' where id = a.id;
  perform app_private.log_application(a.id, a.status, 'enrolled', null);
  return new_cadet;
end $$;
revoke all on function public.application_enrol(uuid) from public, anon;
grant execute on function public.application_enrol(uuid) to authenticated;

-- SUPER_ADMIN only: activate an approved staff or school applicant's account with an operational role.
create or replace function public.application_activate_account(p_application uuid, p_role text, p_hub uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.applications;
begin
  if not app_private.is_super_admin() then raise exception 'super admin only' using errcode = '42501'; end if;
  select * into a from public.applications where id = p_application;
  if not found or a.status <> 'approved' then raise exception 'only an approved application' using errcode = '22023'; end if;
  if not ((a.kind = 'staff' and p_role in ('INSTRUCTOR', 'GROOM')) or (a.kind = 'school' and p_role = 'SCHOOL_ADMIN')) then
    raise exception 'role % does not fit a % application', p_role, a.kind using errcode = '22023';
  end if;
  update public.users set role = p_role, hub_id = coalesce(p_hub, hub_id) where id = a.applicant_id;
  perform app_private.audit('account.activated', 'user', a.applicant_id::text, jsonb_build_object('role', p_role, 'application', a.id));
end $$;
revoke all on function public.application_activate_account(uuid, text, uuid) from public, anon;
grant execute on function public.application_activate_account(uuid, text, uuid) to authenticated;

-- Server only (secret key, after verifying the Razorpay signature): apply one gateway event exactly once.
create or replace function public.ingest_payment_event(p_event_id text, p_order_id text, p_event_type text, p_payment_id text, p_amount_paise integer)
returns text
language plpgsql security definer set search_path = '' as $$
declare r public.payment_records; outcome text;
begin
  if exists (select 1 from public.payment_events where gateway_event_id = p_event_id) then return 'duplicate'; end if;
  select * into r from public.payment_records where gateway_order_id = p_order_id for update;
  if not found then outcome := 'unknown_order';
  elsif p_event_type in ('payment.captured', 'order.paid') then
    if r.amount_paise is distinct from p_amount_paise then outcome := 'amount_mismatch';
    elsif r.status = 'PAID' then outcome := 'already_paid';
    else
      update public.payment_records set status = 'PAID', gateway_payment_id = coalesce(p_payment_id, gateway_payment_id), paid_at = now(),
        invoice_number = coalesce(invoice_number, 'BSAH/' || to_char(now(), 'YYYY') || '/' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)))
       where id = r.id;
      update public.applications set payment_status = 'paid' where id = r.application_id;
      outcome := 'paid';
    end if;
  elsif p_event_type = 'payment.failed' then
    if r.status = 'PENDING' then update public.payment_records set status = 'FAILED' where id = r.id; outcome := 'failed'; else outcome := 'ignored'; end if;
  elsif p_event_type = 'refund.processed' then
    if r.status = 'PAID' and p_amount_paise > 0 and r.refunded_paise + p_amount_paise <= r.amount_paise then
      update public.payment_records set refunded_paise = refunded_paise + p_amount_paise,
        status = case when refunded_paise + p_amount_paise = amount_paise then 'REFUNDED' else status end where id = r.id;
      if r.refunded_paise + p_amount_paise = r.amount_paise then update public.applications set payment_status = 'refunded' where id = r.application_id; end if;
      outcome := 'refunded';
    else outcome := 'ignored'; end if;
  else outcome := 'ignored';
  end if;
  insert into public.payment_events (gateway_event_id, gateway_order_id, event_type, amount_paise, outcome)
  values (p_event_id, p_order_id, p_event_type, p_amount_paise, outcome);
  perform app_private.audit('payment.' || outcome, 'payment_record', coalesce(r.id::text, p_order_id), jsonb_build_object('event', p_event_type));
  return outcome;
end $$;
revoke all on function public.ingest_payment_event(text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.ingest_payment_event(text, text, text, text, integer) to service_role;

-- Staff-visible audit on the new tables (columns changed, never values)
drop trigger if exists programs_audit on public.programs;
create trigger programs_audit after insert or update or delete on public.programs for each row execute function app_private.audit_row_change();
drop trigger if exists enrollments_audit on public.enrollments;
create trigger enrollments_audit after insert or update or delete on public.enrollments for each row execute function app_private.audit_row_change();

-- A starting programme so the enrolment form works on day one. Its enrolment fee is 0 until the owner sets the real one.
insert into public.programs (code, name, description, min_age, max_age, enrolment_fee_paise)
values ('foundation', 'Foundation programme', 'Ground skills, horse care and the first riding phase.', 6, 18, 0)
on conflict (code) do nothing;
