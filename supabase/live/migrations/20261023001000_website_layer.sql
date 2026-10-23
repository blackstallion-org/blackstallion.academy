-- BSAH website layer for the LIVE operations project (tgwadczrfbljnepoaqtb). 23 Oct 2026.
--
-- STRICTLY ADDITIVE. It never alters, drops or rewrites an existing table, policy, function or trigger of the
-- operations schema (see supabase/live/baseline/20261023_live_snapshot.sql). Re-runnable.
--
-- What the public website needs, built on the operations schema instead of the separate website-only tree in
-- supabase/migrations/ (which conflicts with this project on cadets, school_hubs and training_sessions):
--   * staff = public.users.role 'SUPER_ADMIN' (via the existing public.current_role_name()),
--   * onboarding_leads with consent, privacy-conscious attribution and idempotency, written only through
--     public.submit_lead_v2 (security definer; no direct anon insert),
--   * best-effort mirrors into the operations tables built for these forms: mou_requests (MOU gate),
--     executive_appointments (board-audit gate) and qr_lead_captures (enquiries carrying a hub or QR code),
--   * a shared rate limiter (public.consume_rate_limit),
--   * public passport verification over public.cadets.passport_code with minimal disclosure,
--   * generated_documents / media_assets records, three website buckets with storage policies, an append-only
--     audit trail.

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

-- ------------------------------------------------------------------ types
do $$ begin create type public.lead_type as enum ('cadet', 'school', 'board_audit');
exception when duplicate_object then null; end $$;
do $$ begin create type public.lead_status as enum ('new', 'reviewing', 'contacted', 'qualified', 'closed', 'rejected');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------ staff check
create or replace function app_private.is_website_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_role_name() = 'SUPER_ADMIN', false)
$$;
revoke all on function app_private.is_website_staff() from public, anon, authenticated;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_website_staff() to authenticated;

-- ------------------------------------------------------------------ audit trail (append-only)
create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_created_idx on public.audit_events (created_at desc);
alter table public.audit_events enable row level security;
revoke all on public.audit_events from anon, authenticated;
grant select on public.audit_events to authenticated;
drop policy if exists audit_events_staff_read on public.audit_events;
create policy audit_events_staff_read on public.audit_events for select to authenticated
  using ((select app_private.is_website_staff()));

create or replace function app_private.audit(p_action text, p_entity_type text, p_entity_id text, p_meta jsonb default '{}')
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_meta, '{}'::jsonb))
$$;
revoke all on function app_private.audit(text, text, text, jsonb) from public, anon, authenticated;

create or replace function app_private.reject_mutation() returns trigger language plpgsql as $$
begin raise exception 'audit_events is append-only' using errcode = '42501'; end $$;
drop trigger if exists audit_events_no_update on public.audit_events;
create trigger audit_events_no_update before update or delete on public.audit_events
  for each row execute function app_private.reject_mutation();

-- Records WHO changed WHICH row and WHICH columns; values are never copied (no child or contact data in the log).
create or replace function app_private.audit_row_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r jsonb := to_jsonb(case when tg_op = 'DELETE' then old else new end); cols text[];
begin
  if tg_op = 'UPDATE' then
    select array_agg(k order by k) into cols from jsonb_each(to_jsonb(new)) n(k, v) where to_jsonb(old)->k is distinct from v;
    if cols is null then return new; end if;
  end if;
  perform app_private.audit('row.' || lower(tg_op), tg_table_name, r->>'id',
    case when cols is null then '{}'::jsonb else jsonb_build_object('changed_columns', cols) end);
  return case when tg_op = 'DELETE' then old else new end;
end $$;
revoke all on function app_private.audit_row_change() from public, anon, authenticated;

create or replace function app_private.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ------------------------------------------------------------------ website enquiries
create table if not exists public.onboarding_leads (
  id uuid primary key default gen_random_uuid(),
  lead_type public.lead_type not null,
  gate text not null check (gate ~ '^[a-z_]{2,24}$'),
  status public.lead_status not null default 'new',
  contact_name text not null check (length(btrim(contact_name)) between 2 and 120),
  email text,
  phone text,
  payload jsonb not null default '{}'::jsonb,
  attribution jsonb not null default '{}'::jsonb check (pg_column_size(attribution) <= 2048),
  privacy_notice_version text not null,
  consent_at timestamptz not null,
  idempotency_key text not null unique check (idempotency_key ~ '^[A-Za-z0-9_-]{16,64}$'),
  assigned_to uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_leads_contact check (email is not null or phone is not null)
);
create index if not exists onboarding_leads_status_idx on public.onboarding_leads (status, created_at desc);
create index if not exists onboarding_leads_gate_idx on public.onboarding_leads (gate, created_at desc);
create index if not exists onboarding_leads_assigned_idx on public.onboarding_leads (assigned_to);

