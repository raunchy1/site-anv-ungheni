/**
 * Verifică, fișier cu fișier, dacă logo-ul descărcat de pe Commons e al mărcii
 * de anvelope sau al altei firme cu același nume.
 *
 * Problema e reală și frecventă: căutarea după titlu întoarce „Torque
 * Pharmaceuticals" pentru Torque, „Kelly Services" pentru Kelly, „Pirelli RE"
 * (imobiliare) pentru Pirelli și institutul de cercetare RIKEN pentru Riken.
 * Toate au numele mărcii în titlu și niciuna n-are legătură cu anvelopele.
 *
 * Testul: categoriile și descrierea fișierului de pe Commons trebuie să conțină
 * un cuvânt din domeniu — tire, tyre, rubber, pneu, шин. Dacă nu conțin,
 * fișierul e marcat `suspect` și NU se urcă până nu e privit pe planșă.
 *
 * Rulare: node tools/logos/verify-commons.mjs [--drop]
 *   --drop șterge fișierele suspecte din logos-sursa/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SRC = path.join(ROOT, 'logos-sursa');
const MANIFEST = path.join(SRC, 'manifest.json');
const UA = 'anvelope-ungheni-logo-fetch/1.0 (https://anvelope-ungheni.md; cristiermurache@gmail.com)';
const DROP = process.argv.includes('--drop');

const DOMENIU = /(tire|tyre|tires|tyres|rubber|pneumatic|pneu|reifen|шин|автошин|wheel|automotive|car manufactur)/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const rows = [];
for (const [slug, m] of Object.entries(manifest)) {
  if (!m?.file) continue;

  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
    format: 'json', action: 'query', titles: m.titlu, prop: 'categories|imageinfo',
    cllimit: '50', iiprop: 'extmetadata',
  })}`;
  let page;
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA } });
    page = Object.values((await r.json()).query?.pages ?? {})[0];
  } catch { rows.push({ slug, m, verdict: 'necunoscut', motiv: 'cerere eșuată' }); continue; }

  const cats = (page?.categories ?? []).map((c) => c.title).join(' ');
  const meta = page?.imageinfo?.[0]?.extmetadata ?? {};
  const text = [
    cats,
    meta.ImageDescription?.value ?? '',
    meta.ObjectName?.value ?? '',
    meta.Categories?.value ?? '',
    m.titlu,
  ].join(' ').replace(/<[^>]+>/g, ' ');

  const potrivit = DOMENIU.test(text);
  rows.push({
    slug, m,
    verdict: potrivit ? 'ok' : 'suspect',
    motiv: potrivit ? (text.match(DOMENIU)?.[0] ?? '') : 'nicio urmă de anvelope în categorii sau descriere',
    categorii: cats.replace(/Category:/g, '').slice(0, 200),
  });
  await sleep(250);
}

rows.sort((a, b) => (b.m.produse ?? 0) - (a.m.produse ?? 0));

const ok = rows.filter((r) => r.verdict === 'ok');
const suspect = rows.filter((r) => r.verdict !== 'ok');

console.log(`\n=== POTRIVITE (${ok.length}) ===`);
for (const r of ok) console.log(`  ${String(r.m.produse).padStart(4)}  ${r.m.marca.padEnd(14)} ${r.m.titlu}  [${r.motiv}]`);

console.log(`\n=== SUSPECTE (${suspect.length}) — nu se urcă ===`);
for (const r of suspect) console.log(`  ${String(r.m.produse).padStart(4)}  ${r.m.marca.padEnd(14)} ${r.m.titlu}\n        categorii: ${r.categorii || '—'}`);

for (const r of suspect) {
  manifest[r.slug] = { ...r.m, suspect: true, motiv: r.motiv };
  if (DROP) {
    const f = path.join(SRC, r.m.file);
    if (fs.existsSync(f)) fs.unlinkSync(f);
    manifest[r.slug].file = null;
  }
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
console.log(`\n${DROP ? 'șterse' : 'marcate'} ${suspect.length} fișiere suspecte`);
