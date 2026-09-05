#!/usr/bin/env node
/**
 * VERIFICAREA DE PARITATE — „câte sunt la ei, atâtea să fie la noi".
 *
 * DE CE EXISTĂ. Până acum răspundeam la întrebarea „am importat tot ce lipsea?"
 * numărând ce a scris importul. Aia e o măsurătoare despre unealtă, nu despre
 * rezultat. Clientul pune altă întrebare, singura care contează: deschid la ei
 * un filtru, deschid același filtru la noi, văd același număr? Pe 275/35 R19
 * iarnă, ei arătau 7 și noi 4.
 *
 * Un produs poate lipsi dintr-un filtru din patru motive complet diferite, iar
 * un contor global nu le deosebește:
 *
 *   1. nu-l avem deloc în catalog;
 *   2. îl avem, dar e `out_of_stock` sau fără preț, deci catalogul îl ascunde;
 *   3. îl avem și e vizibil, dar dimensiunea noastră parsată diferă de a lor,
 *      deci cade în alt sertar de filtru;
 *   4. îl avem, e vizibil, dimensiunea e bună, dar sezonul nostru diferă de al
 *      lor — și atunci lipsește exact din filtrul pe sezon, ca în exemplul de
 *      mai sus.
 *
 * Scriptul le separă și spune, pentru fiecare dimensiune, câte are fiecare parte
 * și care anume lipsesc. NU SCRIE NIMIC în bază.
 *
 * Sezonul îl luăm din filtrul lor, nu din titluri: codurile de mai jos sunt
 * chiar cele pe care le folosește bara lor de filtre.
 *
 *   node --env-file=.env.local tools/sync/pandashop/verify-parity.mjs
 *   node --env-file=.env.local tools/sync/pandashop/verify-parity.mjs --cache
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from './config.mjs';
import { createHttp } from './http.mjs';
import { createHtmlSource, TYRES_PATH } from './html-source.mjs';
import { readAll, readBrands } from './db.mjs';
import { indexeazaCatalogul, potriveste, potrivireRelaxata } from './match.mjs';
import { parseTitle } from './parse-title.mjs';

/** Codurile de sezon din filtrul lor, citite din markup-ul listării. */
const SEZOANE = [
  { cod: '2714_68375', sezon: 'iarna' },
  { cod: '2714_19501', sezon: 'vara' },
  { cod: '2714_29838', sezon: 'all_season' },
];

const COLOANE = [
  'id', 'category', 'brand_name', 'model', 'width', 'aspect', 'diameter',
  'load_index', 'speed_index', 'is_xl', 'is_runflat', 'title_ro', 'slug_ro',
  'pandashop_id', 'price_mdl', 'stock_status', 'season', 'is_active',
].join(',');

const dimensiune = (t) => (t.width && t.diameter ? `${t.width}/${t.aspect ?? '—'} ${t.diameter}` : '—');

