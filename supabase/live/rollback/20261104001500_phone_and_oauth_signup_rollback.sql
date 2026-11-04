-- Rollback of 20261104001500_phone_and_oauth_signup.sql: restores handle_new_user() exactly as 20261104001400 left it.
-- Accounts already created through phone or Google keep their public.users rows (they are ordinary PARENT rows).
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
