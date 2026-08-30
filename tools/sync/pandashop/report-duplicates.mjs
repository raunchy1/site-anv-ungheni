#!/usr/bin/env node
/**
 * ETAPA 0.2 — duplicatele dinăuntrul catalogului nostru.
 *
 * NU SCRIE NIMIC ȘI NU PROPUNE NICIO ȘTERGERE. Doar lista, cu o recomandare
 * pentru fiecare pereche: care rând rămâne canonic și care primește 301.
 *
 * Cum se găsesc: două produse ale noastre care, normalizate, dau aceeași cheie
 * naturală, sunt aceeași anvelopă intrată de două ori. Tiparele se văd cu ochiul
 * liber în slug-uri — `anvelope-*` față de forma fără prefix (două valuri de
 * import), sufixul `-1`, brandul lipit de model (`avonwv7-`).
 *
 * Canonicul se alege pe date, nu pe vechime: câștigă rândul cu mai multă
 * substanță — preț, stoc, imagini, descriere, slug RU. La egalitate, slug-ul mai
 * curat (fără prefixul `anvelope-`, fără sufix numeric), apoi ID-ul mai mic.
 *
 *   node --env-file=.env.local tools/sync/pandashop/report-duplicates.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.mjs';
import { readProducts, readBrands, readAll } from './db.mjs';
import { parseTitle } from './parse-title.mjs';
import { naturalKey } from './natural-key.mjs';

/** Cât de „plin" e un rând. Numai citire; nimic din asta nu se scrie. */
function scor(p, imagini) {
  return (p.price_mdl ? 3 : 0)
    + (p.stock_status && p.stock_status !== 'out_of_stock' ? 2 : 0)
    + Math.min(imagini, 3)
    + (p.slug_ru ? 1 : 0)
    + (p.is_active ? 1 : 0);
}

const slugCurat = (s = '') => (s.startsWith('anvelope-') ? 0 : 1) + (/-\d+$/.test(s) ? 0 : 1);

/*
 * Marcajele de omologare din fabrică. „MO1" e Mercedes, „AO" Audi, „N0"–„N4"
 * Porsche, „LR" Land Rover, „*" BMW. Două anvelope care diferă doar prin ele NU
 * sunt același produs: au carcasă și compus diferit, iar un 301 între ele ar
 * pierde unul real. Rămân în raport, dar într-o categorie separată, cu semn de
 * întrebare — nu se propune redirecționare.
 */
const OE = /(?:^|[-\s])(mo\d?|moe|ao|ro\d|n[0-4]|lr|j|vol|\*|b\d|gox?|mgt|nf0)(?:[-\s]|$)/gi;
const marcajeOE = (s = '') => [...String(s).toLowerCase().matchAll(OE)].map((m) => m[1]).sort().join(',');

function tipar(a, b) {
  const [x, y] = [a.slug_ro ?? '', b.slug_ro ?? ''];
  if (x.replace(/^anvelope-/, '') === y.replace(/^anvelope-/, '')) return 'prefix `anvelope-`';
  if (x.replace(/-\d+$/, '') === y.replace(/-\d+$/, '')) return 'sufix numeric';
  if (x.replace(/-/g, '') === y.replace(/-/g, '')) return 'cratimă lipsă (brand lipit de model)';
  return 'slug-uri diferite';
}

