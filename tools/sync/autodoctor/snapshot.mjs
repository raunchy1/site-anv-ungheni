#!/usr/bin/env node
/**
 * FOTOGRAFIA CATALOGULUI AUTODOCTOR. Pasul 1, și singurul care atinge rețeaua
 * (în afară de poze, la import).
 *
 * Citește cele ~134 de pagini de listare ale lor, ordonate după nume, și scrie
 * fiecare anvelopă înțeleasă într-un NDJSON. Nu atinge baza noastră.
 *
 *   node --env-file=.env.local tools/sync/autodoctor/snapshot.mjs              # din cache, dacă există
 *   node --env-file=.env.local tools/sync/autodoctor/snapshot.mjs --proaspat   # prețurile de azi
 *
 * `--proaspat` ocolește cache-ul de pe disc. Fără el, o reluare citește
 * paginile din ziua primei fotografii — iar un preț vechi scris azi în bază e
 * o minciună cu dată nouă.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHttp } from '../pandashop/http.mjs';
import { createAutodoctorSource } from './source.mjs';
import { config } from './config.mjs';

export const FISIER = path.join(config.paths.state, 'catalog.ndjson');
const RESPINSE = path.join(config.paths.state, 'respinse.json');

/** Citește fotografia scrisă anterior. Sare liniile stricate de o oprire bruscă. */
export function citesteFotografia(fisier = FISIER) {
  if (!fs.existsSync(fisier)) return [];
  const out = [];
  for (const linie of fs.readFileSync(fisier, 'utf8').split('\n')) {
    if (!linie.trim()) continue;
    try { out.push(JSON.parse(linie)); } catch { /* linie trunchiată */ }
  }
  return out;
}

export function citesteRespinse() {
  try { return JSON.parse(fs.readFileSync(RESPINSE, 'utf8')); } catch { return []; }
}

export async function faFotografia({ proaspat = false, log = console.log } = {}) {
  const t0 = Date.now();
  fs.mkdirSync(config.paths.state, { recursive: true });
  const http = createHttp({ ...config.http, useCache: !proaspat });
  const source = createAutodoctorSource(http);

  const { produse, respinse, total } = await source.enumera({ log });

  /*
   * ÎNTRERUPĂTORUL. Fotografia se scrie doar dacă e întreagă: o fotografie
   * ciuntită ar stinge a doua zi, la actualizarea prețurilor, tot ce lipsește
   * din ea. Pragul fix prinde o schimbare de structură la ei; comparația cu
   * totalul lor prinde o pagină sărită.
   */
  if (produse.length < config.breakers.minEnumerate) {
    throw new Error(`fotografia are ${produse.length} anvelope, sub pragul de ${config.breakers.minEnumerate} — structura lor s-a schimbat; nu se scrie nimic`);
  }
  if (total && produse.length + respinse.length < total * 0.97) {
    throw new Error(`fotografia are ${produse.length + respinse.length} din ${total} anvelope declarate de ei — lipsesc pagini; nu se scrie nimic`);
  }

  /* Fișierul nou se scrie alături și se mută peste cel vechi abia la final:
     importul care citește în același timp nu vede niciodată jumătate de fișier. */
  const temp = `${FISIER}.nou`;
  fs.writeFileSync(temp, produse.map((p) => JSON.stringify(p)).join('\n') + '\n');
  fs.renameSync(temp, FISIER);
  fs.writeFileSync(RESPINSE, JSON.stringify(respinse, null, 1));

  log(`\nFotografia: ${produse.length} anvelope în ${FISIER} (${respinse.length} respinse, ${total} declarate de ei)`);
  log(`HTTP: ${http.stats.fetched} cereri, ${http.stats.cached} din cache, ${http.stats.retried} reîncercări, ${http.stats.failed} eșecuri`);
  log(`gata în ${Math.round((Date.now() - t0) / 1000)}s`);
  return { total: produse.length, respinse: respinse.length, declarate: total };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  faFotografia({ proaspat: process.argv.includes('--proaspat') })
    .catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
}