alter table public.onboarding_leads enable row level security;
revoke all on public.onboarding_leads from anon, authenticated;
grant select on public.onboarding_leads to authenticated;
grant update (status, assigned_to) on public.onboarding_leads to authenticated;
drop policy if exists onboarding_leads_staff_read on public.onboarding_leads;
create policy onboarding_leads_staff_read on public.onboarding_leads for select to authenticated
  using ((select app_private.is_website_staff()));
drop policy if exists onboarding_leads_staff_update on public.onboarding_leads;
create policy onboarding_leads_staff_update on public.onboarding_leads for update to authenticated
  using ((select app_private.is_website_staff())) with check ((select app_private.is_website_staff()));

drop trigger if exists onboarding_leads_updated on public.onboarding_leads;
create trigger onboarding_leads_updated before update on public.onboarding_leads
  for each row execute function app_private.set_updated_at();
drop trigger if exists audit_onboarding_leads on public.onboarding_leads;
create trigger audit_onboarding_leads after update or delete on public.onboarding_leads
  for each row execute function app_private.audit_row_change();

-- ------------------------------------------------------------------ rate limiting (fixed window, salted buckets)
create table if not exists app_private.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);
revoke all on app_private.rate_limits from public, anon, authenticated;

create or replace function public.consume_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare w timestamptz; n integer;
begin
  if p_bucket is null or p_bucket !~ '^[a-z]{2,16}:[a-f0-9]{32,64}$' then raise exception 'invalid bucket'; end if;
  if p_limit not between 1 and 1000 or p_window_seconds not between 10 and 86400 then raise exception 'invalid limit'; end if;
  w := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into app_private.rate_limits as r (bucket, window_start, hits) values (p_bucket, w, 1)
  on conflict (bucket, window_start) do update set hits = r.hits + 1
  returning hits into n;
  if random() < 0.02 then delete from app_private.rate_limits where window_start < now() - interval '2 days'; end if;
  return n <= p_limit;
end $$;
revoke all on function public.consume_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, integer, integer) to anon, authenticated;

