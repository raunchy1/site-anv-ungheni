/**
 * Sesiune HTTP pentru anvelope-ungheni.md.
 * Site-ul e în spatele unui interstițiu proof-of-work (ihost) care întoarce 503
 * până când clientul rezolvă SHA-256 cu N biți zero în față și primește cookie-ul `ih_clear`.
 * Fiecare sesiune are propriul cookie jar => putem ține RO și RU în paralel.
 */
import crypto from 'node:crypto';

export const BASE = 'https://anvelope-ungheni.md';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 AnvelopeUngheniMigrationBot/1.0 (+migrare site proprietar; info@anvelope-ungheni.md)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function leadingZeroBits(buf) {
  let c = 0;
  for (const x of buf) {
    if (x === 0) { c += 8; continue; }
    for (let j = 7; j >= 0; j--) { if ((x >> j) & 1) return c; c++; }
  }
  return c;
}

function solvePow(t, s, bits) {
  for (let n = 0; ; n++) {
    if (leadingZeroBits(crypto.createHash('sha256').update(`${t}.${s}.${n}`).digest()) >= bits) return n;
  }
}

export function createSession() {
  const cookies = new Map();
  const cookieHeader = () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  let clearing = null;
  let sessionLanguage = 'ro-ro';   // limba cu care s-a făcut warmup, ca s-o putem reface identic
  let rewarming = null;

  function absorb(res) {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const kv = c.split(';')[0];
      const i = kv.indexOf('=');
      if (i > 0) cookies.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim());
    }
  }

  function headers(extra = {}) {
    return {
      'User-Agent': UA,
      'Accept-Language': 'ro,ru;q=0.8,en;q=0.5',
      ...(cookies.size ? { Cookie: cookieHeader() } : {}),
      ...extra,
    };
  }

  async function clearChallenge(html) {
    const t = html.match(/T="([^"]+)"/)?.[1];
    const s = html.match(/S="([^"]+)"/)?.[1];
    const bits = Number(html.match(/BITS=(\d+)/)?.[1]);
    if (!t || !s || !bits) throw new Error('markup-ul challenge-ului s-a schimbat');
    const n = solvePow(t, s, bits);
    const res = await fetch(`${BASE}/.well-known/ihost-verify/`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ t, s, n: String(n) }),
    });
    absorb(res);
    if (!res.ok) throw new Error(`verificare eșuată: ${res.status}`);
  }

  async function ensureCleared(html) {
    clearing = clearing ?? clearChallenge(html).finally(() => { clearing = null; });
    await clearing;
  }

  /**
   * Sesiunile expiră după circa o oră: serverul începe să răspundă 400/403 în loc să
   * reemită provocarea, deci retry-ul simplu nu se mai poate recupera niciodată.
   * Aruncăm cookie-urile și refacem warmup-ul cu aceeași limbă.
   */
  async function rewarm() {
    rewarming = rewarming ?? (async () => {
      cookies.clear();
      await get(`${BASE}/`, { retries: 2, noRewarm: true });
      if (sessionLanguage !== 'ro-ro') {
        await postForm(`${BASE}/index.php?route=common/language/language`, { code: sessionLanguage, redirect: 'common/home' });
        cookies.set('language', sessionLanguage);
      }
    })().finally(() => { rewarming = null; });
    await rewarming;
  }

  async function get(url, { retries = 3, accept = 'text/html', noRewarm = false } = {}) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, { headers: headers({ Accept: accept }), redirect: 'follow' });
        absorb(res);
        if (res.status === 404 || res.status === 410) return { status: res.status, html: '', url: res.url };
        const body = await res.text();
        if (res.status === 503 && body.includes('ihost-verify')) { await ensureCleared(body); continue; }
        if ((res.status === 400 || res.status === 403) && !noRewarm) { await rewarm(); continue; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { status: res.status, html: body, url: res.url };
      } catch (e) {
        lastErr = e;
        await sleep(500 * 2 ** attempt + Math.random() * 300);
      }
    }
    throw lastErr;
  }

  async function getBuffer(url, { retries = 3 } = {}) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, { headers: headers() });
        absorb(res);
        if (res.status === 404) return null;
        if (res.status === 400 || res.status === 403) { await rewarm(); continue; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { buffer: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get('content-type') };
      } catch (e) {
        lastErr = e;
        await sleep(500 * 2 ** attempt);
      }
    }
    throw lastErr;
  }

  async function postForm(url, fields, { redirect = 'manual' } = {}) {
    const res = await fetch(url, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/x-www-form-urlencoded', Referer: `${BASE}/` }),
      body: new URLSearchParams(fields),
      redirect,
    });
    absorb(res);
    return res;
  }

  /** Rezolvă challenge-ul o dată și, opțional, comută limba magazinului (RO implicit, `ru-ru`). */
  async function warmup(language) {
    sessionLanguage = language ?? 'ro-ro';
    await get(`${BASE}/`, { noRewarm: true });
    if (language && language !== 'ro-ro') {
      await postForm(`${BASE}/index.php?route=common/language/language`, { code: language, redirect: 'common/home' });
      cookies.set('language', language);
    }
    return { get, getBuffer, postForm, cookies };
  }

  return { get, getBuffer, postForm, warmup, rewarm, cookies };
}

/** Sesiune implicită, pentru scripturi simple. */
const _default = createSession();
export const { get, getBuffer, postForm, warmup, rewarm } = _default;
