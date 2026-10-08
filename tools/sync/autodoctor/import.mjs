#!/usr/bin/env node
/**
 * IMPORTUL DIN FOTOGRAFIA AUTODOCTOR.
 *
 * Citește `catalog.ndjson` scris de `snapshot.mjs` — nu atinge rețeaua decât
 * pentru poze — potrivește fiecare anvelopă de-a lor cu catalogul nostru și
 * importă DOAR ce nu avem. E importul lui pneu.md, cu aceleași reguli:
 *
 *   · ce avem deja se LEAGĂ (`product_sources`), nu se dublează;
 *   · prețul unui produs cu alt `primary_source` nu se atinge;
 *   · `price_locked` și `in_stock` (stocul atelierului) nu se ating niciodată;
 *   · șase verificări, iar un produs care pică una merge întreg în carantină:
 *
 *       1. dimensiune parsată      4. cel puțin o imagine descărcată
 *       2. brand cunoscut          5. titlu în ambele limbi
 *       3. preț pozitiv            6. slug fără coliziune
 *
 * CE E ÎN PLUS FAȚĂ DE PNEU.MD: A DOUA POTRIVIRE, TOLERANTĂ LA SCRIERE.
 * Catalogul nostru are deja majoritatea anvelopelor lor — Joyroad, Hilo,
 * Habilead, Crosswind veneau prin aceeași rețea — dar scrise altfel: „RX706
 * SUV" la noi, „SUV RX706" la ei; „Arctic S8" și „ARCTIC S-8"; „UltraGrip
 * Performance+" și „UG PERF +". Cheia strictă le vede diferite. Vezi
 * `potrivireTolerantă` mai jos: aceeași marcă, aceeași dimensiune, aceiași
 * indici, același model după ce scrierea e adusă la o formă comună — și un
 * singur candidat, altfel nu se ghicește.
 *
 *   node --env-file=.env.local tools/sync/autodoctor/import.mjs                 # dry-run
 *   node --env-file=.env.local tools/sync/autodoctor/import.mjs --branduri      # dry-run, cu mărcile noi
 *   node --env-file=.env.local tools/sync/autodoctor/import.mjs --apply --branduri
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from './config.mjs';
import { citesteFotografia, citesteRespinse } from './snapshot.mjs';
import { titluMarca } from '../pneu/json-source.mjs';
import { scrieSurse, citesteSursa } from '../pneu/sources.mjs';
import { readAll, readBrands } from '../pandashop/db.mjs';
import { insert, insertReturning } from '../pandashop/db-write.mjs';
import { indexeazaCatalogul, potriveste, potrivireRelaxata } from '../pandashop/match.mjs';
import { parseTitle } from '../pandashop/parse-title.mjs';
import { normalizeSeason } from '../../scraper/parse-product.mjs';
import { slugRo, slugRu, titluCatalog } from '../pandashop/slug.mjs';
import { calculeazaPret } from '../pandashop/pricing.mjs';
import { pregatesteImagini } from '../pandashop/images.mjs';
import { esteExclus, REZERVATE, meta } from '../pandashop/import.mjs';
import { reimprospateazaContoarele } from '../pandashop/counters.mjs';

/** Numele furnizorului în `product_sources`, și eticheta de enum pe `products.source`. */
export const SURSA = 'autodoctor';
const ENUM_SURSA = 'autodoctor_sync';

const COLOANE = [
  'id', 'category', 'brand_name', 'model', 'width', 'aspect', 'diameter',
  'load_index', 'speed_index', 'is_xl', 'is_runflat', 'title_ro', 'slug_ro', 'slug_ru',
  'pandashop_id', 'pneuexpert_id', 'legacy_product_id', 'primary_source', 'price_locked',
].join(',');

/** Dintre două fișe de-ale lor pentru aceeași anvelopă: stocul, apoi prețul, apoi cea mai nouă. */
export function maiBunDintre(a, b) {
  const stocA = a.stockStatus === 'supplier';
  const stocB = b.stockStatus === 'supplier';
  if (stocA !== stocB) return stocA ? a : b;
  const pA = a.priceMdl ?? Infinity;
  const pB = b.priceMdl ?? Infinity;
  if (pA !== pB) return pA < pB ? a : b;
  return Number(b.id) > Number(a.id) ? b : a;
}

