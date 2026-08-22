/**
 * Reconstruiește data/raw/products.ndjson din cache-ul de HTML, fără nicio cerere
 * către server. Ăsta e motivul pentru care cache-ul există: orice corecție de parser
 * se aplică pe tot catalogul în câteva secunde.
 * Rulare: node tools/scraper/reparse.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { parseProduct } from './parse-product.mjs';

const RAW = new URL('../../data/raw/', import.meta.url);
const CACHE = path.join(RAW.pathname.replace(/%20/g, ' '), 'html-cache');
const BASE = 'https://anvelope-ungheni.md';

const out = fs.createWriteStream(new URL('products.ndjson.new', RAW));
let n = 0; let noRu = 0;
const t0 = Date.now();

for (const d of fs.readdirSync(CACHE).sort()) {
  const dir = path.join(CACHE, d);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith('.ro.html.gz')) continue;
    const slug = f.replace(/\.ro\.html\.gz$/, '');
    const roHtml = zlib.gunzipSync(fs.readFileSync(path.join(dir, f))).toString('utf8');
    const ruPath = path.join(dir, `${slug}.ru.html.gz`);
    const ruHtml = fs.existsSync(ruPath) ? zlib.gunzipSync(fs.readFileSync(ruPath)).toString('utf8') : null;
    if (!ruHtml) noRu++;

    const ro = parseProduct(roHtml, `${BASE}/${slug}`);
    const ru = ruHtml ? parseProduct(ruHtml, `${BASE}/ru/`) : null;
    out.write(`${JSON.stringify({
      slug,
      slug_ru: ru?.canonical?.replace(`${BASE}/ru/`, '') ?? null,
      ro, ru,
      crawled_at: null,
      reparsed_at: new Date().toISOString(),
    })}\n`);
    if (++n % 2000 === 0) console.log(`${n} reparsate…`);
  }
}
out.end();
await new Promise((r) => out.on('close', r));
fs.renameSync(new URL('products.ndjson', RAW), new URL('products.ndjson.bak', RAW));
fs.renameSync(new URL('products.ndjson.new', RAW), new URL('products.ndjson', RAW));
console.log(`gata: ${n} produse reparsate în ${((Date.now() - t0) / 1000).toFixed(1)}s (fără RU: ${noRu})`);
