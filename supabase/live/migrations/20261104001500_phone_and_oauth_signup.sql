-- Phone and Google sign-up on the LIVE operations project (tgwadczrfbljnepoaqtb). 4 Nov 2026. Re-runnable.
--
-- Why: public.users.email is NOT NULL and UNIQUE, but a person who signs in with a text-message code has no e-mail address.
-- The trigger public.handle_new_user() (F2, widened in 20261104001400) inserted new.email, so the first phone sign-in failed
-- with 500 "null value in column email of relation users violates not-null constraint" and no account was created
-- (observed read-only against the live Auth endpoint on 4 Nov 2026; nothing was stored).
--
-- What it changes (one function, nothing else; no column, constraint, policy or grant):
--   * a phone-only sign-up gets the reserved address phone-<digits>@phone.invalid (the .invalid TLD can never receive mail,
--     so nothing is ever e-mailed to it), and users.phone_number is filled from the verified number;
--   * the number is stored only when no other row already holds it (users.phone_number is UNIQUE), so a sign-up can never
--     fail, or take over a number, because of an older row;
--   * the display name also falls back to the provider's `name` claim (Google sends full_name and name);
--   * the role rule is unchanged: it comes from raw_app_meta_data only, sign-up data never sets a role (F2).
-- Google sign-ins with an e-mail that already has an account are linked by Supabase Auth to that same auth user, so this
-- trigger does not fire again and no second public.users row is made.
-- Needs the owner's approval like 001100 / 001400 (shared project). Rollback: ../rollback/20261104001500_phone_and_oauth_signup_rollback.sql

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
declare
  v_role text := upper(coalesce(new.raw_app_meta_data->>'role', ''));
  v_digits text := regexp_replace(coalesce(new.phone, ''), '\D', '', 'g');
  v_phone text := case when v_digits <> '' then '+' || v_digits end;
  v_email text := nullif(btrim(coalesce(new.email, '')), '');
  v_name text := nullif(btrim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')), '');
begin
  if v_role not in ('PARENT', 'INSTRUCTOR', 'GROOM', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'ADMISSIONS') then v_role := 'PARENT'; end if;
  if v_email is null then
    v_email := 'phone-' || coalesce(nullif(v_digits, ''), replace(new.id::text, '-', '')) || '@phone.invalid';
  end if;
  if v_phone is not null and (char_length(v_phone) > 20 or exists (select 1 from public.users u where u.phone_number = v_phone)) then
    v_phone := null;
  end if;
  insert into public.users (id, full_name, email, phone_number, role)
  values (new.id, left(coalesce(v_name, 'New User'), 255), left(v_email, 255), v_phone, v_role);
  return new;
end;
$function$;
