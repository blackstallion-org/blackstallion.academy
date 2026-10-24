-- Website intake v2 tests (consent, attribution, idempotency, rate limiting, read access). THROWAWAY Postgres only.
-- Runs after 10_ and 20_ in the same database (reuses the t.* helpers and fixtures).
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  ops uuid := '00000000-0000-0000-0000-0000000000a1';
  g1  uuid := '00000000-0000-0000-0000-0000000000c1';
  key1 text := 'k_test_0000000000000001';
  attr jsonb;
begin
  -- happy path through the anonymous API role
  perform t.eq('intake: anon stores a consented lead',
    t.scalar(null, 'anon', format($q$select public.submit_lead_v2('cadet','parents','Parent Test','p2@test.invalid',null,'{"student":"A, 9"}','v1',true,%L::jsonb,%L)->>'status'$q$,
      '{"path":"/parents","utm_source":"flyer","utm_medium":"qr","ip":"203.0.113.9","ua":"secret","hub":"zone-01a"}', key1)), 'stored');
  perform t.eq('intake: same idempotency key is a duplicate, not a second row',
    t.scalar(null, 'anon', format($q$select public.submit_lead_v2('cadet','parents','Parent Test','p2@test.invalid',null,'{}','v1',true,'{}',%L)->>'status'$q$, key1)), 'duplicate');
  perform t.eq('intake: exactly one row for the key', (select count(*)::text from public.onboarding_leads where idempotency_key = key1), '1');

  select attribution into attr from public.onboarding_leads where idempotency_key = key1;
  perform t.eq('intake: attribution keeps allowed keys', (attr ? 'utm_source' and attr ? 'path' and attr ? 'hub')::text, 'true');
  perform t.eq('intake: attribution drops ip and user agent', (attr ? 'ip' or attr ? 'ua')::text, 'false');
  perform t.eq('intake: consent time recorded', (select (consent_at is not null)::text from public.onboarding_leads where idempotency_key = key1), 'true');
  perform t.eq('intake: gate recorded', (select gate from public.onboarding_leads where idempotency_key = key1), 'parents');
  perform t.eq('intake: submission audited with gate',
    (select count(*)::text from public.audit_events where action = 'lead.submitted' and metadata->>'gate' = 'parents'), '1');

  -- refusals
  perform t.eq('intake: no consent rejected',
    t.scalar(null, 'anon', $q$select public.submit_lead_v2('cadet','parents','Parent Test','p@test.invalid',null,'{}','v1',false,'{}','k_test_0000000000000002')::text$q$), 'ERR:P0001');
  perform t.eq('intake: null consent rejected',
    t.scalar(null, 'anon', $q$select public.submit_lead_v2('cadet','parents','Parent Test','p@test.invalid',null,'{}','v1',null,'{}','k_test_0000000000000003')::text$q$), 'ERR:P0001');
  perform t.eq('intake: malformed idempotency key rejected',
    t.scalar(null, 'anon', $q$select public.submit_lead_v2('cadet','parents','Parent Test','p@test.invalid',null,'{}','v1',true,'{}','short')::text$q$), 'ERR:P0001');
  perform t.eq('intake: invalid gate rejected',
    t.scalar(null, 'anon', $q$select public.submit_lead_v2('cadet','Parents!','Parent Test','p@test.invalid',null,'{}','v1',true,'{}','k_test_0000000000000004')::text$q$), 'ERR:P0001');
  perform t.eq('intake: missing contact rejected',
    t.scalar(null, 'anon', $q$select public.submit_lead_v2('school','mou','Trustee Test',null,null,'{}','v1',true,'{}','k_test_0000000000000005')::text$q$), 'ERR:P0001');

  -- privacy of stored leads
  perform t.eq('intake: anon cannot read leads', t.scalar(null, 'anon', 'select count(*) from public.onboarding_leads'), 'ERR:42501');
  perform t.eq('intake: guardian cannot read leads', t.scalar(g1, 'authenticated', 'select count(*) from public.onboarding_leads where gate is not null'), '0');
  perform t.eq('intake: operations can read the stored lead', t.scalar(ops, 'authenticated', format('select count(*) from public.onboarding_leads where idempotency_key = %L', key1)), '1');
  perform t.eq('intake: anon cannot insert directly',
    t.dml(null, 'anon', $q$insert into public.onboarding_leads (lead_type, contact_name, privacy_notice_version) values ('cadet','X','v1')$q$), 'ERR:42501');

  -- rate limiter
  perform t.eq('rate: first hit allowed', t.scalar(null, 'anon', $q$select public.consume_rate_limit('lead:0123456789abcdef0123456789abcdef', 2, 600)::text$q$), 'true');
  perform t.eq('rate: second hit allowed', t.scalar(null, 'anon', $q$select public.consume_rate_limit('lead:0123456789abcdef0123456789abcdef', 2, 600)::text$q$), 'true');
  perform t.eq('rate: third hit refused', t.scalar(null, 'anon', $q$select public.consume_rate_limit('lead:0123456789abcdef0123456789abcdef', 2, 600)::text$q$), 'false');
  perform t.eq('rate: other bucket unaffected', t.scalar(null, 'anon', $q$select public.consume_rate_limit('lead:fedcba9876543210fedcba9876543210', 2, 600)::text$q$), 'true');
  perform t.eq('rate: raw value as bucket rejected', t.scalar(null, 'anon', $q$select public.consume_rate_limit('203.0.113.9', 2, 600)::text$q$), 'ERR:P0001');
  perform t.eq('rate: absurd limit rejected', t.scalar(null, 'anon', $q$select public.consume_rate_limit('lead:0123456789abcdef0123456789abcdef', 0, 600)::text$q$), 'ERR:P0001');
  perform t.eq('rate: anon cannot read the limiter table', t.scalar(null, 'anon', 'select count(*) from app_private.rate_limits'), 'ERR:42501');

  -- the original v1 function still works (backwards compatible)
  perform t.eq('intake: v1 submit_lead still accepted', t.scalar(null, 'anon', $q$select public.submit_lead('school','Trustee Test','t@test.invalid',null,'{}','v1')::text$q$), 'true');
end $$;

select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end as result
from t.results where n > :start_n order by n;
