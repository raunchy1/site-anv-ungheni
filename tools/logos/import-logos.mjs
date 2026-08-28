/**
 * Normalizează și urcă logo-urile de marcă în bucketul `marci`, apoi scrie
 * `brands.logo_url`.
 *
 * Intrarea e un folder cu fișiere numite după `slug_ro`: `michelin.svg`,
 * `gt-radial.svg`, `point-s.png`. Ce nu se potrivește cu nicio marcă se
 * raportează, nu se ghicește.
 *
 * Normalizare:
 *   - SVG: se refuză fișierele cu `<script>` sau `on…=` (nu urcăm cod executabil
 *     într-un bucket public) și cele fără `viewBox`, care se randează prost la
 *     scalare;
 *   - PNG: fundal alb sau negru uniform -> transparent, apoi decupare la
 *     conținut, prin `normalize-png.py`. Sub 400 px lățime se refuză.
 *
 * Idempotent: reîncărcarea aceluiași fișier suprascrie obiectul și păstrează URL-ul.
 *
 * Rulare:
 *   node --env-file=.env.local tools/logos/import-logos.mjs --dir ./logos-sursa
 *   node --env-file=.env.local tools/logos/import-logos.mjs --dir ./logos-sursa --apply
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1]; };
const DIR = path.resolve(arg('--dir') ?? './logos-sursa');
const APPLY = argv.includes('--apply');
const BUCKET = process.env.SUPABASE_BRAND_BUCKET ?? 'marci';
const NORMALIZER = fileURLToPath(new URL('./normalize-png.py', import.meta.url));
const LIGHT_CHECK = fileURLToPath(new URL('./is-light.py', import.meta.url));

const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
/**
 * Pragul de lățime pentru PNG. 400 px e regula implicită; se poate coborî
 * explicit cu `--min-width`, pentru cazurile în care singurul fișier oficial e
 * mai mic dar tot suficient — logo-ul se afișează la 80 px pe card și la 160 px
 * pe pagina de marcă, deci 300 px rămân peste 2× la densitate dublă.
 */
const MIN_PNG_WIDTH = Number(arg('--min-width')) || 400;

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ------------------------------------------------------------------ intrare */

let files;
try {
  files = (await fsp.readdir(DIR)).filter((f) => MIME[path.extname(f).toLowerCase()]);
} catch {
  console.error(`Folderul ${DIR} nu există.`);
  process.exit(1);
}
if (!files.length) { console.error(`Niciun fișier de logo în ${DIR}.`); process.exit(1); }

const { data: brands, error } = await db.from('brands').select('id, name, slug_ro, product_count, logo_url');
if (error) throw new Error(`citire branduri: ${error.message}`);
const byKey = new Map();
for (const b of brands) { byKey.set(b.slug_ro, b); byKey.set(slugify(b.name), b); }

/* ------------------------------------------------------------ normalizare */

/** PNG: lățimea, din antetul IHDR. Nu merită o bibliotecă pentru patru octeți. */
function pngWidth(buf) {
  return buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47 ? buf.readUInt32BE(16) : 0;
}

/**
 * SVG: refuzăm codul executabil, dar `viewBox`-ul lipsă îl REPARĂM, nu-l
 * refuzăm. Multe fișiere de pe Commons au doar `width`/`height`; fără `viewBox`
 * imaginea nu se scalează, deși desenul e corect. Îl calculăm din dimensiuni —
 * nu e o redesenare, e aceeași geometrie, declarată explicit.
 */
