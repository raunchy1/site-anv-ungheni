/**
 * Caută logo-urile mărcilor rămase pe SITE-URILE LOR OFICIALE.
 *
 * Commons acoperă mărcile europene și japoneze; restul catalogului — mărcile
 * chinezești, turcești și indoneziene — nu există acolo deloc. Singura sursă
 * acceptabilă pentru ele e site-ul producătorului, dar nu-l știm dinainte, așa
 * că îl căutăm: pentru fiecare marcă se încearcă un set de domenii derivate din
 * nume (`marca.com`, `marcatire.com`, `marca-tyres.com`, `.eu`, `.com.tr`,
 * `.cn`…), plus domeniile scrise de mână în `DOMENII`, pentru mărcile care
 * aparțin unui grup cu alt nume (Leao și Crosswind sunt LingLong, Laufenn e
 * Hankook, Tigar și Riken sunt Michelin).
 *
 * Din pagina găsită se extrag candidații de logo — `<img>` cu „logo" în `src`
 * sau `alt`, imaginile din antet, și `<svg>` inline din antet — și se descarcă
 * în `logos-candidate/<slug>/`. NU se acceptă nimic automat: fișierele se
 * privesc pe planșa de candidați și se promovează manual.
 *
 * Rulare: node tools/logos/probe-official.mjs [--only slug,slug] [--limit N]
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = path.join(ROOT, 'logos-candidate');
const CSV = path.join(ROOT, 'tools/logos/marci-checklist.csv');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1]; };
const ONLY = arg('--only')?.split(',').map((s) => s.trim());
const LIMIT = Number(arg('--limit')) || Infinity;

/**
 * Domenii știute, pentru mărcile la care ghicitul nu funcționează: sub-mărci ale
 * unui grup cu alt nume, sau site-uri cu domeniu care nu seamănă cu marca.
 */
