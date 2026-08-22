/**
 * Faza 0.5 — descarcă imaginile la rezoluție maximă.
 * Încearcă întâi originalul (/image/catalog/product/X.jpg), cu fallback pe cache-ul 700x800.
 * Dedup pe SHA-1 al conținutului. Output: data/raw/images/ + data/raw/images-manifest.json
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import crypto from 'node:crypto';
import { createSession, BASE } from './session.mjs';

const RAW = new URL('../../data/raw/', import.meta.url);
const DIR = new URL('images/', RAW);
const MANIFEST = new URL('images-manifest.json', RAW);
const CONCURRENCY = Number(process.argv[process.argv.indexOf('--concurrency') + 1]) || 6;

await fsp.mkdir(DIR, { recursive: true });

const manifest = fs.existsSync(MANIFEST) ? JSON.parse(await fsp.readFile(MANIFEST, 'utf8')) : { by_source: {}, by_hash: {} };

const wanted = new Map(); // path -> [slugs]
const rl = readline.createInterface({ input: fs.createReadStream(new URL('products.ndjson', RAW)), crlfDelay: Infinity });
for await (const line of rl) {
  if (!line.trim()) continue;
  let d; try { d = JSON.parse(line); } catch { continue; }
  for (const img of d.ro?.images ?? []) {
    if (!wanted.has(img)) wanted.set(img, []);
    wanted.get(img).push(d.slug);
  }
}
// imaginile paginilor de servicii (image/catalog/uslugi/...) — extrase din pages.json
if (fs.existsSync(new URL('pages.json', RAW))) {
  const pages = JSON.parse(await fsp.readFile(new URL('pages.json', RAW), 'utf8'));
  for (const [slug, v] of Object.entries(pages.services ?? {})) {
    for (const m of (v.ro?.body_html ?? '').matchAll(/<img[^>]+src="([^"]*\/uslugi\/[^"]*)"/g)) {
      const orig = m[1].replace(/^https?:\/\/[^/]+/, '').replace('/image/cache/', '/image/').replace(/-\d+x\d+(\.[a-z]+)$/i, '$1');
      if (!wanted.has(orig)) wanted.set(orig, []);
      wanted.get(orig).push(`serviciu:${slug}`);
    }
  }
}

const queue = [...wanted.keys()].filter((p) => !manifest.by_source[p]);
console.log(`${wanted.size} imagini unice referite, ${queue.length} de descărcat`);

let cursor = 0, ok = 0, dup = 0, miss = 0;

async function worker() {
  const s = createSession();
  await s.warmup();
  for (;;) {
    const i = cursor++;
    if (i >= queue.length) return;
    const rel = queue[i];
    const candidates = [rel, rel.replace('/image/catalog/', '/image/cache/catalog/').replace(/(\.[a-z]+)$/i, '-700x800$1')];
    let got = null;
    for (const c of candidates) {
      got = await s.getBuffer(BASE + c).catch(() => null);
      if (got?.buffer?.length) break;
      got = null;
    }
    if (!got) { miss++; manifest.by_source[rel] = null; continue; }
    const hash = crypto.createHash('sha1').update(got.buffer).digest('hex');
    const ext = path.extname(rel) || '.jpg';
    const file = `${hash}${ext}`;
    if (manifest.by_hash[hash]) { dup++; } else {
      await fsp.writeFile(new URL(file, DIR), got.buffer);
      manifest.by_hash[hash] = { file, bytes: got.buffer.length, content_type: got.contentType };
      ok++;
    }
    manifest.by_source[rel] = file;
    if ((ok + dup + miss) % 200 === 0) {
      console.log(`${ok + dup + miss}/${queue.length}  noi=${ok} dup=${dup} lipsă=${miss}`);
      await fsp.writeFile(MANIFEST, JSON.stringify(manifest, null, 1));
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await fsp.writeFile(MANIFEST, JSON.stringify(manifest, null, 1));
console.log(`gata: noi=${ok} duplicate=${dup} lipsă=${miss}`);
