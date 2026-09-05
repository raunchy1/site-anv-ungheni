#!/usr/bin/env node
/**
 * IMPORTUL PRODUSELOR NOI. Gate B.
 *
 * Se importă DOAR produse pe care detectorul le-a văzut ca noi. Niciun produs
 * existent nu e citit ca să fie modificat și nu există în tot directorul ăsta o
 * singură operație de UPDATE sau DELETE pe `products` — `db-write.mjs` o refuză.
 *
 * ȘASE VERIFICĂRI, TOATE OBLIGATORII. Un produs care pică oricare dintre ele
 * merge în carantină întreg, nu intră în catalog pe jumătate:
 *
 *   1. dimensiune parsată de parserul existent
 *   2. brand care există deja la noi — niciodată creat automat
 *   3. preț prezent și pozitiv
 *   4. cel puțin o imagine descărcată
 *   5. titlu în ambele limbi
 *   6. slug fără coliziune, nici cu produsele noastre, nici cu rutele rezervate
 *
 * Cazul „fără preț" e special: nu e carantină, e listă de așteptare. Produsul
 * există la ei, doar că azi nu se poate cumpăra. `status = 'no_price'`, iar la
 * următoarea rulare se verifică din nou.
 *
 *   node --env-file=.env.local tools/sync/pandashop/import.mjs            # dry-run
 *   node --env-file=.env.local tools/sync/pandashop/import.mjs --limit 50 --apply
 */
import { pathToFileURL } from 'node:url';
import { config } from './config.mjs';
import { createHttp } from './http.mjs';
import { createHtmlSource } from './html-source.mjs';
import { readAll, readBrands } from './db.mjs';
import { insert, insertReturning, update } from './db-write.mjs';
import { parseTitle } from './parse-title.mjs';
import { normalizeSeason } from '../../scraper/parse-product.mjs';
import { slugRo, slugRu, titluCatalog } from './slug.mjs';
import { calculeazaPret } from './pricing.mjs';
import { pregatesteImagini } from './images.mjs';
import { detecteaza } from './detect.mjs';
import { iaLacatul, elibereazaLacatul } from './lock.mjs';
import { reimprospateazaContoarele } from './counters.mjs';

/* Rutele care nu sunt produse. Un produs cu slug-ul `contact` ar înlocui tăcut
   pagina de contact — vezi tools/route-map/check-collisions.ts. */
export const REZERVATE = new Set([
  'catalog-anvelope', 'senzori-presiune-anvelope', 'servicii', 'contact', 'cos', 'checkout',
  'comanda', 'favorite', 'comparare', 'admin', 'api', 'ru', 'cont', 'cautare', 'design-system',
  'sitemap.xml', 'robots.txt', '_next', 'image', 'opengraph-image', 'icon', 'favicon.ico',
  'katalog-shin', 'datchiki-davleniya-v-shinah', 'uslugi', 'kontakty', 'korzina',
  'oformlenie-zakaza', 'zakaz', 'izbrannoe', 'sravnenie', 'poisk',
]);

/**
 * Marca e pe lista celor scoase din catalog? Comparația e pe numele normalizat,
 * ca „POWERTRAC", „Powertrac" și „ powertrac " să fie același lucru.
 */
export function esteExclus(nume) {
  const n = String(nume ?? '').trim().toLowerCase();
  return n !== '' && config.brands.excluse.includes(n);
}

/**
 * Normalizează un produs de la ei în forma rândului nostru, sau spune de ce nu se poate.
 * Funcție pură: nicio cerere de rețea, niciun efect. De aceea e testabilă.
 */