-- ------------------------------------------------------------------ mirrors into the operations tables
-- Each mirror is best effort: it runs in its own sub-transaction, so a mismatch (for example a missing phone number,
-- which those tables require) never loses the website lead itself.
create or replace function app_private.mirror_lead(p_gate text, p_type public.lead_type, p_name text, p_email text,
  p_phone text, p_payload jsonb, p_attr jsonb, p_ref text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_hub text := coalesce(nullif(left(p_attr->>'qr', 100), ''), nullif(left(p_attr->>'hub', 100), ''));
begin
  if p_gate = 'mou' then
    if p_email is null or p_phone is null then return 'skipped'; end if;
    insert into public.mou_requests (school_name, representative_name, designation, email, phone_number, campus_tier, notes)
    values (left(coalesce(nullif(p_payload->>'organisation', ''), 'Not given'), 255), left(p_name, 255),
            nullif(left(coalesce(p_payload->>'mou_designation', p_payload->>'designation', ''), 100), ''),
            left(p_email, 255), left(p_phone, 20), nullif(left(coalesce(p_payload->>'mou_tier', ''), 50), ''),
            'Website MOU enquiry. Reference ' || p_ref);
    return 'mou_requests';
  elsif p_gate = 'audit' then
    if p_email is null or p_phone is null or (p_payload->>'date') is null or (p_payload->>'slot') is null then return 'skipped'; end if;
    insert into public.executive_appointments (school_name, representative_name, designation, phone_number, email,
      preferred_date, preferred_time_slot)
    values (left(coalesce(nullif(p_payload->>'organisation', ''), 'Not given'), 255), left(p_name, 255),
            left(coalesce(nullif(p_payload->>'designation', ''), 'Not given'), 100), left(p_phone, 20), left(p_email, 255),
            (p_payload->>'date')::date, left(p_payload->>'slot', 50));
    return 'executive_appointments';
  elsif p_type = 'cadet' and v_hub is not null then
    insert into public.qr_lead_captures (hub_slug, parent_name, parent_phone, student_grade, source)
    values (v_hub, left(p_name, 255), left(p_phone, 20), nullif(left(coalesce(p_payload->>'student', ''), 50), ''),
            case when p_attr ? 'qr' then 'website-qr' else 'website' end);
    return 'qr_lead_captures';
  end if;
  return 'none';
exception when others then
  return 'failed';
end $$;
revoke all on function app_private.mirror_lead(text, public.lead_type, text, text, text, jsonb, jsonb, text) from public, anon, authenticated;

-- ------------------------------------------------------------------ lead intake
-- Returns {"status":"stored","mirror":…} or {"status":"duplicate"}. Raises on invalid input (the server validates first).
create or replace function public.submit_lead_v2(
  p_type public.lead_type, p_gate text, p_name text, p_email text, p_phone text, p_payload jsonb,
  p_privacy_version text, p_consent boolean, p_attribution jsonb, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare new_id uuid; clean_attr jsonb; v_email text := nullif(btrim(p_email), ''); v_phone text := nullif(btrim(p_phone), ''); m text;
begin
  if p_consent is distinct from true then raise exception 'consent required'; end if;
  if p_gate is null or p_gate !~ '^[a-z_]{2,24}$' then raise exception 'invalid gate'; end if;
  if p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9_-]{16,64}$' then raise exception 'invalid idempotency key'; end if;
  if p_name is null or length(btrim(p_name)) not between 2 and 120 then raise exception 'invalid name'; end if;
  if v_email is null and v_phone is null then raise exception 'email or phone required'; end if;
  if v_email is not null and (length(v_email) > 160 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then raise exception 'invalid email'; end if;
  if v_phone is not null and length(v_phone) > 24 then raise exception 'invalid phone'; end if;
  if p_privacy_version is null or btrim(p_privacy_version) = '' then raise exception 'privacy notice version required'; end if;
  if length(coalesce(p_payload, '{}'::jsonb)::text) > 4000 then raise exception 'payload too large'; end if;

  select coalesce(jsonb_object_agg(key, left(value #>> '{}', 200)), '{}'::jsonb) into clean_attr
    from jsonb_each(coalesce(p_attribution, '{}'::jsonb))
   where key in ('path', 'hub', 'campaign', 'qr', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content')
     and jsonb_typeof(value) = 'string';

  insert into public.onboarding_leads
    (lead_type, gate, contact_name, email, phone, payload, privacy_notice_version, consent_at, attribution, idempotency_key)
  values (p_type, p_gate, btrim(p_name), v_email, v_phone, coalesce(p_payload, '{}'::jsonb), btrim(p_privacy_version),
          now(), clean_attr, p_idempotency_key)
  on conflict (idempotency_key) do nothing
  returning id into new_id;

  if new_id is null then return jsonb_build_object('status', 'duplicate'); end if;
  m := app_private.mirror_lead(p_gate, p_type, btrim(p_name), v_email, v_phone, coalesce(p_payload, '{}'::jsonb), clean_attr, new_id::text);
  perform app_private.audit('lead.submitted', 'onboarding_lead', new_id::text,
    jsonb_build_object('type', p_type, 'gate', p_gate, 'mirror', m));
  return jsonb_build_object('status', 'stored', 'mirror', m);
end $$;
revoke all on function public.submit_lead_v2(public.lead_type, text, text, text, text, jsonb, text, boolean, jsonb, text) from public;
grant execute on function public.submit_lead_v2(public.lead_type, text, text, text, text, jsonb, text, boolean, jsonb, text) to anon, authenticated;

-- ------------------------------------------------------------------ public passport verification
-- Minimal disclosure: status, rank and issue date only (no name, hub or horse). Honours site_settings.verify_public.
create or replace function public.verify_passport(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_rank text; v_created timestamptz; v_enabled text;
begin
  if p_code is null or p_code !~ '^[A-Za-z0-9-]{8,64}$' then return jsonb_build_object('status', 'unknown'); end if;
  select value into v_enabled from public.site_settings where key = 'verify_public';
  if v_enabled is not null and lower(btrim(v_enabled)) in ('false', '0', 'off', 'no') then
    return jsonb_build_object('status', 'unavailable');
  end if;
  select c.current_rank, c.created_at into v_rank, v_created from public.cadets c where upper(c.passport_code) = upper(p_code) limit 1;
  if not found then return jsonb_build_object('status', 'unknown'); end if;
  return jsonb_build_object('status', 'valid',
    'rank', lower(regexp_replace(coalesce(v_rank, 'CADET_SQUIRE'), '^CADET_', '')),
    'credential_type', 'passport',
    'issued_at', to_char(v_created at time zone 'UTC', 'YYYY-MM-DD'));
end $$;
revoke all on function public.verify_passport(text) from public;
grant execute on function public.verify_passport(text) to anon, authenticated;

-- ------------------------------------------------------------------ documents and media records
create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('mou_draft', 'campus_proposal', 'roi_export')),
  title text not null check (length(title) between 2 and 200),
  storage_path text not null unique check (storage_path ~ '^[a-z0-9_/.-]+$' and length(storage_path) between 8 and 300 and storage_path !~ '\.\.'),
  lead_reference text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists generated_documents_created_idx on public.generated_documents (created_at desc);
create index if not exists generated_documents_created_by_idx on public.generated_documents (created_by);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique check (storage_path ~ '^[a-z0-9_/.-]+$' and length(storage_path) between 8 and 300 and storage_path !~ '\.\.'),
  alt_text text not null check (length(btrim(alt_text)) between 3 and 300),
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  bytes integer not null check (bytes between 1 and 8388608),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists media_assets_uploaded_by_idx on public.media_assets (uploaded_by);

alter table public.generated_documents enable row level security;
alter table public.media_assets enable row level security;
revoke all on public.generated_documents, public.media_assets from anon, authenticated;
grant select, insert on public.generated_documents to authenticated;
grant select on public.media_assets to anon, authenticated;
grant insert, delete on public.media_assets to authenticated;

drop policy if exists generated_documents_staff_read on public.generated_documents;
create policy generated_documents_staff_read on public.generated_documents for select to authenticated
  using ((select app_private.is_website_staff()));
drop policy if exists generated_documents_staff_insert on public.generated_documents;
create policy generated_documents_staff_insert on public.generated_documents for insert to authenticated
  with check ((select app_private.is_website_staff()) and created_by = (select auth.uid()));
drop policy if exists media_assets_public_read on public.media_assets;
create policy media_assets_public_read on public.media_assets for select to anon, authenticated using (true);
drop policy if exists media_assets_staff_insert on public.media_assets;
create policy media_assets_staff_insert on public.media_assets for insert to authenticated
  with check ((select app_private.is_website_staff()) and uploaded_by = (select auth.uid()));
drop policy if exists media_assets_staff_delete on public.media_assets;
create policy media_assets_staff_delete on public.media_assets for delete to authenticated
  using ((select app_private.is_website_staff()));

drop trigger if exists audit_generated_documents on public.generated_documents;
create trigger audit_generated_documents after insert or update or delete on public.generated_documents
  for each row execute function app_private.audit_row_change();
drop trigger if exists audit_media_assets on public.media_assets;
create trigger audit_media_assets after insert or update or delete on public.media_assets
  for each row execute function app_private.audit_row_change();

-- ------------------------------------------------------------------ storage (new website buckets only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('website-assets', 'website-assets', true, 8388608, array['image/png', 'image/jpeg', 'image/webp']),
  ('user-uploads', 'user-uploads', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('private-documents', 'private-documents', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "website-assets staff insert" on storage.objects;
create policy "website-assets staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'website-assets' and (select app_private.is_website_staff()));
drop policy if exists "website-assets staff update" on storage.objects;
create policy "website-assets staff update" on storage.objects for update to authenticated
  using (bucket_id = 'website-assets' and (select app_private.is_website_staff()));
drop policy if exists "website-assets staff delete" on storage.objects;
create policy "website-assets staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'website-assets' and (select app_private.is_website_staff()));

drop policy if exists "user-uploads owner insert" on storage.objects;
create policy "user-uploads owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "user-uploads owner or staff read" on storage.objects;
create policy "user-uploads owner or staff read" on storage.objects for select to authenticated
  using (bucket_id = 'user-uploads' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select app_private.is_website_staff())));
drop policy if exists "user-uploads owner delete" on storage.objects;
create policy "user-uploads owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "private-documents staff read" on storage.objects;
create policy "private-documents staff read" on storage.objects for select to authenticated
  using (bucket_id = 'private-documents' and (select app_private.is_website_staff()));
drop policy if exists "private-documents staff insert" on storage.objects;
create policy "private-documents staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'private-documents' and (select app_private.is_website_staff()));
drop policy if exists "private-documents staff delete" on storage.objects;
create policy "private-documents staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'private-documents' and (select app_private.is_website_staff()));
