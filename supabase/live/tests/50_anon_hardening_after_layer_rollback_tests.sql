-- 20261023001200 re-applied, then the WEBSITE LAYER rolled back underneath it (public.consume_rate_limit and
-- app_private.rate_limits gone). The privacy part must hold and anonymous inserts must keep working. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  keep_qr uuid[] := array(select id from public.qr_lead_captures);
  i int; ok int := 0;
begin
  perform t.eq('after layer rollback: the website limiter is gone', (to_regprocedure('public.consume_rate_limit(text,integer,integer)') is null
    and to_regclass('app_private.rate_limits') is null)::text, 'true');
  perform t.eq('after layer rollback: anon still cannot read stall-cam links', t.scalar(null, 'anon', 'select stall_cctv_rtsp_url from public.equine_fleet limit 1'), 'ERR:42501');
  perform t.eq('after layer rollback: anon still reads safe horse columns', t.scalar(null, 'anon', 'select name from public.equine_fleet'), 'Chetak');
  perform t.eq('after layer rollback: anon still cannot read revenue shares', t.scalar(null, 'anon', 'select revenue_share_percentage from public.school_hubs limit 1'), 'ERR:42501');
  perform t.eq('after layer rollback: anon still cannot read achievements', t.scalar(null, 'anon', 'select count(*) from public.achievements'), 'ERR:42501');
  perform t.client('{"x-forwarded-for":"198.51.100.10"}');
  perform t.eq('after layer rollback: checks still apply', t.dml(null, 'anon',
    $q$insert into public.qr_lead_captures (hub_slug, parent_name) values ('bad slug!', 'Kiran Rao')$q$), 'ERR:23514');
  for i in 1..6 loop
    if t.dml(null, 'anon', $q$insert into public.qr_lead_captures (hub_slug, parent_name) values ('test-hub', 'Kiran Rao')$q$) = 'OK:1' then ok := ok + 1; end if;
  end loop;
  perform t.eq('after layer rollback: anon inserts keep working, the rate limit fails open (6 of 6)', ok::text, '6');
  perform t.client(null);
  delete from public.qr_lead_captures where id <> all (keep_qr);
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
