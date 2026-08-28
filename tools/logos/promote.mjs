/**
 * Promovează un candidat verificat cu ochiul din `logos-candidate/<slug>/` în
 * `logos-sursa/<slug>.<ext>` și îi scrie proveniența în manifest.
 *
 * Promovarea e mereu manuală: `probe-official.mjs` descarcă tot ce arată a logo
 * din antetul unui site, dar nu poate ști dacă site-ul e al mărcii sau al unui
 * distribuitor care o revinde. Decizia aia se ia uitându-te la planșă.
 *
 * Rulare: node tools/logos/promote.mjs <slug> <fisier-candidat> ["notă"]
 * Exemplu: node tools/logos/promote.mjs laufenn 2.svg "antetul laufenn.com"
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const fromIdx = args.indexOf('--from');
const FROM = fromIdx === -1 ? null : args[fromIdx + 1];
const rest = fromIdx === -1 ? args : args.filter((a, i) => i !== fromIdx && i !== fromIdx + 1);
const [slug, file, nota] = rest;
if (!slug || !file) { console.error('folosire: promote.mjs <slug> <fisier> ["notă"] [--from <alt-slug>]'); process.exit(1); }

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const CAND = path.join(ROOT, 'logos-candidate');
const SRC = path.join(ROOT, 'logos-sursa');

// `--from` promovează un fișier găsit în dosarul altei mărci: site-ul unui
// producător cu mai multe mărci (royalblacktyre.com) le arată pe toate în antet.
const src = path.join(CAND, FROM ?? slug, file);
if (!fs.existsSync(src)) { console.error(`nu există: ${path.relative(ROOT, src)}`); process.exit(1); }

const report = JSON.parse(fs.readFileSync(path.join(CAND, 'candidati.json'), 'utf8'));
const info = report[FROM ?? slug];
const cand = info?.candidati?.find((c) => c.file === file);

const ext = path.extname(file).toLowerCase();
const dest = path.join(SRC, `${slug}${ext}`);
fs.copyFileSync(src, dest);

const mPath = path.join(SRC, 'manifest.json');
const m = JSON.parse(fs.readFileSync(mPath, 'utf8'));
m[slug] = {
  file: path.basename(dest),
  marca: FROM ? slug : (info?.marca ?? slug),
  produse: FROM ? null : (info?.produse ?? null),
  sursa: 'site oficial al producătorului',
  pagina: info?.site ?? null,
  url: cand?.url ?? null,
  verificat: nota ?? 'verificat pe planșa de candidați',
};
fs.writeFileSync(mPath, JSON.stringify(m, null, 1));
console.log(`✓ ${slug} <- ${file} (${info?.site ?? 'sursă necunoscută'})`);
