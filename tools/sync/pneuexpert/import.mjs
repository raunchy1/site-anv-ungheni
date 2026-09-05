#!/usr/bin/env node
/**
 * IMPORTUL DIN FOTOGRAFIA PNEUEXPERT.
 *
 * Citește `catalog.ndjson` scris de `snapshot.mjs` — nu atinge rețeaua decât
 * pentru fotografii — potrivește fiecare anvelopă de-a lor cu catalogul nostru
 * și importă DOAR ce nu avem.
 *
 * DE CE NU SE IMPORTĂ TOT, deși omul a cerut „tot catalogul lor". Aproape
 * jumătate din anvelopele lor le avem deja, venite de la pandashop sau din
 * OpenCart. Importate a doua oară ar însemna două fișe pentru aceeași anvelopă,
 * cu două prețuri și două adrese — exact ce strică un catalog. „Tot" înseamnă
 * acoperire completă a gamei lor, nu numărul lor de rânduri: ce avem se leagă
 * prin `pneuexpert_id`, ce n-avem intră.
 *
 * ȘASE VERIFICĂRI, aceleași ca la pandashop. Un produs care pică oricare merge
 * întreg în carantină; nu există import pe jumătate:
 *
 *   1. dimensiune parsată      4. cel puțin o imagine descărcată
 *   2. brand cunoscut          5. titlu în ambele limbi
 *   3. preț pozitiv            6. slug fără coliziune
 *
 *   node --env-file=.env.local tools/sync/pneuexpert/import.mjs                 # dry-run
 *   node --env-file=.env.local tools/sync/pneuexpert/import.mjs --branduri      # dry-run, cu mărcile noi
 *   node --env-file=.env.local tools/sync/pneuexpert/import.mjs --apply --branduri
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from './config.mjs';
import { citesteFotografia } from './snapshot.mjs';
import { readAll, readBrands } from '../pandashop/db.mjs';
import { insert, insertReturning } from '../pandashop/db-write.mjs';
import { indexeazaCatalogul, potriveste, potrivireRelaxata } from '../pandashop/match.mjs';
import { parseTitle } from '../pandashop/parse-title.mjs';
import { normalizeSeason } from '../../scraper/parse-product.mjs';
import { slugRo, slugRu, titluCatalog } from '../pandashop/slug.mjs';
import { calculeazaPret } from '../pandashop/pricing.mjs';
import { pregatesteImagini } from '../pandashop/images.mjs';
import { esteExclus, REZERVATE, meta } from '../pandashop/import.mjs';
import { createHttp } from '../pandashop/http.mjs';
import { reimprospateazaContoarele } from '../pandashop/counters.mjs';

const COLOANE = [
  'id', 'category', 'brand_name', 'model', 'width', 'aspect', 'diameter',
  'load_index', 'speed_index', 'is_xl', 'is_runflat', 'title_ro', 'slug_ro', 'slug_ru',
  'pandashop_id', 'pneuexpert_id', 'legacy_product_id',
].join(',');

/**
 * `legacy_product_id` e `int NOT NULL UNIQUE` din vremea OpenCart. Produsele
 * venite prin sincronizare n-au avut niciodată un ID OpenCart, deci primesc unul
 * negativ, derivat din al lor. Pandashop face la fel, iar spațiul e comun: dacă
 * două hash-uri se ciocnesc, se ia următorul liber. Fără pasul ăsta, o coliziune
 * de una la douăzeci de mii ar opri un lot întreg cu 23505.
 */
export function idLiber(text, folosite) {
  let h = 0;
  for (const c of String(text)) h = (h * 31 + c.charCodeAt(0)) % 2_000_000_000;
  let v = -Math.abs(h || 1);
  while (folosite.has(v)) v = v === -2_000_000_000 ? -1 : v - 1;
  folosite.add(v);
  return v;
}

/**
 * O anvelopă de-a lor -> rândul nostru, sau motivele pentru care nu se poate.
 * Funcție pură: nicio cerere, niciun efect. De aceea e testabilă.
 */
