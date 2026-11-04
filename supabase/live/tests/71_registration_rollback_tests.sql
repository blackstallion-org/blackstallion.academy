-- After the registration rollback: everything it added is gone, the operations schema is as it was. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$ begin
  perform t.eq('rollback: the registration tables are gone', (select count(*)::text from pg_tables where schemaname = 'public'
    and tablename in ('programs','guardian_children','applications','application_events','application_documents','enrollments','payment_events','notification_log')), '0');
  perform t.eq('rollback: the added payment and consent columns are gone', (select count(*)::text from information_schema.columns where table_schema = 'public'
    and ((table_name = 'payment_records' and column_name in ('application_id','invoice_number','amount_paise','paid_at','refunded_paise'))
      or (table_name = 'consent_records' and column_name = 'application_id'))), '0');
  perform t.eq('rollback: the role check is back to five roles', (select (pg_get_constraintdef(oid) not like '%ADMISSIONS%')::text from pg_constraint where conname = 'users_role_check'), 'true');
  perform t.eq('rollback: the cadet created by enrolment is kept', (select count(*)::text from public.cadets where parent_id = '00000000-0000-0000-0000-0000000000c1'), '1');
  perform t.eq('rollback: the bucket is gone once empty', (select count(*)::text from storage.buckets where id = 'application-documents'), '0');
  perform t.eq('rollback: sign-up still makes a PARENT', (select count(*)::text from pg_proc where proname = 'handle_new_user' and prosrc like '%PARENT%' and prosrc not like '%ADMISSIONS%'), '1');
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
