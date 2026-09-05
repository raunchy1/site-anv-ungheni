#!/usr/bin/env node
/**
 * SCOATEREA UNEI MĂRCI DIN CATALOG, cu totul.
 *
 * Cerut pe 5 septembrie 2026: Rosava, Centara, Rotex, Powertrac și Charmhoo nu
 * se mai vând. Nu „ascunse", nu `is_active = false` — șterse.
 *
 * DE CE E SCRIPT SEPARAT, ȘI NU ÎN `tools/sync/pandashop/`. Acolo există o
 * regulă pe care nu vreau s-o slăbesc: `db-write.mjs` nu are nicio funcție de
 * ștergere, iar `products` se scrie doar prin inserare. Un `delete` pe produse
 * n-are ce căuta în același director cu cronul de noapte. Aici e explicit,
 * pornit de om, cu rulare seacă implicită.
 *
 * ORDINEA CONTEAZĂ, din cauza a două constrângeri:
 *
 *   1. `pandashop_seen.product_id` e `on delete set null`, dar tabelul are
 *      `check (imported = false or product_id is not null)`. Ștergerea unui
 *      produs importat ar încălca-o. Deci rândurile se trec întâi pe
 *      `imported = false, status = 'skipped'`, cu nota motivului.
 *   2. Rândurile rămân în `pandashop_seen`, NU se șterg. Ele sunt exact ce
 *      împiedică detectorul să vadă ID-urile ca „produse noi" la noapte și să
 *      le importe la loc. Ștergerea lor ar readuce mărcile în catalog.
 *
 * `order_items.product_id` e `on delete set null` și are `title_snapshot`,
 * `slug_snapshot`, `price_snapshot` — comenzile vechi rămân lizibile.
 *
 * Copia de siguranță (produse + imagini + rânduri `pandashop_seen`) se scrie în
 * `reports/sync/` ÎNAINTE de orice ștergere, și în rularea seacă, și în cea reală.
 *
 *   node --env-file=.env.local tools/db/scoate-branduri.mjs zeta greentrac          # rulare seacă
 *   node --env-file=.env.local tools/db/scoate-branduri.mjs zeta greentrac --apply
 */
import fs from 'node:fs';
import path from 'node:path';

/*
 * Mărcile se dau în linia de comandă, ca slug-uri. Fără argumente rămâne lista
 * primei cereri, ca rularea din 5 septembrie să se poată reface identic.
 */
const MARCI_IMPLICITE = ['rosava', 'centara', 'rotex', 'powertrac', 'charmhoo'];
const NOTA = 'brand scos din catalog la cererea atelierului';

const aplica = process.argv.includes('--apply');
const MARCI = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (MARCI.length === 0) MARCI.push(...MARCI_IMPLICITE);
const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) throw new Error('lipsesc NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (rulează cu --env-file=.env.local)');

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function cere(cale, init = {}) {
  const res = await fetch(`${URL_BASE}/rest/v1/${cale}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${cale} → ${res.status} ${(await res.text()).slice(0, 300)}`);
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}

/** Citire paginată: PostgREST întoarce cel mult 1000 de rânduri pe cerere. */
async function citesteTot(cale, pas = 1000) {
  const out = [];
  for (let de = 0; ; de += pas) {
    const lot = await cere(cale, { headers: { Range: `${de}-${de + pas - 1}`, 'Range-Unit': 'items' } });
    out.push(...lot);
    if (lot.length < pas) return out;
  }
}

const loturi = (a, n = 200) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

