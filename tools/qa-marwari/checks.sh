#!/bin/zsh
# Baseline repository checks, run once before any change: typecheck, lint, unit tests. Writes logs + a summary.
LOGDIR=${1:-/tmp}
mkdir -p $LOGDIR
cd "$(dirname "$0")/../.." || exit 1
: > $LOGDIR/summary.txt
echo "branch $(git branch --show-current) HEAD $(git rev-parse --short HEAD) $(date)" >> $LOGDIR/summary.txt
echo "load before: $(uptime | sed 's/.*load averages: //')" >> $LOGDIR/summary.txt
for c in typecheck lint test; do
  start=$(date +%s)
  npm run $c > $LOGDIR/$c.log 2>&1
  code=$?
  echo "$c exit=$code secs=$(( $(date +%s) - start ))" >> $LOGDIR/summary.txt
done
echo "load after: $(uptime | sed 's/.*load averages: //')" >> $LOGDIR/summary.txt
echo ALLDONE >> $LOGDIR/summary.txt
