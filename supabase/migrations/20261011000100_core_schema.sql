-- BSAH core schema. Source: Comprehensive Architecture Blueprint §8 (a recommended baseline).
-- NOT applied to any database. Review with the business before running anywhere real.
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
