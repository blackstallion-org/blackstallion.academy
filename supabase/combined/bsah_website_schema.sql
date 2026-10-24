-- BSAH website schema: ALL root migrations in order, as one script for the Supabase SQL editor of a NEW, EMPTY project.
-- Generated 2026-10-23T11:40Z from supabase/migrations/*. Run ONCE. Do not run on a project that already has these tables
-- (the first migrations are not re-runnable). Preferred path: apply the migration files individually via the Supabase CLI/connector.
-- Verified on a throwaway Postgres 16 with supabase/tests (176 checks).


-- ===================================================================== 20261011000100_core_schema.sql
-- BSAH core schema. Source: Comprehensive Architecture Blueprint §8 (a recommended baseline).
-- Applied to Supabase project bsah-academy (hiqowfwptvsndrzayifm) on 12 Oct 2026.
-- Additions beyond the blueprint are marked [ADDED]: instructor_assignments and hub_members, which
-- the blueprint's RLS rules require ("instructors scoped to assigned cadets", "school users see only their hub").

create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum
  ('cadet', 'parent_guardian', 'instructor', 'school_partner', 'operations', 'executive_admin');
create type public.cadet_rank as enum ('squire', 'rider', 'knight', 'sovereign_lancer');
create type public.hub_status as enum ('prospect', 'pipeline', 'contracted', 'active', 'paused', 'closed');
create type public.lead_type as enum ('cadet', 'school', 'board_audit');
create type public.lead_status as enum ('new', 'reviewing', 'contacted', 'qualified', 'closed', 'rejected');
create type public.credential_status as enum ('issued', 'revoked', 'expired');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role public.app_role not null default 'cadet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.regional_zones (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  active boolean not null default true
);

create table public.school_hubs (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.regional_zones (id),
  code text not null unique,
  display_name text not null,
  location_label text,
  status public.hub_status not null default 'prospect',
  acreage numeric(5, 2),
  student_capacity_band text,
  zero_capex_invested numeric(14, 2),
  revenue_share_pct numeric(5, 2) check (revenue_share_pct is null or revenue_share_pct between 0 and 100),
  contract_reference text,
  status_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- commercial statuses need contract evidence (Prompt 5.1 rule 7)
  constraint hub_commercial_needs_evidence check (
    status in ('prospect', 'pipeline', 'closed') or (contract_reference is not null and status_verified_at is not null)
  )
);

create table public.cadets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id),
  public_display_name text,
  date_of_birth date,
  home_zone_id uuid references public.regional_zones (id),
  current_rank public.cadet_rank not null default 'squire',
  enrollment_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.cadet_guardians (
  cadet_id uuid not null references public.cadets (id) on delete cascade,
  guardian_profile_id uuid not null references public.profiles (id) on delete cascade,
  relationship_label text,
  can_view_records boolean not null default true,
  primary key (cadet_id, guardian_profile_id)
);

-- [ADDED] which instructor may see/assess which cadet
create table public.instructor_assignments (
  instructor_profile_id uuid not null references public.profiles (id) on delete cascade,
  cadet_id uuid not null references public.cadets (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (instructor_profile_id, cadet_id)
);

-- [ADDED] which school-partner user belongs to which hub
create table public.hub_members (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  hub_id uuid not null references public.school_hubs (id) on delete cascade,
  primary key (profile_id, hub_id)
);

create table public.curriculum_pillars (
  id smallint primary key check (id between 1 and 13),
  title text not null,
  skill_developed text not null,
  trait_application text not null,
  phase text not null check (phase in ('foundation', 'crucible', 'command')),
  active boolean not null default true,
  content_version integer not null default 1
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  cadet_id uuid not null references public.cadets (id),
  instructor_profile_id uuid not null references public.profiles (id),
  hub_id uuid references public.school_hubs (id),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer check (duration_minutes between 0 and 240),
  attendance_status text not null default 'scheduled',
  ground_check_complete boolean not null default false,
  tack_check_complete boolean not null default false,
  horse_care_complete boolean not null default false,
  instructor_notes text,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create table public.session_pillar_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions (id) on delete cascade,
  pillar_id smallint not null references public.curriculum_pillars (id),
  assessment text not null check (assessment in ('not_observed', 'developing', 'demonstrated', 'mastered')),
  evidence_note text,
  assessed_by uuid not null references public.profiles (id),
  assessed_at timestamptz not null default now(),
  unique (session_id, pillar_id)
);

create table public.cadet_rank_history (
  id uuid primary key default gen_random_uuid(),
  cadet_id uuid not null references public.cadets (id),
  from_rank public.cadet_rank,
  to_rank public.cadet_rank not null,
  decision text not null check (decision in ('approved', 'rejected', 'reversed')),
  assessor_profile_id uuid not null references public.profiles (id),
  criteria_version text not null,
  evidence_summary text,
  decided_at timestamptz not null default now()
);

create table public.passport_credentials (
  id uuid primary key default gen_random_uuid(),
  cadet_id uuid not null references public.cadets (id),
  public_code_hash text not null unique,
  credential_type text not null,
  rank_at_issue public.cadet_rank not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  status public.credential_status not null default 'issued',
  revoked_at timestamptz,
  issued_by uuid not null references public.profiles (id)
);

create table public.onboarding_leads (
  id uuid primary key default gen_random_uuid(),
  lead_type public.lead_type not null,
  status public.lead_status not null default 'new',
  contact_name text not null,
  email text,
  phone text,
  payload jsonb not null default '{}'::jsonb,
  privacy_notice_version text not null,
  assigned_to uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.approved_claims (
  id uuid primary key default gen_random_uuid(),
  claim_key text not null unique,
  public_copy text not null,
  evidence_reference text,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  review_due_at timestamptz,
  active boolean not null default false,
  -- a claim cannot be live without evidence, an approver and an approval date
  constraint claim_active_needs_evidence check (
    not active or (evidence_reference is not null and approved_by is not null and approved_at is not null)
  )
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_profile_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index training_sessions_cadet_time_idx on public.training_sessions (cadet_id, started_at desc);
create index training_sessions_hub_time_idx on public.training_sessions (hub_id, started_at desc);
create index session_pillar_logs_pillar_idx on public.session_pillar_logs (pillar_id);
create index onboarding_leads_status_idx on public.onboarding_leads (status, created_at desc);
create index school_hubs_zone_status_idx on public.school_hubs (zone_id, status);
create index cadet_guardians_guardian_idx on public.cadet_guardians (guardian_profile_id);
create index instructor_assignments_cadet_idx on public.instructor_assignments (cadet_id);
create index cadet_rank_history_cadet_idx on public.cadet_rank_history (cadet_id, decided_at desc);
create index passport_credentials_cadet_idx on public.passport_credentials (cadet_id);

-- ------------------------------------------------------------------ updated_at
create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger school_hubs_updated before update on public.school_hubs for each row execute function public.set_updated_at();
create trigger onboarding_leads_updated before update on public.onboarding_leads for each row execute function public.set_updated_at();

-- ===================================================================== 20261011000200_security_and_functions.sql
-- BSAH authorisation, business rules and RLS. Source: Architecture Blueprint §9 and Prompts 2.3, 3.1, 4.2, 4.3.
-- Applied to Supabase project bsah-academy (hiqowfwptvsndrzayifm) on 12 Oct 2026. Default deny: every table has RLS on and grants are listed explicitly.
-- Open decisions (see docs/reference/backend-open-decisions.md): who may issue credentials and approve ranks,
-- rank criteria, instructor "propose" workflow, school-partner aggregates, lead routing.

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

-- ------------------------------------------------------------------ helpers (never trust the browser)
create function app_private.my_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create function app_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(app_private.my_role() in ('operations', 'executive_admin'), false)
$$;

create function app_private.is_exec() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(app_private.my_role() = 'executive_admin', false)
$$;

create function app_private.is_assigned_instructor(p_cadet uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.instructor_assignments ia
    where ia.cadet_id = p_cadet and ia.instructor_profile_id = auth.uid()
  ) and app_private.my_role() = 'instructor'
$$;

create function app_private.is_cadet_or_guardian(p_cadet uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.cadets c where c.id = p_cadet and c.profile_id = auth.uid())
      or exists (
        select 1 from public.cadet_guardians g
        where g.cadet_id = p_cadet and g.guardian_profile_id = auth.uid() and g.can_view_records
      )
$$;

create function app_private.can_see_cadet(p_cadet uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_cadet_or_guardian(p_cadet) or app_private.is_assigned_instructor(p_cadet)
$$;

create function app_private.session_cadet(p_session uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select cadet_id from public.training_sessions where id = p_session
$$;

create function app_private.can_assess_session(p_session uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or exists (
    select 1 from public.training_sessions s
    where s.id = p_session and s.instructor_profile_id = auth.uid() and app_private.is_assigned_instructor(s.cadet_id)
  )
$$;

create function app_private.is_hub_member(p_hub uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.hub_members m where m.hub_id = p_hub and m.profile_id = auth.uid())
$$;

create function app_private.audit(p_action text, p_entity_type text, p_entity_id text, p_meta jsonb default '{}')
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_events (actor_profile_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_meta, '{}'::jsonb))
$$;

-- ------------------------------------------------------------------ role changes
create function public.guard_profile_role() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role then
    -- trusted server contexts (no end-user JWT) may change roles; end users only if executive_admin
    if auth.uid() is not null and not app_private.is_exec() then
      raise exception 'role changes require executive_admin' using errcode = '42501';
    end if;
    perform app_private.audit('profile.role_changed', 'profile', new.id::text,
      jsonb_build_object('from', old.role, 'to', new.role));
  end if;
  return new;
end $$;
create trigger profiles_guard_role before update on public.profiles for each row execute function public.guard_profile_role();

-- ------------------------------------------------------------------ hub status audit
create function public.audit_hub_status() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    perform app_private.audit('hub.status_changed', 'school_hub', new.id::text,
      jsonb_build_object('from', old.status, 'to', new.status, 'contract_reference', new.contract_reference));
  end if;
  return new;
end $$;
create trigger school_hubs_audit after update on public.school_hubs for each row execute function public.audit_hub_status();

-- ------------------------------------------------------------------ rank decisions (append-only, validated)
create function public.next_rank(r public.cadet_rank) returns public.cadet_rank language sql immutable as $$
  select case r when 'squire' then 'rider'::public.cadet_rank
                when 'rider' then 'knight'::public.cadet_rank
                when 'knight' then 'sovereign_lancer'::public.cadet_rank end
$$;

create function public.validate_rank_decision() returns trigger language plpgsql security definer set search_path = '' as $$
declare cur public.cadet_rank; last_row public.cadet_rank_history;
begin
  select current_rank into cur from public.cadets where id = new.cadet_id for update;
  if cur is null then raise exception 'unknown cadet'; end if;
  if auth.uid() is not null then
    if new.assessor_profile_id is distinct from auth.uid() then
      raise exception 'assessor must be the signed-in user' using errcode = '42501';
    end if;
  end if;
  if new.evidence_summary is null or length(btrim(new.evidence_summary)) < 10 then
    raise exception 'a dated evidence summary (10+ characters) is required';
  end if;
  new.from_rank := cur;
  if new.decision = 'approved' then
    if new.to_rank is distinct from public.next_rank(cur) then
      raise exception 'invalid transition: % -> % (only the next rank may be approved)', cur, new.to_rank;
    end if;
  elsif new.decision = 'reversed' then
    select * into last_row from public.cadet_rank_history where cadet_id = new.cadet_id order by decided_at desc, id desc limit 1;
    if last_row.id is null or last_row.decision <> 'approved' then
      raise exception 'only the most recent approved decision can be reversed';
    end if;
    new.to_rank := last_row.from_rank;
  else -- rejected: rank unchanged
    new.to_rank := cur;
  end if;
  new.decided_at := now();
  return new;
end $$;
create trigger rank_history_validate before insert on public.cadet_rank_history for each row execute function public.validate_rank_decision();

create function public.apply_rank_decision() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.decision in ('approved', 'reversed') then
    update public.cadets set current_rank = new.to_rank where id = new.cadet_id;
  end if;
  perform app_private.audit('rank.' || new.decision, 'cadet', new.cadet_id::text,
    jsonb_build_object('from', new.from_rank, 'to', new.to_rank, 'criteria_version', new.criteria_version));
  return new;
end $$;
create trigger rank_history_apply after insert on public.cadet_rank_history for each row execute function public.apply_rank_decision();

create function public.reject_mutation() returns trigger language plpgsql as $$
begin raise exception '% is append-only', tg_table_name; end $$;
create trigger rank_history_no_update before update or delete on public.cadet_rank_history for each row execute function public.reject_mutation();
create trigger audit_no_update before update or delete on public.audit_events for each row execute function public.reject_mutation();

-- ------------------------------------------------------------------ Passport credentials
-- The raw code is returned ONCE, at issue. Only its SHA-256 hash is stored.
create function public.issue_passport_credential(p_cadet uuid, p_type text, p_expires timestamptz default null)
returns text language plpgsql security definer set search_path = '' as $$
declare raw text; cur public.cadet_rank;
begin
  if not app_private.is_admin() then raise exception 'not authorised to issue credentials' using errcode = '42501'; end if;
  select current_rank into cur from public.cadets where id = p_cadet;
  if cur is null then raise exception 'unknown cadet'; end if;
  if p_expires is not null and p_expires <= now() then raise exception 'expiry must be in the future'; end if;
  raw := 'BP-' || upper(encode(extensions.gen_random_bytes(18), 'hex'));
  insert into public.passport_credentials (cadet_id, public_code_hash, credential_type, rank_at_issue, expires_at, issued_by)
  values (p_cadet, encode(extensions.digest(raw, 'sha256'), 'hex'), p_type, cur, p_expires, auth.uid());
  perform app_private.audit('credential.issued', 'cadet', p_cadet::text, jsonb_build_object('type', p_type));
  return raw;
end $$;

create function public.revoke_passport_credential(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not app_private.is_admin() then raise exception 'not authorised to revoke credentials' using errcode = '42501'; end if;
  update public.passport_credentials set status = 'revoked', revoked_at = now() where id = p_id and status = 'issued';
  if not found then raise exception 'no issued credential with that id'; end if;
  perform app_private.audit('credential.revoked', 'passport_credential', p_id::text);
end $$;

-- Public verification: minimal output, no names, no ids, no private notes.
create function public.verify_passport(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c public.passport_credentials;
begin
  if p_code is null or length(p_code) not between 8 and 128 then
    return jsonb_build_object('status', 'unknown');
  end if;
  select * into c from public.passport_credentials
   where public_code_hash = encode(extensions.digest(btrim(p_code), 'sha256'), 'hex');
  if c.id is null then return jsonb_build_object('status', 'unknown'); end if;
  if c.status = 'revoked' then return jsonb_build_object('status', 'revoked'); end if;
  if c.status = 'expired' or (c.expires_at is not null and c.expires_at <= now()) then
    return jsonb_build_object('status', 'expired');
  end if;
  return jsonb_build_object('status', 'valid', 'rank', c.rank_at_issue, 'credential_type', c.credential_type,
                            'issued_at', c.issued_at);
end $$;

-- ------------------------------------------------------------------ lead intake (server-validated)
-- A stored lead means an enquiry was received. It is not an enrolment, contract or appointment.
-- Rate limiting and spam protection belong in the calling server action / edge layer.
create function public.submit_lead(p_type public.lead_type, p_name text, p_email text, p_phone text,
                                   p_payload jsonb, p_privacy_version text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if p_name is null or length(btrim(p_name)) not between 2 and 120 then raise exception 'invalid name'; end if;
  if (p_email is null or btrim(p_email) = '') and (p_phone is null or btrim(p_phone) = '') then
    raise exception 'email or phone required';
  end if;
  if p_email is not null and btrim(p_email) <> '' and
     (length(p_email) > 160 or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then raise exception 'invalid email'; end if;
  if p_phone is not null and length(p_phone) > 24 then raise exception 'invalid phone'; end if;
  if p_privacy_version is null or btrim(p_privacy_version) = '' then raise exception 'privacy notice version required'; end if;
  if length(coalesce(p_payload, '{}'::jsonb)::text) > 4000 then raise exception 'payload too large'; end if;
  insert into public.onboarding_leads (lead_type, contact_name, email, phone, payload, privacy_notice_version)
  values (p_type, btrim(p_name), nullif(btrim(p_email), ''), nullif(btrim(p_phone), ''),
          coalesce(p_payload, '{}'::jsonb), btrim(p_privacy_version))
  returning id into new_id;
  perform app_private.audit('lead.submitted', 'onboarding_lead', new_id::text, jsonb_build_object('type', p_type));
  return true;
end $$;

-- ------------------------------------------------------------------ public labels only (no finance, no contracts)
create view public.public_hub_labels with (security_invoker = false) as
  select h.code, h.display_name, h.location_label, h.status, z.code as zone_code
  from public.school_hubs h join public.regional_zones z on z.id = h.zone_id;

-- ------------------------------------------------------------------ RLS: on everywhere, then policies
alter table public.profiles enable row level security;
alter table public.regional_zones enable row level security;
alter table public.school_hubs enable row level security;
alter table public.cadets enable row level security;
alter table public.cadet_guardians enable row level security;
alter table public.instructor_assignments enable row level security;
alter table public.hub_members enable row level security;
alter table public.curriculum_pillars enable row level security;
alter table public.training_sessions enable row level security;
alter table public.session_pillar_logs enable row level security;
alter table public.cadet_rank_history enable row level security;
alter table public.passport_credentials enable row level security;
alter table public.onboarding_leads enable row level security;
alter table public.approved_claims enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or app_private.is_admin());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid() or app_private.is_exec()) with check (id = auth.uid() or app_private.is_exec());
create policy profiles_exec_insert on public.profiles for insert to authenticated with check (app_private.is_exec());
create policy profiles_exec_delete on public.profiles for delete to authenticated using (app_private.is_exec());

create policy zones_read on public.regional_zones for select to anon, authenticated
  using (active or app_private.is_admin());
create policy zones_admin_write on public.regional_zones for all to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());

create policy hubs_read on public.school_hubs for select to authenticated
  using (app_private.is_admin() or app_private.is_hub_member(id));
create policy hubs_admin_write on public.school_hubs for all to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());

create policy cadets_read on public.cadets for select to authenticated using (app_private.can_see_cadet(id));
create policy cadets_admin_write on public.cadets for all to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());

create policy guardians_read on public.cadet_guardians for select to authenticated
  using (guardian_profile_id = auth.uid() or app_private.is_admin());
create policy guardians_admin_write on public.cadet_guardians for all to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());

create policy assignments_read on public.instructor_assignments for select to authenticated
  using (instructor_profile_id = auth.uid() or app_private.is_admin());
create policy assignments_admin_write on public.instructor_assignments for all to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());

create policy hub_members_read on public.hub_members for select to authenticated
  using (profile_id = auth.uid() or app_private.is_admin());
create policy hub_members_admin_write on public.hub_members for all to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());

create policy pillars_read on public.curriculum_pillars for select to anon, authenticated
  using (active or app_private.is_exec());
create policy pillars_exec_write on public.curriculum_pillars for all to authenticated
  using (app_private.is_exec()) with check (app_private.is_exec());

create policy sessions_read on public.training_sessions for select to authenticated
  using (app_private.can_see_cadet(cadet_id));
create policy sessions_write on public.training_sessions for insert to authenticated
  with check (app_private.is_admin()
    or (app_private.my_role() = 'instructor' and instructor_profile_id = auth.uid() and app_private.is_assigned_instructor(cadet_id)));
create policy sessions_update on public.training_sessions for update to authenticated
  using (app_private.is_admin() or (instructor_profile_id = auth.uid() and app_private.is_assigned_instructor(cadet_id)))
  with check (app_private.is_admin() or (instructor_profile_id = auth.uid() and app_private.is_assigned_instructor(cadet_id)));

create policy pillar_logs_read on public.session_pillar_logs for select to authenticated
  using (app_private.can_see_cadet(app_private.session_cadet(session_id)));
create policy pillar_logs_insert on public.session_pillar_logs for insert to authenticated
  with check (assessed_by = auth.uid() and app_private.can_assess_session(session_id));
create policy pillar_logs_update on public.session_pillar_logs for update to authenticated
  using (app_private.can_assess_session(session_id))
  with check (assessed_by = auth.uid() and app_private.can_assess_session(session_id));

create policy rank_history_read on public.cadet_rank_history for select to authenticated
  using (app_private.can_see_cadet(cadet_id));
create policy rank_history_admin_insert on public.cadet_rank_history for insert to authenticated
  with check (app_private.is_admin() and assessor_profile_id = auth.uid());

create policy credentials_read on public.passport_credentials for select to authenticated
  using (app_private.is_admin() or app_private.is_cadet_or_guardian(cadet_id));

create policy leads_admin_read on public.onboarding_leads for select to authenticated using (app_private.is_admin());
create policy leads_admin_update on public.onboarding_leads for update to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());

create policy claims_public_read on public.approved_claims for select to anon, authenticated
  using (active and (review_due_at is null or review_due_at > now()));
create policy claims_admin_all on public.approved_claims for all to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());

create policy audit_exec_read on public.audit_events for select to authenticated using (app_private.is_exec());

-- ------------------------------------------------------------------ grants (explicit; nothing implicit)
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.regional_zones, public.curriculum_pillars, public.approved_claims, public.public_hub_labels to anon, authenticated;
grant select on public.profiles, public.school_hubs, public.cadets, public.cadet_guardians, public.instructor_assignments,
  public.hub_members, public.training_sessions, public.session_pillar_logs, public.cadet_rank_history,
  public.passport_credentials, public.onboarding_leads, public.audit_events to authenticated;
grant insert, update, delete on public.profiles, public.regional_zones, public.school_hubs, public.cadets,
  public.cadet_guardians, public.instructor_assignments, public.hub_members, public.curriculum_pillars,
  public.approved_claims to authenticated;
grant insert, update on public.training_sessions, public.session_pillar_logs to authenticated;
grant insert on public.cadet_rank_history to authenticated;
grant update (status, assigned_to) on public.onboarding_leads to authenticated;

grant execute on function public.verify_passport(text) to anon, authenticated;
grant execute on function public.submit_lead(public.lead_type, text, text, text, jsonb, text) to anon, authenticated;
grant execute on function public.issue_passport_credential(uuid, text, timestamptz) to authenticated;
grant execute on function public.revoke_passport_credential(uuid) to authenticated;
grant execute on function app_private.my_role(), app_private.is_admin(), app_private.is_exec(),
  app_private.is_assigned_instructor(uuid), app_private.is_cadet_or_guardian(uuid), app_private.can_see_cadet(uuid),
  app_private.session_cadet(uuid), app_private.can_assess_session(uuid), app_private.is_hub_member(uuid)
  to anon, authenticated;

-- ===================================================================== 20261011000300_seed_reference_data.sql
-- Seed: curriculum pillars (13) and regional zones (6), generated from lib/content/curriculum.ts and schools.ts.
-- No hubs, no cadets, no partners, no sample people are seeded. Zone-01 sub-zones are TARGET corridors, not signed partners;
-- they are added as 'prospect' hubs only (no contract evidence required for prospect).

insert into public.curriculum_pillars (id, title, skill_developed, trait_application, phase) values
  (1, 'Grooming & feeding', 'Responsibility, attention to detail', 'Reliability, conscientiousness', 'foundation'),
  (2, 'Mounting & initial handling', 'Patience, focus', 'Self-control, persistence', 'foundation'),
  (3, 'Learning commands & cues', 'Communication, clarity', 'Empathy, emotional awareness', 'foundation'),
  (4, 'Riding at different speeds & terrains', 'Courage, adaptability', 'Confidence, resilience', 'crucible'),
  (5, 'Jumping & challenging obstacles', 'Risk assessment, problem-solving', 'Bravery, critical thinking', 'crucible'),
  (6, 'Working with a stubborn / unpredictable horse', 'Flexibility, negotiation', 'Emotional intelligence, diplomacy', 'crucible'),
  (7, 'Regular practice & training', 'Discipline, consistency', 'Work ethic, perseverance', 'crucible'),
  (8, 'Building trust with the horse', 'Leadership, gentle authority', 'Integrity, trustworthiness', 'crucible'),
  (9, 'Dealing with mistakes & falls', 'Acceptance, recovery', 'Resilience, humility', 'crucible'),
  (10, 'Skill-at-arms & tent pegging runs', 'High-speed spatial convergence, absolute kinetic focus', 'Precision under velocity, target execution', 'command'),
  (11, 'Mounted archery & bow release', 'Dual-task coordination, breath-hold stillness', 'Poise under dynamic motion, split-second timing', 'command'),
  (12, 'High-velocity barrel racing', 'Centrifugal balance, split-second geometric agility', 'Calculated risk-taking, razor-sharp reflexes', 'command'),
  (13, 'Cavalry squad formation & parade command', 'Strategic synchronization, collective discipline', 'Institutional loyalty, executive leadership presence', 'command')
on conflict (id) do nothing;

insert into public.regional_zones (code, name, description) values
  ('01', 'Telangana & Andhra Pradesh Circuit', 'Hyderabad hub network'),
  ('02', 'National Capital Region Circuit', 'NCR'),
  ('03', 'Maharashtra & Western India Circuit', 'West'),
  ('04', 'Karnataka & Southern Metropolitan Circuit', 'South'),
  ('05', 'Northern Heritage & Boarding Circuit', 'Northern corridor'),
  ('06', 'Eastern & Central Regional Circuit', 'East & Centre')
on conflict (code) do nothing;

insert into public.school_hubs (zone_id, code, display_name, location_label, status)
select z.id, h.code, h.name, h.loc, 'prospect' from public.regional_zones z join (values
  ('01A', 'Financial District & Narsingi Corridor', 'Hyderabad'),
  ('01B', 'Begumpet & Jubilee Hills Heritage Belt', 'Hyderabad'),
  ('01C', 'Gachibowli & Madhapur Academic Axis', 'Hyderabad')
) as h(code, name, loc) on z.code = '01'
on conflict (code) do nothing;

-- ===================================================================== 20261011000400_audit_log_coverage.sql
-- Audit coverage for sensitive tables. Records WHO changed WHAT table, WHICH row, and WHICH COLUMNS changed.
-- Values are not copied into the log (no child or contact data in audit metadata).
-- The table audit_events is append-only (see migration 0002). Rank decisions, hub status, role changes,
-- credential issue/revoke and lead submission are already audited by their own functions/triggers.

create function public.audit_row_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  r jsonb := to_jsonb(case when tg_op = 'DELETE' then old else new end);
  eid text;
  cols text[];
begin
  eid := coalesce(r->>'id', concat_ws(':', r->>'cadet_id', r->>'guardian_profile_id', r->>'instructor_profile_id', r->>'profile_id', r->>'hub_id'));
  if tg_op = 'UPDATE' then
    select array_agg(k order by k) into cols
      from jsonb_each(to_jsonb(new)) n(k, v)
     where to_jsonb(old)->k is distinct from v;
    if cols is null then return new; end if;
  end if;
  perform app_private.audit('row.' || lower(tg_op), tg_table_name, eid,
    case when cols is null then '{}'::jsonb else jsonb_build_object('changed_columns', cols) end);
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create trigger audit_cadet_guardians after insert or update or delete on public.cadet_guardians for each row execute function public.audit_row_change();
create trigger audit_instructor_assignments after insert or update or delete on public.instructor_assignments for each row execute function public.audit_row_change();
create trigger audit_hub_members after insert or update or delete on public.hub_members for each row execute function public.audit_row_change();
create trigger audit_approved_claims after insert or update or delete on public.approved_claims for each row execute function public.audit_row_change();
create trigger audit_leads_update after update on public.onboarding_leads for each row execute function public.audit_row_change();
create trigger audit_cadets after update or delete on public.cadets for each row execute function public.audit_row_change();
create trigger audit_credentials_update after update on public.passport_credentials for each row execute function public.audit_row_change();
create trigger audit_pillar_logs after insert or update on public.session_pillar_logs for each row execute function public.audit_row_change();

-- Audit rows may only be created by security-definer code, never directly by app roles.
revoke insert, update, delete on public.audit_events from anon, authenticated;
revoke all on function public.audit_row_change() from public, anon, authenticated;

-- Role freshness: authorization helpers read public.profiles on every call; they never trust a role claim
-- baked into the sign-in token. Demoting a user therefore takes effect on their very next request.
comment on function app_private.my_role() is 'Reads the CURRENT role from public.profiles on every call. Never from JWT claims.';

-- ===================================================================== 20261012000500_advisor_hardening.sql
-- Applied 12 Oct 2026 after the Supabase security/performance advisors.
-- The view is no longer a public path: it runs with the caller's rights and app roles cannot read it.
alter view public.public_hub_labels set (security_invoker = true);
revoke all on public.public_hub_labels from anon, authenticated;

-- Public hub labels come from a narrow function instead (no finance or contract columns).
create function public.list_public_hubs()
returns table (code text, display_name text, location_label text, status public.hub_status, zone_code text)
language sql stable security definer set search_path = '' as $$
  select h.code, h.display_name, h.location_label, h.status, z.code
  from public.school_hubs h join public.regional_zones z on z.id = h.zone_id
  order by h.code
$$;
revoke all on function public.list_public_hubs() from public;
grant execute on function public.list_public_hubs() to anon, authenticated;

alter function public.set_updated_at() set search_path = '';

-- ===================================================================== 20261012000600_rls_initplan_and_fk_indexes.sql
-- Applied 12 Oct 2026: evaluate auth.uid() once per statement in RLS, and index every foreign key.
alter policy profiles_read on public.profiles using (id = (select auth.uid()) or app_private.is_admin());
alter policy profiles_update_self on public.profiles
  using (id = (select auth.uid()) or app_private.is_exec()) with check (id = (select auth.uid()) or app_private.is_exec());
alter policy guardians_read on public.cadet_guardians using (guardian_profile_id = (select auth.uid()) or app_private.is_admin());
alter policy assignments_read on public.instructor_assignments using (instructor_profile_id = (select auth.uid()) or app_private.is_admin());
alter policy hub_members_read on public.hub_members using (profile_id = (select auth.uid()) or app_private.is_admin());
alter policy sessions_write on public.training_sessions
  with check (app_private.is_admin()
    or (app_private.my_role() = 'instructor' and instructor_profile_id = (select auth.uid()) and app_private.is_assigned_instructor(cadet_id)));
alter policy sessions_update on public.training_sessions
  using (app_private.is_admin() or (instructor_profile_id = (select auth.uid()) and app_private.is_assigned_instructor(cadet_id)))
  with check (app_private.is_admin() or (instructor_profile_id = (select auth.uid()) and app_private.is_assigned_instructor(cadet_id)));
alter policy pillar_logs_insert on public.session_pillar_logs
  with check (assessed_by = (select auth.uid()) and app_private.can_assess_session(session_id));
alter policy pillar_logs_update on public.session_pillar_logs
  using (app_private.can_assess_session(session_id))
  with check (assessed_by = (select auth.uid()) and app_private.can_assess_session(session_id));
alter policy rank_history_admin_insert on public.cadet_rank_history
  with check (app_private.is_admin() and assessor_profile_id = (select auth.uid()));

create index if not exists approved_claims_approved_by_idx on public.approved_claims (approved_by);
create index if not exists audit_events_actor_idx on public.audit_events (actor_profile_id);
create index if not exists cadet_rank_history_assessor_idx on public.cadet_rank_history (assessor_profile_id);
create index if not exists cadets_home_zone_idx on public.cadets (home_zone_id);
create index if not exists hub_members_hub_idx on public.hub_members (hub_id);
create index if not exists onboarding_leads_assigned_idx on public.onboarding_leads (assigned_to);
create index if not exists passport_credentials_issued_by_idx on public.passport_credentials (issued_by);
create index if not exists session_pillar_logs_assessed_by_idx on public.session_pillar_logs (assessed_by);
create index if not exists training_sessions_instructor_idx on public.training_sessions (instructor_profile_id);

-- ===================================================================== 20261023000700_website_intake.sql
-- Website intake v2 (23 Oct 2026). Additive only: the original public.submit_lead() keeps working.
-- Adds what the public website needs to make an enquiry trustworthy end to end:
--   * explicit consent timestamp (no consent, no row),
--   * privacy-conscious attribution (route, hub, campaign, QR code, referrer host, UTM tags; no IP, no user agent),
--   * idempotency key so a double click or a retried request never creates two leads,
--   * a fixed-window rate limiter keyed by a server-side salted hash (the raw IP never reaches the database),
--   * the website gate name, so MOU requests and board-audit appointments are distinguishable from other leads.
-- NOT APPLIED to any live project. Validate with supabase/tests/run.sh, then apply only with owner approval.

alter table public.onboarding_leads
  add column if not exists gate text,
  add column if not exists attribution jsonb not null default '{}'::jsonb,
  add column if not exists consent_at timestamptz,
  add column if not exists idempotency_key text;

do $$ begin
  alter table public.onboarding_leads add constraint onboarding_leads_idempotency_key_format
    check (idempotency_key is null or idempotency_key ~ '^[A-Za-z0-9_-]{16,64}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.onboarding_leads add constraint onboarding_leads_attribution_size
    check (pg_column_size(attribution) <= 2048);
exception when duplicate_object then null; end $$;

create unique index if not exists onboarding_leads_idempotency_key_uq
  on public.onboarding_leads (idempotency_key) where idempotency_key is not null;
create index if not exists onboarding_leads_gate_idx on public.onboarding_leads (gate, created_at desc);

-- ------------------------------------------------------------------ rate limiting (fixed window)
create table if not exists app_private.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);
revoke all on app_private.rate_limits from public, anon, authenticated;

-- Returns true while the caller is under the limit. Buckets are opaque hashes made by the server with a secret salt,
-- so a visitor cannot exhaust someone else's bucket. Old windows are pruned opportunistically.
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
  if random() < 0.02 then
    delete from app_private.rate_limits where window_start < now() - interval '2 days';
  end if;
  return n <= p_limit;
end $$;

-- ------------------------------------------------------------------ lead intake v2
-- Returns {"status":"stored"} or {"status":"duplicate"}. Raises on invalid input (the server action validates first).
create or replace function public.submit_lead_v2(
  p_type public.lead_type, p_gate text, p_name text, p_email text, p_phone text, p_payload jsonb,
  p_privacy_version text, p_consent boolean, p_attribution jsonb, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare new_id uuid; clean_attr jsonb;
begin
  if p_consent is distinct from true then raise exception 'consent required'; end if;
  if p_gate is null or p_gate !~ '^[a-z_]{2,24}$' then raise exception 'invalid gate'; end if;
  if p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9_-]{16,64}$' then raise exception 'invalid idempotency key'; end if;
  if p_name is null or length(btrim(p_name)) not between 2 and 120 then raise exception 'invalid name'; end if;
  if (p_email is null or btrim(p_email) = '') and (p_phone is null or btrim(p_phone) = '') then
    raise exception 'email or phone required';
  end if;
  if p_email is not null and btrim(p_email) <> '' and
     (length(p_email) > 160 or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then raise exception 'invalid email'; end if;
  if p_phone is not null and length(p_phone) > 24 then raise exception 'invalid phone'; end if;
  if p_privacy_version is null or btrim(p_privacy_version) = '' then raise exception 'privacy notice version required'; end if;
  if length(coalesce(p_payload, '{}'::jsonb)::text) > 4000 then raise exception 'payload too large'; end if;

  -- Keep only known attribution keys with short string values.
  select coalesce(jsonb_object_agg(key, left(value #>> '{}', 200)), '{}'::jsonb) into clean_attr
    from jsonb_each(coalesce(p_attribution, '{}'::jsonb))
   where key in ('path', 'hub', 'campaign', 'qr', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content')
     and jsonb_typeof(value) = 'string';

  insert into public.onboarding_leads
    (lead_type, gate, contact_name, email, phone, payload, privacy_notice_version, consent_at, attribution, idempotency_key)
  values (p_type, p_gate, btrim(p_name), nullif(btrim(p_email), ''), nullif(btrim(p_phone), ''),
          coalesce(p_payload, '{}'::jsonb), btrim(p_privacy_version), now(), clean_attr, p_idempotency_key)
  on conflict (idempotency_key) where idempotency_key is not null do nothing
  returning id into new_id;

  if new_id is null then return jsonb_build_object('status', 'duplicate'); end if;
  perform app_private.audit('lead.submitted', 'onboarding_lead', new_id::text, jsonb_build_object('type', p_type, 'gate', p_gate));
  return jsonb_build_object('status', 'stored');
end $$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public;
revoke all on function public.submit_lead_v2(public.lead_type, text, text, text, text, jsonb, text, boolean, jsonb, text) from public;
grant execute on function public.consume_rate_limit(text, integer, integer) to anon, authenticated;
grant execute on function public.submit_lead_v2(public.lead_type, text, text, text, text, jsonb, text, boolean, jsonb, text) to anon, authenticated;

-- ===================================================================== 20261023000800_auth_storage_documents.sql
-- Auth profiles, Storage buckets/policies and generated documents (23 Oct 2026). Additive and re-runnable.
--
-- * Every new auth user gets a least-privilege profile ('cadet'): no admin rights. Staff are promoted by an
--   executive_admin (audited), never by hard-coded credentials.
-- * Buckets: website-assets (public read, admin write), user-uploads (owner folder, private), private-documents
--   (admins only; downloaded through short-lived signed URLs).
-- * generated_documents records every stored PDF (MOU drafts etc.); media_assets records website images.
-- Validate with supabase/tests/run.sh; apply to a live project only with owner approval.

-- ------------------------------------------------------------------ profile on sign-up
create or replace function app_private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Member'))
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function app_private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
  for each row execute function app_private.handle_new_user();

-- ------------------------------------------------------------------ documents and media records
create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('mou_draft', 'campus_proposal', 'roi_export')),
  title text not null check (length(title) between 2 and 200),
  storage_path text not null unique check (storage_path ~ '^[a-z0-9_/.-]+$' and length(storage_path) between 8 and 300 and storage_path !~ '\.\.'),
  lead_reference text,
  created_by uuid references public.profiles (id),
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
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index if not exists media_assets_uploaded_by_idx on public.media_assets (uploaded_by);

alter table public.generated_documents enable row level security;
alter table public.media_assets enable row level security;

drop policy if exists generated_documents_admin_read on public.generated_documents;
create policy generated_documents_admin_read on public.generated_documents for select to authenticated
  using ((select app_private.is_admin()));
drop policy if exists generated_documents_admin_insert on public.generated_documents;
create policy generated_documents_admin_insert on public.generated_documents for insert to authenticated
  with check ((select app_private.is_admin()) and created_by = (select auth.uid()));

drop policy if exists media_assets_public_read on public.media_assets;
create policy media_assets_public_read on public.media_assets for select to anon, authenticated using (true);
drop policy if exists media_assets_admin_insert on public.media_assets;
create policy media_assets_admin_insert on public.media_assets for insert to authenticated
  with check ((select app_private.is_admin()) and uploaded_by = (select auth.uid()));
drop policy if exists media_assets_admin_delete on public.media_assets;
create policy media_assets_admin_delete on public.media_assets for delete to authenticated
  using ((select app_private.is_admin()));

revoke all on public.generated_documents, public.media_assets from anon, authenticated;
grant select, insert on public.generated_documents to authenticated;
grant select on public.media_assets to anon, authenticated;
grant insert, delete on public.media_assets to authenticated;

-- ------------------------------------------------------------------ storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('website-assets', 'website-assets', true, 8388608, array['image/png', 'image/jpeg', 'image/webp']),
  ('user-uploads', 'user-uploads', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('private-documents', 'private-documents', false, 20971520, array['application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- website-assets: anyone may read (public bucket); only admins write or delete.
drop policy if exists "website-assets admin insert" on storage.objects;
create policy "website-assets admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'website-assets' and (select app_private.is_admin()));
drop policy if exists "website-assets admin update" on storage.objects;
create policy "website-assets admin update" on storage.objects for update to authenticated
  using (bucket_id = 'website-assets' and (select app_private.is_admin()));
drop policy if exists "website-assets admin delete" on storage.objects;
create policy "website-assets admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'website-assets' and (select app_private.is_admin()));

-- user-uploads: a signed-in user works only inside the folder named after their user id; admins can read all.
drop policy if exists "user-uploads owner insert" on storage.objects;
create policy "user-uploads owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "user-uploads owner or admin read" on storage.objects;
create policy "user-uploads owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'user-uploads' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select app_private.is_admin())));
drop policy if exists "user-uploads owner delete" on storage.objects;
create policy "user-uploads owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- private-documents: admins only (signed URLs are minted for them on the server).
drop policy if exists "private-documents admin read" on storage.objects;
create policy "private-documents admin read" on storage.objects for select to authenticated
  using (bucket_id = 'private-documents' and (select app_private.is_admin()));
drop policy if exists "private-documents admin insert" on storage.objects;
create policy "private-documents admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'private-documents' and (select app_private.is_admin()));
drop policy if exists "private-documents admin delete" on storage.objects;
create policy "private-documents admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'private-documents' and (select app_private.is_admin()));

-- ------------------------------------------------------------------ audit trail for documents and media
drop trigger if exists audit_generated_documents on public.generated_documents;
create trigger audit_generated_documents after insert or update or delete on public.generated_documents
  for each row execute function public.audit_row_change();
drop trigger if exists audit_media_assets on public.media_assets;
create trigger audit_media_assets after insert or update or delete on public.media_assets
  for each row execute function public.audit_row_change();