export function normalizeaza(sursa, { branduri, sluguriRo, sluguriRu, reguli }) {
  const motive = [];
  /* Titlul intră în catalog fără cuvântul lor de categorie: cele 15.008 titluri
     ale noastre încep cu brandul, nu cu „Anvelopa". */
  const titluRo = titluCatalog(sursa.titleRo);
  const titluRu = titluCatalog(sursa.titleRu);
  const t = parseTitle(titluRo, branduri.map((b) => b.name));

  /* Mărcile scoase din catalog se opresc aici, înaintea oricărei alte verificări:
     nu e un defect de date, e o decizie comercială, iar carantina n-are ce face
     cu ele. `esteExclus` se uită și la brandul parsat, și la cel brut de la ei —
     marca poate lipsi din `brands` tocmai pentru că a fost ștearsă. */
  const brandBrut = String(t.brand ?? sursa.brandRaw ?? '');
  if (esteExclus(brandBrut) || esteExclus(sursa.brandRaw)) {
    return { rand: null, motive: [], exclus: brandBrut || sursa.brandRaw || '—' };
  }

  if (!t.size_raw) motive.push('dimensiune neparsată');
  const brand = branduri.find((b) => b.name.toLowerCase() === String(t.brand ?? '').toLowerCase());
  if (!brand) motive.push(`brand necunoscut: ${t.brand ?? sursa.brandRaw ?? '—'}`);
  if (!titluRo) motive.push('titlu RO lipsă');
  if (!titluRu) motive.push('titlu RU lipsă');

  const pret = calculeazaPret(sursa.priceMdl, brand?.name, reguli);

  const slug_ro = slugRo(titluRo);
  const slug_ru = slugRu(titluRu || titluRo);
  if (!slug_ro) motive.push('slug RO gol');
  if (sluguriRo.has(slug_ro)) motive.push(`coliziune slug RO: ${slug_ro}`);
  if (slug_ru && sluguriRu.has(slug_ru)) motive.push(`coliziune slug RU: ${slug_ru}`);
  if (REZERVATE.has(slug_ro) || REZERVATE.has(slug_ru)) motive.push('slug rezervat de o rută a site-ului');

  const rand = {
    /* `legacy_product_id` e NOT NULL UNIQUE din vremea OpenCart. Produsele venite
       prin sincronizare n-au avut niciodată un ID OpenCart, așa că primesc unul
       negativ, derivat din al lor — nu se poate ciocni cu nimic din 1..999999. */
    legacy_product_id: -Math.abs(hashNumeric(sursa.id)),
    pandashop_id: String(sursa.id),
    source: 'pandashop_sync',
    slug_ro,
    slug_ru: slug_ru || null,
    category: 'anvelope',
    brand_id: brand?.id ?? null,
    brand_name: brand?.name ?? null,
    attr_manufacturer: sursa.brandRaw ?? null,
    model: t.model || null,
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
    stock_status: 'supplier',
    title_ro: titluRo,
    title_ru: titluRu || null,
    description_ro: sursa.descriptionRo || null,
    description_ru: sursa.descriptionRu || null,
    /* Meta-urile se scriu la import, dupa conventia celor 15.010 fise vechi.
       Fara ele fisa intra in index fara descriere — Google isi alege singur o
       propozitie din pagina, de obicei tabelul de specificatii. */
    ...meta(titluRo, titluRu || titluRo),
    attributes: sursa.attributes ?? {},
    in_catalog: true,
    is_active: true,
    imported_at: new Date().toISOString(),
  };

  return { rand, motive, pret, faraPret: !pret };
}

/**
 * Titlul si descrierea pentru motoarele de cautare, in exact forma folosita de
 * catalogul existent — inclusiv telefonul si bifele. Nu inventam un al doilea
 * stil pentru 66 de fise dintr-un catalog de 15.000.
 */
export function meta(titluRo, titluRu) {
  const tel = '068-263-644';
  return {
    meta_title_ro: `${titluRo} - cumpara in Ungheni`,
    meta_desc_ro: `Anvelope ${titluRo} - cele mai mici preturi din Ungheni. \u2714\ufe0fLivrare \u2714\ufe0fGarantie \u2742Oferim servicii de montare \u260e${tel}`,
    meta_title_ru: `${titluRu} - \u043a\u0443\u043f\u0438\u0442\u044c \u0432 \u0423\u043d\u0433\u0435\u043d\u0430\u0445`,
    meta_desc_ru: `\u0428\u0438\u043d\u044b ${titluRu} - \u043b\u0443\u0447\u0448\u0438\u0435 \u0446\u0435\u043d\u044b \u0432 \u0423\u043d\u0433\u0435\u043d\u044b \u2714\ufe0f\u0414\u043e\u0441\u0442\u0430\u0432\u043a\u0430 \u2714\ufe0f\u0413\u0430\u0440\u0430\u043d\u0442\u0438\u044f \u2742\u041f\u0440\u0435\u0434\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u043c \u0448\u0438\u043d\u043e\u043c\u043e\u043d\u0442\u0430\u0436 \u260e${tel}`,
  };
}