/*
 * SCRIEREA MODELULUI, ADUSĂ LA O FORMĂ COMUNĂ — doar pentru comparație, nu se
 * scrie nicăieri. Prescurtările sunt cele găsite efectiv la ei pe 8 octombrie
 * 2026 („UG PERF", „EFFIGRIP", „VEC 4SEASONS G3", „EAG F1 ASY"), iar formele
 * lungi sunt cele din catalogul nostru.
 */
const PRESCURTARI = [
  [/\bug\b/g, 'ultragrip'], [/\bperf(orm)?\b\.?/g, 'performance'], [/\beffigrip\b/g, 'efficientgrip'],
  [/\bcomp\b/g, 'compact'], [/\bvec\b/g, 'vector'], [/\bg([1-3])\b/g, 'gen$1'], [/\bgen-?([1-3])\b/g, 'gen$1'],
  [/\beag\b/g, 'eagle'], [/\basy(m|mmetric)?\b/g, 'asymmetric'], [/\bspt\b/g, 'sport'], [/\bwi\b/g, 'winter'],
  [/\bwint\b\.?/g, 'winter'], [/\bw d\b/g, 'winter defender'], [/\bkri\b/g, 'kristall'], [/\bplus\b/g, '+'],
  [/\b4 seasons\b/g, '4seasons'], [/\ball season\b/g, 'allseason'],
];

export function formaModel(model) {
  let s = String(model ?? '').toLowerCase().replace(/[.]/g, ' ').replace(/(\p{L})-(\d)/gu, '$1$2');
  for (const [re, cu] of PRESCURTARI) s = s.replace(re, cu);
  const tokeni = s.replace(/[^a-z0-9+ ]+/g, ' ').replace(/\s*\+/g, '+').split(/\s+/).filter(Boolean);
  return { lipit: tokeni.join(''), sortat: [...tokeni].sort().join(' ') };
}

const diaComparabil = (d) => String(d ?? '').toUpperCase().replace(/^R/, '').replace(',', '.');

/**
 * A TREIA TRECERE, după cheia strictă și cea relaxată.
 *
 * Aceeași marcă, aceeași lățime, înălțime și diametru (cu tot cu C), același
 * model în forma comună (cu tokenii în orice ordine) și indici care nu se
 * contrazic — la noi pot lipsi, dar nu pot fi alții. Se acceptă DOAR un
 * candidat unic; dacă rămân doi, se preferă cel cu același XL, iar dacă tot
 * sunt doi, nu se ghicește.
 */
export function indexTolerant(produse) {
  const m = new Map();
  for (const p of produse) {
    if (p.category !== 'anvelope' || !p.brand_name || !p.model || !p.width) continue;
    const k = `${p.brand_name.toLowerCase()}|${p.width}|${p.aspect ?? ''}|${diaComparabil(p.diameter)}`;
    const l = m.get(k);
    if (l) l.push(p); else m.set(k, [p]);
  }
  return m;
}

export function potrivireTolerantă(sursa, index) {
  if (!sursa.brandRaw || !sursa.width) return null;
  const dia = `${diaComparabil(sursa.diameter)}${sursa.typeC ? 'C' : ''}`;
  const lista = index.get(`${sursa.brandRaw.toLowerCase()}|${sursa.width}|${sursa.aspect ?? ''}|${dia}`) ?? [];
  if (!lista.length) return null;
  const lor = formaModel(sursa.modelRaw);
  const norm = (v) => (v == null || v === '' ? null : String(v).toUpperCase().replace(/\s/g, ''));
  const compatibil = (p) => {
    const f = formaModel(p.model);
    if (f.lipit !== lor.lipit && f.sortat !== lor.sortat) return false;
    const s1 = norm(p.load_index); const s2 = norm(sursa.loadIndex);
    const v1 = norm(p.speed_index); const v2 = norm(sursa.speedIndex);
    if (s1 && s2 && s1 !== s2) return false;
    if (v1 && v2 && v1 !== v2) return false;
    if (Boolean(p.is_runflat) !== Boolean(sursa.isRunflat)) return false;
    return true;
  };
  let c = lista.filter(compatibil);
  if (c.length > 1) c = c.filter((p) => Boolean(p.is_xl) === Boolean(sursa.isXl));
  return c.length === 1 ? c[0] : null;
}