async function main() {
  const t0 = Date.now();
  console.log('· citesc catalogul și imaginile…');
  const [ours, brands, imgs] = await Promise.all([
    readProducts(), readBrands(), readAll('product_images', 'product_id'),
  ]);
  const brandNames = brands.map((b) => b.name).filter(Boolean).sort((a, b) => b.length - a.length);
  const nrImagini = new Map();
  for (const i of imgs) nrImagini.set(i.product_id, (nrImagini.get(i.product_id) ?? 0) + 1);

  /* Gruparea. Cheia din titlu, nu din coloane: coloanele sunt exact cele care
     s-au dovedit nesigure la 0.1, iar aici avem nevoie de gruparea corectă. */
  const grupuri = new Map();
  for (const p of ours) {
    if (p.category !== 'anvelope') continue;
    const t = parseTitle(p.title_ro, brandNames);
    if (!t.brandKnown || !t.size_raw) continue;
    const k = naturalKey({
      brand: t.brand, model: t.model, width: t.width, aspect: t.aspect, diameter: t.diameter,
      loadIndex: t.loadIndex, speedIndex: t.speedIndex, isXl: t.isXl, isRunflat: t.isRunflat,
    });
    (grupuri.get(k) ?? grupuri.set(k, []).get(k)).push(p);
  }

  const dupe = [...grupuri.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([k, list]) => {
      const cu = list.map((p) => ({ p, s: scor(p, nrImagini.get(p.id) ?? 0), img: nrImagini.get(p.id) ?? 0 }));
      cu.sort((a, b) => b.s - a.s || slugCurat(b.p.slug_ro) - slugCurat(a.p.slug_ro) || a.p.id - b.p.id);
      const oe = new Set(cu.map((x) => marcajeOE(x.p.slug_ro)));
      return {
        k, canonic: cu[0], redirect: cu.slice(1), tipar: tipar(cu[0].p, cu[1].p),
        /* Dacă rândurile din grup au marcaje OE diferite, nu sunt duplicate. */
        omologariDiferite: oe.size > 1,
      };
    })
    .sort((a, b) => b.redirect.length - a.redirect.length || a.canonic.p.id - b.canonic.p.id);

  const sigure = dupe.filter((g) => !g.omologariDiferite);
  const deVerificat = dupe.filter((g) => g.omologariDiferite);
  const produseImplicate = sigure.reduce((n, g) => n + 1 + g.redirect.length, 0);
  const peTipar = {};
  for (const g of sigure) peTipar[g.tipar] = (peTipar[g.tipar] ?? 0) + 1;

  const dir = config.paths.reports;
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

  const rand = (x) => `#${x.p.id} \`${x.p.slug_ro}\` · ${x.p.price_mdl ?? '—'} MDL · ${x.p.stock_status} · ${x.img} imagini${x.p.slug_ru ? '' : ' · fără slug RU'}`;

  const md = `# Etapa 0.2 — duplicate interne

Rulare: ${new Date().toISOString()} · ${Math.round((Date.now() - t0) / 1000)}s · **nu s-a scris nimic, nu s-a șters nimic**

**${sigure.length} grupuri de duplicate reale**, ${produseImplicate} produse implicate,
${produseImplicate - sigure.length} de redirecționat cu 301.

Separat: **${deVerificat.length} grupuri care NU sunt duplicate** — diferă prin marcajul de
omologare din fabrică (MO1 Mercedes, AO Audi, N0–N4 Porsche, LR Land Rover, \* BMW).
Au carcasă și compus diferit; un 301 între ele ar pierde un produs real. Le las
în raport ca să le vezi, dar nu propun nimic pentru ele.

## Pe tipare

| Tipar | Grupuri |
|---|---|
${Object.entries(peTipar).sort((a, b) => b[1] - a[1]).map(([t, n]) => `| ${t} | ${n} |`).join('\n')}

Canonicul e ales pe date: preț, stoc, imagini, slug RU, activ. La egalitate,
slug-ul mai curat (fără prefixul \`anvelope-\`, fără sufix numeric), apoi ID-ul mai mic.

## Duplicate reale — ${sigure.length} grupuri

${sigure.map((g, i) => `### ${i + 1}. ${g.canonic.p.title_ro}
_${g.tipar}_
- **rămâne canonic:** ${rand(g.canonic)}
${g.redirect.map((x) => `- **301 către canonic:** ${rand(x)}`).join('\n')}`).join('\n\n')}

## NU sunt duplicate — omologări diferite (${deVerificat.length} grupuri)

Nu se propune nicio acțiune. Dacă vrei totuși să le unifici, e o decizie de
catalog, nu una tehnică.

${deVerificat.map((g, i) => `### ${i + 1}. ${g.canonic.p.title_ro}
${[g.canonic, ...g.redirect].map((x) => `- ${rand(x)}`).join('\n')}`).join('\n\n')}
`;

  fs.writeFileSync(path.join(dir, `etapa0-duplicate-${stamp}.md`), md);
  fs.writeFileSync(path.join(dir, `etapa0-duplicate-${stamp}.json`), JSON.stringify(
    dupe.map((g) => ({
      omologari_diferite: g.omologariDiferite,
      cheie: g.k, tipar: g.tipar,
      canonic: { id: g.canonic.p.id, slug: g.canonic.p.slug_ro },
      redirect: g.redirect.map((x) => ({ id: x.p.id, slug: x.p.slug_ro })),
    })), null, 2));

  console.log(`\n${md.split('## Toate grupurile')[0]}`);
  console.log(`Raport: ${path.join(dir, `etapa0-duplicate-${stamp}.md`)}`);
}

main().catch((e) => { console.error('\nRULAREA A EȘUAT:', e); process.exit(1); });
