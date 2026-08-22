/**
 * Aplică migrațiile pe un Postgres local (docker, port 55432) ca să verifice
 * că rulează și că sunt idempotente. Nu atinge nimic din Supabase.
 * Rulare: node tools/db/apply-local.mjs [--twice]
 */
import fs from 'node:fs';
import pg from 'pg';

const dir = new URL('../../supabase/migrations/', import.meta.url);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const c = new pg.Client({ host: 'localhost', port: 55432, user: 'postgres', password: 'pg', database: 'postgres' });
await c.connect();

const passes = process.argv.includes('--twice') ? 2 : 1;
for (let pass = 1; pass <= passes; pass++) {
  if (passes > 1) console.log(`\n--- trecerea ${pass} ---`);
  for (const f of files) {
    try {
      await c.query(fs.readFileSync(new URL(f, dir), 'utf8'));
      console.log('OK    ', f);
    } catch (e) {
      console.log('EROARE', f, '→', e.message, e.position ? `(poziția ${e.position})` : '');
      process.exitCode = 1;
    }
  }
}

const q = async (sql) => (await c.query(sql)).rows;
console.log('\ntabele:', (await q(`select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1`)).map((r) => r.table_name).join(', '));
console.log('\nindexuri:', (await q(`select count(*)::int n from pg_indexes where schemaname='public'`))[0].n);
console.log('constrângeri CHECK pe products:', (await q(`select conname from pg_constraint where conrelid='products'::regclass and contype='c' order by 1`)).map((r) => r.conname).join(', '));
console.log('pagini legale pre-create:', (await q('select slug_ro from legal_pages order by sort_order')).map((r) => r.slug_ro).join(', '));
await c.end();