/**
 * `legacy_product_id` e `int NOT NULL UNIQUE` din vremea OpenCart. Produsele
 * venite prin sincronizare n-au avut niciodată un ID OpenCart, deci primesc unul
 * negativ, derivat din al lor. Pandashop și pneuexpert fac la fel, iar spațiul e
 * comun: dacă două hash-uri se ciocnesc, se ia următorul liber.
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

  const pret = calculeazaPret(sursa.priceMdl, brand?.name, reguli);
  /*
   * La ei prețul nu lipsește niciodată: toate cele 2.136 de anvelope din
   * 8 octombrie 2026 aveau preț. Dacă totuși apare una fără, e un semn că s-a
   * schimbat ceva la ei — merge în carantină, nu în catalog.
   */
  if (!pret) motive.push('preț lipsă sau neplauzibil');

  const slug_ro = slugRo(titluRo);
  const slug_ru = slugRu(titluRu || titluRo);
  if (!slug_ro) motive.push('slug RO gol');
  if (sluguriRo.has(slug_ro)) motive.push(`coliziune slug RO: ${slug_ro}`);
  if (slug_ru && sluguriRu.has(slug_ru)) motive.push(`coliziune slug RU: ${slug_ru}`);
  if (REZERVATE.has(slug_ro) || REZERVATE.has(slug_ru)) motive.push('slug rezervat de o rută a site-ului');

  /*
   * Stocul lor, nu al nostru: `availability` din listarea lor („in-stock" sau
   * „out-of-stock"). Ce e pe stoc la ei intră ca „supplier",
   * adică „Disponibil · livrare 1–3 zile"; restul, `out_of_stock`, cu fișa
   * vizibilă dar fără o promisiune de livrare pe care nimeni n-o poate onora.
   */
  const stoc = sursa.stockStatus === 'out_of_stock' || !pret ? 'out_of_stock' : 'supplier';

  const rand = {
    legacy_product_id: idLiber(`autodoctor:${sursa.id}`, folosite),
    source: ENUM_SURSA,
    primary_source: SURSA,
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

  return { rand, motive, pret, exclus: null };
}

