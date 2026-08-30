/**
 * Teste pe normalizarea de import. Funcție pură, deci fără rețea și fără bază.
 *
 *   node --test tools/sync/pandashop/*.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeaza, REZERVATE } from './import.mjs';
import { slugRo, slugRu, titluCatalog } from './slug.mjs';
import { calculeazaPret, rotunjeste } from './pricing.mjs';

const BRANDURI = [
  { id: 1, name: 'Crosswind' }, { id: 2, name: 'Ceat' }, { id: 3, name: 'Michelin' },
  { id: 4, name: 'Tracmax' }, { id: 5, name: 'Double Coin' },
];

const produsul = (over = {}) => ({
  id: '01212005',
  titleRo: 'Anvelopa Crosswind Grip Peak 4S 165/65 R15 81T',
  titleRu: 'Шина Crosswind Grip Peak 4S 165/65 R15 81T',
  descriptionRo: 'ceva', descriptionRu: 'что-то',
  brandRaw: 'Crosswind', modelRaw: 'Grip Peak 4S', seasonRaw: 'all season',
  loadIndex: '81', speedIndex: 'T', isXl: false, isRunflat: false, isStudded: false,
  priceMdl: 899, oldPriceMdl: null, stockStatus: 'in_stock',
  images: [{ url: 'x' }], gtin: null, attributes: {},
  ...over,
});

const context = (over = {}) => ({
  branduri: BRANDURI, sluguriRo: new Set(), sluguriRu: new Set(),
  reguli: { default_margin_pct: 15, rounding: 'end_9', by_brand: {}, by_price_range: [] },
  ...over,
});

test('un produs bun trece toate verificările', () => {
  const { rand, motive } = normalizeaza(produsul(), context());
  assert.deepEqual(motive, []);
  assert.equal(rand.title_ro, 'Crosswind Grip Peak 4S 165/65 R15 81T', 'titlul intră fără cuvântul lor de categorie');
  assert.equal(rand.title_ru, 'Crosswind Grip Peak 4S 165/65 R15 81T');
  assert.equal(rand.slug_ro, 'crosswind-grip-peak-4s-165-65-r15-81t');
  assert.equal(rand.slug_ru, 'crosswind-grip-peak-4s-16565-r15-81t');
  assert.equal(rand.source, 'pandashop_sync');
  assert.equal(rand.season, 'all_season');
  assert.equal(rand.stock_status, 'supplier', 'randează „Disponibil · livrare 1–3 zile"');
  assert.equal(rand.source_price_mdl, 899);
  assert.equal(rand.price_mdl, 1039);
  assert.equal(rand.price_locked, false);
});

test('brand necunoscut → carantină, niciodată creat automat', () => {
  const { motive, rand } = normalizeaza(produsul({ titleRo: 'Anvelopa Comforser CF930 235/50 R19 103Y', brandRaw: 'Comforser' }), context());
  assert.ok(motive.some((m) => m.startsWith('brand necunoscut')), motive.join(' | '));
  assert.equal(rand.brand_id, null, 'nu se inventează un brand nou');
});

test('coliziunea de slug oprește importul, nu adaugă sufix', () => {
  const ctx = context({ sluguriRo: new Set(['crosswind-grip-peak-4s-165-65-r15-81t']) });
  const { motive, rand } = normalizeaza(produsul(), ctx);
  assert.ok(motive.some((m) => m.startsWith('coliziune slug RO')));
  assert.equal(rand.slug_ro, 'crosswind-grip-peak-4s-165-65-r15-81t', 'slug-ul rămâne cel generat, fără „-1"');
});

test('un slug care se ciocnește cu o rută a site-ului e oprit', () => {
  const { motive } = normalizeaza(produsul({ titleRo: 'Contact', titleRu: 'Contact' }), context());
  assert.ok(motive.some((m) => m.includes('rezervat')), motive.join(' | '));
});

test('fără preț nu e carantină, e listă de așteptare', () => {
  const { motive, faraPret } = normalizeaza(produsul({ priceMdl: null }), context());
  assert.equal(faraPret, true);
  assert.deepEqual(motive, [], 'lipsa prețului nu e un motiv de carantină');
});

test('preț zero sau negativ nu produce preț', () => {
  assert.equal(calculeazaPret(0, 'Ceat'), null);
  assert.equal(calculeazaPret(-5, 'Ceat'), null);
});

test('dimensiune neparsabilă → carantină', () => {
  const { motive } = normalizeaza(produsul({ titleRo: 'Anvelopa Crosswind Ceva Fără Dimensiune' }), context());
  assert.ok(motive.includes('dimensiune neparsată'), motive.join(' | '));
});

test('pandashop_id rămâne text: zerourile din față se păstrează', () => {
  const { rand } = normalizeaza(produsul({ id: '00170643' }), context());
  assert.equal(rand.pandashop_id, '00170643');
  assert.equal(typeof rand.pandashop_id, 'string');
});

test('pandashop_id în format UUID trece la fel', () => {
  const u = '105f6fc6-c8f0-11e4-9153-d43d7ef8efab';
  const { rand } = normalizeaza(produsul({ id: u }), context());
  assert.equal(rand.pandashop_id, u);
  assert.ok(Number.isInteger(rand.legacy_product_id), 'legacy_product_id rămâne numeric chiar și pentru UUID');
});

test('două produse diferite nu primesc același legacy_product_id', () => {
  const a = normalizeaza(produsul({ id: '00170643' }), context()).rand;
  const b = normalizeaza(produsul({ id: '00170644' }), context()).rand;
  assert.notEqual(a.legacy_product_id, b.legacy_product_id);
});

/* ------------------------------------------------------------- slug-urile */

