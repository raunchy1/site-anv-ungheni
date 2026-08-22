/**
 * Seed complet în Supabase din data/raw/.
 * Idempotent: rulat de două ori la rând produce exact același rezultat.
 * Ordine: brands -> products -> product_images -> product_related -> services -> settings.
 *
 * Rulare: pnpm db:seed [--dry-run] [--limit N]
 */
import fs from 'node:fs';
import readline from 'node:readline';
import { createClient } from '@supabase/supabase-js';

const RAW = new URL('../../data/raw/', import.meta.url);
const DRY = process.argv.includes('--dry-run');
const LIMIT = process.argv.includes('--limit') ? Number(process.argv[process.argv.indexOf('--limit') + 1]) : Infinity;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'produse';
const BATCH = 500;

for (const k of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!process.env[k]) { console.error(`lipsește ${k} din mediu (.env.local)`); process.exit(1); }
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: 'public' },
});

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const readJson = (f) => JSON.parse(fs.readFileSync(new URL(f, RAW), 'utf8'));

/** Inserare pe loturi, cu progres. */
async function upsert(table, rows, onConflict) {
  if (DRY) { log(`  [dry-run] ${table}: ${rows.length} rânduri`); return rows.length; }
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await db.from(table).upsert(chunk, { onConflict, ignoreDuplicates: false });
    if (error) throw new Error(`${table} [${i}..${i + chunk.length}]: ${error.message}`);
    done += chunk.length;
    if (done % 2000 === 0 || done === rows.length) log(`  ${table}: ${done}/${rows.length}`);
  }
  return done;
}

const count = async (table) => {
  const { count: n, error } = await db.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`count(${table}): ${error.message}`);
  return n ?? 0;
};

/* ------------------------------------------------------------------ date */

log('citesc data/raw/…');
const pages = readJson('pages.json');
const manifest = fs.existsSync(new URL('images-manifest.json', RAW)) ? readJson('images-manifest.json') : { by_source: {} };

const products = [];
const rl = readline.createInterface({ input: fs.createReadStream(new URL('products.ndjson', RAW)), crlfDelay: Infinity });
for await (const line of rl) {
  if (!line.trim()) continue;
  try { products.push(JSON.parse(line)); } catch { /* linie parțială */ }
  if (products.length >= LIMIT) break;
}
log(`${products.length} produse, ${Object.keys(pages.brands).length} branduri, ${Object.keys(pages.services).length} pagini de servicii`);

/* --------------------------------------------------------------- branduri */

const brandBySlug = new Map();
for (const [slug, v] of Object.entries(pages.brands)) {
  brandBySlug.set(slug, {
    slug_ro: slug,
    slug_ru: (v.ru?.canonical ?? '').split('/ru/')[1] || null,
    name: (v.ro?.title ?? slug).replace(/^Anvelope\s+/i, '').trim(),
    meta_title_ro: v.ro?.meta_title ?? null,
    meta_title_ru: v.ru?.meta_title ?? null,
    meta_desc_ro: v.ro?.meta_description ?? null,
    meta_desc_ru: v.ru?.meta_description ?? null,
    // nu există în sursă; se completează din admin
    description_ro: null, description_ru: null, logo_url: null,
  });
}
// branduri care apar pe produse dar n-au pagină proprie în sitemap
for (const p of products) {
  const link = p.ro.brand_url ?? '';
  const slug = link.replace(/^https?:\/\/[^/]+\//, '').replace(/^ru\//, '');
  if (slug && !brandBySlug.has(slug) && p.ro.brand) {
    brandBySlug.set(slug, { slug_ro: slug, slug_ru: null, name: p.ro.brand,
      meta_title_ro: null, meta_title_ru: null, meta_desc_ro: null, meta_desc_ru: null,
      description_ro: null, description_ru: null, logo_url: null });
  }
}
log(`branduri de inserat: ${brandBySlug.size}`);
await upsert('brands', [...brandBySlug.values()], 'slug_ro');

const brandIds = new Map();
if (!DRY) {
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('brands').select('id, slug_ro').range(from, from + 999);
    if (error) throw new Error(`citire brands: ${error.message}`);
    for (const b of data) brandIds.set(b.slug_ro, b.id);
    if (data.length < 1000) break;
  }
}

