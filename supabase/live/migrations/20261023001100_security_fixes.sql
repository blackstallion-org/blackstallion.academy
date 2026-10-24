-- Security fixes for the LIVE operations project (tgwadczrfbljnepoaqtb). 23 Oct 2026.
-- These CHANGE existing objects, so they are applied only with the owner's explicit approval.
-- Re-runnable. No data is changed or deleted.
--
-- F1 (critical) Self-promotion: policy users.own_profile_update lets any signed-in user update their own row, and the
--    authenticated role holds UPDATE on every column, so a parent could set role = 'SUPER_ADMIN' and gain every
--    super_admin_all policy. Fix: a guard trigger. Only an existing SUPER_ADMIN (or a trusted server context without
--    an end-user JWT, such as the dashboard or the service role) may change id, email, role or hub_id.
-- F2 (critical) Sign-up role injection: public.handle_new_user() copied the role from raw_user_meta_data, which the
--    person signing up controls. Fix: read the role from raw_app_meta_data (only settable with the service role or
--    the dashboard), accept only known roles, default PARENT.

-- ------------------------------------------------------------------ F1
-- app_private already exists (website layer); its usage grant to authenticated is needed by RLS policies.
create schema if not exists app_private;

create or replace function app_private.guard_user_privileges() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.role is distinct from old.role or new.hub_id is distinct from old.hub_id
      or new.email is distinct from old.email or new.id is distinct from old.id)
     and auth.uid() is not null
     and coalesce(public.current_role_name(), '') <> 'SUPER_ADMIN' then
    raise exception 'only a SUPER_ADMIN may change role, hub, email or id' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function app_private.guard_user_privileges() from public, anon, authenticated;

drop trigger if exists users_guard_privileges on public.users;
create trigger users_guard_privileges before update on public.users
  for each row execute function app_private.guard_user_privileges();

-- ------------------------------------------------------------------ F2
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
