-- Self-service member accounts: student, parent, teacher, school (28 Oct 2026). Additive and re-runnable.
--
-- Anyone may create an account from /admin/login ("Create an account"). The account is a normal Supabase Auth user:
--   * public.profiles keeps the least-privilege role 'cadet' for EVERY self-service sign-up (see 20261023000800). Nobody can
--     promote themselves; staff roles and 'instructor' / 'school_partner' are still granted by an executive_admin, audited.
--   * public.member_accounts records what kind of member the person says they are (student, parent, teacher, school) and
--     the details they gave. Students and parents are 'active' at once; teachers and schools are 'pending' until staff
--     review them (public.review_member_account, audited). Status and kind can never be edited by the member.
--   * The kind is read from the sign-up metadata by the trigger below, validated against the enum, and every other value
--     is clipped; a malformed form can never block the auth account itself (the member row is best effort).
--   * public.my_enquiries() lets a member with a CONFIRMED e-mail see the coarse progress of enquiries made with that
--     address (never the internal status, the notes or anyone else's rows).
-- NOT APPLIED to any live project. Validate with supabase/tests/run.sh, then apply only with owner approval.

do $$ begin create type public.member_kind as enum ('student', 'parent', 'teacher', 'school');
exception when duplicate_object then null; end $$;
do $$ begin create type public.member_status as enum ('pending', 'active', 'suspended');
exception when duplicate_object then null; end $$;

create table if not exists public.member_accounts (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  kind public.member_kind not null,
  status public.member_status not null default 'pending',
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email text check (email is null or char_length(email) <= 160),
  phone text check (phone is null or char_length(phone) between 6 and 24),
  organisation text check (organisation is null or char_length(organisation) <= 160),
  city text check (city is null or char_length(city) <= 80),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object' and pg_column_size(details) <= 4000),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists member_accounts_kind_status_idx on public.member_accounts (kind, status, created_at desc);
create index if not exists member_accounts_reviewed_by_idx on public.member_accounts (reviewed_by);
drop trigger if exists member_accounts_updated on public.member_accounts;
create trigger member_accounts_updated before update on public.member_accounts
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------ sign-up: profile (always) + member row (when a kind was chosen)
create or replace function app_private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := case when jsonb_typeof(new.raw_user_meta_data) = 'object' then new.raw_user_meta_data else '{}'::jsonb end;
  k text := meta ->> 'member_kind';
  nm text := left(btrim(coalesce(meta ->> 'full_name', '')), 120);
  det jsonb;
  ph text := nullif(btrim(coalesce(meta ->> 'phone', '')), '');
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(nm, ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Member'))
  on conflict (id) do nothing;

  if k in ('student', 'parent', 'teacher', 'school') then
    begin
      if char_length(nm) < 2 then nm := coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Member'); end if;
      det := case when jsonb_typeof(meta -> 'details') = 'object' then meta -> 'details' else '{}'::jsonb end;
      if pg_column_size(det) > 4000 then det := '{}'::jsonb; end if;
      if ph is not null and char_length(ph) not between 6 and 24 then ph := null; end if;
      insert into public.member_accounts (profile_id, kind, status, full_name, email, phone, organisation, city, details)
      values (new.id, k::public.member_kind,
              (case when k in ('student', 'parent') then 'active' else 'pending' end)::public.member_status,
              nm, left(new.email, 160), ph,
              left(nullif(btrim(coalesce(meta ->> 'organisation', '')), ''), 160),
              left(nullif(btrim(coalesce(meta ->> 'city', '')), ''), 80), det)
      on conflict (profile_id) do nothing;
    exception when others then
      raise warning 'member_accounts row skipped for new user: %', sqlstate;
    end;
  end if;
  return new;
end $$;
revoke all on function app_private.handle_new_user() from public, anon, authenticated;

-- ------------------------------------------------------------------ row level security
alter table public.member_accounts enable row level security;

drop policy if exists member_accounts_read on public.member_accounts;
create policy member_accounts_read on public.member_accounts for select to authenticated
  using (profile_id = (select auth.uid()) or app_private.is_admin());

drop policy if exists member_accounts_update_own on public.member_accounts;
create policy member_accounts_update_own on public.member_accounts for update to authenticated
  using (profile_id = (select auth.uid()) and status <> 'suspended')
  with check (profile_id = (select auth.uid()));

revoke all on public.member_accounts from anon, authenticated;
grant select on public.member_accounts to authenticated;
-- members edit only what they typed; kind, status and the review columns are never in this list
grant update (full_name, phone, organisation, city, details) on public.member_accounts to authenticated;

-- ------------------------------------------------------------------ staff review (audited)
create or replace function public.review_member_account(p_profile uuid, p_status public.member_status)
returns void language plpgsql security definer set search_path = '' as $$
declare old_status public.member_status; k public.member_kind;
begin
  if not app_private.is_admin() then raise exception 'staff only' using errcode = '42501'; end if;
  select status, kind into old_status, k from public.member_accounts where profile_id = p_profile for update;
  if not found then raise exception 'account not found' using errcode = 'P0002'; end if;
  if old_status = p_status then return; end if;
  update public.member_accounts set status = p_status, reviewed_by = auth.uid(), reviewed_at = now() where profile_id = p_profile;
  perform app_private.audit('member.status_changed', 'member_account', p_profile::text,
    jsonb_build_object('kind', k, 'from', old_status, 'to', p_status));
end $$;
revoke all on function public.review_member_account(uuid, public.member_status) from public, anon;
grant execute on function public.review_member_account(uuid, public.member_status) to authenticated;

-- ------------------------------------------------------------------ a member's own enquiries (confirmed e-mail only, coarse progress only)
create or replace function public.my_enquiries()
returns table (id uuid, lead_type public.lead_type, gate text, progress text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select l.id, l.lead_type, l.gate,
         case l.status when 'new' then 'received' when 'reviewing' then 'in progress' when 'contacted' then 'in progress'
                       when 'qualified' then 'in progress' else 'closed' end,
         l.created_at
    from public.onboarding_leads l
    join auth.users u on u.id = auth.uid() and u.email_confirmed_at is not null
   where l.email is not null and lower(l.email) = lower(u.email)
   order by l.created_at desc
   limit 50
$$;
revoke all on function public.my_enquiries() from public, anon;
grant execute on function public.my_enquiries() to authenticated;
