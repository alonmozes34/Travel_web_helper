#!/usr/bin/env bash
# Nightly QA: every check this project has, in order, with one line per step
# in a report. Run from the repository root:
#
#     bash scripts/nightly.sh
#
# Steps:
#   1. lint, typecheck, unit tests
#   2. a build on the demo catalogue, and the browser suites against it:
#      accessibility (axe + manual), smoke, features, negative
#   3. a build on Yesim's real catalogue (their Prices API needs no key) and
#      the accessibility suite against it — real data breaks layouts that the
#      demo does not (it found a 4px overflow on 28 September 2026)
#   4. the live regression against the production site: 940 searches, every
#      card's order, link and (for Yesim) price and plan
#
# aloSIM's catalogue needs credentials that are not in this environment and
# must never be written to it; production has them, so step 4 covers aloSIM.
#
# Exit 0 when every step passed, 1 otherwise. The report is printed at the end
# and written to $NIGHTLY_REPORT (default /tmp/nightly-report.md).

set -u
cd "$(dirname "$0")/.."
REPORT="${NIGHTLY_REPORT:-/tmp/nightly-report.md}"
LOGS="$(mktemp -d)"
FAILED=0
: > "$REPORT"

line() { printf '%s\n' "$1" >> "$REPORT"; }
step() {
  # step <name> <command...>
  local name="$1"; shift
  local log="$LOGS/$(echo "$name" | tr ' /' '__').log"
  if "$@" > "$log" 2>&1; then
    line "- ✅ $name"
  else
    FAILED=1
    line "- ❌ $name — last lines:"
    line '```'
    grep -E 'FAIL|✗|not ok|error|Error' "$log" | head -15 >> "$REPORT" || true
    tail -5 "$log" >> "$REPORT"
    line '```'
  fi
}

# A server on a fresh port, killed by its own PID — `pkill -f next` also kills
# the shell running it.
SERVER_PID=""
start_server() {
  local port="$1"; shift
  env "$@" PORT="$port" npx next start -p "$port" > "$LOGS/server-$port.log" 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 60); do
    curl -s -o /dev/null "http://localhost:$port/" && return 0
    sleep 1
  done
  return 1
}
stop_server() { [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID" 2>/dev/null; SERVER_PID=""; }

line "# Nightly QA — $(date -u '+%Y-%m-%d %H:%M UTC')"
line ""
line "Commit: $(git rev-parse --short HEAD) on $(git rev-parse --abbrev-ref HEAD)"
line "Live site: $(curl -sS -m 20 https://www.yeshklita.com/ | grep -oE 'גרסה[^0-9]*[0-9]+\.[0-9]+\.[0-9]+' | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo unknown)"
line ""

[ -d node_modules ] || npm ci > "$LOGS/npm-ci.log" 2>&1

line "## Code"
step "lint" npm run lint
step "typecheck" npx tsc --noEmit -p .
step "unit tests" npm run test:unit

line ""
line "## Demo catalogue"
if DEMO_CATALOGUE=true npm run build > "$LOGS/build-demo.log" 2>&1 && start_server 7101 DEMO_CATALOGUE=true; then
  export BASE_URL=http://localhost:7101
  step "accessibility (demo)" npm run test:a11y
  step "smoke" npm run test:e2e
  step "features" npm run test:features
  step "negative" npm run test:negative
  stop_server
else
  FAILED=1; line "- ❌ demo build or server did not start"; tail -20 "$LOGS/build-demo.log" >> "$REPORT"
fi

line ""
line "## Yesim's real catalogue"
if YESIM_PARTNER_ID=5581 npm run build > "$LOGS/build-yesim.log" 2>&1 && start_server 7102 YESIM_PARTNER_ID=5581; then
  export BASE_URL=http://localhost:7102
  step "accessibility (real Yesim data)" npm run test:a11y
  stop_server
else
  FAILED=1; line "- ❌ Yesim build or server did not start"; tail -20 "$LOGS/build-yesim.log" >> "$REPORT"
fi

line ""
line "## Live site"
step "live regression (940 searches)" env REGRESSION_OUT="$LOGS/live.json" python3 scripts/live-regression.py https://www.yeshklita.com
grep -E '^## |^yesim ILS/EUR|pages,' "$LOGS/live_regression_(940_searches).log" 2>/dev/null | sed 's/^## /  - /' >> "$REPORT" || true

line ""
if [ "$FAILED" = 0 ]; then line "**Result: all green.**"; else line "**Result: failures above.** Logs: $LOGS"; fi
cat "$REPORT"
exit "$FAILED"
