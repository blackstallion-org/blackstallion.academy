#!/usr/bin/env bash
# Rehearsal of the backup and restore procedure in docs/DEPLOYMENT_RUNBOOK.md §8, on THROWAWAY Postgres only.
# Builds the live replica (stub → baseline snapshot → website layer → security fixes → anon hardening), adds synthetic
# rows through the public RPC, takes a logical backup exactly as the runbook describes, restores it into a second,
# fresh database that has only what a new Supabase project already has (the stub and Supabase's default privileges),
# and compares row counts, row level security flags, policies, schema / table / column / sequence privileges, default
# privileges and function definitions/grants between the two. A third database restored the naive way proves why the
# runbook's two extra steps (neutralise the default privileges first; re-run the migrations afterwards) are needed.
# usage: supabase/live/tests/backup_restore_rehearsal.sh   (run as a non-root user; needs postgres 16 binaries)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; LIVE="$(cd "$HERE/.." && pwd)"; BIN=/usr/lib/postgresql/16/bin
D="$(mktemp -d)"; trap '"$BIN/pg_ctl" -D "$D/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$D"' EXIT
"$BIN/initdb" -D "$D/data" -U postgres --auth=trust >/dev/null
"$BIN/pg_ctl" -D "$D/data" -o "-p 54331 -k $D -c listen_addresses=''" -l "$D/log" -w start >/dev/null
export PATH="$BIN:$PATH"
CONN="-h $D -p 54331 -U postgres"
PS="psql $CONN -q -X -v ON_ERROR_STOP=1"

# A brand-new Supabase project already contains: the API roles, the auth and storage schemas (the stub), and default
# privileges that open every new table / sequence / function made by postgres in public to the API roles. The three
# "create role" lines of the stub run once (roles belong to the whole cluster); later databases only get the schemas.
DEFAULTS_ON="
alter default privileges for role postgres in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on functions to anon, authenticated, service_role;"
DEFAULTS_OFF="
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, service_role;"
fresh_project() {  # $1 = database name, $2 = "roles" for the first database of the cluster
  $PS -c "create database $1 encoding 'UTF8' lc_collate 'C' lc_ctype 'C' template template0"
  if [ "${2:-}" = roles ]; then $PS -d "$1" -f "$HERE/00_stub.sql"; else sed '/^create role /d' "$HERE/00_stub.sql" | $PS -d "$1"; fi
  $PS -d "$1" -c "$DEFAULTS_ON"
}
fresh_project src roles
fresh_project dst
fresh_project ctl

MIGRATIONS=("$LIVE/migrations/20261023001000_website_layer.sql" "$LIVE/migrations/20261023001100_security_fixes.sql" \
            "$LIVE/migrations/20261023001200_anon_privacy_hardening.sql")
echo "build the replica of the live project in src"
for f in "$LIVE/baseline/20261023_live_snapshot.sql" "${MIGRATIONS[@]}"; do
  $PS -d src -f "$f" 2>&1 | grep -v 'NOTICE:' || true
done

echo "add synthetic rows (staff user, three enquiries through the public RPC, one document record)"
$PS -d src -t -A <<'SQL' >/dev/null
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000aa', 'staff.synthetic@example.test');
set role anon;
select public.submit_lead_v2('school', 'mou', 'Synthetic Trustee One', 'one@example.test', null, '{"school":"Synthetic School"}', '2026-10-draft', true, '{"path":"/schools/mou"}', 'rehearsal-key-000000000001');
select public.submit_lead_v2('cadet', 'cadet_enrol', 'Synthetic Parent Two', null, '+910000000002', '{}', '2026-10-draft', true, '{"qr":"rehearsal"}', 'rehearsal-key-000000000002');
select public.submit_lead_v2('board_audit', 'audit', 'Synthetic Board Three', 'three@example.test', null, '{}', '2026-10-draft', true, '{}', 'rehearsal-key-000000000003');
reset role;
insert into public.generated_documents (kind, title, storage_path, created_by)
  values ('mou_draft', 'Synthetic MOU draft', 'mou/2026/10/rehearsal-0001.pdf', '00000000-0000-0000-0000-0000000000aa');
SQL

echo "backup (runbook §8): public + app_private schemas with their grants, and the auth users they reference"
pg_dump $CONN -d src --format=custom --no-owner --schema=public --schema=app_private -f "$D/app.dump"
pg_dump $CONN -d src --format=custom --no-owner --data-only --table=auth.users -f "$D/auth_users.dump"

# The public schema (with its comment and grants) already exists in every Supabase project, so its three entries are
# left out of the restore list; everything else is restored with the first error stopping the run.
pg_restore -l "$D/app.dump" | grep -v -E '^[0-9]+; [0-9]+ [0-9]+ (SCHEMA - public|COMMENT - SCHEMA public|ACL - SCHEMA public) ' > "$D/app.list"
restore_into() {
  pg_restore $CONN -d "$1" --no-owner --exit-on-error "$D/auth_users.dump"
  pg_restore $CONN -d "$1" --no-owner --exit-on-error -L "$D/app.list" "$D/app.dump"
}

echo "control: restore the naive way into ctl (default privileges left on)"
restore_into ctl

