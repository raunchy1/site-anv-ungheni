/**
 * Generează `tools/logos/marci-checklist.csv`: mărcile în ordinea importanței
 * (număr de produse), cu acoperirea cumulată a catalogului. Ordinea din CSV e
 * ordinea în care se caută logo-urile — primele zece mărci acoperă jumătate
 * din catalog, ultimele treizeci acoperă sub 1%.
 *
 * Rulare: node --env-file=.env.local tools/logos/build-checklist.mjs
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await db.from('brands').select('name, slug_ro, product_count, logo_url').order('product_count', { ascending: false });
if (error) throw new Error(error.message);

const total = data.reduce((s, b) => s + b.product_count, 0);
let acc = 0;
const rows = data.map((b, i) => {
  acc += b.product_count;
  return {
    prioritate: i + 1,
    slug_ro: b.slug_ro,
    name: b.name,
    produse: b.product_count,
    cota: ((b.product_count / total) * 100).toFixed(2),
    cumulat: ((acc / total) * 100).toFixed(2),
    are_logo: b.logo_url ? 'da' : 'nu',
  };
});

const head = Object.keys(rows[0]).join(',');
const csv = [head, ...rows.map((r) => Object.values(r).map((v) => (/[,"]/.test(String(v)) ? `"${v}"` : v)).join(','))].join('\n');
fs.writeFileSync(new URL('./marci-checklist.csv', import.meta.url), csv + '\n');
console.log(`${rows.length} mărci, ${total} produse -> tools/logos/marci-checklist.csv`);
console.log(`primele 10 acoperă ${rows[9].cumulat}% din catalog, primele 30 acoperă ${rows[29].cumulat}%`);
