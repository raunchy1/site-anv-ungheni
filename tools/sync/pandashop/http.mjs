/**
 * Client HTTP civilizat pentru pandashop.md.
 *
 * Suntem parteneri, nu adversari: un singur User-Agent care spune cine suntem și
 * pe cine să sune dacă deranjăm, concurență mică, pauză între cereri, retry
 * exponențial doar pe erori tranzitorii. Nimic din ce face fișierul ăsta nu
 * trebuie să semene cu un scraper agresiv.
 *
 * Cache pe disc: fiecare răspuns se salvează. O rulare întreruptă se reia fără
 * să mai atingă sursa, iar testele merg pe fixture-uri reale, nu pe rețea.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const ORIGIN = 'https://www.pandashop.md';

export const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 ' +
  'AnvelopeUngheniSyncBot/1.0 (+parteneriat comercial; info@anvelope-ungheni.md)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (min, max) => min + Math.random() * (max - min);

export function createHttp({
  cacheDir = 'data/sync/cache',
  concurrency = 4,
  delayMin = 400,
  delayMax = 800,
  retries = 4,
  timeoutMs = 45_000,
  useCache = true,
} = {}) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const stats = { fetched: 0, cached: 0, retried: 0, failed: 0, bytes: 0 };

  const cachePath = (url) => {
    const h = crypto.createHash('sha1').update(url).digest('hex');
    return path.join(cacheDir, h.slice(0, 2), `${h}.html`);
  };

  async function raw(url) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        stats.retried++;
        /* Exponențial cu jitter. Dacă sunt încărcați, insistența e exact ce nu trebuie. */
        await sleep(Math.min(30_000, 2 ** attempt * 1000) + jitter(0, 500));
      }
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': UA, 'Accept-Language': 'ro,ru;q=0.8', Accept: 'text/html,application/xhtml+xml' },
          signal: AbortSignal.timeout(timeoutMs),
        });

        /* 404 e un răspuns, nu o defecțiune: produsul a dispărut de la ei. */
        if (res.status === 404) return { status: 404, body: '' };
        /* 429 și 5xx sunt tranzitorii — reîncercăm. Restul, nu. */
        if (res.status === 429 || res.status >= 500) { lastErr = new Error(`HTTP ${res.status}`); continue; }
        if (!res.ok) return { status: res.status, body: '' };

        const body = await res.text();
        stats.bytes += body.length;
        return { status: res.status, body };
      } catch (e) {
        lastErr = e;
      }
    }
    stats.failed++;
    throw new Error(`${url}: ${lastErr?.message ?? 'eșec necunoscut'}`);
  }

  /** GET cu cache pe disc. Întoarce string-ul HTML (gol dacă 404). */
  async function get(url) {
    const p = cachePath(url);
    if (useCache && fs.existsSync(p)) { stats.cached++; return fs.readFileSync(p, 'utf8'); }
    const { body } = await raw(url);
    stats.fetched++;
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
    await sleep(jitter(delayMin, delayMax));
    return body;
  }

  /** Rulează `fn` peste `items` cu cel mult `concurrency` în zbor. Păstrează ordinea. */
  async function map(items, fn) {
    const out = new Array(items.length);
    let next = 0;
    const worker = async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await fn(items[i], i);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
    return out;
  }

  return { get, map, stats, cachePath };
}

/**
 * Checkpoint: o rulare lungă trebuie să poată muri și să se reia de unde a rămas.
 * Fișier NDJSON, o linie per unitate terminată.
 */
export function createCheckpoint(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const done = new Set();
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try { done.add(JSON.parse(line).id); } catch { /* linie trunchiată de o oprire bruscă */ }
    }
  }
  const fd = fs.openSync(file, 'a');
  return {
    has: (id) => done.has(id),
    mark(id, extra = {}) { done.add(id); fs.writeSync(fd, `${JSON.stringify({ id, ...extra })}\n`); },
    get size() { return done.size; },
    close() { fs.closeSync(fd); },
  };
}
