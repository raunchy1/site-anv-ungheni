#!/usr/bin/env node
/**
 * DETECTORUL. Pasul 2 al mecanismului.
 *
 * Enumeră ID-urile de la ei, scade ce e deja în `pandashop_seen`, și ce rămâne e
 * nou. Nicio potrivire aproximativă, niciun prag de similaritate, nicio atingere
 * a produselor existente.
 *
 * Aici e DOAR detecție: raportează ce e nou și se oprește. Importul se leagă la
 * Gate B. Până atunci scriptul nu scrie nimic, nicăieri.
 *
 *   node --env-file=.env.local tools/sync/pandashop/detect.mjs           # rapid, primele pagini
 *   node --env-file=.env.local tools/sync/pandashop/detect.mjs --full    # tot catalogul
 */
import { config } from './config.mjs';
import { createHttp } from './http.mjs';
import { createHtmlSource } from './html-source.mjs';
import { createFeedSource } from './feed-source.mjs';
import { pathToFileURL } from 'node:url';
import { readAll } from './db.mjs';

const full = process.argv.includes('--full');

/**
 * Regula de oprire pentru rularea rapidă: catalogul lor e ordonat cu cele mai noi
 * întâi, deci după două pagini consecutive fără niciun ID necunoscut nu mai are
 * ce urma. Rularea săptămânală (`--full`) merge până la capăt, ca să prindă și
 * produsele adăugate retroactiv, în mijlocul listei.
 */
export async function detecteaza({ cunoscute, source, full: complet }) {
  const noi = [];
  let paginiFaraNoutati = 0;
  let pagini = 0;
  let declarat = null;

  for await (const ref of source.listProducts({
    onPage: (page, refs, meta) => {
      pagini = page;
      declarat = meta.total ?? declarat;
      if (complet) return;
      const necunoscute = refs.filter((r) => !cunoscute.has(r.id)).length;
      paginiFaraNoutati = necunoscute === 0 ? paginiFaraNoutati + 1 : 0;
      if (paginiFaraNoutati >= config.discovery.stopAfterKnownPages) return 'stop';
      return undefined;
    },
  })) {
    if (!cunoscute.has(ref.id)) noi.push(ref);
  }
  return { noi, pagini, declarat };
}

async function main() {
  const t0 = Date.now();
  const cunoscute = new Set((await readAll('pandashop_seen', 'pandashop_id')).map((r) => r.pandashop_id));
  console.log(`· ID-uri cunoscute: ${cunoscute.size}`);

  const http = createHttp({ ...config.http });
  const source = config.source === 'feed' ? createFeedSource() : createHtmlSource(http);
  const { noi, pagini, declarat } = await detecteaza({ cunoscute, source, full });

  /* Întrerupătorul. Implicit: oprire. */
  if (pagini > 0 && declarat === 0) throw new Error('enumerarea a întors 0 produse — structura lor s-a schimbat');
  if (noi.length > config.breakers.maxNewPerRun) {
    throw new Error(`${noi.length} produse noi într-o rulare, peste pragul de ${config.breakers.maxNewPerRun} — se oprește`);
  }

  console.log(`· ${full ? 'enumerare completă' : 'rulare rapidă'}: ${pagini} pagini, ${Math.round((Date.now() - t0) / 1000)}s`);
  console.log(`\nPRODUSE NOI: ${noi.length}`);
  for (const r of noi.slice(0, 30)) console.log(`  ${r.id}  ${r.card.title}  ${r.card.price ?? '—'} MDL`);
  if (noi.length > 30) console.log(`  … și încă ${noi.length - 30}`);
  if (noi.length === 0) console.log('  (nimic nou — exact ce trebuie imediat după fotografia inițială)');
  console.log('\nDetecție, atât. Importul se leagă la Gate B; nimic nu s-a scris.');
}

/* `pathToFileURL`, nu interpolare: calea proiectului are un spațiu în ea, iar
   `file://…/anvelope ungheni site/…` nu e egal cu URL-ul codificat din
   `import.meta.url`. Fără asta scriptul se încarcă și nu face nimic, tăcut. */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
}
