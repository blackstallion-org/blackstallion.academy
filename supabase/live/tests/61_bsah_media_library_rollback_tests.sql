-- Rollback of the media library: the earlier image upload keeps working and nothing else changed. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  admin uuid := '00000000-0000-0000-0000-0000000000a1';
begin
  perform t.eq('rollback: library columns removed', (select count(*)::text from information_schema.columns where table_schema = 'public' and table_name = 'media_assets' and column_name in ('bucket', 'kind')), '0');
  perform t.eq('rollback: library rule removed', (select count(*)::text from pg_constraint where conname = 'media_assets_library_rules'), '0');
  perform t.eq('rollback: library policies removed', (select count(*)::text from pg_policies where schemaname = 'storage' and policyname like 'bsah-media%'), '0');
  perform t.eq('rollback: the old type rule is back (AVIF refused again)',
    t.dml(admin, 'authenticated', format($q$insert into public.media_assets (storage_path, alt_text, mime_type, bytes, uploaded_by) values ('site/2026/10/back.avif', 'A described file', 'image/avif', 1000, %L)$q$, admin)), 'ERR:23514');
  perform t.eq('rollback: the old image upload works', t.dml(admin, 'authenticated', format($q$insert into public.media_assets (storage_path, alt_text, mime_type, bytes, uploaded_by) values ('site/2026/10/back.png', 'A described file', 'image/png', 1000, %L)$q$, admin)), 'OK:1');
  perform t.eq('rollback: the earlier website-assets policies are intact', (select count(*)::text from pg_policies where schemaname = 'storage' and policyname like 'website-assets%'), '3');
  perform t.eq('rollback: the bucket and its files are left alone', (select count(*)::text from storage.buckets where id = 'bsah-media'), '1');
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
