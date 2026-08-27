/**
 * Urcă logo-urile de marcă în Supabase Storage și scrie `brands.logo_url`.
 *
 * Sursa e un folder LOCAL, `data/brand-logos/`, în care pui fișierele oficiale
 * ale producătorilor (media kit / press kit). Numele fișierului e slug-ul mărcii
 * sau chiar numele ei: `michelin.svg`, `nokian-tyres.png`, `Bridgestone.svg`.
 * Nimic nu se descarcă automat de pe site-uri străine — vezi DECISIONS.md §A.3.
 *
 * Idempotent: reîncărcarea aceluiași fișier suprascrie obiectul și lasă URL-ul
 * neschimbat. Fără `--apply` doar raportează ce ar face.
 *
 * Rulare:
 *   node --env-file=.env.local tools/seed/upload-brand-logos.mjs
 *   node --env-file=.env.local tools/seed/upload-brand-logos.mjs --apply
 */
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const DIR = fileURLToPath(new URL('../../data/brand-logos/', import.meta.url));
const BUCKET = process.env.SUPABASE_BRAND_BUCKET ?? 'branduri';
const APPLY = process.argv.includes('--apply');

const MIME = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

/** Aceeași regulă de slugificare ca la seed: fără diacritice, fără spații. */
const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

let files;
try {
  files = (await fsp.readdir(DIR)).filter((f) => MIME[path.extname(f).toLowerCase()]);
} catch {
  console.error(`Folderul ${DIR} nu există. Creează-l și pune în el fișierele de logo.`);
  process.exit(1);
}
if (!files.length) {
  console.error(`Niciun fișier de logo în ${DIR} (acceptate: ${Object.keys(MIME).join(', ')}).`);
  process.exit(1);
}

const { data: brands, error: brandsErr } = await db.from('brands').select('id, slug_ro, name, logo_url');
if (brandsErr) throw new Error(`citire branduri: ${brandsErr.message}`);

// două chei de potrivire: slug-ul de rută și numele slugificat. Suficient pentru
// „nokian-tyres.svg" la marca „Nokian Tyres", fără potriviri aproximative.
const byKey = new Map();
for (const b of brands) {
  byKey.set(b.slug_ro, b);
  byKey.set(slugify(b.name), b);
}

if (APPLY) {
  const { data: buckets } = await db.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await db.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 2097152,
      allowedMimeTypes: Object.values(MIME),
    });
    if (error) throw new Error(`creare bucket: ${error.message}`);
    log(`bucket „${BUCKET}" creat, public la citire`);
  }
}

const matched = [];
const orphanFiles = [];
for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  const brand = byKey.get(slugify(path.basename(file, ext)));
  if (brand) matched.push({ file, ext, brand });
  else orphanFiles.push(file);
}

log(`${files.length} fișiere, ${matched.length} potrivite, ${orphanFiles.length} fără marcă`);
if (!APPLY) {
  for (const m of matched) log(`  ar urca ${m.file} -> ${m.brand.name}`);
  for (const f of orphanFiles) log(`  FĂRĂ MARCĂ: ${f}`);
  log('rulare seacă — adaugă --apply ca să scrie');
  process.exit(0);
}

let uploaded = 0;
for (const { file, ext, brand } of matched) {
  const body = await fsp.readFile(path.join(DIR, file));
  const objectPath = `${brand.slug_ro}${ext}`;
  const { error: upErr } = await db.storage.from(BUCKET).upload(objectPath, body, {
    contentType: MIME[ext],
    upsert: true,
    cacheControl: '31536000',
  });
  if (upErr) { console.error(`  EROARE ${file}: ${upErr.message}`); continue; }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
  const { error: dbErr } = await db.from('brands').update({ logo_url: url }).eq('id', brand.id);
  if (dbErr) { console.error(`  EROARE la ${brand.name}: ${dbErr.message}`); continue; }
  uploaded++;
  log(`  ${brand.name} -> ${objectPath}`);
}

const without = brands.filter((b) => !b.logo_url && !matched.some((m) => m.brand.id === b.id));
log(`gata: ${uploaded} logo-uri urcate; ${without.length} mărci rămân fără logo (rezervă tipografică)`);
for (const f of orphanFiles) log(`  FĂRĂ MARCĂ: ${f}`);
