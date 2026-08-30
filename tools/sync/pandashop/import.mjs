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
    attributes: sursa.attributes ?? {},
    in_catalog: true,
    is_active: true,
    imported_at: new Date().toISOString(),
  };

  return { rand, motive, pret, faraPret: !pret };
}

/** ID numeric stabil din ID-ul lor, care poate fi text sau UUID. */
function hashNumeric(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 2_000_000_000;
  return h || 1;
}

async function main() {
  const t0 = Date.now();
  const aplica = process.argv.includes('--apply');
  const iLimit = process.argv.indexOf('--limit');
  const limit = iLimit > 0 ? Number(process.argv[iLimit + 1]) : Infinity;

  const setari = (await readAll('settings', 'sync_enabled,pricing_rules'))[0] ?? {};
  if (setari.sync_enabled === false) { console.log('sincronizarea e oprită din admin (settings.sync_enabled = false)'); return; }

  console.log('· citesc catalogul nostru…');
  const [branduri, produse, imagini, vazute] = await Promise.all([
    readBrands(), readAll('products', 'slug_ro,slug_ru'), readAll('product_images', 'content_hash'), readAll('pandashop_seen', 'pandashop_id'),
  ]);
  const sluguriRo = new Set(produse.map((p) => p.slug_ro));
  const sluguriRu = new Set(produse.map((p) => p.slug_ru).filter(Boolean));
  const hashuri = new Set(imagini.map((i) => i.content_hash).filter(Boolean));
  const cunoscute = new Set(vazute.map((v) => v.pandashop_id));
  console.log(`  ${produse.length} produse, ${branduri.length} branduri, ${hashuri.size} imagini distincte, ${cunoscute.size} ID-uri văzute`);

  /* SIMULARE. Ca să putem verifica pipeline-ul înainte ca pandashop să urce ceva
     nou, `--simuleaza N` uită N ID-uri din setul din memorie, deci detectorul le
     vede ca noi. Nu atinge baza. Refuzată împreună cu `--apply`: un import „real"
     pe produse simulate ar fi exact importul retroactiv pe care nu-l vrem. */
  const iSim = process.argv.indexOf('--simuleaza');
  if (iSim > 0) {
    if (aplica) throw new Error('--simuleaza nu se combină cu --apply');
    const n = Number(process.argv[iSim + 1]) || 10;
    const sterse = [...cunoscute].slice(-n);
    for (const id of sterse) cunoscute.delete(id);
    console.log(`· SIMULARE: ${sterse.length} ID-uri scoase din set, ca să pară noi`);
  }

  const http = createHttp({ ...config.http });
  const source = createHtmlSource(http);
  const { noi } = await detecteaza({ cunoscute, source, full: process.argv.includes('--full') || iSim > 0 });
  console.log(`· produse noi detectate: ${noi.length}`);

  /* Întrerupătorul, înainte de orice scriere. */
  if (noi.length > config.breakers.maxNewPerRun) {
    throw new Error(`${noi.length} produse noi, peste pragul de ${config.breakers.maxNewPerRun} — se oprește fără să scrie`);
  }
  if (noi.length === 0) { console.log('  nimic de făcut'); return; }

  const deImportat = noi.slice(0, limit);
  const rezultate = { importate: [], carantina: [], faraPret: [], erori: [] };

  for (const ref of deImportat) {
    try {
      const sursa = await source.fetchProduct(ref);
      if (!sursa) { rezultate.erori.push({ id: ref.id, motiv: '404 la extragere' }); continue; }

      const { rand, motive, pret, faraPret } = normalizeaza(sursa, { branduri, sluguriRo, sluguriRu, reguli: setari.pricing_rules });

      if (faraPret && motive.length === 0) { rezultate.faraPret.push({ id: ref.id, titlu: sursa.titleRo }); continue; }

      const { imagini: imgs, erori: eImg } = await pregatesteImagini(sursa.images, hashuri, { dryRun: !aplica });
      if (imgs.length === 0) motive.push(`nicio imagine descărcată${eImg.length ? `: ${eImg[0]}` : ''}`);

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

  console.log(`\n${aplica ? 'APLIC' : 'DRY-RUN — nu se scrie nimic'}`);
  console.log(`  de importat:      ${rezultate.importate.length}`);
  console.log(`  în carantină:     ${rezultate.carantina.length}`);
  console.log(`  fără preț (așteptare): ${rezultate.faraPret.length}`);
  console.log(`  erori:            ${rezultate.erori.length}`);

  for (const c of rezultate.carantina.slice(0, 10)) console.log(`   carantină ${c.id}: ${c.titlu} → ${c.motive.join('; ')}`);
  for (const x of rezultate.importate.slice(0, 20)) {
    console.log(`\n  ${x.id}  ${x.rand.title_ro}`);
    console.log(`    slug RO: ${x.rand.slug_ro}`);
    console.log(`    slug RU: ${x.rand.slug_ru}`);
    console.log(`    ${x.rand.size_raw} ${x.rand.load_index ?? ''}${x.rand.speed_index ?? ''}${x.rand.is_xl ? ' XL' : ''} · ${x.rand.season ?? 'fără sezon'} · ${x.rand.brand_name}`);
    console.log(`    preț: ${x.rand.source_price_mdl} MDL + ${x.pret.pct}% (${x.pret.motiv}) = ${x.rand.price_mdl} MDL`);
    console.log(`    imagini: ${x.imgs.length} (${x.imgs.filter((i) => i.refolosita).length} refolosite)`);
  }

  /* Întrerupătorul se verifică DUPĂ ce s-a tipărit raportul, nu înainte: dacă
     rularea se oprește, omul trebuie să vadă din ce cauză, nu doar că s-a oprit. */
  const peMotiv = {};
  for (const c of rezultate.carantina) for (const m of c.motive) {
    const cheie = m.replace(/:.*$/, '');
    peMotiv[cheie] = (peMotiv[cheie] ?? 0) + 1;
  }
  if (Object.keys(peMotiv).length) {
    console.log('\n  motivele carantinei:');
    for (const [m, n] of Object.entries(peMotiv).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(4)}  ${m}`);
  }

  if (rataCarantina > config.breakers.maxQuarantineShare) {
    throw new Error(`carantină ${(rataCarantina * 100).toFixed(0)}%, peste pragul de ${config.breakers.maxQuarantineShare * 100}% — se oprește fără să scrie`);
  }

  if (!aplica) { console.log('\nNimic scris. Adaugă --apply.'); return; }

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
  for (const f of rezultate.faraPret) {
    await insert('pandashop_seen', [{ pandashop_id: f.id, baseline: false, imported: false, status: 'no_price', last_checked_at: new Date().toISOString() }], { onConflict: 'pandashop_id' });
  }

  await insert('import_runs', [{
    source: 'pandashop_sync', actor: 'sync:new', dry_run: false,
    started_at: new Date(t0).toISOString(), finished_at: new Date().toISOString(),
    rows_total: totalIncercate, rows_created: create, rows_skipped: rezultate.faraPret.length,
    errors: rezultate.erori, notes: `carantină: ${rezultate.carantina.length}`,
  }]);

  console.log(`\n  create: ${create} produse`);
  console.log(`gata în ${Math.round((Date.now() - t0) / 1000)}s`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
}
