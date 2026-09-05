#!/usr/bin/env node
/**
 * GATE D — RECUPERAREA ANVELOPELOR CARE LIPSESC DIN CATALOG.
 *
 * DE CE EXISTA. Fotografia initiala (Gate A) a scris toate cele ~25.000 de
 * ID-uri de la pandashop in `pandashop_seen` cu `status = 'skipped'`, ca sa nu se
 * importe retroactiv nimic. Corect ca precautie, gresit ca stare finala: din acel
 * moment „produs nou" a insemnat „ID aparut DUPA fotografie", iar cele ~1.100 de
 * anvelope pe care ei le au pe stoc si noi nu le-am avut niciodata au ramas in
 * afara catalogului pentru totdeauna. Clientul le vede la ei si nu le vede la noi.
 *
 * CE FACE. Trece prin listarea lor, potriveste fiecare produs cu catalogul nostru
 * exact ca `refresh.mjs`, si importa DOAR ce nu se potriveste cu nimic — cu titlu
 * in ambele limbi, descriere, atribute, dimensiune parsata, pret si poze.
 *
 * DE CE NU REFOLOSESTE `import.mjs` CA ATARE. Acela intreaba `pandashop_seen`
 * cine e nou, iar raspunsul e „nimeni": fotografia a marcat tot. Aici intrebarea
 * e alta — „ce au ei si nu avem noi" — si se raspunde prin potrivire, nu prin
 * apartenenta la o multime. Normalizarea, verificarile si scrierea sunt insa
 * exact aceleasi functii, importate din `import.mjs`; nu exista a doua definitie
 * a ce inseamna un produs valid.
 *
 *   node --env-file=.env.local tools/sync/pandashop/backfill.mjs                    # dry-run
 *   node --env-file=.env.local tools/sync/pandashop/backfill.mjs --limit 20 --apply
 *   node --env-file=.env.local tools/sync/pandashop/backfill.mjs --apply --branduri
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from './config.mjs';
import { createHttp } from './http.mjs';
import { createHtmlSource } from './html-source.mjs';
import { readAll, readBrands } from './db.mjs';
import { insert, insertReturning } from './db-write.mjs';
import { indexeazaCatalogul, potriveste, potrivireRelaxata } from './match.mjs';
import { normalizeaza } from './import.mjs';
import { pregatesteImagini } from './images.mjs';
import { slugRo, slugRu } from './slug.mjs';
import { iaLacatul, elibereazaLacatul } from './lock.mjs';
import { reimprospateazaContoarele } from './counters.mjs';

const COLOANE = [
  'id', 'category', 'brand_name', 'model', 'width', 'aspect', 'diameter',
  'load_index', 'speed_index', 'is_xl', 'is_runflat', 'title_ro', 'slug_ro', 'slug_ru', 'pandashop_id',
].join(',');

/**
 * Brandurile pe care ei le au si noi nu.
 *
 * Regula veche era „brand necunoscut = carantina, niciodata creat automat", si
 * are dreptate ca politica implicita: un brand inventat dintr-o greseala de
 * parsare ramane in catalog. Dar cand scopul rularii e chiar sa aduca TOT ce au
 * ei, refuzul inseamna ca zeci de anvelope reale nu intra niciodata. Compromisul:
 * se creeaza doar cerut explicit (`--branduri`), se listeaza inainte, si se
 * marcheaza `is_active` ca oricare altul, ca sa se poata stinge dintr-un click.
 */
async function creeazaBranduri(nume, { apply, log }) {
  if (nume.length === 0) return new Map();
  log(`· branduri de creat: ${nume.length} — ${nume.join(', ')}`);
  if (!apply) return new Map();
  const randuri = nume.map((n) => ({
    name: n,
    slug_ro: slugRo(n),
    slug_ru: slugRu(n),
    is_active: true,
  }));
  const create = await insertReturning('brands', randuri);
  log(`  create: ${create.length}`);
  return new Map(create.map((b) => [b.name.toLowerCase(), b]));
}

