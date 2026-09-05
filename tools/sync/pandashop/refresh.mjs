#!/usr/bin/env node
/**
 * GATE C — ACTUALIZAREA PRETULUI SI A STOCULUI.
 *
 * DE CE EXISTA. Mecanismul din Gate A/B a fost construit ca sa importe anvelope
 * NOI si sa nu atinga nimic din ce aveam deja — o precautie corecta cand
 * catalogul tocmai fusese mutat din OpenCart. Numai ca de atunci nimeni n-a mai
 * confruntat cele 15.008 randuri cu sursa, iar pretul si stocul lor au ramas la
 * ziua exportului. 6.944 stau pe `out_of_stock` cu pret NULL, iar catalogul le
 * ascunde: `queries.ts` filtreaza pe `stock_status in ('in_stock','supplier')`.
 * Asta a vazut clientul — 275/35 R19 iarna arata un singur model la noi si mai
 * multe la ei, desi produsele existau in baza noastra, doar stinse.
 *
 * CE FACE. O trecere peste listarea lor (~138 de pagini, cateva minute), plus
 * sitemap-ul de produse fara stoc, si pentru fiecare produs de-al nostru care se
 * potriveste scrie pretul lor + marja si disponibilitatea. Atat. Nu creeaza
 * produse — aia e treaba lui `backfill.mjs` — si nu poate atinge alta coloana
 * decat cele cinci, pentru ca scrie prin `sync_refresh_products`, nu prin UPDATE.
 *
 * CE NU FACE FARA SA I SE CEARA. Produsele care nu mai apar deloc la ei nu se
 * sting automat: sunt 5.000 si e o decizie comerciala, nu una tehnica. `--delisted`
 * o cere explicit.
 *
 *   node --env-file=.env.local tools/sync/pandashop/refresh.mjs                 # dry-run
 *   node --env-file=.env.local tools/sync/pandashop/refresh.mjs --apply
 *   node --env-file=.env.local tools/sync/pandashop/refresh.mjs --apply --delisted
 *   node --env-file=.env.local tools/sync/pandashop/refresh.mjs --apply --fara-sitemap
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from './config.mjs';
import { createHttp } from './http.mjs';
import { createHtmlSource } from './html-source.mjs';
import { readAll, readBrands } from './db.mjs';
import { indexeazaCatalogul, potriveste, potrivireRelaxata, cheieDin } from './match.mjs';
import { naturalKey, extrageOE } from './natural-key.mjs';
import { parseTitle } from './parse-title.mjs';
import { calculeazaPret } from './pricing.mjs';
import { tyreUrls, slugToTitle } from './sitemap.mjs';
import { iaLacatul, elibereazaLacatul } from './lock.mjs';
import { reimprospateazaContoarele } from './counters.mjs';

/* Coloanele de care are nevoie potrivirea, plus cele pe care le comparam.
   Deliberat nu `select=*`: 15.000 de randuri cu descrieri si atribute inseamna
   zeci de MB pe care nu-i citim ca sa comparam doua numere. */
const COLOANE = [
  'id', 'category', 'brand_name', 'model', 'width', 'aspect', 'diameter',
  'load_index', 'speed_index', 'is_xl', 'is_runflat', 'title_ro',
  'pandashop_id', 'price_mdl', 'source_price_mdl', 'price_locked', 'stock_status', 'synced_at',
].join(',');

/**
 * Cheile sub care un rand de-al nostru poate fi cautat in catalogul lor:
 * cea din coloanele structurate si cea din titlu. Ordinea conteaza — coloanele
 * sunt mai complete, titlul e plasa de siguranta.
 */
function cheiProdus(p, brandNames) {
  const chei = [];
  if (p.brand_name && p.model && p.diameter) {
    const oe = extrageOE(p.model) || extrageOE(p.title_ro);
    chei.push(naturalKey({
      brand: p.brand_name, model: p.model, width: p.width, aspect: p.aspect, diameter: p.diameter,
      loadIndex: p.load_index, speedIndex: p.speed_index, isXl: p.is_xl, isRunflat: p.is_runflat, oe,
    }));
  }
  const t = parseTitle(p.title_ro, brandNames);
  if (t.brandKnown && t.size_raw) {
    const k = cheieDin(t);
    if (!chei.includes(k)) chei.push(k);
  }
  return chei;
}

