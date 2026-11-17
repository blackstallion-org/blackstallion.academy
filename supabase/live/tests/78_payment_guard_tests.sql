-- Payment order guard (20261118001900). Run by run.sh after the registration tests (70), whose application has a PAID order
-- 'order_TEST1': once after the migration (:'phase' = 'after') and once after its rollback (:'phase' = 'rolled-back').
-- THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
select set_config('t.phase', :'phase', false);
do $$
declare
  g uuid := '00000000-0000-0000-0000-0000000000c1';
  after boolean := current_setting('t.phase') = 'after';
  app uuid;
  before_status text;
  second text;
begin
  select application_id into app from public.payment_records where gateway_order_id = 'order_TEST1';
  if after then
    perform t.eq('guard: the one-pending-order index exists', (select count(*)::text from pg_indexes where indexname = 'payment_records_one_pending_per_application'), '1');
    -- the main path under the new function: an application's first capture is 'paid' and marks the application paid
    -- (the 70 tests already paid order_TEST1, so it is set aside for this check and restored below)
    update public.payment_records set status = 'FAILED' where gateway_order_id = 'order_TEST1';
    update public.applications set payment_status = 'pending' where id = app;
    insert into public.payment_records (parent_id, gateway_order_id, amount_paid, gst_amount, payment_type, status, application_id, amount_paise)
    values (g, 'order_G0', 2950.00, 450.00, 'ONBOARDING', 'PENDING', app, 295000);
    perform t.eq('guard: an application''s first capture is paid', public.ingest_payment_event('evt_g0', 'order_G0', 'payment.captured', 'pay_g0', 295000), 'paid');
    perform t.eq('guard: and the application shows paid', (select payment_status from public.applications where id = app), 'paid');
    select payment_status into before_status from public.applications where id = app;
    insert into public.payment_records (parent_id, gateway_order_id, amount_paid, gst_amount, payment_type, status, application_id, amount_paise)
    values (g, 'order_G1', 2950.00, 450.00, 'ONBOARDING', 'PENDING', app, 295000);
    begin
      insert into public.payment_records (parent_id, gateway_order_id, amount_paid, gst_amount, payment_type, status, application_id, amount_paise)
      values (g, 'order_G2', 2950.00, 450.00, 'ONBOARDING', 'PENDING', app, 295000);
      second := 'inserted';
    exception when unique_violation then second := 'refused';
    end;
    perform t.eq('guard: a second PENDING order for one application is refused', second, 'refused');
    perform t.eq('guard: a capture on a second order of a paid application is flagged, not counted as paid',
      public.ingest_payment_event('evt_g1', 'order_G1', 'payment.captured', 'pay_g1', 295000), 'paid_duplicate');
    perform t.eq('guard: the duplicate capture is still recorded as money taken', (select status || '/' || (invoice_number is not null)::text from public.payment_records where gateway_order_id = 'order_G1'), 'PAID/true');
    perform t.eq('guard: the application itself is unchanged by the duplicate', (select payment_status from public.applications where id = app), before_status);
    perform t.eq('guard: the duplicate is in the audit trail', (select (count(*) >= 1)::text from public.audit_events where action = 'payment.paid_duplicate'), 'true');
    perform t.eq('guard: refunding the duplicate works', public.ingest_payment_event('evt_g2', 'order_G1', 'refund.processed', 'pay_g1', 295000), 'refunded');
    perform t.eq('guard: refunding the duplicate leaves the application paid (its first order still stands)', (select payment_status from public.applications where id = app), before_status);
    perform t.eq('guard: a replayed event is still a duplicate', public.ingest_payment_event('evt_g1', 'order_G1', 'payment.captured', 'pay_g1', 295000), 'duplicate');
    insert into public.payment_records (parent_id, gateway_order_id, amount_paid, gst_amount, payment_type, status, application_id, amount_paise)
    values (g, 'order_G3', 10.00, 0, 'ONBOARDING', 'PENDING', null, 1000);
    perform t.eq('guard: an order without an application is paid as before', public.ingest_payment_event('evt_g3', 'order_G3', 'payment.captured', 'pay_g3', 1000), 'paid');
    perform t.eq('guard: a signed-in user still cannot ingest gateway events', t.scalar(g, 'authenticated', $q$select public.ingest_payment_event('evt_g4', 'order_G3', 'payment.captured', 'pay_g3', 1000)$q$), 'ERR:42501');
    delete from public.payment_records where gateway_order_id in ('order_G0', 'order_G1', 'order_G2', 'order_G3');
    update public.payment_records set status = 'PAID' where gateway_order_id = 'order_TEST1';
  else
    perform t.eq('guard rollback: the index is gone', (select count(*)::text from pg_indexes where indexname = 'payment_records_one_pending_per_application'), '0');
    perform t.eq('guard rollback: the original ingest function is back', (select (position('paid_duplicate' in prosrc) = 0)::text from pg_proc where proname = 'ingest_payment_event'), 'true');
    perform t.eq('guard rollback: anon and signed-in users still cannot run it', (select (not has_function_privilege('authenticated', 'public.ingest_payment_event(text, text, text, text, integer)', 'execute') and not has_function_privilege('anon', 'public.ingest_payment_event(text, text, text, text, integer)', 'execute'))::text), 'true');
  end if;
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
