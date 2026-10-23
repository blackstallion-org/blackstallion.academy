#!/usr/bin/env bash
# Replica test of the LIVE operations project: stub → baseline snapshot → evidence → website layer (applied twice)
# → layer tests → security fixes (applied twice) → fix tests → anon hardening evidence → anon hardening (applied twice)
# → hardening tests → hardening rollback (twice) → rollback tests → hardening re-applied → layer rollback → rollback
# tests → hardening-after-layer-rollback tests. Throwaway Postgres only; never touches a real database.
# usage: supabase/live/tests/run.sh   (run as a non-root user; needs postgres 16 binaries)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; LIVE="$(cd "$HERE/.." && pwd)"; BIN=/usr/lib/postgresql/16/bin
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
echo "apply rollback of the website layer"
run "$LIVE/rollback/20261023001000_website_layer_rollback.sql"
tst "$HERE/30_rollback_tests.sql"
tst "$HERE/50_anon_hardening_after_layer_rollback_tests.sql"
P=$(grep -c '^PASS' "$D/out.txt" || true); F=$(grep -c '^FAIL' "$D/out.txt" || true)
echo "---- $P passed, $F failed"; [ "$F" = 0 ]