/** Apelul RPC. Singura cale prin care fisierul asta poate scrie in `products`. */
async function scrie(randuri, { chunk = 500 } = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  let actualizate = 0; let blocate = 0;
  for (let i = 0; i < randuri.length; i += chunk) {
    const res = await fetch(`${url}/rest/v1/rpc/sync_refresh_products`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_rows: randuri.slice(i, i + chunk) }),
    });
    if (!res.ok) throw new Error(`sync_refresh_products: HTTP ${res.status} ${await res.text()}`);
    const [r] = await res.json();
    actualizate += r?.actualizate ?? 0;
    blocate += r?.blocate ?? 0;
  }
  return { actualizate, blocate };
}

/**
 * O rulare. Cronul si CLI-ul apeleaza exact functia asta.
 *
 * @param {{apply?: boolean, delisted?: boolean, faraCache?: boolean, log?: Function}} opts
 */
export async function actualizeaza(opts = {}) {
  const { apply: aplica = false, delisted = false, faraCache = true, cuSitemap = true } = opts;
  const log = opts.log ?? console.log;
  const t0 = Date.now();
  const jurnal = [];
  const spune = (...a) => { jurnal.push(a.join(' ')); log(...a); };

  const setari = (await readAll('settings', 'sync_enabled,pricing_rules'))[0] ?? {};
  if (setari.sync_enabled === false) {
    spune('sincronizarea e oprita din admin (settings.sync_enabled = false)');
    return { oprit: 'din_admin', jurnal };
  }

  spune('· citesc catalogul nostru…');
  const [produse, branduri] = await Promise.all([readAll('products', COLOANE), readBrands()]);
  const brandNames = branduri.map((b) => b.name).filter(Boolean).sort((a, b) => b.length - a.length);
  const anvelope = produse.filter((p) => p.category === 'anvelope');
  const index = indexeazaCatalogul(produse, brandNames);
  spune(`  ${anvelope.length} anvelope, ${branduri.length} branduri, ${index.faraCheie} fara cheie completa`);

  /* Cache-ul HTTP e dezactivat implicit AICI, spre deosebire de raportul de
     potrivire: un pret citit din cache-ul de saptamana trecuta nu e o
     actualizare, e o minciuna scrisa in baza cu data de azi. */
  const http = createHttp({ ...config.http, useCache: !faraCache });
  const source = createHtmlSource(http);

  spune('· enumar listarea lor (produse pe stoc)…');
  const peStoc = new Map();          // cheie naturala -> {id, pret, titlu}
  const peStocId = new Map();        // pandashop_id  -> acelasi obiect
  let declarat = null;
  let enumerate = 0;
  for await (const ref of source.listProducts({
    onPage: (pagina, _refs, meta) => {
      declarat = meta.total ?? declarat;
      if (pagina % 10 === 0) process.stdout.write(`  pagina ${pagina}, ${enumerate} produse\r`);
    },
  })) {
    enumerate++;
    const t = parseTitle(ref.card.title, brandNames);
    const rec = {
      id: ref.id,
      pret: ref.card.price,
      disponibil: ref.card.available,
      titlu: ref.card.title,
    };
    peStocId.set(String(ref.id), rec);
    if (t.brandKnown && t.size_raw) {
      const k = cheieDin(t);
      /* Prima aparitie castiga. Daca ei au acelasi model de doua ori, nu avem cum
         alege intre ele si oricum au acelasi pret. */
      if (!peStoc.has(k)) peStoc.set(k, rec);
    }
  }
  spune(`\n  ${enumerate} produse enumerate (ei declara ${declarat})`);

  /* Intrerupatorul de la enumerare: o listare ciuntita ar stinge catalogul. */
  if (enumerate === 0) throw new Error('enumerarea a intors 0 produse — nu se scrie nimic');
  if (declarat && enumerate < declarat * 0.9) {
    throw new Error(`enumerare incompleta: ${enumerate} din ${declarat} declarate — nu se scrie nimic`);
  }

  /*
   * Sitemap-ul de produse fara stoc e util o data pe saptamana, nu zilnic: sunt
   * 11 fisiere de ~25 MB fiecare si singurul lucru pe care il adauga e stingerea
   * fiselor mostenite din OpenCart care la ei exista, dar n-au fost niciodata pe
   * stoc de cand sincronizam. Rularea zilnica din cron il sare.
   */
  const faraStocChei = new Set();
  if (cuSitemap) {
    spune('· citesc sitemap-ul lor de produse fara stoc…');
    const urls = await tyreUrls({
      stateDir: config.paths.state,
      refresh: faraCache,
      onFile: (i, n, gasite) => process.stdout.write(`  fisierul ${i}/${n}, ${gasite} anvelope\r`),
    });
    for (const u of urls) {
      const t = parseTitle(slugToTitle(u.slug), brandNames);
      if (t.brandKnown && t.size_raw) faraStocChei.add(cheieDin(t));
    }
    spune(`\n  ${urls.length} anvelope fara stoc la ei, ${faraStocChei.size} chei distincte`);
  } else {
    spune('· sitemap-ul de produse fara stoc: sarit (--fara-sitemap)');
  }

  /*
   * A DOUA TRECERE — fisele noastre carora le lipsesc indicii.
   *
   * Se porneste dinspre ei, nu dinspre noi: doar asa se vede daca un produs de-al
   * lor are UN SINGUR corespondent posibil la noi. „Michelin Pilot Alpin 5
   * 275/35 R19 100V MO" la ei, „…275/35 R19 MO" la noi — aceeasi anvelopa, chei
   * stricte diferite. Fara pasul asta fisa noastra ramane stinsa pe veci, iar a
   * lor intra la import ca produs nou, adica duplicat.
   *
   * Cand doi dintre ei vor acelasi rand de-al nostru, se renunta la amandoi:
   * inseamna ca exista chiar doua variante si nu putem sti care e a noastra.
   */
  const relaxat = new Map();          // id-ul produsului nostru -> rec de la ei
  const disputat = new Set();
  for (const rec of peStocId.values()) {
    const m = potriveste(rec.titlu, index, brandNames);
    if (m.stare !== 'doar_la_ei') continue;
    const al_nostru = potrivireRelaxata(m.t, m.aproape);
    if (!al_nostru) continue;
    if (relaxat.has(al_nostru.id)) { disputat.add(al_nostru.id); continue; }
    relaxat.set(al_nostru.id, rec);
  }
  for (const id of disputat) relaxat.delete(id);
  spune(`  potriviri relaxate (fise fara indici la noi): ${relaxat.size}${disputat.size ? `, ${disputat.size} disputate si lasate deoparte` : ''}`);

  /* ------------------------------------------------------------- decizia */
  const deScris = [];
  const rezumat = {
    reactivate: 0,        // erau stinse la noi, sunt pe stoc la ei
    stinse: 0,            // erau aprinse la noi, la ei nu mai sunt pe stoc
    pretSchimbat: 0,
    neschimbate: 0,
    fara_corespondent: 0, // nu apar la ei nici pe stoc, nici in sitemap
    ambigue: 0,
  };
  const exemple = { reactivate: [], stinse: [], pret: [] };

  /*
   * UN `pandashop_id` PE UN SINGUR RAND. `products_pandashop_id_uidx` e unic, iar
   * catalogul nostru are perechi de fise care descriu aceeasi anvelopa (mostenite
   * din OpenCart, vezi report-duplicates.mjs). Amandoua se potrivesc cu acelasi
   * produs de la ei, deci amandoua ar cere aceeasi eticheta si lotul ar pica cu
   * 23505 — s-a intamplat la prima rulare cu scriere.
   *
   * Ambele randuri primesc pretul si stocul, pentru ca ambele descriu o anvelopa
   * care chiar e pe stoc. Doar eticheta merge la unul singur: primul intalnit,
   * sau cel care o are deja.
   */
  const idRezervat = new Map();     // pandashop_id -> id-ul produsului nostru care il tine
  for (const p of anvelope) if (p.pandashop_id) idRezervat.set(String(p.pandashop_id), p.id);
  let duplicate = 0;
  const eticheta = (pandashopId, produsId) => {
    const cheie = String(pandashopId);
    const detinator = idRezervat.get(cheie);
    if (detinator === undefined) { idRezervat.set(cheie, produsId); return cheie; }
    if (detinator === produsId) return cheie;
    duplicate++;
    return null;                    // `coalesce` in RPC pastreaza ce era
  };

  for (const p of anvelope) {
    const m = potriveste(p.title_ro, index, brandNames, { pandashopId: p.pandashop_id });

    /* Produsul nostru, cautat in listarea lor. Legatura prin `pandashop_id` e
       cea sigura; altfel, cheia naturala din titlul nostru. */
    let lor = p.pandashop_id ? peStocId.get(String(p.pandashop_id)) : null;
    let cheie = null;
    if (!lor) {
      /* DOUA CHEI, ca la indexare, si din exact acelasi motiv: 1.896 din fisele
         noastre au titlul in dezacord cu coloanele. „Michelin Pilot Alpin 5
         275/35 R19 MO" n-are indicii in titlu, dar ii are in `load_index` si
         `speed_index`. Daca am cauta doar dupa titlu, fisa ar ramane stinsa desi
         anvelopa e pe stoc la ei — exact cazul reclamat de client. */
      for (const k of cheiProdus(p, brandNames)) {
        if (!cheie) cheie = k;
        lor = peStoc.get(k);
        if (lor) { cheie = k; break; }
      }
    }
    /* Ultima sansa: perechea gasita la trecerea relaxata de mai sus. */
    if (!lor) lor = relaxat.get(p.id) ?? null;

    if (lor) {
      const pret = calculeazaPret(lor.pret, p.brand_name, setari.pricing_rules);
      const stocNou = pret && lor.disponibil ? 'supplier' : 'out_of_stock';
      const pretNou = pret?.pret ?? null;

      const schimbaStoc = p.stock_status !== stocNou;
      const schimbaPret = Number(p.price_mdl) !== Number(pretNou);
      if (!schimbaStoc && !schimbaPret && p.synced_at && String(p.pandashop_id ?? '') === String(lor.id)) {
        rezumat.neschimbate++;
      } else {
        if (schimbaStoc && stocNou !== 'out_of_stock') {
          rezumat.reactivate++;
          if (exemple.reactivate.length < 15) exemple.reactivate.push(`${p.title_ro} → ${pretNou} MDL`);
        } else if (schimbaStoc) {
          rezumat.stinse++;
          if (exemple.stinse.length < 10) exemple.stinse.push(p.title_ro);
        } else if (schimbaPret) {
          rezumat.pretSchimbat++;
          if (exemple.pret.length < 10) exemple.pret.push(`${p.title_ro}: ${p.price_mdl} → ${pretNou} MDL`);
        }
      }

      deScris.push({
        id: p.id,
        pandashop_id: eticheta(lor.id, p.id),
        source_price_mdl: lor.pret ?? null,
        price_mdl: pretNou,
        stock_status: stocNou,
      });
      continue;
    }

    /* Nu e pe stoc la ei. Daca apare in sitemap-ul lor de „fara stoc", stim sigur
       ca produsul exista la ei si azi nu se poate cumpara — se stinge. */
    /*
     * DEJA LEGAT, ABSENT AZI DIN LISTAREA LOR.
     *
     * Un rand care are `pandashop_id` a fost gasit la ei intr-o rulare
     * anterioara, pe stoc. Daca azi nu mai e in listare, inseamna ca s-a terminat
     * — indiferent ce zice sitemap-ul, care se reface la ei o data pe zi si
     * poate fi in urma. Regula asta nu are nevoie de sitemap deloc, si de aceea
     * rularea zilnica din cron se poate lipsi de cele ~275 MB ale lui.
     */
    if (p.pandashop_id) {
      if (p.stock_status !== 'out_of_stock') {
        rezumat.stinse++;
        if (exemple.stinse.length < 10) exemple.stinse.push(p.title_ro);
        deScris.push({ id: p.id, pandashop_id: p.pandashop_id, source_price_mdl: null, price_mdl: null, stock_status: 'out_of_stock' });
      } else {
        rezumat.neschimbate++;
      }
      continue;
    }

    const chei = cheiProdus(p, brandNames);
    if (chei.some((k) => faraStocChei.has(k))) {
      if (p.stock_status !== 'out_of_stock') {
        rezumat.stinse++;
        if (exemple.stinse.length < 10) exemple.stinse.push(p.title_ro);
        deScris.push({ id: p.id, pandashop_id: p.pandashop_id ?? null, source_price_mdl: null, price_mdl: null, stock_status: 'out_of_stock' });
      } else {
        rezumat.neschimbate++;
      }
      continue;
    }

    rezumat.fara_corespondent++;
    if (m.stare === 'ambiguu') rezumat.ambigue++;
    /* Produs pe care ei nu-l mai au deloc. Implicit nu se atinge: poate fi adus
       de la alt furnizor si stingerea a 5.000 de fise e o decizie comerciala. */
    if (delisted && p.stock_status !== 'out_of_stock') {
      rezumat.stinse++;
      deScris.push({ id: p.id, pandashop_id: p.pandashop_id ?? null, source_price_mdl: null, price_mdl: null, stock_status: 'out_of_stock' });
    }
  }

  /* -------------------------------------------------------------- raportul */
  spune(`\n${aplica ? 'APLIC' : 'DRY-RUN — nu se scrie nimic'}`);
  spune(`  produse cu corespondent la ei: ${anvelope.length - rezumat.fara_corespondent}`);
  spune(`  REACTIVATE (stinse la noi, pe stoc la ei): ${rezumat.reactivate}`);
  spune(`  stinse (nu mai sunt pe stoc la ei):        ${rezumat.stinse}`);
  spune(`  doar pret schimbat:                        ${rezumat.pretSchimbat}`);
  spune(`  neschimbate:                               ${rezumat.neschimbate}`);
  spune(`  fara corespondent la ei:                   ${rezumat.fara_corespondent}${delisted ? ' (se sting, --delisted)' : ' (nu se ating)'}`);
  spune(`  fise duplicate la noi (aceeasi anvelopa):  ${duplicate} — primesc pret si stoc, dar nu si eticheta`);
  spune(`  de scris:                                  ${deScris.length}`);

  for (const e of exemple.reactivate) spune(`   + ${e}`);
  for (const e of exemple.pret) spune(`   ~ ${e}`);
  for (const e of exemple.stinse) spune(`   − ${e}`);

  /* Intrerupatorul de scriere. Daca dintr-o data „trebuie" schimbate aproape
     toate produsele, cel mai probabil s-a schimbat ceva la ei, nu la noi. */
  const cota = anvelope.length ? deScris.length / anvelope.length : 0;
  const prag = config.breakers.maxRefreshShare ?? 0.85;
  if (cota > prag) {
    throw new Error(`s-ar schimba ${(cota * 100).toFixed(0)}% din catalog, peste pragul de ${prag * 100}% — se opreste fara sa scrie`);
  }

  const dir = config.paths.reports;
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  fs.writeFileSync(path.join(dir, `refresh-${stamp}.json`), JSON.stringify({ rezumat, exemple, http: http.stats, dryRun: !aplica }, null, 2));

  if (!aplica) {
    spune('\nNimic scris. Adauga --apply.');
    return { ...rezumat, jurnal, dryRun: true, deScris: deScris.length, durata: Date.now() - t0 };
  }

  spune(`\n· scriu ${deScris.length} randuri…`);
  const { actualizate, blocate } = await scrie(deScris);
  spune(`  actualizate: ${actualizate}  (din care ${blocate} cu pret blocat manual — li s-a scris doar stocul)`);

  /* Fara asta, bara de filtre din catalog ramane pe cifrele de dinainte si un
     brand revenit pe stoc nu mai apare deloc ca optiune. */
  if (actualizate > 0) await reimprospateazaContoarele(spune);

  await import('./db-write.mjs').then(({ insert }) => insert('import_runs', [{
    source: 'pandashop_sync', actor: opts.actor ?? 'refresh', dry_run: false,
    started_at: new Date(t0).toISOString(), finished_at: new Date().toISOString(),
    rows_total: anvelope.length, rows_updated: actualizate, rows_created: 0, rows_skipped: rezumat.neschimbate,
    rows_deactivated: rezumat.stinse, prices_changed: rezumat.pretSchimbat, prices_locked: blocate,
    errors: [], notes: `refresh: +${rezumat.reactivate} reactivate, −${rezumat.stinse} stinse, ${rezumat.pretSchimbat} preturi`,
  }]));

  spune(`gata in ${Math.round((Date.now() - t0) / 1000)}s`);
  return { ...rezumat, jurnal, dryRun: false, actualizate, blocate, durata: Date.now() - t0 };
}

/** Cu lacat, ca doua rulari sa nu se calce. Cronul foloseste varianta asta. */
export async function actualizeazaCuLacat(opts = {}) {
  if (!(await iaLacatul(opts.actor ?? 'refresh'))) {
    return { oprit: 'lacat_ocupat', jurnal: ['o alta rulare e in curs; se sare peste'] };
  }
  try { return await actualizeaza(opts); } finally { await elibereazaLacatul(); }
}

async function main() {
  const r = await actualizeazaCuLacat({
    apply: process.argv.includes('--apply'),
    delisted: process.argv.includes('--delisted'),
    faraCache: !process.argv.includes('--cache'),
    cuSitemap: !process.argv.includes('--fara-sitemap'),
    actor: 'cli:refresh',
  });
  /* Fara linia asta, o rulare blocata de lacat iese tacut cu cod 0 si pare ca
     n-a avut nimic de facut. S-a intamplat: `backfill` tinea lacatul. */
  if (r.oprit) console.log(`oprit: ${r.oprit}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error('\nA ESUAT:', e.message); process.exit(1); });
}
