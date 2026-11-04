-- After the rollback of 20261104001600 the owner policies are exactly the 20261104001400 ones again. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
begin
  perform t.eq('storage F-10 rollback: owner insert is own-folder only again',
    ((select with_check from pg_policies where schemaname = 'storage' and policyname = 'application-documents owner insert') !~ 'applications')::text, 'true');
  perform t.eq('storage F-10 rollback: owner delete is own-folder only again',
    ((select qual from pg_policies where schemaname = 'storage' and policyname = 'application-documents owner delete') !~ 'applications')::text, 'true');
  perform t.eq('storage F-10 rollback: reviewer read policy untouched',
    ((select qual from pg_policies where schemaname = 'storage' and policyname = 'application-documents owner or reviewer read') ~ 'is_admissions')::text, 'true');
end $$;
select case when ok then 'PASS  ' else 'FAIL  ' end || name || case when ok then '' else '  (' || detail || ')' end
  from t.results where n > :start_n order by n;