export function normalizeaza(sursa, { branduri, sluguriRo, sluguriRu, reguli, folosite = new Set() }) {
  if (esteExclus(sursa.brandRaw)) return { rand: null, motive: [], exclus: sursa.brandRaw };

  const motive = [];
  const titluRo = titluCatalog(sursa.titleRo);
  const titluRu = titluCatalog(sursa.titleRu);
  const t = parseTitle(titluRo, branduri.map((b) => b.name));

  if (!t.size_raw) motive.push('dimensiune neparsată');
  const brand = branduri.find((b) => b.name.toLowerCase() === String(t.brand ?? sursa.brandRaw ?? '').toLowerCase());
  if (!brand) motive.push(`brand necunoscut: ${sursa.brandRaw ?? '—'}`);
  if (!titluRo) motive.push('titlu RO lipsă');
  if (!titluRu) motive.push('titlu RU lipsă');
  if (!sursa.modelRaw) motive.push('model lipsă din tabelul lor');

  const pret = calculeazaPret(sursa.priceMdl, brand?.name, reguli);

  const slug_ro = slugRo(titluRo);
  const slug_ru = slugRu(titluRu || titluRo);
  if (!slug_ro) motive.push('slug RO gol');
  if (sluguriRo.has(slug_ro)) motive.push(`coliziune slug RO: ${slug_ro}`);
  if (slug_ru && sluguriRu.has(slug_ru)) motive.push(`coliziune slug RU: ${slug_ru}`);
  if (REZERVATE.has(slug_ro) || REZERVATE.has(slug_ru)) motive.push('slug rezervat de o rută a site-ului');

  /*
   * Stocul lor, nu al nostru. Ce e pe stoc la ei devine „supplier" — adică
   * „Disponibil · livrare 1–3 zile", ca la pandashop. Ce NU e pe stoc rămâne
   * `out_of_stock`: fișa există, se găsește după dimensiune, dar nu promite o
   * livrare pe care nimeni n-o poate onora. Constrângerea bazei cere preț pentru
   * orice altceva decât `out_of_stock`, deci fără preț cade tot acolo.
   */
  const stoc = sursa.stockStatus === 'out_of_stock' || !pret ? 'out_of_stock' : 'supplier';

  const rand = {
    legacy_product_id: idLiber(`pneuexpert:${sursa.id}`, folosite),
    pneuexpert_id: String(sursa.id),
    source: 'pneuexpert_sync',
    slug_ro,
    slug_ru: slug_ru || null,
    category: 'anvelope',
    brand_id: brand?.id ?? null,
    brand_name: brand?.name ?? null,
    attr_manufacturer: sursa.brandRaw ?? null,
    model: t.model || sursa.modelRaw || null,
    size_system: t.size_system,
    width: t.width,
    aspect: t.aspect,
    overall_diameter_in: t.overall_diameter_in,
    section_width_in: t.section_width_in,
    diameter: t.diameter,
    size_raw: t.size_raw,
    size_source: t.size_raw ? 'title' : 'none',
    load_index: t.loadIndex,
    speed_index: t.speedIndex,
    season: normalizeSeason(sursa.seasonRaw) ?? null,
    is_xl: t.isXl,
    is_runflat: t.isRunflat,
    is_studded: Boolean(sursa.isStudded),
    is_commercial: /C$/i.test(String(t.diameter ?? '')),
    price_mdl: pret?.pret ?? null,
    source_price_mdl: sursa.priceMdl ?? null,
    price_source: 'api_sync',
    price_updated_at: new Date().toISOString(),
    price_locked: false,
    stock_status: stoc,
    title_ro: titluRo,
    title_ru: titluRu || null,
    description_ro: null,
    description_ru: null,
    ...meta(titluRo, titluRu || titluRo),
    attributes: sursa.attributes ?? {},
    in_catalog: true,
    is_active: true,
    imported_at: new Date().toISOString(),
    synced_at: new Date().toISOString(),
  };

  return { rand, motive, pret, faraPret: !pret, exclus: null };
}

/** Mărcile pe care ei le au și noi nu. Se creează doar cerut explicit. */
async function creeazaBranduri(nume, { apply, log }) {
  const respinse = nume.filter((n) => esteExclus(n));
  if (respinse.length) log(`· mărci scoase din catalog, nu se creează: ${respinse.join(', ')}`);
  const deCreat = nume.filter((n) => !esteExclus(n));
  if (deCreat.length === 0) return new Map();
  log(`· mărci de creat: ${deCreat.length} — ${deCreat.join(', ')}`);
  if (deCreat.length > config.breakers.maxBranduriNoi) {
    throw new Error(`${deCreat.length} mărci noi, peste pragul de ${config.breakers.maxBranduriNoi} — se oprește: numele lor de brand vin din câmp liber`);
  }
  if (!apply) return new Map();
  const create = await insertReturning('brands', deCreat.map((n) => ({
    name: n, slug_ro: slugRo(n), slug_ru: slugRu(n), is_active: true,
  })));
  log(`  create: ${create.length}`);
  return new Map(create.map((b) => [b.name.toLowerCase(), b]));
}

