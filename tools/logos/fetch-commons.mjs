/**
 * Caută logo-urile pe Wikimedia Commons și le descarcă în `./logos-sursa/`.
 *
 * Commons e a doua sursă din listă, după media kit-ul producătorului, dar e
 * singura care se poate automatiza fără să ghicim structura a 132 de site-uri.
 * Fișierele de acolo sunt fie `PD-textlogo` (sub pragul de originalitate), fie
 * încărcate cu licență liberă — în ambele cazuri utilizabile pentru a identifica
 * marca. Restul mărcilor se rezolvă manual, din surse oficiale.
 *
 * Ce NU face: nu inventează, nu desenează, nu ia de pe agregatoare și nu
 * acceptă un fișier al cărui titlu nu conține numele mărcii. Fiecare descărcare
 * intră în `logos-sursa/manifest.json` cu titlul, URL-ul și licența, ca să se
 * poată verifica una câte una pe planșa de contact.
 *
 * Rulare: node tools/logos/fetch-commons.mjs [--limit N] [--only slug,slug]
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = path.join(ROOT, 'logos-sursa');
const CSV = path.join(ROOT, 'tools/logos/marci-checklist.csv');
const UA = 'anvelope-ungheni-logo-fetch/1.0 (https://anvelope-ungheni.md; cristiermurache@gmail.com)';
const API = 'https://commons.wikimedia.org/w/api.php';

const argv = process.argv.slice(2);
const arg = (name) => { const i = argv.indexOf(name); return i === -1 ? null : argv[i + 1]; };
const LIMIT = Number(arg('--limit')) || Infinity;
const ONLY = arg('--only')?.split(',').map((s) => s.trim());

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Rețeaua pică din când în când (ENETUNREACH pe IPv6). Trei încercări, apoi renunțăm. */
async function retry(fn, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) { last = e; await sleep(1200 * (i + 1)); }
  }
  throw last;
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', ...params })}`;
  return retry(async () => {
    const r = await fetch(url, { headers: { 'user-agent': UA } });
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
  });
}

/** Candidații pentru o marcă, din două interogări: titlu exact și căutare liberă. */
async function candidates(name) {
  const queries = [
    `intitle:"${name}" logo`,
    `${name} tire logo`,
    `${name} tyres logo`,
  ];
  const seen = new Map();
  for (const q of queries) {
    const r = await api({ action: 'query', list: 'search', srsearch: q, srnamespace: '6', srlimit: '20' });
    for (const hit of r.query?.search ?? []) seen.set(hit.title, hit);
    await sleep(300);
    if (seen.size >= 20) break;
  }
  return [...seen.keys()];
}

/**
 * Punctajul unui candidat. Ideea de bază: logo-ul canonic al unei mărci are un
 * titlu în care, după ce scoți numele mărcii și cuvintele de umplutură („logo",
 * „tire", „svg"), NU mai rămâne nimic. Tot ce rămâne — „PAX System", „Asiana",
 * „Raceway Road Atlanta", „Dunlop Handelssysteme" — e alt subiect, iar prima
 * rulare a arătat că exact astea ies în față dacă te iei după lungime.
 */
const FILLER = new Set([
  'logo', 'logotype', 'wordmark', 'symbol', 'emblem', 'icon', 'brand',
  'tire', 'tires', 'tyre', 'tyres', 'rubber', 'company', 'inc', 'corp',
  'svg', 'png', 'file', 'new', 'old', 'vector', 'black', 'white', 'red', 'blue',
]);

function score(title, brand) {
  const t = norm(title);
  const b = norm(brand);
  if (!t.includes(b)) return -1;

  const ext = title.toLowerCase().split('.').pop();
  if (ext !== 'svg' && ext !== 'png') return -1;

  let s = ext === 'svg' ? 60 : 25;
  if (t.includes('logo')) s += 20;

  // ce rămâne din titlu după marcă și umplutură
  const brandWords = new Set(norm(brand).match(/[a-z0-9]+/g) ?? [norm(brand)]);
  const words = title
    .replace(/^File:/i, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .split(/[\s_\-.,()]+/)
    .map((w) => norm(w))
    .filter(Boolean);

  let leftover = 0;
  let anYear = null;
  for (const w of words) {
    if (FILLER.has(w)) continue;
    if (b.includes(w) || brandWords.has(w)) continue;
    if (/^(19|20)\d\d$/.test(w)) { anYear = Number(w); continue; }
    leftover++;
  }
  s -= leftover * 45;

  // anul din titlu: o versiune recentă e un plus, una veche e aproape sigur greșită
  if (anYear !== null) s += anYear >= 2018 ? 10 : -70;

  return s;
}

async function fileInfo(title) {
  const r = await api({
    action: 'query', titles: title, prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata', iiurlwidth: '800',
  });
  const page = Object.values(r.query?.pages ?? {})[0];
  return page?.imageinfo?.[0] ?? null;
}

const csv = fs.readFileSync(CSV, 'utf8').trim().split('\n').slice(1).map((line) => {
  const [prioritate, slug_ro, name, produse] = line.split(',');
  return { prioritate: Number(prioritate), slug_ro, name: name.replace(/^"|"$/g, ''), produse: Number(produse) };
});

await fsp.mkdir(OUT, { recursive: true });
const manifestPath = path.join(OUT, 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};

let done = 0;
for (const b of csv) {
  if (done >= LIMIT) break;
  if (ONLY && !ONLY.includes(b.slug_ro)) continue;
  if (manifest[b.slug_ro]?.file) { console.log(`· ${b.name}: deja`); continue; }
  done++;

  let titles = [];
  try { titles = await candidates(b.name); }
  catch (e) { console.log(`! ${b.name}: căutare eșuată (${e.message.slice(0, 40)})`); continue; }

  const ranked = titles.map((t) => ({ t, s: score(t, b.name) })).filter((x) => x.s > 0).sort((a, b2) => b2.s - a.s);
  if (!ranked.length) { console.log(`— ${b.name} (${b.produse}): niciun candidat`); manifest[b.slug_ro] = { file: null, cautat: true }; continue; }

  const best = ranked[0];
  let info, dest, ext;
  try {
    info = await fileInfo(best.t);
    if (!info) { console.log(`— ${b.name}: fără imageinfo`); continue; }
    ext = best.t.toLowerCase().split('.').pop();
    dest = path.join(OUT, `${b.slug_ro}.${ext}`);
    const bin = await retry(async () => {
      const r = await fetch(info.url, { headers: { 'user-agent': UA } });
      if (!r.ok) throw new Error(`descărcare ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    });
    await fsp.writeFile(dest, bin);
  } catch (e) {
    console.log(`! ${b.name}: ${String(e.message).slice(0, 60)}`);
    continue;
  }

  manifest[b.slug_ro] = {
    file: path.basename(dest),
    marca: b.name,
    produse: b.produse,
    sursa: 'Wikimedia Commons',
    titlu: best.t,
    pagina: `https://commons.wikimedia.org/wiki/${encodeURIComponent(best.t)}`,
    url: info.url,
    mime: info.mime,
    latime: info.width, inaltime: info.height,
    licenta: info.extmetadata?.LicenseShortName?.value ?? null,
    scor: best.s,
    alternative: ranked.slice(1, 4).map((x) => x.t),
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
  console.log(`✓ ${b.name} (${b.produse}) -> ${best.t} [${info.extmetadata?.LicenseShortName?.value ?? '?'}]`);
  await sleep(400);
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
const cu = Object.values(manifest).filter((m) => m.file).length;
console.log(`\n${cu} logo-uri în logos-sursa/, din ${Object.keys(manifest).length} mărci încercate`);
