#!/usr/bin/env bash
# Lighthouse headless prin CLI. Fereastra Chrome nu mai trebuie sa fie in prim-plan —
# asta a fost motivul pentru care auditul de sesiunea trecuta a intors zero.
# Rulare: tools/perf/lh.sh <slug-raport> <url> <mobile|desktop>
set -euo pipefail
cd "$(dirname "$0")/../.."
NAME="$1"; URL="$2"; PRESET="${3:-mobile}"
OUT="reports/lighthouse/$(date +%Y-%m-%d)-${NAME}-${PRESET}"
export CHROME_PATH="${CHROME_PATH:-$HOME/.cache/puppeteer/chrome/$(ls "$HOME/.cache/puppeteer/chrome" | head -1)/chrome-linux64/chrome}"

EXTRA=()
[ "$PRESET" = desktop ] && EXTRA+=(--preset=desktop)

npx --yes lighthouse@12 "$URL" \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" \
  "${EXTRA[@]}" \
  --throttling-method=simulate \
  --max-wait-for-load=45000 \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output=html --output-path="$OUT" \
  --quiet
echo "$OUT.report.json"
