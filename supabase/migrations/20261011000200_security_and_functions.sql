-- BSAH authorisation, business rules and RLS. Source: Architecture Blueprint §9 and Prompts 2.3, 3.1, 4.2, 4.3.
-- NOT applied to any database. Default deny: every table has RLS on and grants are listed explicitly.
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