/** Mărcile pe care ei le au și noi nu. Se creează doar cerut explicit. */
async function creeazaBranduri(nume, { apply, log }) {
  const respinse = nume.filter((n) => esteExclus(n));
  if (respinse.length) log(`· mărci scoase din catalog, nu se creează: ${respinse.join(', ')}`);
  const necreabile = nume.filter((n) => config.branduriNecreabile.includes(n));
  if (necreabile.length) log(`· mărci lăsate pentru un om, nu se creează: ${necreabile.join(', ')}`);
  const deCreat = nume.filter((n) => !esteExclus(n) && !config.branduriNecreabile.includes(n));
  if (deCreat.length === 0) return new Map();
  log(`· mărci de creat: ${deCreat.length} — ${deCreat.join(', ')}`);
  if (deCreat.length > config.breakers.maxBranduriNoi) {
    throw new Error(`${deCreat.length} mărci noi, peste pragul de ${config.breakers.maxBranduriNoi} — se oprește: numele lor de marcă s-au schimbat`);
  }
  if (!apply) return new Map();
  const create = await insertReturning('brands', deCreat.map((n) => ({
    name: n, slug_ro: slugRo(n), slug_ru: slugRu(n), is_active: true,
  })));
  log(`  create: ${create.length}`);
  return new Map(create.map((b) => [b.name.toLowerCase(), b]));
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
  spune(`· fotografia lor: ${lor.length} anvelope (${citesteRespinse().length} rânduri respinse la fotografiere)`);

  spune('· citesc catalogul nostru…');
  let branduri = await readBrands();
  const [produse, imagini, toateSursele] = await Promise.all([
    readAll('products', COLOANE),
    readAll('product_images', 'content_hash'),
    readAll('product_sources', 'product_id,source'),
  ]);
  const sluguriRo = new Set(produse.map((p) => p.slug_ro));
  const sluguriRu = new Set(produse.map((p) => p.slug_ru).filter(Boolean));
  const hashuri = new Set(imagini.map((i) => i.content_hash).filter(Boolean));
  const folosite = new Set(produse.map((p) => p.legacy_product_id));
  /* Produsele care azi n-au NICIUN furnizor legat. Nu le atingem aici, dar
     raportăm pe câte dintre ele le acoperă autodoctor. */
  const cuSursa = new Set(toateSursele.map((s) => s.product_id));
  /* Ce e deja legat de NOI, dintr-o rulare anterioară: `scrieSurse` e reluabil,
     dar diferența „legături noi / reconfirmate" e singurul mod de a vedea dintr-o
     privire dacă a doua rulare chiar a adus ceva. */
  const legateDeja = await citesteSursa(SURSA);
  spune(`  ${produse.length} produse, ${branduri.length} mărci, ${hashuri.size} imagini distincte, ${cuSursa.size} produse cu furnizor legat`);
  if (legateDeja.size) spune(`  ${legateDeja.size} deja legate de ${SURSA} dintr-o rulare anterioară`);

  /* ------------------------------------------------------------ potrivirea */
  let brandNames = branduri.map((b) => b.name).filter(Boolean).sort((a, b) => b.length - a.length);
  let index = indexeazaCatalogul(produse, brandNames);
  const indexTol = indexTolerant(produse);

  const rezultate = {
    gasite: [], candidati: [], ambigue: [], excluse: [],
    carantina: [], carantinaSursa: [], erori: [],
  };
  const brandNecunoscut = new Map();

  const clasifica = () => {
    rezultate.gasite = []; rezultate.candidati = []; rezultate.ambigue = []; rezultate.excluse = []; rezultate.carantinaSursa = [];
    brandNecunoscut.clear();
    for (const p of lor) {
      if (esteExclus(p.brandRaw)) { rezultate.excluse.push(p); continue; }
      const m = potriveste(p.titleRo, index, brandNames);
      if (m.stare === 'gasit') { rezultate.gasite.push({ p, produs: m.produs }); continue; }
      if (m.stare === 'ambiguu') { rezultate.ambigue.push({ p, candidati: m.candidati }); continue; }
      if (m.stare === 'brand_necunoscut') {
        /*
         * Marca se creează cu scrierea din titlu, nu cu cea din API-ul lor.
         * Ei scriu „BF GOODRICH"; catalogul nostru scrie „Hankook", „Pirelli".
         * O marcă creată cu majuscule ar arăta strident pe site — dar, mai rău,
         * `construiesteTitlu` produce oricum forma îmblânzită, deci numele mărcii
         * și titlul produsului ar spune două lucruri diferite despre același
         * brand. Se ia exact ce produce `titluMarca`, ca să nu poată diverge.
         */
        const nume = titluMarca(p.brandRaw ?? '') || '—';
        brandNecunoscut.set(nume, [...(brandNecunoscut.get(nume) ?? []), p]);
        continue;
      }
      if (m.stare === 'dimensiune_neparsata') { rezultate.carantinaSursa.push({ p, motive: ['dimensiune neparsată'] }); continue; }
      /* `doar_la_ei`, dar poate fi o fișă de-a noastră căreia îi lipsesc indicii. */
      const relaxat = potrivireRelaxata(m.t, m.aproape);
      if (relaxat) { rezultate.gasite.push({ p, produs: relaxat, relaxat: true }); continue; }
      const tolerant = potrivireTolerantă(p, indexTol);
      if (tolerant) { rezultate.gasite.push({ p, produs: tolerant, tolerant: true }); continue; }
      rezultate.candidati.push({ p, t: m.t });
    }
  };

  clasifica();
  spune(`\n· potrivite cu ce avem deja: ${rezultate.gasite.length}`);
  spune(`  dintre ele, după scrierea modelului adusă la formă comună: ${rezultate.gasite.filter((g) => g.tolerant).length}`);
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

  /* Ce aduce legarea, dincolo de numere: produse care azi n-au niciun furnizor. */
  /*
   * DOUĂ FIȘE DE-ALE LOR PENTRU UN PRODUS DE-AL NOSTRU.
   *
   * `product_sources` are cheia primară (product_id, source), deci un produs
   * poate avea o singură legătură cu autodoctor. La ei există însă aceeași anvelopă
   * scrisă în două feluri — „Quatrac PRO" și „Quatrac PRO+", „ECOCONTACT-6" și
   * „Ecocontact 6", „Alpin 6" și „Alpin-6" — iar cheia noastră naturală, care
   * normalizează, le vede pe amândouă ca fiind produsul nostru. Trimise în
   * aceeași cerere, Postgres refuză lotul întreg cu 21000.
   *
   * Se păstrează una singură: stocul bate prețul, prețul bate vechimea. Cealaltă NU se aruncă în tăcere — intră
   * în raport, la `conflicte`, pentru că uneori chiar sunt două anvelope
   * diferite („Pro" și „Pro+" sunt modele Vredestein distincte) și atunci
   * catalogul nostru e cel care are o fișă lipsă, nu ei una în plus.
   */
  const pePro = new Map();
  for (const g of rezultate.gasite) {
    const vechi = pePro.get(g.produs.id);
    pePro.set(g.produs.id, vechi ? { ...g, p: maiBunDintre(vechi.p, g.p) } : g);
  }
  rezultate.conflicte = [];
  for (const g of rezultate.gasite) {
    const castigator = pePro.get(g.produs.id);
    if (castigator.p.id !== g.p.id) rezultate.conflicte.push({ p: g.p, produs: g.produs, inLocul: castigator.p.id });
  }
  rezultate.gasite = [...pePro.values()];
  if (rezultate.conflicte.length) {
    spune(`· două fișe de-ale lor pentru același produs de-al nostru: ${rezultate.conflicte.length} (se leagă una, restul în raport)`);
  }

  const fantomeAcoperite = rezultate.gasite.filter(({ produs }) => !cuSursa.has(produs.id));
  const legaturiNoi = rezultate.gasite.filter(({ p }) => !legateDeja.has(String(p.id)));
  spune(`· dintre cele potrivite, fără niciun furnizor până acum: ${fantomeAcoperite.length}`);
  spune(`· legături noi față de rularea trecută: ${legaturiNoi.length}`);

  /*
   * LEGAREA SE SCRIE ÎNAINTEA POZELOR, nu după.
   *
   * Pregătirea produselor noi înseamnă câteva mii de poze descărcate una câte
   * una — ore de rulare. Prima oară legarea era la final și a picat acolo, iar
   * orele alea s-au pierdut degeaba. Legarea nu depinde de poze, nu atinge
   * niciun preț și nu creează nimic: scrie doar rânduri în `product_sources`.
   * Deci se face prima, cât e ieftină, iar dacă importul se împiedică mai
   * târziu, cele 1.750 de legături — și cele 908 produse care până acum n-aveau
   * niciun furnizor — rămân câștigate.
   */
  /*
   * UN COD DE-AL LOR RĂMÂNE LA PRODUSUL LA CARE A FOST LEGAT PRIMA DATĂ.
   *
   * `(source, external_id)` e unic. Când catalogul nostru a primit între timp o
   * fișă care se potrivește mai bine pe hârtie, potrivirea de azi poate arăta
   * spre alt produs — iar lotul întreg pica cu 23505. Mutarea legăturii ar
   * schimba cine dictează prețul unei fișe existente; nu e treaba unui import.
   */
  const legaturaMutata = ({ p, produs }) => {
    const vechi = legateDeja.get(String(p.id));
    return vechi && vechi.product_id !== produs.id;
  };
  const mutate = rezultate.gasite.filter(legaturaMutata);
  if (mutate.length) spune(`· coduri deja legate de alt produs, lăsate cum erau: ${mutate.length}`);

  let legate = 0;
  if (aplica) {
    legate = await scrieSurse(rezultate.gasite.filter((g) => !legaturaMutata(g)).map(({ p, produs }) => ({
      product_id: produs.id,
      source: SURSA,
      external_id: p.id,
      available: p.stockStatus === 'supplier',
    })));
    spune(`· legate de produsele existente: ${legate}`);
  }

  /*
   * UN COD DEJA LEGAT NU DEVINE FIȘĂ NOUĂ.
   *
   * Regula vine de la pneu.md, care își rescrie rândurile pe loc: pe 26 septembrie 2026 codul
   * 3131764, legat de „Platin RP 70 Winter 235/55 R18 104H XL" (fișa 1621), a
   * apărut întâi fără XL, apoi ca „RP-110 Allseason 100V". Potrivirea n-a mai
   * recunoscut fișa, codul a trecut la candidați, s-a creat o fișă nouă, iar
   * legarea ei a picat pe unicitatea (source, external_id) — și a luat cu ea
   * legăturile tuturor celorlalte 19 fișe create în aceeași rulare, rămase fără
   * furnizor și deci cu prețul înghețat.
   *
   * Codul rămâne unde a fost legat (aceeași regulă ca `legaturaMutata`); ce s-a
   * schimbat la ei intră în raport, nu în catalog.
   */
  rezultate.codLegatDeja = rezultate.candidati.filter(({ p }) => legateDeja.has(String(p.id)));
  if (rezultate.codLegatDeja.length) {
    spune(`· candidați al căror cod e deja legat de o fișă (nu se creează): ${rezultate.codLegatDeja.length}`);
  }
  const deImportat = rezultate.candidati
    .filter(({ p }) => !legateDeja.has(String(p.id)))
    .slice(0, limit === Infinity ? undefined : limit);

  /* ------------------------------------------------------------- normalizare */
  const pregatite = [];
  let n = 0;
  for (const { p } of deImportat) {
    const { rand, motive, pret, exclus } = normalizeaza(p, {
      branduri, sluguriRo, sluguriRu, reguli: setari.pricing_rules, folosite,
    });
    if (exclus) { rezultate.excluse.push(p); continue; }

    try {
      const { imagini: imgs, erori: eImg } = await pregatesteImagini(p.images, hashuri, {
        dryRun: !aplica, max: config.imagini.max, altRo: rand.title_ro, altRu: rand.title_ru,
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

  /*
   * ÎNTRERUPĂTORUL SE UITĂ DOAR LA CE AM STRICAT NOI. „Dimensiune neparsată" e
   * o proprietate a catalogului lor și se raportează separat; pragul se
   * calculează pe eșecurile de normalizare din lotul curent.
   */
  /* „Nicio imagine" e tot o lipsă a lor, nu o greșeală a noastră: la actualizare
     ~40% din anvelopele noi n-au poză la ei. Merg în carantină ca oricare, iar
     `poze-din-catalog.mjs` le dă apoi fotografia modelului, dacă o avem. */
  const stricateDeNoi = rezultate.carantina.filter((c) => c.motive.some((m) => !/^nicio imagine/.test(m)));
  const rataCarantina = deImportat.length ? stricateDeNoi.length / deImportat.length : 0;
  spune(`\n${aplica ? 'APLIC' : 'DRY-RUN — nu se scrie nimic'}`);
  spune(`  de legat (le avem deja):  ${rezultate.gasite.length} (${legaturiNoi.length} legături noi)`);
  spune(`  de importat:              ${pregatite.length}`);
  spune(`  în carantină:             ${rezultate.carantina.length}`);
  spune(`  fără dimensiune parsabilă (rămân la ei): ${rezultate.carantinaSursa.length}`);
  spune(`  erori:                    ${rezultate.erori.length}`);

  const peMotiv = {};
  for (const c of [...rezultate.carantina, ...rezultate.carantinaSursa]) for (const m of c.motive) {
    const cheie = m.replace(/:.*$/, '');
    peMotiv[cheie] = (peMotiv[cheie] ?? 0) + 1;
  }
  if (Object.keys(peMotiv).length) {
    spune('  motivele carantinei:');
    for (const [m, k] of Object.entries(peMotiv).sort((a, b) => b[1] - a[1])) spune(`    ${String(k).padStart(4)}  ${m}`);
  }

  /* Fără nimic de creat nu e nimic de protejat: se scrie doar carantina. */
  if (pregatite.length > 0 && rataCarantina > config.breakers.maxQuarantineShare) {
    throw new Error(`carantină ${(rataCarantina * 100).toFixed(0)}%, peste pragul de ${config.breakers.maxQuarantineShare * 100}% — se oprește fără să scrie`);
  }

  if (!aplica) {
    scrieRaport({ rezultate, pregatite, lor, brandNecunoscut, fantomeAcoperite, dryRun: true });
    spune('\nNimic scris. Adaugă --apply.');
    return { ...rezultate, pregatite, fantomeAcoperite, dryRun: true };
  }

  /* ---------------------------------------------------------------- scrierea */
  /* Legăturile s-au scris deja, mai sus. Aici rămân doar produsele noi, fiecare
     cu rândul lui în `product_sources`. */
  let create = 0;
  const surseNoi = [];
  for (const x of pregatite) {
    try {
      const [creat] = await insertReturning('products', [x.rand]);
      if (x.imgs.length) {
        const randuri = x.imgs.map(({ refolosita, ...im }) => ({ ...im, product_id: creat.id }));
        try {
          await insert('product_images', randuri);
        } catch {
          /* O fișă fără poze nu e incompletă, e inutilă: se reîncearcă o dată. */
          try { await insert('product_images', randuri); }
          catch (e2) { rezultate.erori.push({ id: x.p.id, motiv: `poze nescrise: ${e2.message}` }); }
        }
      }
      surseNoi.push({
        product_id: creat.id, source: SURSA, external_id: x.p.id,
        available: x.rand.stock_status === 'supplier',
      });
      create++;
      if (create % 200 === 0) {
        /* Legăturile se scriu din mers, nu la final: o rulare întreruptă lasă
           produse create fără furnizor legat, iar ăla e exact felul de produs
           fantomă pe care faza 5 încearcă să-l cureţe. */
        await scrieSurse(surseNoi.splice(0));
        spune(`  scrise ${create}/${pregatite.length}…`);
      }
    } catch (e) {
      rezultate.erori.push({ id: x.p.id, motiv: `insert: ${e.message}` });
    }
  }
  if (surseNoi.length) await scrieSurse(surseNoi);

  for (const c of [...rezultate.carantina, ...rezultate.carantinaSursa]) {
    await insert('sync_quarantine', [{
      supplier: SURSA, pandashop_id: String(c.p.id), reason: c.motive.join('; '), raw: c.rand ?? c.p,
    }], { onConflict: 'supplier,pandashop_id,reason' });
  }

  await insert('import_runs', [{
    source: ENUM_SURSA, actor, dry_run: false,
    started_at: new Date(t0).toISOString(), finished_at: new Date().toISOString(),
    rows_total: lor.length, rows_created: create, rows_skipped: rezultate.gasite.length,
    errors: rezultate.erori.slice(0, 200),
    notes: `legate: ${legate}; carantină: ${rezultate.carantina.length}; fără furnizor până acum: ${fantomeAcoperite.length}`,
  }]);

  if (create > 0) await reimprospateazaContoarele(spune);
  scrieRaport({ rezultate, pregatite, lor, brandNecunoscut, fantomeAcoperite, dryRun: false, create, legate });

  spune(`\n  create: ${create} produse`);
  spune(`  legate: ${legate} produse existente`);
  spune(`gata în ${Math.round((Date.now() - t0) / 1000)}s`);
  return { ...rezultate, create, legate, fantomeAcoperite };
}

function scrieRaport({ rezultate, pregatite, lor, brandNecunoscut, fantomeAcoperite, dryRun, create = 0, legate = 0 }) {
  fs.mkdirSync(config.paths.reports, { recursive: true });
  const stampila = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const f = path.join(config.paths.reports, `autodoctor-${dryRun ? 'dryrun' : 'import'}-${stampila}.json`);
  fs.writeFileSync(f, JSON.stringify({
    rulare: new Date().toISOString(), dryRun, create, legate,
    cifre: {
      laEi: lor.length,
      gasite: rezultate.gasite.length,
      faraFurnizorPanaAcum: fantomeAcoperite.length,
      ambigue: rezultate.ambigue.length,
      excluse: rezultate.excluse.length,
      candidati: rezultate.candidati.length,
      pregatite: pregatite.length,
      carantina: rezultate.carantina.length,
      carantinaSursa: rezultate.carantinaSursa.length,
      conflicte: (rezultate.conflicte ?? []).length,
      erori: rezultate.erori.length,
    },
    brandNecunoscut: [...brandNecunoscut.entries()].map(([n, l]) => ({ brand: n, produse: l.length, exemplu: l[0].titleRo })),
    fantomeAcoperite: fantomeAcoperite.slice(0, 300).map(({ p, produs }) => ({ produs: produs.id, slug: produs.slug_ro, laEi: p.id, titlu: p.titleRo })),
    conflicte: (rezultate.conflicte ?? []).map(({ p, produs, inLocul }) => ({
      produsulNostru: produs.id, titluNostru: produs.title_ro,
      nelegata: p.id, titluLor: p.titleRo, pretLor: p.priceMdl, legataInSchimb: inLocul,
    })),
    ambigue: rezultate.ambigue.slice(0, 100).map(({ p, candidati }) => ({ id: p.id, titlu: p.titleRo, candidati: candidati.map((c) => `#${c.id} ${c.slug_ro}`) })),
    carantina: [...rezultate.carantina, ...rezultate.carantinaSursa].slice(0, 400).map((c) => ({ id: c.p.id, titlu: c.p.titleRo, motive: c.motive })),
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