export async function recupereaza(opts = {}) {
  const {
    apply: aplica = false, limit = Infinity, branduriNoi = false, faraCache = true,
  } = opts;
  const log = opts.log ?? console.log;
  const t0 = Date.now();
  const jurnal = [];
  const spune = (...a) => { jurnal.push(a.join(' ')); log(...a); };

  const setari = (await readAll('settings', 'sync_enabled,pricing_rules'))[0] ?? {};
  if (setari.sync_enabled === false) {
    spune('sincronizarea e oprita din admin');
    return { oprit: 'din_admin', jurnal };
  }

  spune('· citesc catalogul nostru…');
  let branduri = await readBrands();
  const [produse, imagini, vazute] = await Promise.all([
    readAll('products', COLOANE),
    readAll('product_images', 'content_hash'),
    readAll('pandashop_seen', 'pandashop_id,status'),
  ]);
  const brandNames = branduri.map((b) => b.name).filter(Boolean).sort((a, b) => b.length - a.length);
  const index = indexeazaCatalogul(produse, brandNames);
  const sluguriRo = new Set(produse.map((p) => p.slug_ro).filter(Boolean));
  const sluguriRu = new Set(produse.map((p) => p.slug_ru).filter(Boolean));
  const hashuri = new Set(imagini.map((i) => i.content_hash).filter(Boolean));
  const importatDeja = new Set(vazute.filter((v) => v.status === 'imported').map((v) => v.pandashop_id));
  spune(`  ${produse.length} produse, ${branduri.length} branduri, ${hashuri.size} imagini distincte`);

  const http = createHttp({ ...config.http, useCache: !faraCache });
  const source = createHtmlSource(http);

  spune('· enumar listarea lor si potrivesc…');
  const candidati = [];
  const brandNecunoscut = new Map();     // nume brut -> [refs]
  const respins = { ambiguu: 0, neparsat: 0, gasit: 0, relaxat: 0 };
  let enumerate = 0; let declarat = null;

  for await (const ref of source.listProducts({
    onPage: (pagina, _r, meta) => {
      declarat = meta.total ?? declarat;
      if (pagina % 10 === 0) process.stdout.write(`  pagina ${pagina}, ${candidati.length} candidati\r`);
    },
  })) {
    enumerate++;
    if (importatDeja.has(String(ref.id))) { respins.gasit++; continue; }

    const m = potriveste(ref.card.title, index, brandNames, { pandashopId: ref.id });
    if (m.stare === 'gasit') { respins.gasit++; continue; }
    if (m.stare === 'ambiguu') { respins.ambiguu++; continue; }
    if (m.stare === 'dimensiune_neparsata') { respins.neparsat++; continue; }
    if (m.stare === 'brand_necunoscut') {
      /* Nu se arunca: se retine ca sa poata fi vazut si, la cerere, creat. */
      const brut = (ref.card.title ?? '').replace(/^\s*Anvelopa\s+/i, '').split(/\s+/)[0];
      const lista = brandNecunoscut.get(brut) ?? [];
      lista.push(ref);
      brandNecunoscut.set(brut, lista);
      continue;
    }
    /* `doar_la_ei`: ultima verificare inainte de a-l declara lipsa — poate fi
       aceeasi anvelopa ca una de-a noastra careia ii lipsesc indicii. */
    if (potrivireRelaxata(m.t, m.aproape)) { respins.relaxat++; continue; }

    candidati.push({ ref, near: Boolean(m.aproape) });
  }
  spune(`\n  ${enumerate} produse la ei (declara ${declarat})`);
  spune(`  deja la noi: ${respins.gasit}  ·  ambigue: ${respins.ambiguu}  ·  potrivite relaxat: ${respins.relaxat}  ·  dimensiune neparsata: ${respins.neparsat}`);
  spune(`  brand necunoscut: ${[...brandNecunoscut.values()].reduce((n, l) => n + l.length, 0)} produse, ${brandNecunoscut.size} branduri`);
  spune(`  LIPSESC DIN CATALOG: ${candidati.length}`);

  if (enumerate === 0) throw new Error('enumerarea a intors 0 produse — nu se scrie nimic');
  if (declarat && enumerate < declarat * 0.9) {
    throw new Error(`enumerare incompleta: ${enumerate} din ${declarat} — nu se scrie nimic`);
  }

  /* Brandurile noi, daca s-au cerut. Se fac INAINTE de import, ca produsele lor
     sa treaca verificarea de brand in aceeasi rulare. */
  if (branduriNoi && brandNecunoscut.size) {
    const create = await creeazaBranduri([...brandNecunoscut.keys()].sort(), { apply: aplica, log: spune });
    if (aplica && create.size) {
      branduri = await readBrands();
      for (const lista of brandNecunoscut.values()) for (const ref of lista) candidati.push({ ref, near: false });
      spune(`  candidati dupa adaugarea brandurilor: ${candidati.length}`);
    }
  }

  const deLucru = candidati.slice(0, limit === Infinity ? undefined : limit);
  if (deLucru.length === 0) {
    spune('\nNimic de importat.');
    return { jurnal, importate: [], carantina: [], faraPret: [], erori: [], durata: Date.now() - t0 };
  }

  /*
   * PE LOTURI, nu dintr-o data.
   *
   * Prima incercare aducea toate cele 1.207 fise si abia apoi scria. La 575
   * pandashop a inceput sa raspunda 500 pe categoria de anvelope, rularea a
   * ramas blocata in reincercari si nu se scrisese NIMIC — o ora de cereri pe
   * serverul lor, aruncata. Acum fiecare lot se aduce, se scrie, si abia apoi
   * incepe urmatorul: o intrerupere costa cel mult un lot.
   *
   * Paginile aduse raman oricum in cache-ul de pe disc, deci o reluare cu
   * `--cache` trece instant peste ce s-a facut deja.
   */
  const LOT = 40;
  const rezultate = { importate: [], carantina: [], faraPret: [], erori: [] };
  let opritDeSursa = null;

  for (let start = 0; start < deLucru.length; start += LOT) {
    const lot = deLucru.slice(start, start + LOT);
    const brute = new Array(lot.length);

    await http.map(lot, async (c, i) => {
      try {
        brute[i] = await source.fetchProduct(c.ref);
      } catch (e) {
        brute[i] = { _eroare: e.message, _id: c.ref.id };
      }
    });

    /*
     * Sursa cedeaza? Ne oprim, nu insistam. Un lot intreg esuat inseamna ca ei
     * au o problema, iar reincercarile noastre nu fac decat sa o adanceasca.
     * Ce s-a scris pana aici ramane scris.
     */
    const esuate = brute.filter((b) => !b || b._eroare).length;
    if (esuate >= lot.length * 0.8) {
      opritDeSursa = `${esuate} din ${lot.length} fise n-au putut fi aduse — sursa nu raspunde, se opreste aici`;
      break;
    }

    for (const [i, sursa] of brute.entries()) {
      const idRef = lot[i].ref.id;
      if (!sursa) { rezultate.erori.push({ id: idRef, motiv: '404 la extragere' }); continue; }
      if (sursa._eroare) { rezultate.erori.push({ id: sursa._id, motiv: sursa._eroare }); continue; }

      try {
        const { rand, motive, pret, faraPret } = normalizeaza(sursa, {
          branduri, sluguriRo, sluguriRu, reguli: setari.pricing_rules,
        });

        if (faraPret && motive.length === 0) { rezultate.faraPret.push({ id: sursa.id, titlu: sursa.titleRo }); continue; }

        const { imagini: imgs, erori: eImg } = await pregatesteImagini(sursa.images, hashuri, {
          dryRun: !aplica, altRo: rand.title_ro, altRu: rand.title_ru,
        });
        if (imgs.length === 0) motive.push(`nicio imagine descarcata${eImg.length ? `: ${eImg[0]}` : ''}`);
        if (eImg.length) rezultate.erori.push({ id: sursa.id, motiv: `imagini ratate (${eImg.length})` });

        if (motive.length) { rezultate.carantina.push({ id: sursa.id, titlu: sursa.titleRo, motive, rand }); continue; }

        if (aplica) {
          const [creat] = await insertReturning('products', [rand]);
          if (imgs.length) await insert('product_images', imgs.map(({ refolosita, ...im }) => ({ ...im, product_id: creat.id })));
          await insert('pandashop_seen', [{
            pandashop_id: String(sursa.id), baseline: false, imported: true, product_id: creat.id,
            status: 'imported', last_checked_at: new Date().toISOString(),
          }], { onConflict: 'pandashop_id' });
        }

        /* Se numara DUPA scriere, ca raportul sa spuna ce e in baza, nu ce s-a intentionat. */
        rezultate.importate.push({ id: sursa.id, rand, imgs, pret });
        sluguriRo.add(rand.slug_ro);
        if (rand.slug_ru) sluguriRu.add(rand.slug_ru);
      } catch (e) {
        rezultate.erori.push({ id: idRef, motiv: e.message });
      }
    }

    process.stdout.write(`  ${Math.min(start + LOT, deLucru.length)}/${deLucru.length} · importate ${rezultate.importate.length} · carantina ${rezultate.carantina.length} · erori ${rezultate.erori.length}\r`);
  }
  if (opritDeSursa) spune(`\n  OPRIT: ${opritDeSursa}`);

  /* ------------------------------------------------------------- raportul */
  const peMotiv = {};
  for (const c of rezultate.carantina) for (const m of c.motive) {
    const cheie = m.replace(/:.*$/, '');
    peMotiv[cheie] = (peMotiv[cheie] ?? 0) + 1;
  }

  spune(`\n${aplica ? 'APLICAT' : 'DRY-RUN — nu s-a scris nimic'}`);
  spune(`  importate:        ${rezultate.importate.length}`);
  spune(`  in carantina:     ${rezultate.carantina.length}`);
  spune(`  fara pret:        ${rezultate.faraPret.length}`);
  spune(`  erori:            ${rezultate.erori.length}`);
  if (Object.keys(peMotiv).length) {
    spune('  motivele carantinei:');
    for (const [m, n] of Object.entries(peMotiv).sort((a, b) => b[1] - a[1])) spune(`    ${String(n).padStart(4)}  ${m}`);
  }
  for (const x of rezultate.importate.slice(0, 15)) {
    spune(`   + ${x.rand.title_ro} — ${x.rand.price_mdl} MDL · ${x.imgs.length} poze · /${x.rand.slug_ro}`);
  }

  const dir = config.paths.reports;
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  fs.writeFileSync(path.join(dir, `backfill-${stamp}.json`), JSON.stringify({
    dryRun: !aplica,
    cifre: { enumerate, candidati: candidati.length, ...respins, importate: rezultate.importate.length },
    brandNecunoscut: [...brandNecunoscut.entries()].map(([n, l]) => ({ brand: n, produse: l.length, exemplu: l[0].card.title })),
    carantina: rezultate.carantina.map((c) => ({ id: c.id, titlu: c.titlu, motive: c.motive })),
    erori: rezultate.erori,
    importate: rezultate.importate.map((x) => ({ id: x.id, titlu: x.rand.title_ro, slug: x.rand.slug_ro, pret: x.rand.price_mdl, poze: x.imgs.length })),
  }, null, 2));

  if (aplica && rezultate.importate.length > 0) await reimprospateazaContoarele(spune);

  if (aplica) {
    await insert('import_runs', [{
      source: 'pandashop_sync', actor: opts.actor ?? 'backfill', dry_run: false,
      started_at: new Date(t0).toISOString(), finished_at: new Date().toISOString(),
      rows_total: deLucru.length, rows_created: rezultate.importate.length, rows_skipped: rezultate.faraPret.length,
      errors: rezultate.erori.slice(0, 200), notes: `backfill: ${rezultate.carantina.length} in carantina`,
    }]);
    for (const c of rezultate.carantina) {
      await insert('sync_quarantine', [{ pandashop_id: String(c.id), reason: c.motive.join('; '), raw: c.rand }], { onConflict: 'pandashop_id,reason' });
    }
  }

  spune(`gata in ${Math.round((Date.now() - t0) / 1000)}s · HTTP ${http.stats.fetched} cereri, ${http.stats.cached} din cache`);
  return { ...rezultate, jurnal, dryRun: !aplica, opritDeSursa, ramase: candidati.length - rezultate.importate.length - rezultate.carantina.length - rezultate.faraPret.length, durata: Date.now() - t0 };
}

async function main() {
  const iLimit = process.argv.indexOf('--limit');
  if (!(await iaLacatul('backfill'))) { console.log('o alta rulare e in curs'); return; }
  try {
    await recupereaza({
      apply: process.argv.includes('--apply'),
      branduriNoi: process.argv.includes('--branduri'),
      faraCache: !process.argv.includes('--cache'),
      limit: iLimit > 0 ? Number(process.argv[iLimit + 1]) : Infinity,
      actor: 'cli:backfill',
    });
  } finally { await elibereazaLacatul(); }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error('\nA ESUAT:', e.message); process.exit(1); });
}
