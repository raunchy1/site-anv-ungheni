#!/usr/bin/env node
/**
 * FOTOGRAFIA CATALOGULUI LOR. Pasul 1, și singurul care atinge rețeaua.
 *
 * O SINGURĂ CERERE. La pandashop erau 8.300 de pagini, la pneuexpert 5.500;
 * aici e una, iar din ea ies toate cele ~7.260 de anvelope. De aceea fișierul
 * ăsta e de trei ori mai scurt decât echivalentul lui de la pneuexpert: n-are
 * ce să enumere, n-are paginare de oprit, n-are checkpoint de ținut. Dacă se
 * întrerupe, se reia cu aceeași cerere.
 *
 * Ce face, în ordine: aduce răspunsul lor, normalizează fiecare rând, alege
 * între dublurile lor și scrie NDJSON. Nu atinge baza noastră: `db.mjs` nici
 * măcar nu e importat aici.
 *
 * `primeCost` — prețul lor de achiziție, pe care API-ul lor îl dă public — nu
 * intră în fotografie. `json-source.mjs` copiază câmp cu câmp tocmai ca să nu
 * poată.
 *
 *   node --env-file=.env.local tools/sync/pneu/snapshot.mjs
 *   node --env-file=.env.local tools/sync/pneu/snapshot.mjs --fara-cache
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPneuSource, normalizeazaRand, alegeDintreDuplicate } from './json-source.mjs';
import { config } from './config.mjs';

export const FISIER = path.join(config.paths.state, 'catalog.ndjson');
const RESPINSE = path.join(config.paths.state, 'respinse.json');

/** Citește fotografia scrisă anterior. Sărite liniile stricate de o oprire bruscă. */
export function citesteFotografia(fisier = FISIER) {
  if (!fs.existsSync(fisier)) return [];
  const out = [];
  for (const linie of fs.readFileSync(fisier, 'utf8').split('\n')) {
    if (!linie.trim()) continue;
    try { out.push(JSON.parse(linie)); } catch { /* linie trunchiată */ }
  }
  return out;
}

/** Motivele pentru care rânduri de-ale lor n-au ajuns în fotografie. */
export function citesteRespinse(fisier = RESPINSE) {
  return fs.existsSync(fisier) ? JSON.parse(fs.readFileSync(fisier, 'utf8')) : [];
}

export async function faFotografia({ log = console.log, useCache = true } = {}) {
  const t0 = Date.now();
  fs.mkdirSync(config.paths.state, { recursive: true });

  const source = createPneuSource(config, { useCache, log });

  log('· cer catalogul lor (o singură cerere, ~10 MB)…');
  const brut = await source.adu();
  log(`· au întors ${brut.length} rânduri`);

  if (brut.length < config.breakers.minEnumerate) {
    throw new Error(`au întors ${brut.length} rânduri, sub pragul de ${config.breakers.minEnumerate} — s-a schimbat ceva la ei; nu se scrie nimic`);
  }

  const bune = [];
  const respinse = [];
  for (const x of brut) {
    const r = normalizeazaRand(x);
    if (r.respins) { respinse.push({ id: r.id ?? null, motiv: r.respins }); continue; }
    bune.push(r);
  }

  const unice = alegeDintreDuplicate(bune);
  const dubluri = bune.length - unice.length;

  fs.writeFileSync(FISIER, `${unice.map((r) => JSON.stringify(r)).join('\n')}\n`);
  fs.writeFileSync(RESPINSE, JSON.stringify(respinse, null, 1));

  const peMotiv = {};
  for (const r of respinse) peMotiv[r.motiv] = (peMotiv[r.motiv] ?? 0) + 1;

  log(`· normalizate: ${bune.length}`);
  log(`· dubluri în catalogul lor, colapsate: ${dubluri}`);
  for (const [m, n] of Object.entries(peMotiv).sort((a, b) => b[1] - a[1])) {
    log(`· respinse, ${m}: ${n}`);
  }
  log(`\nFotografia: ${unice.length} anvelope în ${FISIER}`);
  log(`HTTP: ${source.stats.fetched} cereri, ${source.stats.cached} din cache, ${source.stats.retried} reîncercări`);
  log(`gata în ${Math.round((Date.now() - t0) / 1000)}s`);

  return { total: brut.length, bune: bune.length, unice: unice.length, dubluri, respinse };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  faFotografia({ useCache: !process.argv.includes('--fara-cache') })
    .catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
}
