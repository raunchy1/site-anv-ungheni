/**
 * Regenerează src/lib/size-tree.ts din baza de date.
 * Arborele e static la build (~10 KB): selectorul de dimensiune nu face niciun
 * apel la bază la fiecare atingere. Trebuie rulat după fiecare import de produse,
 * altfel contoarele mint tăcut.
 *
 * Rulare: node --env-file=.env.local tools/build/size-tree.mjs
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await db.from('products')
    .select('width, aspect, diameter, stock_status')
    .eq('is_active', true).eq('category', 'anvelope').eq('size_system', 'metric')
    .not('width', 'is', null).not('aspect', 'is', null).not('diameter', 'is', null)
    .range(from, from + 999);
  if (error) throw new Error(error.message);
  rows.push(...data);
  if (data.length < 1000) break;
}
console.log(`${rows.length} anvelope metrice active`);

const tree = {};
for (const r of rows) {
  const w = String(r.width), a = String(r.aspect), d = r.diameter;
  const avail = r.stock_status !== 'out_of_stock' ? 1 : 0;
  tree[w] ??= [0, 0, {}];
  tree[w][0]++; tree[w][1] += avail;
  tree[w][2][a] ??= [0, 0, {}];
  tree[w][2][a][0]++; tree[w][2][a][1] += avail;
  tree[w][2][a][2][d] ??= [0, 0];
  tree[w][2][a][2][d][0]++; tree[w][2][a][2][d][1] += avail;
}

const num = (k) => Number(String(k).replace(/\D/g, ''));
const sortNum = (o) => Object.fromEntries(Object.entries(o).sort((x, y) => num(x[0]) - num(y[0]) || x[0].localeCompare(y[0])));
const sorted = sortNum(Object.fromEntries(Object.entries(tree).map(([w, [t, a, asp]]) => [
  w, [t, a, sortNum(Object.fromEntries(Object.entries(asp).map(([k, [t2, a2, dia]]) => [k, [t2, a2, sortNum(dia)]])))],
])));

const path = 'src/lib/size-tree.ts';
const src = fs.readFileSync(path, 'utf8');
const next = src
  .replace(/export const sizeTree: Readonly<Record<string, WidthNode>> = \{[\s\S]*?\} as const;/,
    `export const sizeTree: Readonly<Record<string, WidthNode>> = ${JSON.stringify(sorted)} as const;`)
  .replace(/^\/\/ GENERAT din .*$/m,
    `// GENERAT din baza de date (tools/build/size-tree.mjs) — ${new Date().toISOString().slice(0, 10)}.`);
fs.writeFileSync(path, next);
console.log(`size-tree.ts regenerat: ${Object.keys(sorted).length} lățimi, ${rows.length} anvelope`);
