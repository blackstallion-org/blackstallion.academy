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
