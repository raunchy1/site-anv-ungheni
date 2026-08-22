/**
 * Urcă în Supabase Storage cele 1.749 de imagini unice (deduplicare SHA-1 deja făcută).
 * Idempotent: sare peste fișierele deja prezente cu aceeași dimensiune.
 * Rulare: node --env-file=.env.local tools/seed/upload-images.mjs [--concurrency N]
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DIR = new URL('../../data/raw/images/', import.meta.url);
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'produse';
const CONCURRENCY = Number(process.argv[process.argv.indexOf('--concurrency') + 1]) || 6;

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

// bucket public la citire; scrierea rămâne exclusiv pe service role
const { data: buckets } = await db.storage.listBuckets();
if (!buckets?.some((b) => b.name === BUCKET)) {
  const { error } = await db.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 52428800,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
  });
  if (error) throw new Error(`creare bucket: ${error.message}`);
  log(`bucket „${BUCKET}" creat, public la citire`);
} else {
  log(`bucket „${BUCKET}" există deja`);
}

// ce e deja sus
const existing = new Map();
for (let offset = 0; ; offset += 1000) {
  const { data, error } = await db.storage.from(BUCKET).list('', { limit: 1000, offset });
  if (error) throw new Error(`listare bucket: ${error.message}`);
  for (const f of data) existing.set(f.name, f.metadata?.size ?? 0);
  if (data.length < 1000) break;
}
log(`în bucket: ${existing.size} fișiere`);

const files = (await fsp.readdir(DIR)).filter((f) => !f.startsWith('.'));
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };

const queue = [];
for (const f of files) {
  const size = (await fsp.stat(new URL(f, DIR))).size;
  if (existing.get(f) === size) continue;
  queue.push({ f, size });
}
log(`de urcat: ${queue.length} din ${files.length} (${Math.round(queue.reduce((a, b) => a + b.size, 0) / 1024 / 1024)} MB)`);

let cursor = 0; let ok = 0; let fail = 0;
const errors = [];
const t0 = Date.now();

async function worker() {
  for (;;) {
    const i = cursor++;
    if (i >= queue.length) return;
    const { f } = queue[i];
    const body = await fsp.readFile(new URL(f, DIR));
    const { error } = await db.storage.from(BUCKET).upload(f, body, {
      contentType: MIME[path.extname(f).toLowerCase()] ?? 'application/octet-stream',
      upsert: true,
      cacheControl: '31536000',
    });
    if (error) { fail++; errors.push(`${f}: ${error.message}`); } else { ok++; }
    if ((ok + fail) % 100 === 0) {
      const rate = (ok + fail) / ((Date.now() - t0) / 1000);
      log(`${ok + fail}/${queue.length}  ok=${ok} eșec=${fail}  ${rate.toFixed(1)}/s`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
log(`gata: ${ok} urcate, ${fail} eșecuri, în ${Math.round((Date.now() - t0) / 1000)}s`);
if (errors.length) console.error('erori:\n' + errors.slice(0, 20).join('\n'));
process.exitCode = fail ? 1 : 0;