export async function verifica(opts = {}) {
  const { faraCache = true } = opts;
  const log = opts.log ?? console.log;
  const t0 = Date.now();

  log('· citesc catalogul nostru…');
  const [produse, branduri] = await Promise.all([readAll('products', COLOANE), readBrands()]);
  const brandNames = branduri.map((b) => b.name).filter(Boolean).sort((a, b) => b.length - a.length);
  const index = indexeazaCatalogul(produse, brandNames);
  const dupaId = new Map(produse.map((p) => [p.id, p]));
  log(`  ${produse.filter((p) => p.category === 'anvelope').length} anvelope`);

  /*
   * Mai rabdator si mai lent decat restul uneltelor, deliberat. Verificarea
   * trece de trei ori prin listarea lor (o data pe sezon) si i-a prins de doua
   * ori raspunzand 500 la mijloc. Nu e o cursa: mai bine sase minute in plus
   * decat o rulare de patru minute care moare la pagina 23 si trebuie reluata
   * de la zero, cu inca 60 de pagini cerute degeaba de pe serverul lor.
   */
  const http = createHttp({
    ...config.http,
    useCache: !faraCache,
    concurrency: 2,
    delayMin: 900,
    delayMax: 1600,
    retries: 8,
  });

  /* --------------------------------------------- enumerarea lor, pe sezoane */
  const alorLor = new Map();          // pandashop_id -> { titlu, sezon, pret, t }
  for (const { cod, sezon } of SEZOANE) {
    const source = createHtmlSource(http, { path: `${TYRES_PATH}?Texts=${cod}` });
    let n = 0; let declarat = null;
    for await (const ref of source.listProducts({
      onPage: (pg, _r, meta) => {
        declarat = meta.total ?? declarat;
        if (pg % 10 === 0) process.stdout.write(`  ${sezon}: pagina ${pg}, ${n}\r`);
      },
    })) {
      n++;
      alorLor.set(String(ref.id), {
        titlu: ref.card.title,
        sezon,
        pret: ref.card.price,
        t: parseTitle(ref.card.title, brandNames),
      });
    }
    log(`\n  ${sezon}: ${n} enumerate (ei declară ${declarat})`);
    if (declarat && n < declarat * 0.9) {
      throw new Error(`enumerare incompletă pe ${sezon}: ${n} din ${declarat}`);
    }
  }
  log(`  total la ei, pe stoc: ${alorLor.size}`);

  /* ------------------------------------------------------------ comparația */
  const motive = {
    ok: 0,
    lipsa_din_catalog: [],
    ascuns_fara_stoc: [],
    dimensiune_diferita: [],
    sezon_diferit: [],
    nepotrivit: [],
  };

  for (const [id, lor] of alorLor) {
    const m = potriveste(lor.titlu, index, brandNames, { pandashopId: id });

    let noi = null;
    if (m.stare === 'gasit') noi = m.produs;
    else if (m.stare === 'doar_la_ei') noi = potrivireRelaxata(m.t, m.aproape);

    if (!noi) {
      if (m.stare === 'ambiguu' || m.stare === 'brand_necunoscut' || m.stare === 'dimensiune_neparsata') {
        motive.nepotrivit.push({ id, titlu: lor.titlu, cauza: m.stare });
      } else {
        motive.lipsa_din_catalog.push({ id, titlu: lor.titlu, dim: dimensiune(lor.t), sezon: lor.sezon });
      }
      continue;
    }

    /* Rândul din index e o proiecție; cel complet are stocul și sezonul. */
    const p = dupaId.get(noi.id) ?? noi;
    const vizibil = p.is_active && p.price_mdl != null && p.stock_status !== 'out_of_stock';

    if (!vizibil) {
      motive.ascuns_fara_stoc.push({ id, titlu: lor.titlu, slug: p.slug_ro, stoc: p.stock_status, pret: p.price_mdl, dim: dimensiune(lor.t), sezon: lor.sezon });
      continue;
    }

    /* Vizibil, dar în ce sertar? Dacă dimensiunea sau sezonul nostru diferă de
       al lor, produsul e pe site și totuși lipsește din filtrul lor echivalent. */
    const dimLor = dimensiune(lor.t);
    const dimNoi = p.width && p.diameter ? `${p.width}/${p.aspect ?? '—'} ${p.diameter}` : '—';
    if (dimLor !== '—' && dimLor !== dimNoi) {
      motive.dimensiune_diferita.push({ id, titlu: lor.titlu, slug: p.slug_ro, lor: dimLor, noi: dimNoi });
      continue;
    }
    if (p.season !== lor.sezon) {
      motive.sezon_diferit.push({ id, titlu: lor.titlu, slug: p.slug_ro, lor: lor.sezon, noi: p.season ?? '—', dim: dimLor });
      continue;
    }

    motive.ok++;
  }

  /* ------------------------------------------------- pe dimensiune și sezon */
  const peSertar = new Map();         // „275/35 R19 · iarna" -> {lor, noi}
  for (const [, lor] of alorLor) {
    const cheie = `${dimensiune(lor.t)} · ${lor.sezon}`;
    const c = peSertar.get(cheie) ?? { lor: 0, lipsa: 0 };
    c.lor++;
    peSertar.set(cheie, c);
  }
  for (const lista of [motive.lipsa_din_catalog, motive.ascuns_fara_stoc, motive.sezon_diferit]) {
    for (const x of lista) {
      const cheie = `${x.dim} · ${x.sezon ?? x.lor}`;
      const c = peSertar.get(cheie);
      if (c) c.lipsa++;
    }
  }
  const sertareStricate = [...peSertar.entries()]
    .filter(([, c]) => c.lipsa > 0)
    .sort((a, b) => b[1].lipsa - a[1].lipsa);

  /* ---------------------------------------------------------------- raport */
  const total = alorLor.size;
  const lipsesc = total - motive.ok;
  log(`\n${'='.repeat(60)}`);
  log(`PARITATE cu pandashop — ${motive.ok} din ${total} (${((motive.ok / total) * 100).toFixed(1)}%)`);
  log('='.repeat(60));
  log(`  lipsesc cu totul din catalog:        ${motive.lipsa_din_catalog.length}`);
  log(`  le avem, dar ascunse (stoc/preț):    ${motive.ascuns_fara_stoc.length}`);
  log(`  dimensiunea noastră diferă de a lor: ${motive.dimensiune_diferita.length}`);
  log(`  sezonul nostru diferă de al lor:     ${motive.sezon_diferit.length}`);
  log(`  nepotrivite (ambiguu/brand/parsare): ${motive.nepotrivit.length}`);
  log(`  TOTAL care nu apar la fel ca la ei:  ${lipsesc}`);

  if (sertareStricate.length) {
    log(`\n  dimensiunile cu diferențe (primele 25 din ${sertareStricate.length}):`);
    for (const [cheie, c] of sertareStricate.slice(0, 25)) {
      log(`    ${cheie.padEnd(30)} ei ${String(c.lor).padStart(3)} · lipsesc ${c.lipsa}`);
    }
  }

  for (const [eticheta, lista] of [
    ['lipsesc din catalog', motive.lipsa_din_catalog],
    ['ascunse', motive.ascuns_fara_stoc],
    ['sezon diferit', motive.sezon_diferit],
    ['dimensiune diferită', motive.dimensiune_diferita],
    ['nepotrivite', motive.nepotrivit],
  ]) {
    if (!lista.length) continue;
    log(`\n  ${eticheta} — primele 10:`);
    for (const x of lista.slice(0, 10)) {
      log(`    · ${x.titlu}${x.slug ? `  → /${x.slug}` : ''}${x.lor && x.noi ? `  (ei: ${x.lor}, noi: ${x.noi})` : ''}${x.stoc ? `  [${x.stoc}, preț ${x.pret ?? '—'}]` : ''}`);
    }
  }

  const dir = config.paths.reports;
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const fisier = path.join(dir, `paritate-${stamp}.json`);
  fs.writeFileSync(fisier, JSON.stringify({
    rulare: new Date().toISOString(),
    total_la_ei: total,
    la_fel_ca_la_ei: motive.ok,
    lipsesc,
    pe_motiv: {
      lipsa_din_catalog: motive.lipsa_din_catalog.length,
      ascuns_fara_stoc: motive.ascuns_fara_stoc.length,
      dimensiune_diferita: motive.dimensiune_diferita.length,
      sezon_diferit: motive.sezon_diferit.length,
      nepotrivit: motive.nepotrivit.length,
    },
    sertare: sertareStricate.map(([cheie, c]) => ({ sertar: cheie, la_ei: c.lor, lipsesc: c.lipsa })),
    detalii: motive,
  }, null, 2));
  log(`\nRaport complet: ${fisier}`);
  log(`gata în ${Math.round((Date.now() - t0) / 1000)}s · HTTP ${http.stats.fetched} cereri, ${http.stats.cached} din cache`);

  return { total, ok: motive.ok, lipsesc, motive, sertareStricate };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifica({ faraCache: !process.argv.includes('--cache') })
    .catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
}
