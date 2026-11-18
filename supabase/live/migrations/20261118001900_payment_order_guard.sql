-- Payment order guard (18 Nov 2026 technical audit, finding M4). NOT APPLIED ANYWHERE.
-- Apply only with the owner's approval, after 20261104001400_registration_admissions.sql. Re-runnable, one transaction.
-- Rollback: supabase/live/rollback/20261118001900_payment_order_guard_rollback.sql. Replica test: tests/run.sh (stage 78).
--
-- Why: the enrolment action reuses "the" pending order of an application, but nothing in the database said there could be
-- only one. Two quick clicks, or a GST change between visits, left two PENDING orders; after that every visit created another
-- order, and a parent who paid two of them was marked paid twice with nothing telling staff that a refund was due.
--
-- After it:
--   1. an application has at most one PENDING payment record (partial unique index); the website marks a stale pending order
--      FAILED before it creates the replacement, and a racing second insert is refused and reuses the first;
--   2. ingest_payment_event still records every verified capture (the money really was taken), but a capture on an
--      application that is already paid by another order returns 'paid_duplicate' instead of 'paid', leaves the application
--      alone and writes 'payment.paid_duplicate' to the audit trail, so staff can refund it. Everything else is unchanged.
--
-- PRE-FLIGHT: this file refuses to run while any application already has two PENDING records (decide which order stands,
-- mark the other FAILED, then run it again):
--   select application_id, count(*) from public.payment_records where status = 'PENDING' and application_id is not null
--   group by 1 having count(*) > 1;
begin;

do $$
begin
  if exists (select 1 from public.payment_records where status = 'PENDING' and application_id is not null
             group by application_id having count(*) > 1) then
    raise exception 'an application has more than one PENDING payment record: resolve it first (see the pre-flight query in this file)';
  end if;
end $$;

create unique index if not exists payment_records_one_pending_per_application
  on public.payment_records (application_id) where status = 'PENDING' and application_id is not null;

create or replace function public.ingest_payment_event(p_event_id text, p_order_id text, p_event_type text, p_payment_id text, p_amount_paise integer)
returns text
language plpgsql security definer set search_path = '' as $$
declare r public.payment_records; outcome text;
begin
  if exists (select 1 from public.payment_events where gateway_event_id = p_event_id) then return 'duplicate'; end if;
  select * into r from public.payment_records where gateway_order_id = p_order_id for update;
  if not found then outcome := 'unknown_order';
  elsif p_event_type in ('payment.captured', 'order.paid') then
    if r.amount_paise is distinct from p_amount_paise then outcome := 'amount_mismatch';
    elsif r.status = 'PAID' then outcome := 'already_paid';
    else
      update public.payment_records set status = 'PAID', gateway_payment_id = coalesce(p_payment_id, gateway_payment_id), paid_at = now(),
        invoice_number = coalesce(invoice_number, 'BSAH/' || to_char(now(), 'YYYY') || '/' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)))
       where id = r.id;
      -- two captures on different orders of one application, processed at once: the second waits here for the first
      if r.application_id is not null then perform 1 from public.applications where id = r.application_id for update; end if;
      if r.application_id is not null and exists (select 1 from public.payment_records
          where application_id = r.application_id and id <> r.id and status = 'PAID') then
        -- a second order for an application that is already paid: staff refund it. A fully refunded earlier order does not
        -- count: then this capture is the only money held, and the application is paid by it.
        outcome := 'paid_duplicate';
      else
        update public.applications set payment_status = 'paid' where id = r.application_id;
        outcome := 'paid';
      end if;
    end if;
  elsif p_event_type = 'payment.failed' then
    if r.status = 'PENDING' then update public.payment_records set status = 'FAILED' where id = r.id; outcome := 'failed'; else outcome := 'ignored'; end if;
  elsif p_event_type = 'refund.processed' then
    if r.status = 'PAID' and p_amount_paise > 0 and r.refunded_paise + p_amount_paise <= r.amount_paise then
      update public.payment_records set refunded_paise = refunded_paise + p_amount_paise,
        status = case when refunded_paise + p_amount_paise = amount_paise then 'REFUNDED' else status end where id = r.id;
      -- the application shows refunded only when no other order of it is still paid
      if r.refunded_paise + p_amount_paise = r.amount_paise and not exists (select 1 from public.payment_records
          where application_id = r.application_id and id <> r.id and status = 'PAID') then
        update public.applications set payment_status = 'refunded' where id = r.application_id;
      end if;
      outcome := 'refunded';
    else outcome := 'ignored'; end if;
  else outcome := 'ignored';
  end if;
  insert into public.payment_events (gateway_event_id, gateway_order_id, event_type, amount_paise, outcome)
  values (p_event_id, p_order_id, p_event_type, p_amount_paise, outcome);
  perform app_private.audit('payment.' || outcome, 'payment_record', coalesce(r.id::text, p_order_id), jsonb_build_object('event', p_event_type));
  return outcome;
end $$;
revoke all on function public.ingest_payment_event(text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.ingest_payment_event(text, text, text, text, integer) to service_role;

commit;
