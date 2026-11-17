-- Rollback of 20261118001900_payment_order_guard.sql (re-runnable): drops the one-pending-order index and puts back
-- ingest_payment_event exactly as 20261104001400_registration_admissions.sql defined it.
begin;

drop index if exists public.payment_records_one_pending_per_application;

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
      update public.applications set payment_status = 'paid' where id = r.application_id;
      outcome := 'paid';
    end if;
  elsif p_event_type = 'payment.failed' then
    if r.status = 'PENDING' then update public.payment_records set status = 'FAILED' where id = r.id; outcome := 'failed'; else outcome := 'ignored'; end if;
  elsif p_event_type = 'refund.processed' then
    if r.status = 'PAID' and p_amount_paise > 0 and r.refunded_paise + p_amount_paise <= r.amount_paise then
      update public.payment_records set refunded_paise = refunded_paise + p_amount_paise,
        status = case when refunded_paise + p_amount_paise = amount_paise then 'REFUNDED' else status end where id = r.id;
      if r.refunded_paise + p_amount_paise = r.amount_paise then update public.applications set payment_status = 'refunded' where id = r.application_id; end if;
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
