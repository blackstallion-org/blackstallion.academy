#!/usr/bin/env bash
# Applies stub + migrations to a throwaway cluster and runs the tests. Never touches a real database.
# usage: tests/run.sh   (run as a non-root user; needs postgres 16 binaries)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; BIN=/usr/lib/postgresql/16/bin
D="$(mktemp -d)"; trap '"$BIN/pg_ctl" -D "$D/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$D"' EXIT
"$BIN/initdb" -D "$D/data" -U postgres --auth=trust >/dev/null
"$BIN/pg_ctl" -D "$D/data" -o "-p 54329 -k $D -c listen_addresses=''" -l "$D/log" -w start >/dev/null
PS="psql -h $D -p 54329 -U postgres -q -X"
$PS -v ON_ERROR_STOP=1 -c "create database bsah_test"
PS="$PS -d bsah_test"
$PS -v ON_ERROR_STOP=1 -f "$HERE/00_supabase_stub.sql"
for f in "$HERE"/../migrations/*.sql; do echo "apply $(basename "$f")"; $PS -v ON_ERROR_STOP=1 -f "$f"; done
: > "$D/out.txt"
# Every numbered test file (10_, 20_, 30_, …) runs in order in the same database.
for t in "$HERE"/[1-9][0-9]_*.sql; do $PS -v ON_ERROR_STOP=1 -t -A -f "$t" | tee -a "$D/out.txt"; done
P=$(grep -c '^PASS' "$D/out.txt" || true); F=$(grep -c '^FAIL' "$D/out.txt" || true)
echo "---- $P passed, $F failed"; [ "$F" = 0 ]