/* --------------------------------------------------------------- produse */

/** Modelul = titlul fără brand, fără dimensiune, fără indici. */
function deriveModel(p) {
  let t = p.ro.title ?? '';
  if (p.ro.brand) t = t.replace(new RegExp(`^\\s*${p.ro.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '');
  t = t.replace(/\d{2,3}\s*[/xX]\s*\d{1,3}(?:[.,]\d+)?\s*Z?R\s*\d{1,2}(?:LT|C)?/i, '');
  t = t.replace(/\b\d{2,3}(?:\/\d{2,3})?\s*[A-Z]{1,2}\b/g, '');
  t = t.replace(/\b(XL|FR|RFT|ROF|SSR|ZP|MFS|\d+PR)\b/gi, '');
  return t.replace(/\s{2,}/g, ' ').trim() || null;
}

const orphan = (p) => (p.ro.breadcrumbs ?? []).length < 3;

const productRows = products.map((p) => {
  const brandSlug = (p.ro.brand_url ?? '').replace(/^https?:\/\/[^/]+\//, '').replace(/^ru\//, '');
  const noSize = p.ro.size_source === 'none';
  const isTpms = p.ro.category === 'tpms';
  return {
    legacy_product_id: Number(p.ro.product_id),
    slug_ro: p.slug,
    slug_ru: p.slug_ru || null,
    category: p.ro.category ?? 'anvelope',
    brand_id: brandIds.get(brandSlug) ?? null,
    brand_name: p.ro.brand ?? null,
    attr_manufacturer: p.ro.attributes?.Producator ?? null,
    model: deriveModel(p),

    size_system: p.ro.size_system,
    width: p.ro.width,
    aspect: p.ro.aspect,
    overall_diameter_in: p.ro.overall_diameter_in,
    section_width_in: p.ro.section_width_in,
    diameter: p.ro.diameter,
    size_raw: p.ro.size_raw,
    size_source: p.ro.size_source,
    load_index: p.ro.load_index,
    speed_index: p.ro.speed_index,
    season: p.ro.season,
    is_xl: !!p.ro.is_xl,
    is_runflat: !!p.ro.is_runflat,
    is_studded: !!p.ro.is_studded,
    is_commercial: !!p.ro.is_commercial,

    price_mdl: p.ro.price,
    old_price_mdl: p.ro.old_price,
    price_source: 'legacy_import',
    price_updated_at: new Date().toISOString(),
    price_locked: false,

    stock_status: p.ro.stock_status ?? 'out_of_stock',

    title_ro: p.ro.title,
    title_ru: p.ru?.title ?? null,
    description_ro: p.ro.description_html,
    description_ru: p.ru?.description_html ?? null,
    meta_title_ro: p.ro.meta_title,
    meta_title_ru: p.ru?.meta_title ?? null,
    meta_desc_ro: p.ro.meta_description,
    meta_desc_ru: p.ru?.meta_description ?? null,

    attributes: p.ro.attributes ?? {},
    in_catalog: !orphan(p),
    // B.2 + B.3: fără dimensiune sau orfan => inactiv. Senzorii TPMS sunt exceptați:
    // n-au dimensiune de anvelopă pentru că nu sunt anvelope.
    is_active: !((noSize && !isTpms) || orphan(p)),
  };
});

const inactive = productRows.filter((r) => !r.is_active);
log(`produse de inserat: ${productRows.length} (dezactivate la import: ${inactive.length} — ${inactive.map((r) => r.slug_ro).join(', ') || 'niciunul'})`);
await upsert('products', productRows, 'legacy_product_id');

const productIds = new Map();
if (!DRY) {
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('products').select('id, slug_ro').range(from, from + 999);
    if (error) throw new Error(`citire products: ${error.message}`);
    for (const p of data) productIds.set(p.slug_ro, p.id);
    if (data.length < 1000) break;
  }
  log(`id-uri de produs citite: ${productIds.size}`);
}

/* ---------------------------------------------------------------- imagini */

const imageRows = [];
let missingImage = 0;
for (const p of products) {
  const src = p.ro.images?.[0];
  const id = productIds.get(p.slug);
  if (!src || (!DRY && !id)) { if (!src) missingImage++; continue; }
  const file = manifest.by_source?.[src];
  if (!file) { missingImage++; continue; }
  imageRows.push({
    product_id: id ?? 0,
    storage_path: `${BUCKET}/${file}`,
    original_path: src,
    content_hash: file.replace(/\.[a-z]+$/i, ''),
    alt_ro: p.ro.title,
    alt_ru: p.ru?.title ?? p.ro.title,
    sort_order: 0,
  });
}
log(`imagini de legat: ${imageRows.length} (produse fără imagine: ${missingImage})`);
await upsert('product_images', imageRows, 'product_id,storage_path');

/* ------------------------------------------------- produse similare (P2) */

const relatedRows = [];
const unresolved = new Set();
for (const p of products) {
  const from = productIds.get(p.slug);
  if (!from && !DRY) continue;
  let order = 0;
  for (const slug of p.ro.related_slugs ?? []) {
    const to = productIds.get(slug);
    if (!to) { unresolved.add(slug); continue; }
    if (to === from) continue;
    relatedRows.push({ product_id: from ?? 0, related_product_id: to, source: 'legacy', sort_order: order++ });
  }
}
log(`relații „produse similare": ${relatedRows.length} (slug-uri nerezolvate: ${unresolved.size})`);
if (unresolved.size) log(`  nerezolvate: ${[...unresolved].slice(0, 10).join(', ')}`);
await upsert('product_related', relatedRows, 'product_id,related_product_id');

/* -------------------------------------------------------------- servicii */

const SERVICE_ORDER = ['schimbul-rotilor', 'balansarea-rotilor', 'reparatia-anvelopelor', 'reparatia-discurilor',
  'slefuirea-discurilor-de-frana', 'sudura-cu-argon', 'vopsirea-discurilor', 'hotel-anvelope',
  'incarcare-conditionere-auto-cu-freon'];

const serviceRows = Object.entries(pages.services)
  .filter(([slug]) => slug !== 'servicii')
  .map(([slug, v]) => {
    const img = [...(v.ro?.body_html ?? '').matchAll(/<img[^>]+src="([^"]*\/uslugi\/[^"]*)"/g)][0]?.[1] ?? null;
    return {
      slug_ro: slug,
      slug_ru: (v.ru?.canonical ?? '').split('/ru/')[1] || null,
      title_ro: v.ro?.title ?? slug,
      title_ru: v.ru?.title ?? null,
      // NULL, nu string gol: sursa nu are niciun text descriptiv
      body_ro: null, body_ru: null, excerpt_ro: null, excerpt_ru: null,
      price_from_mdl: null,
      image_url: img ? img.replace(/^https?:\/\/[^/]+/, '').replace('/image/cache/', '/image/').replace(/-\d+x\d+(\.[a-z]+)$/i, '$1') : null,
      meta_title_ro: v.ro?.meta_title ?? null,
      meta_title_ru: v.ru?.meta_title ?? null,
      meta_desc_ro: v.ro?.meta_description ?? null,
      meta_desc_ru: v.ru?.meta_description ?? null,
      sort_order: SERVICE_ORDER.indexOf(slug) < 0 ? 99 : SERVICE_ORDER.indexOf(slug),
    };
  });
log(`servicii: ${serviceRows.length}`);
await upsert('services', serviceRows, 'slug_ro');

/* -------------------------------------------------------------- reconciliere */

if (!DRY) {
  const asteptat = {
    brands: brandBySlug.size,
    products: productRows.length,
    product_images: imageRows.length,
    product_related: relatedRows.length,
    services: serviceRows.length,
  };
  console.log('\n--- reconciliere ---');
  let diferente = 0;
  for (const [table, want] of Object.entries(asteptat)) {
    const got = await count(table);
    const ok = got === want;
    if (!ok) diferente++;
    console.log(`${ok ? '✓' : '✗'} ${table.padEnd(16)} așteptat ${String(want).padStart(6)}  în bază ${String(got).padStart(6)}${ok ? '' : `  Δ ${got - want}`}`);
  }
  if (diferente) {
    console.error(`\n${diferente} tabel(e) nu se reconciliază. Oprire.`);
    process.exit(1);
  }
  console.log('\nseed complet, totul se reconciliază.');
}