const DOMENII = {
  leao: ['leao-tire.com', 'www.leaotire.com'],
  crosswind: ['www.crosswindtire.com', 'crosswindtires.com'],
  laufenn: ['www.laufenn.com'],
  tigar: ['www.tigar.com', 'tigar-tyres.com'],
  riken: ['www.riken-tyres.com', 'rikentires.com'],
  kelly: ['www.kellytires.com'],
  cooper: ['www.coopertire.com', 'www.coopertires.com'],
  marshal: ['www.marshal-tires.com'],
  roadstone: ['www.roadstone.com'],
  starmaxx: ['www.starmaxx.com.tr', 'www.starmaxx.com'],
  petlas: ['www.petlas.com'],
  giti: ['www.giti.com', 'www.gititire.com'],
  voyager: ['www.voyager-tyres.com'],
  accelera: ['www.acceleratires.com', 'accelera-tires.com'],
  otani: ['www.otanitire.co.th'],
  ovation: ['www.ovationtyre.com', 'ovationtires.com'],
  fortune: ['www.fortune-tire.com', 'fortunetires.com'],
  torque: ['www.torquetyres.com', 'torque-tyres.com'],
  davanti: ['www.davanti-tyres.com'],
  duraturn: ['www.duraturntires.com'],
  rovelo: ['www.rovelotyres.com'],
  minerva: ['www.minerva-tyres.eu', 'minervatyres.com'],
  imperial: ['www.imperial-tyres.eu', 'imperialtyres.com'],
  tristar: ['www.tristar-tyres.eu', 'tristartyres.com'],
  superia: ['www.superia-tyres.eu', 'superiatyres.com'],
  zeta: ['www.zetatires.com', 'zeta-tyres.com'],
  rapid: ['www.rapid-tyres.com', 'rapidtyres.com'],
  atlas: ['www.atlas-tyres.com'],
  federal: ['www.federaltire.com', 'www.federaltyres.com'],
  doublestar: ['www.doublestartire.com', 'en.doublestartire.com'],
  achilles: ['www.achilles-tires.com', 'achillesradial.com'],
  atturo: ['www.atturo.com'],
  nordexx: ['www.nordexx.eu', 'nordexxtyres.com'],
  platin: ['www.platin-reifen.de', 'platintyres.com'],
  hilo: ['www.hilo-tires.com', 'hilotyres.com'],
  centara: ['www.centaratyre.com', 'centaratires.com'],
  tourador: ['www.tourador.com', 'touradortyres.com'],
  firemax: ['www.firemaxtyre.com', 'firemaxtire.com'],
  kpatos: ['www.kpatostyre.com', 'kpatos.com'],
  lanvigator: ['www.lanvigator.com', 'lanvigatortyre.com'],
  ilink: ['www.ilinktyre.com', 'ilink-tire.com'],
  zmax: ['www.zmaxtyre.com', 'zmaxtire.com'],
  aplus: ['www.aplustire.com', 'aplus-tyre.com'],
  aptany: ['www.aptanytire.com', 'aptany.com'],
  arivo: ['www.arivotyres.com', 'arivotyre.com'],
  joyroad: ['www.joyroadtyre.com', 'joyroadtire.com', 'www.joyroad.net'],
  haida: ['www.haidatyre.com', 'haida-tire.com', 'www.haidatire.com'],
  fronway: ['www.fronwaytyre.com', 'fronway-tire.com'],
  landspider: ['www.landspidertire.com', 'landspidertyres.com'],
  roadx: ['www.roadxtire.com'],
  tracmax: ['www.tracmaxtyres.com', 'tracmax.eu'],
  grenlander: ['grenlander.com'],
  goodride: ['www.goodride.com'],
  sunny: ['www.sunnytyre.com', 'sunnytires.com'],
  nereus: ['www.nereustyre.com'],
  comfoser: ['www.comfoser.com'],
  charmhoo: ['www.charmhoo.com'],
  kinforest: ['www.kinforest.com', 'kinforesttyre.com'],
  'three-a': ['www.threeatyre.com', 'threeatires.com'],
  austone: ['www.austone.com', 'austonetyre.com'],
  powertrac: ['www.powertractyre.com'],
  aoteli: ['www.aoteli.com', 'aotelitire.com'],
  ardent: ['www.ardenttyre.com'],
  bearway: ['www.bearwaytyre.com'],
  dovroad: ['www.dovroadtyre.com'],
  roadboss: ['www.roadbosstyre.com'],
  strial: ['www.strial-tyres.com'],
  orium: ['www.orium-tyres.com'],
  anchee: ['www.ancheetyre.com'],
  brics: ['www.bricstyre.com'],
  toledo: ['www.toledo-tyres.com'],
  fortuna: ['www.fortuna-tyres.com'],
  delinte: ['www.delinte.com'],
  'point-s': ['www.points.com', 'www.point-s.com'],
  starmax: ['www.starmaxtyre.com'],
};

/** Variante de domeniu derivate din numele mărcii. */
function candidateDomains(name, slug) {
  const base = slug.replace(/-/g, '');
  const dashed = slug;
  const out = new Set(DOMENII[slug] ?? []);
  for (const b of [base, dashed]) {
    out.add(`www.${b}.com`);
    out.add(`www.${b}tire.com`);
    out.add(`www.${b}tires.com`);
    out.add(`www.${b}tyre.com`);
    out.add(`www.${b}tyres.com`);
    out.add(`www.${b}-tyres.com`);
    out.add(`www.${b}.eu`);
    out.add(`www.${b}.cn`);
  }
  return [...out];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, timeout = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,*/*' }, signal: ctrl.signal, redirect: 'follow' });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') ?? '';
    if (!/html/i.test(ct)) return null;
    const body = await r.text();
    return body.length > 500 ? { url: r.url, body } : null;
  } catch { return null; }
  finally { clearTimeout(t); }
}

/** Candidații de logo dintr-o pagină, în ordinea încrederii. */
function extractLogos(html, pageUrl) {
  const out = [];
  const abs = (u) => { try { return new URL(u, pageUrl).href; } catch { return null; } };

  // 1. <img> cu „logo" în src sau alt
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]
      ?? tag.match(/\bdata-src\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src) continue;
    const alt = tag.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
    if (!/logo|brand/i.test(src + ' ' + alt)) continue;
    if (/sprite|icon-|favicon|payment|visa|master|whatsapp|facebook|instagram/i.test(src)) continue;
    const u = abs(src);
    if (u && /\.(svg|png|webp|jpe?g)(\?|$)/i.test(u)) out.push({ u, why: `img[${alt || 'logo'}]` });
  }

  // 2. imaginea din antet, chiar dacă n-are „logo" în nume
  const header = html.match(/<header[\s\S]{0,4000}?<\/header>/i)?.[0] ?? html.slice(0, 4000);
  for (const m of header.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    const u = abs(m[1]);
    if (u && /\.(svg|png|webp)(\?|$)/i.test(u) && !out.some((o) => o.u === u)) out.push({ u, why: 'antet' });
  }

  // 3. SVG inline din antet
  const svg = header.match(/<svg[\s\S]{200,20000}?<\/svg>/i)?.[0];
  if (svg && /viewBox/i.test(svg)) out.push({ inline: svg, why: 'svg inline din antet' });

  return out.slice(0, 4);
}

