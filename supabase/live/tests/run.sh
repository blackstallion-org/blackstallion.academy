#!/usr/bin/env bash
# Replica test of the LIVE operations project: stub → baseline snapshot → evidence → website layer (applied twice)
# → layer tests → security fixes (applied twice) → fix tests → anon hardening evidence → anon hardening (applied twice)
# → hardening tests → hardening rollback (twice) → rollback tests → hardening re-applied → layer rollback → rollback
# tests → hardening-after-layer-rollback tests. Throwaway Postgres only; never touches a real database.
# usage: supabase/live/tests/run.sh   (run as a non-root user; needs postgres 16 binaries, or set PG_BIN)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; LIVE="$(cd "$HERE/.." && pwd)"; BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"  # PG_BIN overrides it (e.g. /opt/homebrew/opt/postgresql@18/bin on a Mac)
D="$(mktemp -d)"; trap '"$BIN/pg_ctl" -D "$D/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$D"' EXIT
"$BIN/initdb" -D "$D/data" -U postgres --auth=trust >/dev/null
"$BIN/pg_ctl" -D "$D/data" -o "-p 54330 -k $D -c listen_addresses=''" -l "$D/log" -w start >/dev/null
PS="psql -h $D -p 54330 -U postgres -q -X"
# UTF8 like the live project (the default initdb locale here would give SQL_ASCII)
$PS -v ON_ERROR_STOP=1 -c "create database bsah_live encoding 'UTF8' lc_collate 'C' lc_ctype 'C' template template0"
PS="$PS -d bsah_live"
run() { $PS -v ON_ERROR_STOP=1 -f "$1"; }
tst() { $PS -v ON_ERROR_STOP=1 -t -A -f "$1" | tee -a "$D/out.txt"; }
: > "$D/out.txt"
run "$HERE/00_stub.sql"
run "$LIVE/baseline/20261023_live_snapshot.sql"
run "$HERE/01_helpers_fixtures.sql"
tst "$HERE/05_baseline_evidence.sql"
echo "apply 20261023001000_website_layer.sql (twice)"
run "$LIVE/migrations/20261023001000_website_layer.sql"; run "$LIVE/migrations/20261023001000_website_layer.sql"
tst "$HERE/10_website_layer_tests.sql"
echo "apply 20261023001100_security_fixes.sql (twice)"
run "$LIVE/migrations/20261023001100_security_fixes.sql"; run "$LIVE/migrations/20261023001100_security_fixes.sql"
tst "$HERE/20_security_fix_tests.sql"
tst "$HERE/35_anon_hardening_evidence.sql"
echo "apply 20261023001200_anon_privacy_hardening.sql (twice)"
run "$LIVE/migrations/20261023001200_anon_privacy_hardening.sql"; run "$LIVE/migrations/20261023001200_anon_privacy_hardening.sql"
tst "$HERE/40_anon_hardening_tests.sql"
echo "apply rollback of the anon privacy hardening (twice)"
run "$LIVE/rollback/20261023001200_anon_privacy_hardening_rollback.sql"; run "$LIVE/rollback/20261023001200_anon_privacy_hardening_rollback.sql"
tst "$HERE/41_anon_hardening_rollback_tests.sql"
echo "re-apply 20261023001200_anon_privacy_hardening.sql"
run "$LIVE/migrations/20261023001200_anon_privacy_hardening.sql"
echo "apply 20261029001300_bsah_media_library.sql (twice)"
run "$LIVE/migrations/20261029001300_bsah_media_library.sql"; run "$LIVE/migrations/20261029001300_bsah_media_library.sql"
tst "$HERE/60_bsah_media_library_tests.sql"
echo "the media library rollback must refuse while library rows exist"
if $PS -v ON_ERROR_STOP=1 -f "$LIVE/rollback/20261029001300_bsah_media_library_rollback.sql" >/dev/null 2>&1; then echo "FAIL  media library rollback ran while library rows existed" | tee -a "$D/out.txt"; else echo "PASS  media library rollback refuses while library rows exist" | tee -a "$D/out.txt"; fi
$PS -v ON_ERROR_STOP=1 -c "delete from public.media_assets where bucket = 'bsah-media'"
echo "apply rollback of the media library (twice)"
run "$LIVE/rollback/20261029001300_bsah_media_library_rollback.sql"; run "$LIVE/rollback/20261029001300_bsah_media_library_rollback.sql"
tst "$HERE/61_bsah_media_library_rollback_tests.sql"
echo "apply 20261104001400_registration_admissions.sql (twice)"
run "$LIVE/migrations/20261104001400_registration_admissions.sql"; run "$LIVE/migrations/20261104001400_registration_admissions.sql"
tst "$HERE/70_registration_tests.sql"
tst "$HERE/72_phone_signup_evidence.sql"
echo "apply 20261104001500_phone_and_oauth_signup.sql (twice)"
run "$LIVE/migrations/20261104001500_phone_and_oauth_signup.sql"; run "$LIVE/migrations/20261104001500_phone_and_oauth_signup.sql"
tst "$HERE/73_phone_signup_tests.sql"
echo "apply rollback of the phone sign-up change (twice), then the evidence must hold again"
run "$LIVE/rollback/20261104001500_phone_and_oauth_signup_rollback.sql"; run "$LIVE/rollback/20261104001500_phone_and_oauth_signup_rollback.sql"
tst "$HERE/74_phone_signup_rollback_tests.sql"
echo "apply 20261106001700_motion_lab.sql (twice)"
run "$LIVE/migrations/20261106001700_motion_lab.sql"; run "$LIVE/migrations/20261106001700_motion_lab.sql"
tst "$HERE/80_motion_lab_tests.sql"
echo "the motion lab rollback must refuse while a stored file exists, then work once it is gone (twice)"
$PS -v ON_ERROR_STOP=1 -c "insert into public.motion_sessions (owner_id, client_id, name, source, recorded_at, duration_ms, summary, models) select id, gen_random_uuid(), 'keep', 'upload', now(), 1, '{}', '{}' from auth.users limit 1"
if $PS -v ON_ERROR_STOP=1 -f "$LIVE/rollback/20261106001700_motion_lab_rollback.sql" >/dev/null 2>&1; then echo "FAIL  motion lab rollback ran while sessions existed" | tee -a "$D/out.txt"; else echo "PASS  motion lab rollback refuses while sessions exist" | tee -a "$D/out.txt"; fi
$PS -v ON_ERROR_STOP=1 -c "delete from public.motion_sessions" -c "delete from storage.objects where bucket_id = 'motion-lab'"
run "$LIVE/rollback/20261106001700_motion_lab_rollback.sql"; run "$LIVE/rollback/20261106001700_motion_lab_rollback.sql"
if [ "$($PS -t -A -c "select count(*) from pg_class where relname = 'motion_sessions'")" = "0" ]; then echo "PASS  motion lab rollback removes the table" | tee -a "$D/out.txt"; else echo "FAIL  motion lab rollback left the table" | tee -a "$D/out.txt"; fi
echo "apply 20261104001600_application_documents_storage_status.sql (twice)"
run "$LIVE/migrations/20261104001600_application_documents_storage_status.sql"; run "$LIVE/migrations/20261104001600_application_documents_storage_status.sql"
tst "$HERE/76_application_documents_storage_tests.sql"
echo "apply rollback of the application-document storage rule (twice), check it, then re-apply it"
run "$LIVE/rollback/20261104001600_application_documents_storage_status_rollback.sql"; run "$LIVE/rollback/20261104001600_application_documents_storage_status_rollback.sql"
tst "$HERE/77_application_documents_storage_rollback_tests.sql"
run "$LIVE/migrations/20261104001600_application_documents_storage_status.sql"
echo "the registration rollback must refuse while ADMISSIONS accounts exist"
if $PS -v ON_ERROR_STOP=1 -f "$LIVE/rollback/20261104001400_registration_admissions_rollback.sql" >/dev/null 2>&1; then echo "FAIL  registration rollback ran while ADMISSIONS accounts existed" | tee -a "$D/out.txt"; else echo "PASS  registration rollback refuses while ADMISSIONS accounts exist" | tee -a "$D/out.txt"; fi
$PS -v ON_ERROR_STOP=1 -c "update public.users set role = 'PARENT' where role = 'ADMISSIONS'" -c "delete from storage.objects where bucket_id = 'application-documents'"
echo "apply rollback of the registration layer (twice)"
run "$LIVE/rollback/20261104001400_registration_admissions_rollback.sql"; run "$LIVE/rollback/20261104001400_registration_admissions_rollback.sql"
tst "$HERE/71_registration_rollback_tests.sql"
# remove the registration fixtures so the older layer-rollback checks see the data they expect
$PS -v ON_ERROR_STOP=1 -c "delete from public.payment_records where parent_id::text like '00000000-0000-0000-0000-0000000000c%'" -c "delete from auth.users where id::text like '00000000-0000-0000-0000-0000000000c%' or id::text like '00000000-0000-0000-0000-0000000000d%' or id::text like '00000000-0000-0000-0000-0000000000e%'"
echo "apply rollback of the website layer"
run "$LIVE/rollback/20261023001000_website_layer_rollback.sql"
tst "$HERE/30_rollback_tests.sql"
tst "$HERE/50_anon_hardening_after_layer_rollback_tests.sql"
echo "the media library rollback is harmless after the layer rollback (no media_assets left)"
run "$LIVE/rollback/20261029001300_bsah_media_library_rollback.sql"
P=$(grep -c '^PASS' "$D/out.txt" || true); F=$(grep -c '^FAIL' "$D/out.txt" || true)
echo "---- $P passed, $F failed"; [ "$F" = 0 ]
