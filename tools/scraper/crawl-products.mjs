/**
 * Faza 0.2 — crawl produse, RO + RU, cu checkpoint.
 * Output: data/raw/products.ndjson (o linie per produs, append-only, resume la crash)
 *         data/raw/failures.ndjson
 * Rulare:  node tools/scraper/crawl-products.mjs [--limit N] [--concurrency N]
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import readline from 'node:readline';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import { createSession, BASE } from './session.mjs';
import { parseProduct } from './parse-product.mjs';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};

const RAW = new URL('../../data/raw/', import.meta.url);
const OUT = new URL('products.ndjson', RAW);
const FAIL = new URL('failures.ndjson', RAW);
const CONCURRENCY = arg('concurrency', 6);
const DELAY = [250, 500];
const LIMIT = arg('limit', Infinity);

const gzip = promisify(zlib.gzip);
const CACHE = new URL('html-cache/', RAW);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Păstrăm HTML-ul brut: orice reparsare ulterioară nu mai atinge serverul. */
async function cacheHtml(slug, lang, html) {
  const dir = new URL(`${slug.slice(0, 2)}/`, CACHE);
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(new URL(`${slug}.${lang}.html.gz`, dir), await gzip(html));
}
const jitter = () => sleep(DELAY[0] + Math.random() * (DELAY[1] - DELAY[0]));

async function loadDone(file) {
  const done = new Set();
  if (!fs.existsSync(file)) return done;
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try { done.add(JSON.parse(line).slug); } catch { /* linie trunchiată de un crash */ }
  }
  return done;
}

const { products } = JSON.parse(await fsp.readFile(new URL('urls.json', RAW), 'utf8'));
const done = await loadDone(OUT);
const queue = products.filter((u) => !done.has(u.replace(`${BASE}/`, ''))).slice(0, LIMIT);
console.log(`${products.length} produse în sitemap, ${done.size} deja salvate, ${queue.length} de crawlat`);

const out = fs.createWriteStream(OUT, { flags: 'a' });
const fail = fs.createWriteStream(FAIL, { flags: 'a' });

let cursor = 0;
let ok = 0;
let ko = 0;
const started = Date.now();

async function worker(id) {
  const ro = createSession();
  const ru = createSession();
  await ro.warmup();
  await ru.warmup('ru-ru');
  let warmedAt = Date.now();

  for (;;) {
    // sesiunile expiră după circa o oră; le reînnoim preventiv la 25 de minute
    if (Date.now() - warmedAt > 25 * 60 * 1000) {
      await ro.rewarm();
      await ru.rewarm();
      warmedAt = Date.now();
    }
    const i = cursor++;
    if (i >= queue.length) return;
    const url = queue[i];
    const slug = url.replace(`${BASE}/`, '');
    try {
      const roRes = await ro.get(url);
      if (roRes.status !== 200) throw new Error(`RO HTTP ${roRes.status}`);
      await cacheHtml(slug, 'ro', roRes.html);
      const record = parseProduct(roRes.html, url);
      if (!record.product_id) throw new Error('fără product_id (nu e pagină de produs?)');

      await jitter();
      const ruRes = await ru.get(`${BASE}/index.php?route=product/product&product_id=${record.product_id}`);
      if (ruRes.status === 200) await cacheHtml(slug, 'ru', ruRes.html);
      const ruRec = ruRes.status === 200 ? parseProduct(ruRes.html, ruRes.url) : null;
      if (ruRec && ruRec.lang !== 'ru') throw new Error('sesiunea RU a revenit pe RO');

      out.write(`${JSON.stringify({
        slug,
        slug_ru: ruRec?.canonical?.replace(`${BASE}/ru/`, '') ?? null,
        ro: record,
        ru: ruRec,
        crawled_at: new Date().toISOString(),
      })}\n`);
      ok++;
    } catch (e) {
      ko++;
      fail.write(`${JSON.stringify({ slug, url, error: String(e.message ?? e), at: new Date().toISOString() })}\n`);
    }
    if ((ok + ko) % 100 === 0) {
      const rate = (ok + ko) / ((Date.now() - started) / 1000);
      const left = Math.round((queue.length - ok - ko) / rate / 60);
      console.log(`[${new Date().toISOString().slice(11, 19)}] ${ok + ko}/${queue.length}  ok=${ok} fail=${ko}  ${rate.toFixed(1)}/s  ~${left} min rămase`);
    }
    await jitter();
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));
out.end(); fail.end();
console.log(`\ngata: ok=${ok} fail=${ko} în ${Math.round((Date.now() - started) / 1000)}s`);
