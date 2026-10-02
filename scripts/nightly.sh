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
#   3. a build on Yesim's and ZenSim's real catalogues (no keys needed) and
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

# A server on a fresh port, in its own process group, and stopped by that
# group. `npx next start` runs the server as a child: killing npx alone left
# the server running, and the next night's server could not take the port —
# the suites then tested the old build (found 28 September 2026). A port that
# already answers is a failure, not something to test against.
SERVER_PID=""
start_server() {
  local port="$1"; shift
  if curl -s -o /dev/null -m 2 "http://localhost:$port/"; then
    echo "port $port is already serving — refusing to test an unknown server" >> "$LOGS/server-$port.log"
    return 1
  fi
  setsid env "$@" PORT="$port" npx next start -p "$port" > "$LOGS/server-$port.log" 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 60); do
    kill -0 "$SERVER_PID" 2>/dev/null || return 1
    curl -s -o /dev/null "http://localhost:$port/" && return 0
    sleep 1
  done
  return 1
}
stop_server() {
  [ -n "$SERVER_PID" ] || return 0
  kill -- "-$SERVER_PID" 2>/dev/null
  wait "$SERVER_PID" 2>/dev/null
  SERVER_PID=""
}
trap stop_server EXIT

line "# Nightly QA — $(date -u '+%Y-%m-%d %H:%M UTC')"
line ""
line "Commit: $(git rev-parse --short HEAD) on $(git rev-parse --abbrev-ref HEAD)"
line "Live site: $(curl -sS -m 20 https://www.yeshklita.com/ | grep -oE 'גרסה[^0-9]*[0-9]+\.[0-9]+\.[0-9]+' | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo unknown)"
line ""

[ -d node_modules ] || npm ci > "$LOGS/npm-ci.log" 2>&1

line "## Code"
step "lint" npm run lint
# Next writes the PageProps/LayoutProps route types into .next/types; a fresh
# clone has none until a build, and tsc then fails on every page (the nightly
# run of 1 October 2026). `next typegen` writes them without building.
npx next typegen > "$LOGS/typegen.log" 2>&1
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
  FAILED=1; line "- ❌ demo build or server did not start"; tail -20 "$LOGS/build-demo.log" "$LOGS/server-7101.log" >> "$REPORT" 2>/dev/null; stop_server
fi

line ""
line "## Real catalogues (Yesim + ZenSim)"
REAL_ENV="YESIM_PARTNER_ID=5581 ZENSIM_AFFILIATE_ID=yeshklita"
if env $REAL_ENV npm run build > "$LOGS/build-yesim.log" 2>&1 && start_server 7102 $REAL_ENV; then
  export BASE_URL=http://localhost:7102
  # ZenSim's first read takes ~20s and the page does not wait for it; wait
  # until a search shows ZenSim cards, so the suite sees both providers.
  for _ in $(seq 1 30); do
    curl -s -m 30 "$BASE_URL/search?to=JP:7&usage=regular" | grep -q 'zensim.com' && break
    sleep 5
  done
  step "accessibility (real Yesim + ZenSim data)" npm run test:a11y
  stop_server
else
  FAILED=1; line "- ❌ Yesim build or server did not start"; tail -20 "$LOGS/build-yesim.log" "$LOGS/server-7102.log" >> "$REPORT" 2>/dev/null; stop_server
fi

line ""
line "## Live site"
step "live regression (940 searches)" env REGRESSION_OUT="$LOGS/live.json" python3 scripts/live-regression.py https://www.yeshklita.com
grep -E '^## |^yesim ILS/EUR|^alosim: |pages,' "$LOGS/live_regression_(940_searches).log" 2>/dev/null | sed 's/^## /  - /' >> "$REPORT" || true

line ""
if [ "$FAILED" = 0 ]; then line "**Result: all green.**"; else line "**Result: failures above.** Logs: $LOGS"; fi
cat "$REPORT"
exit "$FAILED"
