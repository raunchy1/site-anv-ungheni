/** Verifică pe Postgres real că baza chiar refuză datele degradate (deciziile C.2). */
import pg from 'pg';
const c = new pg.Client({ host: 'localhost', port: 55432, user: 'postgres', password: 'pg', database: 'postgres' });
await c.connect();
await c.query('truncate products restart identity cascade');

const base = { legacy: 900001, slug: 'test-produs', title: 'Test 205/55 R16' };
const insert = (over = {}) => {
  const v = { legacy_product_id: base.legacy++, slug_ro: `${base.slug}-${base.legacy}`, title_ro: base.title, size_source: 'attribute', stock_status: 'out_of_stock', price_mdl: null, is_active: true, ...over };
  return c.query(
    `insert into products (legacy_product_id, slug_ro, title_ro, size_source, stock_status, price_mdl, is_active)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [v.legacy_product_id, v.slug_ro, v.title_ro, v.size_source, v.stock_status, v.price_mdl, v.is_active],
  );
};

const cases = [
  ['produs activ fără dimensiune', { size_source: 'none', is_active: true }, 'respins'],
  ['produs inactiv fără dimensiune', { size_source: 'none', is_active: false }, 'acceptat'],
  ['produs în stoc fără preț', { stock_status: 'in_stock', price_mdl: null }, 'respins'],
  ['produs „stoc furnizor" fără preț', { stock_status: 'supplier', price_mdl: null }, 'respins'],
  ['produs epuizat fără preț', { stock_status: 'out_of_stock', price_mdl: null }, 'acceptat'],
  ['preț zero', { stock_status: 'in_stock', price_mdl: 0 }, 'respins'],
  ['preț negativ', { stock_status: 'in_stock', price_mdl: -5 }, 'respins'],
  ['produs normal', { stock_status: 'in_stock', price_mdl: 1847 }, 'acceptat'],
];

let fails = 0;
for (const [name, over, expected] of cases) {
  let actual = 'acceptat';
  try { await insert(over); } catch (e) { actual = 'respins'; }
  const ok = actual === expected;
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗'}  ${name.padEnd(36)} așteptat: ${expected.padEnd(9)} obținut: ${actual}`);
}
console.log(fails ? `\n${fails} test(e) eșuate` : '\ntoate constrângerile se comportă corect');
process.exitCode = fails ? 1 : 0;
await c.end();