const csv = fs.readFileSync(CSV, 'utf8').trim().split('\n').slice(1).map((l) => {
  const [prioritate, slug_ro, name, produse, , , are_logo] = l.split(',');
  return { prioritate: +prioritate, slug: slug_ro, name: name.replace(/^"|"$/g, ''), produse: +produse, are: are_logo === 'da' };
});

const target = csv.filter((b) => !b.are && (!ONLY || ONLY.includes(b.slug))).slice(0, LIMIT);
await fsp.mkdir(OUT, { recursive: true });
const reportPath = path.join(OUT, 'candidati.json');
const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf8')) : {};

console.log(`${target.length} mărci de căutat\n`);

for (const b of target) {
  if (report[b.slug]?.gasit) { console.log(`· ${b.name}: deja`); continue; }
  let page = null;
  const incercate = [];
  for (const d of candidateDomains(b.name, b.slug)) {
    incercate.push(d);
    page = await get(`https://${d}/`);
    if (page) break;
    await sleep(120);
  }
  if (!page) { console.log(`— ${b.name} (${b.produse}): niciun site`); report[b.slug] = { gasit: false, incercate }; continue; }

  const logos = extractLogos(page.body, page.url);
  if (!logos.length) { console.log(`? ${b.name} (${b.produse}): ${page.url} — fără candidați`); report[b.slug] = { gasit: false, site: page.url }; continue; }

  const dir = path.join(OUT, b.slug);
  await fsp.mkdir(dir, { recursive: true });
  const salvate = [];
  let i = 0;
  for (const c of logos) {
    i++;
    try {
      if (c.inline) {
        const f = path.join(dir, `${i}.svg`);
        await fsp.writeFile(f, c.inline);
        salvate.push({ file: path.basename(f), sursa: page.url, why: c.why });
        continue;
      }
      const r = await fetch(c.u, { headers: { 'user-agent': UA, referer: page.url } });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 300) continue;
      const ext = (c.u.match(/\.(svg|png|webp|jpe?g)/i)?.[1] ?? 'png').toLowerCase();
      const f = path.join(dir, `${i}.${ext}`);
      await fsp.writeFile(f, buf);
      salvate.push({ file: path.basename(f), sursa: page.url, url: c.u, why: c.why, bytes: buf.length });
    } catch { /* candidat inaccesibil */ }
  }

  report[b.slug] = { gasit: salvate.length > 0, site: page.url, marca: b.name, produse: b.produse, candidati: salvate };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 1));
  console.log(`✓ ${b.name} (${b.produse}): ${page.url} — ${salvate.length} candidați`);
  await sleep(300);
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 1));
const cu = Object.values(report).filter((r) => r.gasit).length;
console.log(`\n${cu} mărci cu candidați de verificat, din ${Object.keys(report).length} încercate`);