test('100 de slug-uri generate nu ating nicio rută rezervată', () => {
  const marci = ['Crosswind', 'Ceat', 'Michelin', 'Tracmax', 'Double Coin'];
  const modele = ['Comfort Peak', 'Grip Peak 4S', 'WinterDrive', 'X-privilo TX2', 'RLB1'];
  let n = 0;
  for (const m of marci) for (const mo of modele) for (const w of [165, 195, 225, 275]) {
    const titlu = `Anvelopa ${m} ${mo} ${w}/65 R15 81T`;
    const ro = slugRo(titlu); const ru = slugRu(titlu);
    assert.ok(!REZERVATE.has(ro), `slug RO rezervat: ${ro}`);
    assert.ok(!REZERVATE.has(ru), `slug RU rezervat: ${ru}`);
    assert.match(ro, /^[a-z0-9-]+$/, `slug RO cu caractere nepermise: ${ro}`);
    assert.match(ru, /^[a-z0-9-]+$/, `slug RU cu caractere nepermise: ${ru}`);
    n++;
  }
  assert.equal(n, 100);
});

test('slug-ul RU lipește lățimea de profil, cel RO nu', () => {
  assert.equal(slugRo('Anvelopa Ceat WinterDrive 225/40 R18 92V XL'), 'ceat-winterdrive-225-40-r18-92v-xl');
  assert.equal(slugRu('Шина Ceat WinterDrive 225/40 R18 92V XL'), 'ceat-winterdrive-22540-r18-92v-xl');
});

test('cuvântul de categorie se taie în ambele limbi', () => {
  assert.equal(titluCatalog('Anvelopa Ceat X 1'), 'Ceat X 1');
  assert.equal(titluCatalog('Шина Ceat X 1'), 'Ceat X 1');
  assert.equal(titluCatalog('Ceat X 1'), 'Ceat X 1');
});

/* ---------------------------------------------------------------- prețul */

test('rotunjirea comercială termină în 9 și nu coboară sub marjă', () => {
  assert.equal(rotunjeste(1828.5), 1829);
  assert.equal(rotunjeste(668.15), 669);
  assert.equal(rotunjeste(1000), 1009, 'un preț exact pe „…0" urcă, nu coboară');
  assert.equal(rotunjeste(1234.56, 'none'), 1235);
});

test('marja pe brand bate marja pe interval, care bate implicitul', () => {
  const r = { default_margin_pct: 15, rounding: 'none', by_brand: { Michelin: 12 }, by_price_range: [{ min: 5000, pct: 10 }] };
  assert.equal(calculeazaPret(6000, 'Michelin', r).motiv, 'brand:Michelin');
  assert.equal(calculeazaPret(6000, 'Ceat', r).motiv, 'interval:5000–∞');
  assert.equal(calculeazaPret(100, 'Ceat', r).motiv, 'implicit');
});

/* --------------------------------------------------------------- imaginile */

test('textul alternativ al imaginii e titlul din catalog, în ambele limbi', async () => {
  const { pregatesteImagini } = await import('./images.mjs');
  const original = globalThis.fetch;
  /* JPEG minim valid: SOI + SOF0 cu 900x900 + umplutură până peste pragul de 1 KB. */
  const antet = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x03, 0x84, 0x03, 0x84]);
  const buf = Buffer.concat([antet, Buffer.alloc(2048)]);
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => buf });
  try {
    const { imagini } = await pregatesteImagini(
      [{ url: 'https://x/y.jpg', alt: 'Anvelopa Crosswind Comfort Peak 165/65 R15 81H' }],
      new Set(),
      { dryRun: true, altRo: 'Crosswind Comfort Peak 165/65 R15 81H', altRu: 'Crosswind Comfort Peak 165/65 R15 81H' },
    );
    assert.equal(imagini.length, 1);
    assert.equal(imagini[0].alt_ro, 'Crosswind Comfort Peak 165/65 R15 81H', 'fără prefixul „Anvelopa" din captionul lor');
    assert.equal(imagini[0].alt_ru, 'Crosswind Comfort Peak 165/65 R15 81H', 'alt_ru nu rămâne gol');
    assert.equal(imagini[0].width, 900);
    assert.equal(imagini[0].height, 900);
    assert.equal(imagini[0].content_hash.length, 40, 'numele fișierului e SHA-1-ul conținutului');
  } finally {
    globalThis.fetch = original;
  }
});

test('un produs fără nicio imagine descărcată ajunge în carantină', async () => {
  const { pregatesteImagini } = await import('./images.mjs');
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  try {
    const { imagini, erori } = await pregatesteImagini([{ url: 'https://x/y.jpg' }], new Set(), { dryRun: true });
    assert.equal(imagini.length, 0);
    assert.equal(erori.length, 1, 'eroarea nu se pierde tăcut');
  } finally {
    globalThis.fetch = original;
  }
});

test('aceeași fotografie nu se urcă de două ori', async () => {
  const { pregatesteImagini } = await import('./images.mjs');
  const original = globalThis.fetch;
  const buf = Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(2048, 7)]);
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => buf });
  try {
    const cunoscute = new Set();
    const { imagini } = await pregatesteImagini(
      [{ url: 'https://x/1.jpg' }, { url: 'https://x/2.jpg' }], cunoscute, { dryRun: true },
    );
    assert.equal(imagini[0].content_hash, imagini[1].content_hash);
    assert.equal(imagini[0].refolosita, false);
    assert.equal(imagini[1].refolosita, true);
    assert.equal(cunoscute.size, 1, 'un singur fișier, două referințe');
  } finally {
    globalThis.fetch = original;
  }
});