async function main() {
  const branduri = await citesteTot(`brands?select=id,name,slug_ro,slug_ru,product_count,logo_url&slug_ro=in.(${MARCI.join(',')})`);
  if (branduri.length !== MARCI.length) {
    console.log(`ATENȚIE: cerute ${MARCI.length} mărci, găsite ${branduri.length} — ${branduri.map((b) => b.slug_ro).join(', ')}`);
  }
  const idBrand = branduri.map((b) => b.id);
  const filtruBrand = `brand_id=in.(${idBrand.join(',')})`;

  const produse = await citesteTot(`products?select=*&${filtruBrand}&order=id`);
  const idProdus = produse.map((p) => p.id);
  console.log(`· mărci: ${branduri.map((b) => `${b.name} (${b.id})`).join(', ')}`);
  console.log(`· produse de șters: ${produse.length}`);
  for (const b of branduri) console.log(`    ${String(produse.filter((p) => p.brand_id === b.id).length).padStart(4)}  ${b.name}`);

  const imagini = [];
  const vazute = [];
  const articole = [];
  for (const lot of loturi(idProdus)) {
    const inLot = `in.(${lot.join(',')})`;
    imagini.push(...await citesteTot(`product_images?select=*&product_id=${inLot}`));
    vazute.push(...await citesteTot(`pandashop_seen?select=*&product_id=${inLot}`));
    articole.push(...await citesteTot(`order_items?select=id,order_id,product_id,title_snapshot&product_id=${inLot}`));
  }
  console.log(`· imagini legate: ${imagini.length}`);
  console.log(`· rânduri pandashop_seen legate: ${vazute.length} (importate: ${vazute.filter((v) => v.imported).length})`);
  console.log(`· articole de comandă atinse: ${articole.length}${articole.length ? ' — rămân cu titlul și prețul din momentul comenzii' : ''}`);

  /* Fișierele din storage se șterg doar dacă nu le mai folosește nimeni. Aceeași
     fotografie servește mai multe produse: `content_hash` e SHA-1-ul, deci calea
     poate fi comună cu un produs care rămâne în catalog. */
  const caiCandidate = [...new Set(imagini.map((i) => i.storage_path))];
  const inFolosinta = new Set();
  for (const lot of loturi(caiCandidate, 100)) {
    const cale = `product_images?select=storage_path&storage_path=in.(${lot.map((c) => `"${c}"`).join(',')})&product_id=not.in.(${idProdus.join(',')})`;
    for (const r of await citesteTot(cale)) inFolosinta.add(r.storage_path);
  }
  const deSters = caiCandidate.filter((c) => !inFolosinta.has(c));
  console.log(`· fișiere în storage: ${caiCandidate.length} distincte, ${deSters.length} rămân fără niciun produs, ${inFolosinta.size} sunt folosite și de alte produse`);

  const stampila = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const dosar = 'reports/sync';
  fs.mkdirSync(dosar, { recursive: true });
  const copie = path.join(dosar, `scoatere-branduri-${stampila}.json`);
  fs.writeFileSync(copie, JSON.stringify({ cerute: MARCI, branduri, produse, imagini, vazute, articole, deSters }, null, 2));
  console.log(`· copie de siguranță: ${copie} (${(fs.statSync(copie).size / 1e6).toFixed(1)} MB)`);

  if (!aplica) {
    console.log('\nRulare seacă — nu s-a șters nimic. Adaugă --apply.');
    return;
  }

  console.log('\nAPLIC');

  /* 1. Rândurile din `pandashop_seen` se desprind de produs ÎNAINTE de ștergere,
        altfel `check (imported = false or product_id is not null)` refuză. */
  let desprinse = 0;
  for (const lot of loturi(vazute.map((v) => v.pandashop_id))) {
    await cere(`pandashop_seen?pandashop_id=in.(${lot.map((i) => `"${i}"`).join(',')})`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ imported: false, product_id: null, status: 'skipped', note: NOTA }),
    });
    desprinse += lot.length;
  }
  console.log(`  pandashop_seen: ${desprinse} rânduri trecute pe 'skipped' (rămân, ca ID-urile să nu pară noi la noapte)`);

  /* 2. Produsele. `product_images`, `product_related` și `reviews` cad în cascadă. */
  let sterse = 0;
  for (const lot of loturi(idProdus)) {
    await cere(`products?id=in.(${lot.join(',')})`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    sterse += lot.length;
  }
  console.log(`  products: ${sterse} șterse (cu imaginile lor, în cascadă)`);

  /* 3. Mărcile. După produse: `products.brand_id` le referă. */
  await cere(`brands?id=in.(${idBrand.join(',')})`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  console.log(`  brands: ${idBrand.length} șterse`);

  /* 4. Fișierele orfane din storage. Ultimele: dacă pasul ăsta cade, baza e deja
        curată și repornirea scriptului nu mai are ce șterge din ea. */
  if (deSters.length) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'produse';
    let dus = 0;
    for (const lot of loturi(deSters, 100)) {
      const res = await fetch(`${URL_BASE}/storage/v1/object/${bucket}`, {
        method: 'DELETE', headers: H, body: JSON.stringify({ prefixes: lot }),
      });
      if (!res.ok) { console.log(`  storage: EROARE ${res.status} ${(await res.text()).slice(0, 200)}`); break; }
      dus += lot.length;
    }
    console.log(`  storage: ${dus} fișiere șterse din bucketul '${bucket}'`);
  }

  /* 5. Contoarele. Fără asta, bara de filtre arată mărcile șterse cu numărul vechi. */
  for (const nume of ['refresh_facet_counts', 'refresh_brand_counts']) {
    const res = await fetch(`${URL_BASE}/rest/v1/rpc/${nume}`, { method: 'POST', headers: H, body: '{}' });
    console.log(`  ${nume}: ${res.ok ? 'reîmprospătat' : `EROARE ${res.status}`}`);
  }

  console.log('\nGata.');
}

main().catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
