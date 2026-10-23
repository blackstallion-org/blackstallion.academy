-- Rollback of the website layer leaves the operations schema working. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
begin
  perform t.eq('rollback: website tables removed', (select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and relname in ('onboarding_leads','audit_events','generated_documents','media_assets')), '0');
  perform t.eq('rollback: website RPCs removed', (select count(*)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and proname in ('submit_lead_v2','consume_rate_limit','verify_passport')), '0');
  perform t.eq('rollback: operations tables and rows intact', (select count(*)::text from public.users), '8');
  perform t.eq('rollback: mirrored operations rows kept', (select count(*)::text from public.mou_requests), '1');
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