function checkSvg(buf, name) {
  const s = buf.toString('utf8');
  if (/<script[\s>]/i.test(s) || /\son\w+\s*=/i.test(s)) return { err: `${name}: SVG cu script sau handler de eveniment — refuzat` };
  if (/viewBox\s*=/i.test(s)) return { body: buf };

  const w = parseFloat(s.match(/<svg[^>]*\swidth\s*=\s*"([\d.]+)/i)?.[1] ?? '');
  const h = parseFloat(s.match(/<svg[^>]*\sheight\s*=\s*"([\d.]+)/i)?.[1] ?? '');
  if (!w || !h) return { err: `${name}: SVG fără viewBox și fără dimensiuni numerice — refuzat` };

  const fixed = s.replace(/<svg\b/i, `<svg viewBox="0 0 ${w} ${h}"`);
  return { body: Buffer.from(fixed, 'utf8'), nota: `viewBox adăugat (0 0 ${w} ${h})` };
}

/**
 * Un logo desenat în alb nu e un logo stricat — e varianta pentru antet închis,
 * singura pe care o publică mulți producători. În loc s-o refuzăm, o marcăm:
 * `brands.logo_on_dark` spune interfeței să-i dea placa închisă pentru care a
 * fost desenată. Rasterele se măsoară cu `is-light.py`; la SVG se numără
 * culorile din fișier.
 */
function svgIsLight(buf) {
  const s = buf.toString('utf8');
  const culori = [...s.matchAll(/(?:fill|stroke)\s*[:=]\s*["']?(#[0-9a-f]{3,8}|white|black|rgb\([^)]*\))/gi)]
    .map((m) => m[1].toLowerCase())
    .filter((c) => c !== 'none');
  if (!culori.length) return false;

  const lum = (c) => {
    if (c === 'white') return 1;
    if (c === 'black') return 0;
    let r, g, b;
    if (c.startsWith('rgb')) [r, g, b] = c.match(/[\d.]+/g).map(Number);
    else {
      const h = c.slice(1);
      const p = h.length <= 4 ? h.split('').slice(0, 3).map((x) => parseInt(x + x, 16)) : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
      [r, g, b] = p;
    }
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };
  const vizibile = culori.filter((c) => lum(c) < 0.62).length;
  return vizibile / culori.length < 0.08;
}

function rasterIsLight(file) {
  try {
    return execFileSync('python3', [LIGHT_CHECK, file], { encoding: 'utf8' }).trim().startsWith('light');
  } catch { return false; }
}

const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'logos-'));

/* ------------------------------------------------------------------ lucrul */

const matched = [];
const orphans = [];
const rejected = [];

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  const brand = byKey.get(slugify(path.basename(file, ext)));
  if (!brand) { orphans.push(file); continue; }

  let body = await fsp.readFile(path.join(DIR, file));
  let note = '';

  if (ext === '.svg') {
    const r = checkSvg(body, file);
    if (r.err) { rejected.push(r.err); continue; }
    body = r.body;
    if (r.nota) note = r.nota;
  } else if (ext === '.png') {
    const out = path.join(tmp, file);
    try {
      note = execFileSync('python3', [NORMALIZER, path.join(DIR, file), out], { encoding: 'utf8' }).trim();
      body = await fsp.readFile(out);
    } catch (e) {
      rejected.push(`${file}: normalizare eșuată (${String(e.message).slice(0, 60)})`);
      continue;
    }
    const w = pngWidth(body);
    if (w && w < MIN_PNG_WIDTH) { rejected.push(`${file}: PNG de ${w} px lățime, sub minimul de ${MIN_PNG_WIDTH}`); continue; }
    note = `${w} px${note ? ` · ${note}` : ''}`;
  }

  const peInchis = ext === '.svg' ? svgIsLight(body) : rasterIsLight(path.join(DIR, file));
  if (peInchis) note = `${note ? note + ' · ' : ''}desenat în alb -> placă închisă`;

  matched.push({ file, ext, brand, body, note, peInchis });
}

matched.sort((a, b) => b.brand.product_count - a.brand.product_count);

log(`${files.length} fișiere · ${matched.length} potrivite · ${orphans.length} fără marcă · ${rejected.length} refuzate`);
for (const r of rejected) log(`  REFUZAT ${r}`);
for (const f of orphans) log(`  FĂRĂ MARCĂ ${f}`);

if (!APPLY) {
  for (const m of matched) log(`  ar urca ${m.file} -> ${m.brand.name} (${m.brand.product_count} produse)${m.note ? ` · ${m.note}` : ''}`);
  const acoperit = matched.reduce((s, m) => s + m.brand.product_count, 0);
  const total = brands.reduce((s, b) => s + b.product_count, 0);
  log(`rulare seacă — ar acoperi ${acoperit} din ${total} produse (${((acoperit / total) * 100).toFixed(1)}%)`);
  log('adaugă --apply ca să urce');
  process.exit(0);
}

/* ------------------------------------------------------------------ bucket */

const { data: buckets } = await db.storage.listBuckets();
if (!buckets?.some((b) => b.name === BUCKET)) {
  const { error: e } = await db.storage.createBucket(BUCKET, {
    public: true, fileSizeLimit: 2097152, allowedMimeTypes: Object.values(MIME),
  });
  if (e) throw new Error(`creare bucket: ${e.message}`);
  log(`bucket „${BUCKET}" creat, public la citire`);
}

let uploaded = 0;
for (const m of matched) {
  const objectPath = `${m.brand.slug_ro}${m.ext}`;
  const { error: upErr } = await db.storage.from(BUCKET).upload(objectPath, m.body, {
    contentType: MIME[m.ext], upsert: true, cacheControl: '31536000',
  });
  if (upErr) { console.error(`  EROARE ${m.file}: ${upErr.message}`); continue; }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
  const { error: dbErr } = await db.from('brands')
    .update({ logo_url: url, logo_on_dark: m.peInchis })
    .eq('id', m.brand.id);
  if (dbErr) { console.error(`  EROARE la ${m.brand.name}: ${dbErr.message}`); continue; }
  uploaded++;
  log(`  ${m.brand.name} (${m.brand.product_count}) -> ${objectPath}${m.note ? ` · ${m.note}` : ''}`);
}

const { data: after } = await db.from('brands').select('name, product_count, logo_url');
const cu = after.filter((b) => b.logo_url);
const acoperit = cu.reduce((s, b) => s + b.product_count, 0);
const total = after.reduce((s, b) => s + b.product_count, 0);
log(`gata: ${uploaded} urcate în această rulare · ${cu.length}/${after.length} mărci au logo · acoperă ${acoperit}/${total} produse (${((acoperit / total) * 100).toFixed(1)}%)`);
