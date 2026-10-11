-- Authorization, business-rule and privacy tests. Run by tests/run.sh on a THROWAWAY Postgres only.
create schema t;
create table t.results (n serial, name text, ok boolean, detail text);

create function t.as_user(uid uuid, r text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  execute format('set local role %I', r);
end $$;

-- scalar query under a role; returns the value as text or ERR:<sqlstate>
create function t.scalar(uid uuid, r text, q text) returns text language plpgsql as $$
declare v text;
begin
  perform t.as_user(uid, r);
  begin
    execute q into v;
  exception when others then
    reset role; perform set_config('request.jwt.claim.sub', '', true);
    return 'ERR:' || sqlstate;
  end;
  reset role; perform set_config('request.jwt.claim.sub', '', true);
  return coalesce(v, 'NULL');
end $$;

-- DML under a role; returns OK:<rows> or ERR:<sqlstate>
create function t.dml(uid uuid, r text, q text) returns text language plpgsql as $$
declare n bigint;
begin
  perform t.as_user(uid, r);
  begin
    execute q;
    get diagnostics n = row_count;
  exception when others then
    reset role; perform set_config('request.jwt.claim.sub', '', true);
    return 'ERR:' || sqlstate;
  end;
  reset role; perform set_config('request.jwt.claim.sub', '', true);
  return 'OK:' || n;
end $$;

create function t.eq(nm text, got text, want text) returns void language sql as $$
  insert into t.results (name, ok, detail) values (nm, got is not distinct from want, 'got=' || coalesce(got,'<null>') || ' want=' || want) $$;
create function t.like_(nm text, got text, pat text) returns void language sql as $$
  insert into t.results (name, ok, detail) values (nm, got like pat, 'got=' || coalesce(got,'<null>') || ' want like ' || pat) $$;

-- ---------------------------------------------------------------- fixtures (superuser)
do $$
declare
  ops uuid := '00000000-0000-0000-0000-0000000000a1';
  exe uuid := '00000000-0000-0000-0000-0000000000a2';
  ia  uuid := '00000000-0000-0000-0000-0000000000b1';
  ib  uuid := '00000000-0000-0000-0000-0000000000b2';
  g1  uuid := '00000000-0000-0000-0000-0000000000c1';
  g2  uuid := '00000000-0000-0000-0000-0000000000c2';
  cp1 uuid := '00000000-0000-0000-0000-0000000000d1';
  sp  uuid := '00000000-0000-0000-0000-0000000000e1';
  c1  uuid := '00000000-0000-0000-0000-00000000f001';
  c2  uuid := '00000000-0000-0000-0000-00000000f002';
  hub uuid;
begin
  insert into auth.users (id, email) select x, x::text || '@test.invalid' from unnest(array[ops,exe,ia,ib,g1,g2,cp1,sp]) x;
  insert into public.profiles (id, display_name, role) values
    (ops,'Ops Test','operations'),(exe,'Exec Test','executive_admin'),(ia,'Instructor A','instructor'),
    (ib,'Instructor B','instructor'),(g1,'Guardian 1','parent_guardian'),(g2,'Guardian 2','parent_guardian'),
    (cp1,'Cadet One','cadet'),(sp,'Partner','school_partner');
  insert into public.cadets (id, profile_id, public_display_name) values (c1, cp1, 'Cadet Test One'), (c2, null, 'Cadet Test Two');
  insert into public.cadet_guardians (cadet_id, guardian_profile_id) values (c1, g1), (c2, g2);
  insert into public.instructor_assignments (instructor_profile_id, cadet_id) values (ia, c1), (ib, c2);
  select id into hub from public.school_hubs where code = '01A';
  insert into public.hub_members (profile_id, hub_id) values (sp, hub);
  insert into public.training_sessions (id, cadet_id, instructor_profile_id, started_at)
    values ('00000000-0000-0000-0000-00000005e001', c1, ia, now()), ('00000000-0000-0000-0000-00000005e002', c2, ib, now());
  insert into public.onboarding_leads (lead_type, contact_name, email, privacy_notice_version) values ('cadet','Seed Lead','x@test.invalid','v0');
end $$;

-- ---------------------------------------------------------------- tests
do $$
declare
  ops uuid := '00000000-0000-0000-0000-0000000000a1';
  exe uuid := '00000000-0000-0000-0000-0000000000a2';
  ia  uuid := '00000000-0000-0000-0000-0000000000b1';
  ib  uuid := '00000000-0000-0000-0000-0000000000b2';
  g1  uuid := '00000000-0000-0000-0000-0000000000c1';
  g2  uuid := '00000000-0000-0000-0000-0000000000c2';
  cp1 uuid := '00000000-0000-0000-0000-0000000000d1';
  sp  uuid := '00000000-0000-0000-0000-0000000000e1';
  c1  uuid := '00000000-0000-0000-0000-00000000f001';
  c2  uuid := '00000000-0000-0000-0000-00000000f002';
  s1  uuid := '00000000-0000-0000-0000-00000005e001';
  s2  uuid := '00000000-0000-0000-0000-00000005e002';
  raw text; raw2 text; cred uuid; v jsonb; hub uuid; n_leads_before bigint;
begin
  -- seed data
  perform t.eq('seed: 13 pillars', (select count(*)::text from public.curriculum_pillars), '13');
  perform t.eq('seed: pillars per phase command/crucible/foundation = 4/6/3', (select string_agg(c::text, '/' order by phase) from (select phase, count(*) c from public.curriculum_pillars group by phase) q), '4/6/3');
  perform t.eq('seed: 6 zones', (select count(*)::text from public.regional_zones), '6');
  perform t.eq('seed: three prospect hubs only', (select count(*)::text from public.school_hubs where status = 'prospect'), '3');
  perform t.eq('seed: no cadets/partners beyond fixtures', (select count(*)::text from public.school_hubs where status <> 'prospect'), '0');

  -- anonymous visitor
  perform t.eq('anon: cannot read cadets', t.scalar(null, 'anon', 'select count(*) from public.cadets'), 'ERR:42501');
  perform t.eq('anon: cannot read leads', t.scalar(null, 'anon', 'select count(*) from public.onboarding_leads'), 'ERR:42501');
  perform t.eq('anon: cannot read profiles', t.scalar(null, 'anon', 'select count(*) from public.profiles'), 'ERR:42501');
  perform t.eq('anon: cannot read credentials', t.scalar(null, 'anon', 'select count(*) from public.passport_credentials'), 'ERR:42501');
  perform t.eq('anon: cannot read audit', t.scalar(null, 'anon', 'select count(*) from public.audit_events'), 'ERR:42501');
  perform t.eq('anon: cannot read school_hubs (contract fields)', t.scalar(null, 'anon', 'select count(*) from public.school_hubs'), 'ERR:42501');
  perform t.eq('anon: cannot insert a lead directly', t.dml(null, 'anon', $q$insert into public.onboarding_leads (lead_type, contact_name, email, privacy_notice_version) values ('cadet','x','a@b.co','v1')$q$), 'ERR:42501');
  perform t.eq('anon: can read the 13 pillars', t.scalar(null, 'anon', 'select count(*) from public.curriculum_pillars'), '13');
  perform t.eq('anon: public hub labels visible', t.scalar(null, 'anon', 'select count(*) from public.public_hub_labels'), '3');
  perform t.eq('anon: hub labels expose no finance/contract columns',
    (select count(*)::text from information_schema.columns where table_name = 'public_hub_labels'
       and column_name in ('contract_reference','revenue_share_pct','zero_capex_invested','acreage')), '0');
  perform t.eq('anon: cannot issue credentials', t.scalar(null, 'anon', $q$select public.issue_passport_credential('00000000-0000-0000-0000-00000000f001','x')$q$), 'ERR:42501');

  -- lead intake
  select count(*) into n_leads_before from public.onboarding_leads;
  perform t.eq('lead: anon valid submission accepted', t.scalar(null, 'anon', $q$select public.submit_lead('cadet','Parent Test','p@test.invalid',null,'{"grade":"6"}','v1')::text$q$), 'true');
  perform t.eq('lead: row stored', (select (count(*) - n_leads_before)::text from public.onboarding_leads), '1');
  perform t.eq('lead: bad email rejected', t.scalar(null, 'anon', $q$select public.submit_lead('cadet','Parent Test','not-an-email',null,'{}','v1')::text$q$), 'ERR:P0001');
  perform t.eq('lead: no contact rejected', t.scalar(null, 'anon', $q$select public.submit_lead('cadet','Parent Test',null,null,'{}','v1')::text$q$), 'ERR:P0001');
  perform t.eq('lead: missing privacy version rejected', t.scalar(null, 'anon', $q$select public.submit_lead('cadet','Parent Test','p@test.invalid',null,'{}','')::text$q$), 'ERR:P0001');
  perform t.eq('lead: oversize payload rejected', t.scalar(null, 'anon', format($q$select public.submit_lead('cadet','Parent Test','p@test.invalid',null,%L::jsonb,'v1')::text$q$, jsonb_build_object('x', repeat('a', 5000))::text)), 'ERR:P0001');
  perform t.eq('lead: guardian cannot read leads', t.scalar(g1, 'authenticated', 'select count(*) from public.onboarding_leads'), '0');
  perform t.eq('lead: admin can read leads', (t.scalar(ops, 'authenticated', 'select count(*) from public.onboarding_leads')::int >= 2)::text, 'true');
  perform t.eq('lead: admin cannot rewrite contact fields (column grant)', t.dml(ops, 'authenticated', $q$update public.onboarding_leads set contact_name = 'Changed'$q$), 'ERR:42501');
  perform t.eq('lead: admin can update status', t.dml(ops, 'authenticated', $q$update public.onboarding_leads set status = 'reviewing' where contact_name = 'Seed Lead'$q$), 'OK:1');

  -- cadet records scoping
  perform t.eq('guardian1 sees only own child', t.scalar(g1, 'authenticated', 'select string_agg(public_display_name, ''|'') from public.cadets'), 'Cadet Test One');
  perform t.eq('guardian2 sees only own child', t.scalar(g2, 'authenticated', 'select string_agg(public_display_name, ''|'') from public.cadets'), 'Cadet Test Two');
  perform t.eq('cadet sees only self', t.scalar(cp1, 'authenticated', 'select string_agg(public_display_name, ''|'') from public.cadets'), 'Cadet Test One');
  perform t.eq('instructor A sees only assigned cadet', t.scalar(ia, 'authenticated', 'select string_agg(public_display_name, ''|'') from public.cadets'), 'Cadet Test One');
  perform t.eq('instructor B sees only assigned cadet', t.scalar(ib, 'authenticated', 'select string_agg(public_display_name, ''|'') from public.cadets'), 'Cadet Test Two');
  perform t.eq('admin sees all cadets', t.scalar(ops, 'authenticated', 'select count(*) from public.cadets'), '2');
  perform t.eq('school partner sees no cadets', t.scalar(sp, 'authenticated', 'select count(*) from public.cadets'), '0');
  perform t.eq('guardian1 cannot see other child sessions', t.scalar(g1, 'authenticated', 'select count(*) from public.training_sessions'), '1');
  perform t.eq('guardian cannot edit cadet', t.dml(g1, 'authenticated', $q$update public.cadets set current_rank = 'knight'$q$), 'OK:0');
  perform t.eq('instructor A cannot create session for unassigned cadet', t.dml(ia, 'authenticated', format($q$insert into public.training_sessions (cadet_id, instructor_profile_id, started_at) values (%L, %L, now())$q$, c2, ia)), 'ERR:42501');
  perform t.eq('instructor A can create session for assigned cadet', t.dml(ia, 'authenticated', format($q$insert into public.training_sessions (cadet_id, instructor_profile_id, started_at) values (%L, %L, now())$q$, c1, ia)), 'OK:1');
  perform t.eq('instructor A can log pillar on own session', t.dml(ia, 'authenticated', format($q$insert into public.session_pillar_logs (session_id, pillar_id, assessment, assessed_by) values (%L, 1, 'developing', %L)$q$, s1, ia)), 'OK:1');
  perform t.eq('instructor A cannot log pillar on other instructor session', t.dml(ia, 'authenticated', format($q$insert into public.session_pillar_logs (session_id, pillar_id, assessment, assessed_by) values (%L, 1, 'developing', %L)$q$, s2, ia)), 'ERR:42501');
  perform t.eq('instructor cannot spoof assessor', t.dml(ia, 'authenticated', format($q$insert into public.session_pillar_logs (session_id, pillar_id, assessment, assessed_by) values (%L, 2, 'developing', %L)$q$, s1, ib)), 'ERR:42501');

  -- role escalation
  perform t.eq('cadet cannot self-promote to executive_admin', t.dml(cp1, 'authenticated', $q$update public.profiles set role = 'executive_admin' where id = '00000000-0000-0000-0000-0000000000d1'$q$), 'ERR:42501');
  perform t.eq('operations cannot self-promote', t.dml(ops, 'authenticated', $q$update public.profiles set role = 'executive_admin' where id = '00000000-0000-0000-0000-0000000000a1'$q$), 'ERR:42501');
  perform t.eq('cadet cannot change another profile', t.dml(cp1, 'authenticated', $q$update public.profiles set display_name = 'x' where id = '00000000-0000-0000-0000-0000000000a1'$q$), 'OK:0');
  perform t.eq('cadet can change own display name', t.dml(cp1, 'authenticated', $q$update public.profiles set display_name = 'Cadet One B' where id = '00000000-0000-0000-0000-0000000000d1'$q$), 'OK:1');
  perform t.eq('executive_admin can change a role', t.dml(exe, 'authenticated', $q$update public.profiles set role = 'operations' where id = '00000000-0000-0000-0000-0000000000e1'$q$), 'OK:1');
  perform t.eq('role change is audited', (select count(*)::text from public.audit_events where action = 'profile.role_changed'), '1');
  update public.profiles set role = 'school_partner' where id = sp;  -- restore (trusted context, audited)

  -- rank decisions
  perform t.eq('rank: instructor cannot approve', t.dml(ia, 'authenticated', format($q$insert into public.cadet_rank_history (cadet_id,to_rank,decision,assessor_profile_id,criteria_version,evidence_summary) values (%L,'rider','approved',%L,'draft-0','Observed trot transitions on 2026-10-01')$q$, c1, ia)), 'ERR:42501');
  perform t.eq('rank: guardian cannot approve', t.dml(g1, 'authenticated', format($q$insert into public.cadet_rank_history (cadet_id,to_rank,decision,assessor_profile_id,criteria_version,evidence_summary) values (%L,'rider','approved',%L,'draft-0','Observed trot transitions on 2026-10-01')$q$, c1, g1)), 'ERR:42501');
  perform t.eq('rank: admin cannot skip a rank', t.dml(ops, 'authenticated', format($q$insert into public.cadet_rank_history (cadet_id,to_rank,decision,assessor_profile_id,criteria_version,evidence_summary) values (%L,'knight','approved',%L,'draft-0','Observed everything on 2026-10-01')$q$, c1, ops)), 'ERR:P0001');
  perform t.eq('rank: evidence required', t.dml(ops, 'authenticated', format($q$insert into public.cadet_rank_history (cadet_id,to_rank,decision,assessor_profile_id,criteria_version,evidence_summary) values (%L,'rider','approved',%L,'draft-0','')$q$, c1, ops)), 'ERR:P0001');
  perform t.eq('rank: cannot spoof assessor', t.dml(ops, 'authenticated', format($q$insert into public.cadet_rank_history (cadet_id,to_rank,decision,assessor_profile_id,criteria_version,evidence_summary) values (%L,'rider','approved',%L,'draft-0','Observed trot transitions on 2026-10-01')$q$, c1, exe)), 'ERR:42501');
  perform t.eq('rank: admin approves next rank', t.dml(ops, 'authenticated', format($q$insert into public.cadet_rank_history (cadet_id,to_rank,decision,assessor_profile_id,criteria_version,evidence_summary) values (%L,'rider','approved',%L,'draft-0','Observed trot transitions on 2026-10-01')$q$, c1, ops)), 'OK:1');
  perform t.eq('rank: cadet current_rank updated', (select current_rank::text from public.cadets where id = c1), 'rider');
  perform t.eq('rank: from_rank recorded by trigger', (select from_rank::text from public.cadet_rank_history where cadet_id = c1), 'squire');
  perform t.eq('rank: history cannot be updated', t.dml(ops, 'authenticated', $q$update public.cadet_rank_history set evidence_summary = 'edited later'$q$), 'ERR:42501');  -- no UPDATE grant at all; trigger is a second line of defence
  perform t.eq('rank: history cannot be deleted', t.dml(ops, 'authenticated', $q$delete from public.cadet_rank_history$q$), 'ERR:42501');
  begin update public.cadet_rank_history set evidence_summary = 'tamper attempt text'; perform t.eq('rank: trigger rejects UPDATE for superuser', 'updated', 'blocked');
  exception when others then perform t.eq('rank: trigger rejects UPDATE for superuser', 'blocked', 'blocked'); end;
  begin delete from public.cadet_rank_history; perform t.eq('rank: history cannot be deleted even by superuser trigger', 'deleted', 'blocked');
  exception when others then perform t.eq('rank: history cannot be deleted even by superuser trigger', 'blocked', 'blocked'); end;
  perform t.eq('rank: guardian sees own child history only', t.scalar(g1, 'authenticated', 'select count(*) from public.cadet_rank_history'), '1');
  perform t.eq('rank: other guardian sees none', t.scalar(g2, 'authenticated', 'select count(*) from public.cadet_rank_history'), '0');
  perform t.eq('rank: reversal restores previous rank', t.dml(ops, 'authenticated', format($q$insert into public.cadet_rank_history (cadet_id,to_rank,decision,assessor_profile_id,criteria_version,evidence_summary) values (%L,'rider','reversed',%L,'draft-0','Approved in error; corrected 2026-10-02')$q$, c1, ops)), 'OK:1');
  perform t.eq('rank: after reversal back to squire', (select current_rank::text from public.cadets where id = c1), 'squire');
  perform t.eq('rank: reversal needs a prior approval', t.dml(ops, 'authenticated', format($q$insert into public.cadet_rank_history (cadet_id,to_rank,decision,assessor_profile_id,criteria_version,evidence_summary) values (%L,'rider','reversed',%L,'draft-0','Nothing to reverse here at all')$q$, c2, ops)), 'ERR:P0001');
  perform t.eq('rank: rejection keeps rank', t.dml(ops, 'authenticated', format($q$insert into public.cadet_rank_history (cadet_id,to_rank,decision,assessor_profile_id,criteria_version,evidence_summary) values (%L,'rider','rejected',%L,'draft-0','Not ready: canter transitions unstable')$q$, c2, ops)), 'OK:1');
  perform t.eq('rank: rank unchanged after rejection', (select current_rank::text from public.cadets where id = c2), 'squire');
  perform t.eq('rank: decisions are audited', (select (count(*) >= 3)::text from public.audit_events where action like 'rank.%'), 'true');

  -- Passport credentials
  perform t.eq('passport: instructor cannot issue', t.scalar(ia, 'authenticated', format($q$select public.issue_passport_credential(%L,'rank_passport')$q$, c1)), 'ERR:42501');
  perform t.eq('passport: guardian cannot issue', t.scalar(g1, 'authenticated', format($q$select public.issue_passport_credential(%L,'rank_passport')$q$, c1)), 'ERR:42501');
  raw := t.scalar(ops, 'authenticated', format($q$select public.issue_passport_credential(%L,'rank_passport')$q$, c1));
  perform t.like_('passport: admin issues, code returned once', raw, 'BP-%');
  perform t.eq('passport: raw code is not stored', (select count(*)::text from public.passport_credentials where public_code_hash = raw), '0');
  perform t.eq('passport: stored hash is SHA-256 hex', (select (length(public_code_hash) = 64)::text from public.passport_credentials limit 1), 'true');
  v := t.scalar(null, 'anon', format($q$select public.verify_passport(%L)::text$q$, raw))::jsonb;
  perform t.eq('verify: valid status', v->>'status', 'valid');
  perform t.eq('verify: output is minimal', (select string_agg(k, ',' order by k) from jsonb_object_keys(v) k), 'credential_type,issued_at,rank,status');
  perform t.eq('verify: unknown code', (t.scalar(null, 'anon', $q$select public.verify_passport('BP-DOESNOTEXIST0000')::text$q$)::jsonb)->>'status', 'unknown');
  perform t.eq('verify: null/short code', (t.scalar(null, 'anon', $q$select public.verify_passport('x')::text$q$)::jsonb)->>'status', 'unknown');
  perform t.eq('verify: anon cannot read credential table', t.scalar(null, 'anon', 'select count(*) from public.passport_credentials'), 'ERR:42501');
  perform t.eq('passport: guardian sees own child credentials', t.scalar(g1, 'authenticated', 'select count(*) from public.passport_credentials'), '1');
  perform t.eq('passport: other guardian sees none', t.scalar(g2, 'authenticated', 'select count(*) from public.passport_credentials'), '0');
  perform t.eq('passport: expiry must be in the future', t.scalar(ops, 'authenticated', format($q$select public.issue_passport_credential(%L,'rank_passport', now() - interval '1 day')$q$, c1)), 'ERR:P0001');
  raw2 := t.scalar(ops, 'authenticated', format($q$select public.issue_passport_credential(%L,'event_pass', now() + interval '1 day')$q$, c1));
  perform t.eq('verify: unexpired dated credential valid', (t.scalar(null, 'anon', format($q$select public.verify_passport(%L)::text$q$, raw2))::jsonb)->>'status', 'valid');
  update public.passport_credentials set expires_at = now() - interval '1 minute' where public_code_hash = encode(extensions.digest(raw2, 'sha256'), 'hex');
  perform t.eq('verify: expired', (t.scalar(null, 'anon', format($q$select public.verify_passport(%L)::text$q$, raw2))::jsonb)->>'status', 'expired');
  select id into cred from public.passport_credentials where public_code_hash = encode(extensions.digest(raw, 'sha256'), 'hex');
  perform t.eq('passport: instructor cannot revoke', t.scalar(ia, 'authenticated', format($q$select public.revoke_passport_credential(%L)::text$q$, cred)), 'ERR:42501');
  perform t.eq('passport: admin revokes', t.scalar(ops, 'authenticated', format($q$select 'done' from (select public.revoke_passport_credential(%L)) x$q$, cred)), 'done');
  perform t.eq('verify: revoked', (t.scalar(null, 'anon', format($q$select public.verify_passport(%L)::text$q$, raw))::jsonb)->>'status', 'revoked');
  perform t.eq('verify: revoked output reveals nothing else', (select count(*)::text from jsonb_object_keys(t.scalar(null, 'anon', format($q$select public.verify_passport(%L)::text$q$, raw))::jsonb)), '1');

  -- hubs: commercial status needs evidence
  select id into hub from public.school_hubs where code = '01A';
  perform t.eq('hub: cannot be marked active without evidence', t.dml(ops, 'authenticated', $q$update public.school_hubs set status = 'active' where code = '01A'$q$), 'ERR:23514');
  perform t.eq('hub: contracted needs verification date too', t.dml(ops, 'authenticated', $q$update public.school_hubs set status = 'contracted', contract_reference = 'REF-TEST' where code = '01A'$q$), 'ERR:23514');
  perform t.eq('hub: contracted with evidence accepted', t.dml(ops, 'authenticated', $q$update public.school_hubs set status = 'contracted', contract_reference = 'REF-TEST', status_verified_at = now() where code = '01A'$q$), 'OK:1');
  perform t.eq('hub: status change audited', (select count(*)::text from public.audit_events where action = 'hub.status_changed'), '1');
  perform t.eq('hub: partner member sees own hub', t.scalar(sp, 'authenticated', 'select count(*) from public.school_hubs'), '1');
  perform t.eq('hub: guardian sees no hub records', t.scalar(g1, 'authenticated', 'select count(*) from public.school_hubs'), '0');
  perform t.eq('hub: partner cannot change status', t.dml(sp, 'authenticated', $q$update public.school_hubs set status = 'active'$q$), 'OK:0');
  perform t.eq('hub: public label shows contracted status only as label (no contract ref column)', t.scalar(null, 'anon', $q$select status::text from public.public_hub_labels where code = '01A'$q$), 'contracted');

  -- claims ledger
  perform t.eq('claim: cannot go live without evidence', t.dml(ops, 'authenticated', $q$insert into public.approved_claims (claim_key, public_copy, active) values ('c1','Some claim', true)$q$), 'ERR:23514');
  perform t.eq('claim: inactive draft accepted', t.dml(ops, 'authenticated', $q$insert into public.approved_claims (claim_key, public_copy) values ('c2','Draft claim')$q$), 'OK:1');
  perform t.eq('claim: anon sees no draft claims', t.scalar(null, 'anon', 'select count(*) from public.approved_claims'), '0');
  perform t.eq('claim: guardian update changes zero rows (RLS)', t.dml(g1, 'authenticated', $q$update public.approved_claims set active = true$q$), 'OK:0');
  perform t.eq('claim: still no active claims', (select count(*)::text from public.approved_claims where active), '0');

  -- audit log
  perform t.eq('audit: executive can read', (t.scalar(exe, 'authenticated', 'select count(*) from public.audit_events')::int > 0)::text, 'true');
  perform t.eq('audit: operations cannot read', t.scalar(ops, 'authenticated', 'select count(*) from public.audit_events'), '0');
  perform t.eq('audit: cannot be edited', t.dml(exe, 'authenticated', 'update public.audit_events set action = ''x'''), 'ERR:42501');
end $$;

select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end as result
from t.results order by n;
