#!/usr/bin/env node
/**
 * FOTOGRAFIA CATALOGULUI LOR. Pasul 1, și singurul care atinge rețeaua.
 *
 * Enumeră toate anvelopele de la pneuexpert (sitemap + listările celor șase
 * categorii), aduce fiecare pagină de produs și scrie ce a înțeles într-un
 * fișier NDJSON. Nu atinge baza noastră: `db.mjs` nici măcar nu e importat aici.
 *
 * DE CE UN FIȘIER INTERMEDIAR, și nu import direct din rețea. Sunt ~5.500 de
 * pagini pe serverul unui partener, adică vreo 20 de minute de cereri politicoase.
 * Raportul de potrivire și importul citesc amândouă aceleași date; dacă fiecare
 * și-ar aduce singur paginile, l-am fi vizitat de două ori degeaba. Fotografia se
 * face o dată, se verifică, apoi se importă din ea.
 *
 * Reia de unde a rămas: fiecare pagină e în cache pe disc, iar produsele deja
 * scrise sunt sărite prin checkpoint. O rulare întreruptă nu costă nimic.
 *
 *   node --env-file=.env.local tools/sync/pneuexpert/snapshot.mjs
 *   node --env-file=.env.local tools/sync/pneuexpert/snapshot.mjs --limit 50
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHttp, createCheckpoint } from '../pandashop/http.mjs';
import { createPneuexpertSource } from './html-source.mjs';
import { config } from './config.mjs';

export const FISIER = path.join(config.paths.state, 'catalog.ndjson');
const REFS = path.join(config.paths.state, 'refs.json');

/** Citește fotografia scrisă anterior. Sărită liniile stricate de o oprire bruscă. */
export function citesteFotografia(fisier = FISIER) {
  if (!fs.existsSync(fisier)) return [];
  const out = [];
  for (const linie of fs.readFileSync(fisier, 'utf8').split('\n')) {
    if (!linie.trim()) continue;
    try { out.push(JSON.parse(linie)); } catch { /* linie trunchiată */ }
  }
  return out;
}

async function main() {
  const t0 = Date.now();
  const iLimit = process.argv.indexOf('--limit');
  const limit = iLimit > 0 ? Number(process.argv[iLimit + 1]) : Infinity;
  const reenumera = process.argv.includes('--reenumera');

  fs.mkdirSync(config.paths.state, { recursive: true });
  const http = createHttp({ ...config.http });
  const source = createPneuexpertSource(http);

  /* Enumerarea se ține pe disc: e partea care depinde de paginarea lor, iar o
     reluare n-are de ce să le mai ceară cele ~300 de pagini de listare. */
  let refs;
  if (!reenumera && fs.existsSync(REFS)) {
    refs = JSON.parse(fs.readFileSync(REFS, 'utf8'));
    console.log(`· enumerare citită de pe disc: ${refs.length} produse (--reenumera ca s-o refacă)`);
  } else {
    refs = await source.enumera({ log: console.log });
    fs.writeFileSync(REFS, JSON.stringify(refs, null, 1));
    console.log(`· enumerare: ${refs.length} produse distincte`);
  }

  if (refs.length < config.breakers.minEnumerate) {
    throw new Error(`enumerarea a întors ${refs.length} produse, sub pragul de ${config.breakers.minEnumerate} — structura lor s-a schimbat; nu se scrie nimic`);
  }

  const punct = createCheckpoint(path.join(config.paths.state, 'checkpoint.ndjson'));
  const deFacut = refs.filter((r) => !punct.has(r.id)).slice(0, limit === Infinity ? undefined : limit);
  console.log(`· de adus: ${deFacut.length} (${punct.size} deja în fotografie)`);

  const iesire = fs.openSync(FISIER, 'a');
  const cifre = { adus: 0, disparut: 0, eroare: 0 };
  let ultimul = Date.now();

  const lot = 200;
  for (let i = 0; i < deFacut.length; i += lot) {
    await http.map(deFacut.slice(i, i + lot), async (ref) => {
      try {
        const p = await source.fetchProduct(ref);
        if (!p) { cifre.disparut++; punct.mark(ref.id, { disparut: true }); return; }
        fs.writeSync(iesire, `${JSON.stringify({ ...p, inStoc: Boolean(ref.inStoc) })}\n`);
        cifre.adus++;
        punct.mark(ref.id);
      } catch (e) {
        cifre.eroare++;
        punct.mark(ref.id, { eroare: e.message });
        if (cifre.eroare <= 10) console.log(`  ! ${ref.id}: ${e.message}`);
      }
    });
    if (Date.now() - ultimul > 20_000) {
      const facut = i + lot;
      const rata = facut / ((Date.now() - t0) / 1000);
      const ramas = Math.round((deFacut.length - facut) / Math.max(rata, 0.01));
      console.log(`  ${Math.min(facut, deFacut.length)}/${deFacut.length} · ${cifre.adus} aduse, ${cifre.disparut} dispărute, ${cifre.eroare} erori · ~${Math.round(ramas / 60)} min rămase`);
      ultimul = Date.now();
    }
  }

  fs.closeSync(iesire);
  punct.close();
  const total = citesteFotografia().length;
  console.log(`\nFotografia: ${total} produse în ${FISIER}`);
  console.log(`HTTP: ${http.stats.fetched} cereri, ${http.stats.cached} din cache, ${http.stats.retried} reîncercări, ${http.stats.failed} eșecuri`);
  console.log(`gata în ${Math.round((Date.now() - t0) / 1000)}s`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
}