/** Legarea produselor pe care le avem deja. Singura scriere pe rânduri existente. */
async function leaga(perechi, { apply, log }) {
  if (perechi.length === 0 || !apply) return 0;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  let total = 0;
  for (let i = 0; i < perechi.length; i += 500) {
    const res = await fetch(`${url}/rest/v1/rpc/sync_link_pneuexpert`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_rows: perechi.slice(i, i + 500) }),
    });
    if (!res.ok) throw new Error(`sync_link_pneuexpert: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    total += Number(await res.json()) || 0;
  }
  log(`· legate de produsele existente: ${total}`);
  return total;
}

export async function ruleaza(opts = {}) {
  const { apply: aplica = false, limit = Infinity, branduriNoi = false, actor = 'cli' } = opts;
  const log = opts.log ?? console.log;
  const t0 = Date.now();
  const spune = (...a) => log(...a);

  const setari = (await readAll('settings', 'sync_enabled,pricing_rules'))[0] ?? {};
  if (setari.sync_enabled === false) {
    spune('sincronizarea e oprită din admin (settings.sync_enabled = false)');
    return { oprit: 'din_admin' };
  }

  const lor = citesteFotografia();
  if (lor.length === 0) throw new Error('fotografia e goală — rulează întâi snapshot.mjs');
  spune(`· fotografia lor: ${lor.length} anvelope`);

  spune('· citesc catalogul nostru…');
  let branduri = await readBrands();
  const [produse, imagini] = await Promise.all([
    readAll('products', COLOANE),
    readAll('product_images', 'content_hash'),
  ]);
  const sluguriRo = new Set(produse.map((p) => p.slug_ro));
  const sluguriRu = new Set(produse.map((p) => p.slug_ru).filter(Boolean));
  const hashuri = new Set(imagini.map((i) => i.content_hash).filter(Boolean));
  const folosite = new Set(produse.map((p) => p.legacy_product_id));
  spune(`  ${produse.length} produse, ${branduri.length} mărci, ${hashuri.size} imagini distincte`);

  /* ------------------------------------------------------------ potrivirea */
  let brandNames = branduri.map((b) => b.name).filter(Boolean).sort((a, b) => b.length - a.length);
  let index = indexeazaCatalogul(produse, brandNames);

  const rezultate = {
    gasite: [], candidati: [], ambigue: [], excluse: [],
    importate: [], carantina: [], faraPret: [], erori: [],
  };
  const brandNecunoscut = new Map();

  const clasifica = () => {
    rezultate.gasite = []; rezultate.candidati = []; rezultate.ambigue = []; rezultate.excluse = [];
    brandNecunoscut.clear();
    for (const p of lor) {
      if (esteExclus(p.brandRaw)) { rezultate.excluse.push(p); continue; }
      const m = potriveste(p.titleRo, index, brandNames, { pandashopId: null });
      if (m.stare === 'gasit') { rezultate.gasite.push({ p, produs: m.produs }); continue; }
      if (m.stare === 'ambiguu') { rezultate.ambigue.push({ p, candidati: m.candidati }); continue; }
      if (m.stare === 'brand_necunoscut') {
        const brut = (p.brandRaw ?? '—').trim();
        brandNecunoscut.set(brut, [...(brandNecunoscut.get(brut) ?? []), p]);
        continue;
      }
      if (m.stare === 'dimensiune_neparsata') { rezultate.carantina.push({ p, motive: ['dimensiune neparsată'] }); continue; }
      /* `doar_la_ei`, dar poate fi o fișă de-a noastră căreia îi lipsesc indicii. */
      const relaxat = potrivireRelaxata(m.t, m.aproape);
      if (relaxat) { rezultate.gasite.push({ p, produs: relaxat, relaxat: true }); continue; }
      rezultate.candidati.push({ p, t: m.t });
    }
  };

  clasifica();
  spune(`\n· potrivite cu ce avem deja: ${rezultate.gasite.length}`);
  spune(`· ambigue (mai mulți candidați — nu se ghicește): ${rezultate.ambigue.length}`);
  spune(`· mărci scoase din catalog: ${rezultate.excluse.length}`);
  spune(`· brand necunoscut: ${[...brandNecunoscut.values()].reduce((n, l) => n + l.length, 0)} anvelope, ${brandNecunoscut.size} mărci`);
  spune(`· candidați de import: ${rezultate.candidati.length}`);

  if (branduriNoi && brandNecunoscut.size) {
    const create = await creeazaBranduri([...brandNecunoscut.keys()].sort(), { apply: aplica, log: spune });
    if (create.size) {
      branduri = await readBrands();
      brandNames = branduri.map((b) => b.name).filter(Boolean).sort((a, b) => b.length - a.length);
      index = indexeazaCatalogul(produse, brandNames);
      clasifica();
      spune(`· după crearea mărcilor — potrivite: ${rezultate.gasite.length}, candidați: ${rezultate.candidati.length}`);
    }
  }

  const deImportat = rezultate.candidati.slice(0, limit === Infinity ? undefined : limit);

  /* ------------------------------------------------------------- normalizare */
  const http = createHttp({ ...config.http });
  const pregatite = [];
  let n = 0;
  for (const { p } of deImportat) {
    const { rand, motive, pret, faraPret, exclus } = normalizeaza(p, {
      branduri, sluguriRo, sluguriRu, reguli: setari.pricing_rules, folosite,
    });
    if (exclus) { rezultate.excluse.push(p); continue; }
    /*
     * FĂRĂ PREȚ NU ÎNSEAMNĂ FĂRĂ FIȘĂ. La pandashop, un produs fără preț intra
     * pe lista de așteptare, pentru că a doua zi cronul îl verifica din nou.
     * Aici nu există încă un cron, iar omul a cerut acoperirea completă a
     * dimensiunilor: ~23% din fișele lor vechi n-au preț afișat. Intră în catalog
     * ca `out_of_stock` cu preț NULL — se găsesc după dimensiune și marcă, iar
     * pagina spune cinstit că nu sunt disponibile, în loc să nu existe deloc.
     */
    if (faraPret) rezultate.faraPret.push({ id: p.id, titlu: p.titleRo });

    try {
      const { imagini: imgs, erori: eImg } = await pregatesteImagini(p.images, hashuri, {
        dryRun: !aplica, altRo: rand.title_ro, altRu: rand.title_ru,
      });
      if (imgs.length === 0) motive.push(`nicio imagine descărcată${eImg.length ? `: ${eImg[0]}` : ''}`);
      if (eImg.length) rezultate.erori.push({ id: p.id, motiv: `imagini ratate (${eImg.length})` });
      if (motive.length) { rezultate.carantina.push({ p, motive, rand }); continue; }
      pregatite.push({ p, rand, imgs, pret });
      sluguriRo.add(rand.slug_ro);
      if (rand.slug_ru) sluguriRu.add(rand.slug_ru);
    } catch (e) {
      rezultate.erori.push({ id: p.id, motiv: e.message });
    }
    if (++n % 200 === 0) spune(`  pregătite ${n}/${deImportat.length}…`);
  }

  const rataCarantina = deImportat.length ? rezultate.carantina.length / deImportat.length : 0;
  spune(`\n${aplica ? 'APLIC' : 'DRY-RUN — nu se scrie nimic'}`);
  spune(`  de importat:  ${pregatite.length}`);
  spune(`  în carantină: ${rezultate.carantina.length}`);
  spune(`  fără preț (intră ca indisponibile): ${rezultate.faraPret.length}`);
  spune(`  erori:        ${rezultate.erori.length}`);

  const peMotiv = {};
  for (const c of rezultate.carantina) for (const m of c.motive) {
    const cheie = m.replace(/:.*$/, '');
    peMotiv[cheie] = (peMotiv[cheie] ?? 0) + 1;
  }
  if (Object.keys(peMotiv).length) {
    spune('  motivele carantinei:');
    for (const [m, k] of Object.entries(peMotiv).sort((a, b) => b[1] - a[1])) spune(`    ${String(k).padStart(4)}  ${m}`);
  }

  if (rataCarantina > config.breakers.maxQuarantineShare) {
    throw new Error(`carantină ${(rataCarantina * 100).toFixed(0)}%, peste pragul de ${config.breakers.maxQuarantineShare * 100}% — se oprește fără să scrie`);
  }

  if (!aplica) {
    scrieRaport({ rezultate, pregatite, lor, brandNecunoscut, dryRun: true });
    spune('\nNimic scris. Adaugă --apply.');
    return { ...rezultate, pregatite, dryRun: true };
  }

  /* ---------------------------------------------------------------- scrierea */
  await leaga(rezultate.gasite.map(({ p, produs }) => ({ id: produs.id, pneuexpert_id: String(p.id) })), { apply: aplica, log: spune });

  let create = 0;
  for (const x of pregatite) {
    try {
      const [creat] = await insertReturning('products', [x.rand]);
      if (x.imgs.length) {
        const randuri = x.imgs.map(({ refolosita, ...im }) => ({ ...im, product_id: creat.id }));
        try {
          await insert('product_images', randuri);
        } catch {
          /* O fișă fără poze nu e incompletă, e inutilă: se reîncearcă o dată, iar
             dacă tot nu merge produsul nu apare în catalog până i se pun pozele. */
          try { await insert('product_images', randuri); }
          catch (e2) { rezultate.erori.push({ id: x.p.id, motiv: `poze nescrise: ${e2.message}` }); }
        }
      }
      create++;
      if (create % 200 === 0) spune(`  scrise ${create}/${pregatite.length}…`);
    } catch (e) {
      rezultate.erori.push({ id: x.p.id, motiv: `insert: ${e.message}` });
    }
  }

  for (const c of rezultate.carantina) {
    await insert('sync_quarantine', [{
      supplier: 'pneuexpert', pandashop_id: String(c.p.id), reason: c.motive.join('; '), raw: c.rand ?? c.p,
    }], { onConflict: 'supplier,pandashop_id,reason' });
  }

  await insert('import_runs', [{
    source: 'pneuexpert_sync', actor, dry_run: false,
    started_at: new Date(t0).toISOString(), finished_at: new Date().toISOString(),
    rows_total: lor.length, rows_created: create, rows_skipped: rezultate.gasite.length,
    errors: rezultate.erori.slice(0, 200), notes: `carantină: ${rezultate.carantina.length}`,
  }]);

  if (create > 0) await reimprospateazaContoarele(spune);
  scrieRaport({ rezultate, pregatite, lor, brandNecunoscut, dryRun: false, create });

  spune(`\n  create: ${create} produse`);
  spune(`  HTTP imagini: ${http.stats.fetched} cereri`);
  spune(`gata în ${Math.round((Date.now() - t0) / 1000)}s`);
  return { ...rezultate, create };
}

function scrieRaport({ rezultate, pregatite, lor, brandNecunoscut, dryRun, create = 0 }) {
  fs.mkdirSync(config.paths.reports, { recursive: true });
  const stampila = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const f = path.join(config.paths.reports, `pneuexpert-${dryRun ? 'dryrun' : 'import'}-${stampila}.json`);
  fs.writeFileSync(f, JSON.stringify({
    rulare: new Date().toISOString(), dryRun, create,
    cifre: {
      laEi: lor.length,
      gasite: rezultate.gasite.length,
      ambigue: rezultate.ambigue.length,
      excluse: rezultate.excluse.length,
      candidati: rezultate.candidati.length,
      pregatite: pregatite.length,
      carantina: rezultate.carantina.length,
      faraPret: rezultate.faraPret.length,
      erori: rezultate.erori.length,
    },
    brandNecunoscut: [...brandNecunoscut.entries()].map(([n, l]) => ({ brand: n, produse: l.length, exemplu: l[0].titleRo })),
    ambigue: rezultate.ambigue.slice(0, 100).map(({ p, candidati }) => ({ id: p.id, titlu: p.titleRo, candidati: candidati.map((c) => `#${c.id} ${c.slug_ro}`) })),
    carantina: rezultate.carantina.slice(0, 300).map((c) => ({ id: c.p.id, titlu: c.p.titleRo, motive: c.motive })),
    erori: rezultate.erori.slice(0, 300),
    importate: pregatite.slice(0, 500).map((x) => ({ id: x.p.id, titlu: x.rand.title_ro, slug: x.rand.slug_ro, pret: x.rand.price_mdl, stoc: x.rand.stock_status, poze: x.imgs.length })),
  }, null, 1));
  console.log(`· raport: ${f}`);
}

async function main() {
  const iLimit = process.argv.indexOf('--limit');
  await ruleaza({
    apply: process.argv.includes('--apply'),
    branduriNoi: process.argv.includes('--branduri'),
    limit: iLimit > 0 ? Number(process.argv[iLimit + 1]) : Infinity,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
}