/** ID numeric stabil din ID-ul lor, care poate fi text sau UUID. */
function hashNumeric(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 2_000_000_000;
  return h || 1;
}

/**
 * O rulare completă. CLI-ul și cronul apelează exact funcția asta — nu există
 * două căi de cod care s-ar putea comporta diferit în producție față de mână.
 *
 * @param {{apply?: boolean, limit?: number, full?: boolean, simuleaza?: number, actor?: string, log?: Function}} opts
 */
export async function ruleaza(opts = {}) {
  const { apply: aplica = false, limit = Infinity, full = false, simuleaza = 0, actor = 'manual' } = opts;
  const log = opts.log ?? console.log;
  const t0 = Date.now();
  const jurnal = [];
  const spune = (...a) => { jurnal.push(a.join(' ')); log(...a); };

  const setari = (await readAll('settings', 'sync_enabled,pricing_rules'))[0] ?? {};
  if (setari.sync_enabled === false) {
    spune('sincronizarea e oprită din admin (settings.sync_enabled = false)');
    return { oprit: 'din_admin', jurnal, importate: [], carantina: [], faraPret: [], erori: [], excluse: [] };
  }

  spune('· citesc catalogul nostru…');
  const [branduri, produse, imagini, vazute] = await Promise.all([
    readBrands(), readAll('products', 'slug_ro,slug_ru'), readAll('product_images', 'content_hash'), readAll('pandashop_seen', 'pandashop_id'),
  ]);
  const sluguriRo = new Set(produse.map((p) => p.slug_ro));
  const sluguriRu = new Set(produse.map((p) => p.slug_ru).filter(Boolean));
  const hashuri = new Set(imagini.map((i) => i.content_hash).filter(Boolean));
  const cunoscute = new Set(vazute.map((v) => v.pandashop_id));
  spune(`  ${produse.length} produse, ${branduri.length} branduri, ${hashuri.size} imagini distincte, ${cunoscute.size} ID-uri văzute`);

  /* SIMULARE. Ca să putem verifica pipeline-ul înainte ca pandashop să urce ceva
     nou, `--simuleaza N` uită N ID-uri din setul din memorie, deci detectorul le
     vede ca noi. Nu atinge baza. Refuzată împreună cu `--apply`: un import „real"
     pe produse simulate ar fi exact importul retroactiv pe care nu-l vrem. */
  if (simuleaza > 0) {
    if (aplica) throw new Error('simularea nu se combină cu scrierea');
    const sterse = [...cunoscute].slice(-simuleaza);
    for (const id of sterse) cunoscute.delete(id);
    spune(`· SIMULARE: ${sterse.length} ID-uri scoase din set, ca să pară noi`);
  }

  const http = createHttp({ ...config.http });
  const source = createHtmlSource(http);
  const { noi } = await detecteaza({ cunoscute, source, full: full || simuleaza > 0 });
  spune(`· produse noi detectate: ${noi.length}`);

  /* Întrerupătorul, înainte de orice scriere. */
  if (noi.length > config.breakers.maxNewPerRun) {
    throw new Error(`${noi.length} produse noi, peste pragul de ${config.breakers.maxNewPerRun} — se oprește fără să scrie`);
  }
  if (noi.length === 0) {
    spune('  nimic de făcut');
    return { jurnal, importate: [], carantina: [], faraPret: [], erori: [], excluse: [], durata: Date.now() - t0 };
  }

  const deImportat = noi.slice(0, limit);
  const rezultate = { importate: [], carantina: [], faraPret: [], erori: [], excluse: [] };

  for (const ref of deImportat) {
    try {
      const sursa = await source.fetchProduct(ref);
      if (!sursa) { rezultate.erori.push({ id: ref.id, motiv: '404 la extragere' }); continue; }

      const { rand, motive, pret, faraPret, exclus } = normalizeaza(sursa, { branduri, sluguriRo, sluguriRu, reguli: setari.pricing_rules });

      if (exclus) { rezultate.excluse.push({ id: ref.id, titlu: sursa.titleRo, brand: exclus }); continue; }

      if (faraPret && motive.length === 0) { rezultate.faraPret.push({ id: ref.id, titlu: sursa.titleRo }); continue; }

      const { imagini: imgs, erori: eImg } = await pregatesteImagini(sursa.images, hashuri, {
        dryRun: !aplica, altRo: rand.title_ro, altRu: rand.title_ru,
      });
      if (imgs.length === 0) motive.push(`nicio imagine descărcată${eImg.length ? `: ${eImg[0]}` : ''}`);
      /* O imagine care n-a putut fi adusă nu trece tăcut: ajunge în jurnalul rulării
         chiar dacă produsul a intrat cu celelalte. Pozele sunt jumătate din pagină. */
      if (eImg.length) rezultate.erori.push({ id: ref.id, motiv: `imagini ratate (${eImg.length}): ${eImg.join(' | ').slice(0, 200)}` });

      if (motive.length) { rezultate.carantina.push({ id: ref.id, titlu: sursa.titleRo, motive, rand }); continue; }

      rezultate.importate.push({ id: ref.id, rand, imgs, pret });
      /* Rezervăm slug-urile în memorie, ca două produse din aceeași rulare să nu
         se ciocnească între ele înainte să ajungă în bază. */
      sluguriRo.add(rand.slug_ro);
      if (rand.slug_ru) sluguriRu.add(rand.slug_ru);
    } catch (e) {
      rezultate.erori.push({ id: ref.id, motiv: e.message });
    }
  }

  const totalIncercate = deImportat.length;
  const rataCarantina = totalIncercate ? rezultate.carantina.length / totalIncercate : 0;

  spune(`\n${aplica ? 'APLIC' : 'DRY-RUN — nu se scrie nimic'}`);
  spune(`  de importat:      ${rezultate.importate.length}`);
  spune(`  în carantină:     ${rezultate.carantina.length}`);
  spune(`  fără preț (așteptare): ${rezultate.faraPret.length}`);
  spune(`  erori:            ${rezultate.erori.length}`);
  if (rezultate.excluse.length) spune(`  mărci scoase din catalog: ${rezultate.excluse.length} (${[...new Set(rezultate.excluse.map((e) => e.brand))].join(', ')})`);

  for (const c of rezultate.carantina.slice(0, 10)) spune(`   carantină ${c.id}: ${c.titlu} → ${c.motive.join('; ')}`);
  for (const x of rezultate.importate.slice(0, 20)) {
    spune(`\n  ${x.id}  ${x.rand.title_ro}`);
    spune(`    slug RO: ${x.rand.slug_ro}`);
    spune(`    slug RU: ${x.rand.slug_ru}`);
    spune(`    ${x.rand.size_raw} ${x.rand.load_index ?? ''}${x.rand.speed_index ?? ''}${x.rand.is_xl ? ' XL' : ''} · ${x.rand.season ?? 'fără sezon'} · ${x.rand.brand_name}`);
    spune(`    preț: ${x.rand.source_price_mdl} MDL + ${x.pret.pct}% (${x.pret.motiv}) = ${x.rand.price_mdl} MDL`);
    spune(`    imagini: ${x.imgs.length} (${x.imgs.filter((i) => i.refolosita).length} refolosite)`);
  }

  /* Întrerupătorul se verifică DUPĂ ce s-a tipărit raportul, nu înainte: dacă
     rularea se oprește, omul trebuie să vadă din ce cauză, nu doar că s-a oprit. */
  const peMotiv = {};
  for (const c of rezultate.carantina) for (const m of c.motive) {
    const cheie = m.replace(/:.*$/, '');
    peMotiv[cheie] = (peMotiv[cheie] ?? 0) + 1;
  }
  if (Object.keys(peMotiv).length) {
    spune('\n  motivele carantinei:');
    for (const [m, n] of Object.entries(peMotiv).sort((a, b) => b[1] - a[1])) spune(`    ${String(n).padStart(4)}  ${m}`);
  }

  if (rataCarantina > config.breakers.maxQuarantineShare) {
    throw new Error(`carantină ${(rataCarantina * 100).toFixed(0)}%, peste pragul de ${config.breakers.maxQuarantineShare * 100}% — se oprește fără să scrie`);
  }

  if (!aplica) {
    spune('\nNimic scris. Adaugă --apply.');
    return { ...rezultate, jurnal, dryRun: true, durata: Date.now() - t0 };
  }

  /* -------------------------------------------------------------- scrierea */
  let create = 0;
  for (const x of rezultate.importate) {
    const [creat] = await insertReturning('products', [x.rand]);
    if (x.imgs.length) await insert('product_images', x.imgs.map(({ refolosita, ...i }) => ({ ...i, product_id: creat.id })));
    await insert('pandashop_seen', [{
      pandashop_id: x.id, baseline: false, imported: true, product_id: creat.id,
      status: 'imported', last_checked_at: new Date().toISOString(),
    }], { onConflict: 'pandashop_id' });
    create++;
  }
  for (const c of rezultate.carantina) {
    await insert('sync_quarantine', [{ pandashop_id: c.id, reason: c.motive.join('; '), raw: c.rand }], { onConflict: 'pandashop_id,reason' });
    await insert('pandashop_seen', [{ pandashop_id: c.id, baseline: false, imported: false, status: 'quarantined', last_checked_at: new Date().toISOString() }], { onConflict: 'pandashop_id' });
  }
  /* ID-ul unei mărci scoase se scrie în `pandashop_seen` ca 'skipped': altfel
     rămâne „nou" la fiecare rulare și se reevaluează la nesfârșit. */
  for (const x of rezultate.excluse) {
    await insert('pandashop_seen', [{ pandashop_id: x.id, baseline: false, imported: false, status: 'skipped', note: `marcă scoasă din catalog: ${x.brand}`, last_checked_at: new Date().toISOString() }], { onConflict: 'pandashop_id' });
  }
  for (const f of rezultate.faraPret) {
    await insert('pandashop_seen', [{ pandashop_id: f.id, baseline: false, imported: false, status: 'no_price', last_checked_at: new Date().toISOString() }], { onConflict: 'pandashop_id' });
  }

  await insert('import_runs', [{
    source: 'pandashop_sync', actor, dry_run: false,
    started_at: new Date(t0).toISOString(), finished_at: new Date().toISOString(),
    rows_total: totalIncercate, rows_created: create, rows_skipped: rezultate.faraPret.length,
    errors: rezultate.erori, notes: `carantină: ${rezultate.carantina.length}`,
  }]);

  if (create > 0) await reimprospateazaContoarele(spune);

  spune(`\n  create: ${create} produse`);
  spune(`gata în ${Math.round((Date.now() - t0) / 1000)}s`);
  return { ...rezultate, jurnal, dryRun: false, create, durata: Date.now() - t0 };
}

/**
 * Rulare cu lacăt. Cronul o folosește pe asta: două rulări simultane nu trebuie
 * să existe niciodată, iar lacătul se eliberează și dacă rularea aruncă.
 */
export async function ruleazaCuLacat(opts = {}) {
  const cine = opts.actor ?? 'sync';
  if (!(await iaLacatul(cine))) {
    return { oprit: 'lacat_ocupat', jurnal: ['o altă rulare e în curs; se sare peste'], importate: [], carantina: [], faraPret: [], erori: [], excluse: [] };
  }
  try {
    return await ruleaza(opts);
  } finally {
    await elibereazaLacatul();
  }
}

async function main() {
  const iLimit = process.argv.indexOf('--limit');
  const iSim = process.argv.indexOf('--simuleaza');
  const r = await ruleazaCuLacat({
    apply: process.argv.includes('--apply'),
    full: process.argv.includes('--full'),
    limit: iLimit > 0 ? Number(process.argv[iLimit + 1]) : Infinity,
    simuleaza: iSim > 0 ? (Number(process.argv[iSim + 1]) || 10) : 0,
    actor: 'cli',
  });
  if (r.oprit === 'lacat_ocupat') console.log('o altă rulare e în curs; se sare peste');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
}