echo "restore per runbook into dst: default privileges off, restore, re-run the migrations, default privileges back on"
$PS -d dst -c "$DEFAULTS_OFF"
restore_into dst
for f in "${MIGRATIONS[@]}"; do $PS -d dst -f "$f" 2>&1 | grep -v 'NOTICE:' || true; done   # storage buckets/policies live outside the dump
$PS -d dst -c "$DEFAULTS_ON"

# Everything below prints one comparable text block per database.
snapshot() {
  $PS -d "$1" -t -A <<'SQL'
-- effective privileges as sorted text; an unset ACL (null) means "owner only", so it is spelled out the same way
create function pg_temp.eff(acl aclitem[], kind "char", owner oid) returns text language sql as $$
  select coalesce(string_agg(g || ':' || p, ',' order by g, p), '-')
    from (select case when a.grantee = 0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end as g,
                 a.privilege_type || case when a.is_grantable then '*' else '' end as p
            from aclexplode(coalesce(acl, acldefault(kind, owner))) a) x $$;
select '== row counts';
select table_schema || '.' || table_name || ' ' ||
       (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text
  from information_schema.tables
 where table_schema in ('public', 'app_private', 'auth') and table_type = 'BASE TABLE' order by 1;
select '== row level security';
select n.nspname || '.' || c.relname || ' rls=' || c.relrowsecurity || ' force=' || c.relforcerowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname in ('public', 'app_private') and c.relkind = 'r' order by 1;
select '== policies';
select schemaname || '.' || tablename || ' ' || policyname || ' ' || cmd || ' ' || roles::text || ' ' || coalesce(qual, '-') || ' ' || coalesce(with_check, '-')
  from pg_policies where schemaname in ('public', 'app_private', 'storage') order by 1;
select '== schema privileges';
select n.nspname || ' ' || pg_temp.eff(n.nspacl, 'n'::"char", n.nspowner) from pg_namespace n where n.nspname in ('public', 'app_private') order by 1;
select '== table and sequence privileges';
select n.nspname || '.' || c.relname || ' ' || c.relkind::text || ' ' ||
       pg_temp.eff(c.relacl, case when c.relkind = 'S' then 's'::"char" else 'r'::"char" end, c.relowner)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname in ('public', 'app_private') and c.relkind in ('r', 'v', 'm', 'S', 'p') order by 1;
select '== column privileges';
select n.nspname || '.' || c.relname || '.' || a.attname || ' ' || a.attacl::text
  from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
 where n.nspname in ('public', 'app_private') and a.attacl is not null and not a.attisdropped order by 1;
select '== default privileges';
select coalesce(n.nspname, '*') || ' ' || pg_get_userbyid(d.defaclrole) || ' ' || d.defaclobjtype::text || ' ' || d.defaclacl::text
  from pg_default_acl d left join pg_namespace n on n.oid = d.defaclnamespace order by 1;
select '== functions and execute grants';
select n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') ' || md5(pg_get_functiondef(p.oid)) || ' ' ||
       pg_temp.eff(p.proacl, 'f'::"char", p.proowner)
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname in ('public', 'app_private') order by 1;
select '== public cannot read enquiries';
select has_table_privilege('anon', 'public.onboarding_leads', 'select')::text || ' ' || has_table_privilege('authenticated', 'public.onboarding_leads', 'select')::text;
SQL
}
snapshot src > "$D/src.txt"
snapshot dst > "$D/dst.txt"
snapshot ctl > "$D/ctl.txt"
section() { awk -v s="== $2" '$0==s{f=1;next} /^== /{f=0} f' "$D/$1.txt"; }   # one named block of a snapshot

P=0; F=0
ok() { echo "PASS  $1"; P=$((P + 1)); }
no() { echo "FAIL  $1"; F=$((F + 1)); }
for name in "row counts" "row level security" "policies" "schema privileges" "table and sequence privileges" "column privileges" \
            "default privileges" "functions and execute grants" "public cannot read enquiries"; do
  a="$(section src "$name")"; b="$(section dst "$name")"
  if [ -n "$a" ] && [ "$a" = "$b" ]; then ok "$name identical after restore ($(echo "$a" | wc -l) lines)"; else no "$name differ"; diff <(echo "$a") <(echo "$b") | head -12 || true; fi
done
for name in "policies" "table and sequence privileges" "column privileges"; do   # what the naive restore (ctl) gets wrong
  echo "info  naive restore, $name: $(diff <(section src "$name") <(section ctl "$name") | grep -c '^[<>]') differing lines"
done
trap_seen="$($PS -d ctl -t -A -c "select has_table_privilege('anon', 'public.onboarding_leads', 'select')")"
[ "$trap_seen" = t ] && ok "control: a naive restore gives anonymous visitors read access to enquiries back (the extra steps are needed)" \
                     || no "control: the naive restore did not show the default-privilege trap, so the runbook's extra step is unproven"
leads="$($PS -d dst -t -A -c "select count(*) from public.onboarding_leads")"
[ "$leads" = 3 ] && ok "the three synthetic enquiries are back" || no "enquiries after restore: $leads"
audit="$($PS -d dst -t -A -c "select count(*) from public.audit_events where action = 'lead.submitted'")"
[ "$audit" = 3 ] && ok "their audit rows are back" || no "audit rows after restore: $audit"
echo "---- $P passed, $F failed"; [ "$F" = 0 ]
