#!/usr/bin/env bash
# Finalizează Faza 0 fără supraveghere: retry eșecuri -> imagini -> facete RU -> validare.
set -uo pipefail
cd "$(dirname "$0")/../.."
log() { echo "[$(date +%H:%M:%S)] $*"; }

log "aștept terminarea crawl-ului de produse…"
while pgrep -f "tools/scraper/crawl-products.mjs" >/dev/null; do sleep 30; done
log "crawl terminat: $(wc -l < data/raw/products.ndjson) produse"

# --- retry: crawler-ul reia din checkpoint, deci rulează doar ce lipsește ---
for attempt in 1 2 3; do
  missing=$(node -e '
    const fs=require("fs");
    const {products}=JSON.parse(fs.readFileSync("data/raw/urls.json","utf8"));
    const done=new Set(fs.readFileSync("data/raw/products.ndjson","utf8").split("\n").filter(Boolean).map(l=>{try{return JSON.parse(l).slug}catch{return null}}));
    console.log(products.filter(u=>!done.has(u.replace("https://anvelope-ungheni.md/",""))).length);
  ')
  log "lipsesc $missing produse (încercarea $attempt)"
  [ "$missing" -eq 0 ] && break
  node tools/scraper/crawl-products.mjs --concurrency 6 >> data/raw/crawl-products.log 2>&1
done

log "descarc imaginile…"
node tools/scraper/download-images.mjs --concurrency 6 > data/raw/download-images.log 2>&1
log "imagini: $(ls data/raw/images 2>/dev/null | wc -l) fișiere unice"

log "extrag facetele RU…"
node tools/scraper/extract-facets-ru.mjs > data/raw/facets-ru.log 2>&1 || log "facete RU: eșuat, se reia manual"

log "rulez validarea…"
node tools/scraper/validate.mjs
log "FAZA 0 TERMINATĂ — data/raw/REPORT.md"
