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
