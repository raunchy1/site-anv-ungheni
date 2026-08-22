#!/usr/bin/env bash
cd "$(dirname "$0")/../.."
for p in "home|http://localhost:3100/" \
         "catalog|http://localhost:3100/catalog-anvelope/latime_205/inaltime_55/diametru_r16" \
         "produs|http://localhost:3100/accelera-651-sport-195-50-r16-84w"; do
  n="${p%%|*}"; u="${p##*|}"
  for f in mobile desktop; do
    echo "== $n $f"
    bash tools/perf/lh.sh "$n" "$u" "$f" || echo "  ESEC"
  done
done
echo "TERMINAT"
