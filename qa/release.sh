#!/usr/bin/env sh
# The release bar, the one in CLAUDE.md, in order. Stops at the first failure.
#
#   sh qa/release.sh
#
# It checks and never writes, so run these first when they apply:
#   python3 qa/kit.py sync      after editing kit/ascii-ui.css or kit/ascii-ui.js
#   python3 qa/reference.py     after changing a component
#   python3 build.py            always, then commit site/ and dist/ with the change
# Needs Playwright for Python and Chromium (see qa/README.md). Run it from
# anywhere; it works from the repo root.

cd "$(dirname "$0")/.." || exit 1
n=0
step() {
  n=$((n+1))
  printf '[%2d] %s\n' "$n" "$*"
  if ! "$@"; then
    echo "release: FAIL at step $n: $*"
    exit 1
  fi
}

step python3 qa/qa.py 390 844 dark m x
step python3 qa/qa.py 390 844 light m x
step python3 qa/qa.py 1440 900 dark d x
step python3 qa/qa.py 1440 900 light d x
step python3 qa/qa.py 390 844 dark s x --site
step python3 qa/breakpoints.py
step python3 qa/clock.py
step python3 qa/audit.py
step python3 qa/keyboard.py
step python3 qa/kit.py
step python3 qa/reduced.py
step python3 qa/reduced.py --site
step python3 qa/nav.py quick
step python3 qa/reference.py --check
step python3 build.py --check
echo "release: ok, $n of $n steps passed. Commit, push to main, Vercel ships it."
