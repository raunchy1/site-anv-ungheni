/**
 * Teste pe fixturi reale, luate din răspunsul lor din 16 septembrie 2026.
 *
 * Fiecare caz de mai jos a fost găsit în catalogul lor, nu inventat: dacă un
 * test pare exagerat, e pentru că datele chiar arată așa.
 *
 *   node --test tools/sync/pneu/*.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeazaRand, alegeDintreDuplicate, construiesteTitlu,
  dimensiune, indiciDinFactura, titluMarca, titluModel, imagini,
} from './json-source.mjs';

/** Un rând de-al lor, cu ce e obligatoriu completat. */
const rand = (extra = {}) => ({
  id: 1, brand: 'KUMHO', model: 'WP-52', width: 195, height: 55, diameter: '16',
  loadIndex: 87, speedIndex: 'H', season: 'WINTER', price: 1700,
  invoiceName: '195/55R 16 87H TL WP-52 KUMHO SOUTH KOREA',
  stock: 0, invoiceStock: 4, typeC: false, productImages: [], profileImage: null,
  primeCost: 1252.24, discount: 15, transferLimit: 4,
  ...extra,
});

test('marca lor e cu majuscule, a noastră nu', () => {
  assert.equal(titluMarca('HANKOOK'), 'Hankook');
  assert.equal(titluMarca('BF GOODRICH'), 'Bf Goodrich');
  assert.equal(titluMarca('ESA TECAR'), 'Esa Tecar');
});

test('modelul: cuvintele se îmblânzesc, codurile rămân', () => {
  /* „WINTERCRAFT WP52" — primul e un cuvânt, al doilea un cod. */
  assert.equal(titluModel('WINTERCRAFT WP52'), 'Wintercraft WP52');
  /* Codurile cu cifre sau scurte nu se ating: sunt nume de produs, nu cuvinte. */
  assert.equal(titluModel('TS-830P'), 'TS-830P');
  assert.equal(titluModel('4S2 H750'), '4S2 H750');
  /* Ce e deja scris normal rămâne normal. */
  assert.equal(titluModel('Dynapro HPX (RA43)'), 'Dynapro HPX (RA43)');
});

test('marca nu se scrie de două ori când modelul lor o repetă', () => {
  assert.equal(titluModel('NEXEN N`BLUE 4SEASON-2', 'NEXEN'), 'N`BLUE 4SEASON-2');
});

test('dimensiunea comercială păstrează C-ul, pentru că el intră în cheie', () => {
  assert.equal(dimensiune({ width: 225, height: 55, diameter: '17', typeC: false }), '225/55 R17');
  assert.equal(dimensiune({ width: 195, height: 70, diameter: '15', typeC: true }), '195/70 R15C');
});

test('dimensiunile agricole („7.00-12") nu se inventează, se refuză', () => {
  /* La ei `height` e 0 pentru ele. Catalogul nostru nu scrie așa ceva. */
  assert.equal(dimensiune({ width: 7, height: 0, diameter: '12', typeC: false }), null);
  const r = normalizeazaRand(rand({ width: 7, height: 0, diameter: '12' }));
  assert.match(r.respins, /dimensiune/);
});

test('indicii se recuperează din șirul de factură când câmpul lor e gol', () => {
  assert.deepEqual(
    indiciDinFactura('225/65R 17 106H TL WP-52 XL EXTRA LOAD KUMHO SOUTH KOREA'),
    { loadIndex: '106', speedIndex: 'H' },
  );
  /* Indicele dublu, de anvelopă de marfă. */
  assert.deepEqual(
    indiciDinFactura('205/75R 16C 113/111R TL Winguard NEXEN CHINA'),
    { loadIndex: '113/111', speedIndex: 'R' },
  );
  /* Un rând real: câmpul `speedIndex` lipsea, dar factura îl avea. */
  const r = normalizeazaRand(rand({ speedIndex: null, loadIndex: 106, invoiceName: '225/65R 17 106H TL WP-52 XL EXTRA LOAD KUMHO SOUTH KOREA' }));
  assert.equal(r.respins, undefined);
  assert.match(r.titleRo, /106H XL$/);
});

test('XL și runflat se citesc DOAR din factură — altundeva nu există', () => {
  assert.match(normalizeazaRand(rand({ invoiceName: '235/60R 18 107V TL Prime-3X XL EXTRA LOAD/(K-125A) HANKOOK' })).titleRo, / XL$/);
  assert.match(normalizeazaRand(rand({ invoiceName: '255/40R 18 99V TL TS-860S+ SSR XL RUN-FLAT/BMW-MODELLE CONTINENTAL' })).titleRo, /XL RunFlat/);
});

test('fără șir de factură nu se presupune non-XL — rândul se refuză', () => {
  /*
   * 829 de rânduri de-ale lor n-au `invoiceName`. Din cele cu, peste jumătate
   * SUNT XL, deci presupunerea „non-XL" ar fi greșită mai des decât corectă, iar
   * o anvelopă XL contopită peste una non-XL e fix potrivirea falsă pe care
   * cheia naturală trebuie s-o împiedice.
   */
  const r = normalizeazaRand(rand({ invoiceName: null }));
  assert.match(r.respins, /XL\/runflat necunoscute/);
});

test('omologarea de fabrică ajunge la coada titlului, de unde o citește parseTitle', () => {
  const r = normalizeazaRand(rand({
    brand: 'CONTINENTAL', model: 'TS-830P', width: 295, height: 35, diameter: '19',
    loadIndex: 104, speedIndex: 'W',
    invoiceName: '295/35R 19 104W TL TS-830P RO1 XL FR AUDI-MODELLE/EXTRA LOAD CONTINENTAL USA',
  }));
  assert.equal(r.titleRo, 'Continental TS-830P 295/35 R19 104W XL RO1');
});

test('titlul se construiește în convenția noastră, nu în a lor', () => {
  assert.equal(
    construiesteTitlu({ marca: 'KUMHO', model: 'WINTERCRAFT WP52', size: '225/65 R17', loadIndex: '106', speedIndex: 'H', xl: true }),
    'Kumho Wintercraft WP52 225/65 R17 106H XL',
  );
});

test('`primeCost` nu iese din modul, în nicio formă', () => {
  /* Prețul lor de achiziție e public în API-ul lor. Nu e al nostru. */
  const r = normalizeazaRand(rand());
  const serializat = JSON.stringify(r);
  assert.ok(!serializat.includes('primeCost'));
  assert.ok(!serializat.includes('1252.24'));
  assert.ok(!serializat.includes('transferLimit'));
});

test('stocul vine din `stock`/`invoiceStock`, nu din `isInStock`', () => {
  /* `isInStock` e `true` pe toate cele 7.260 de rânduri ale lor. */
  assert.equal(normalizeazaRand(rand({ stock: 0, invoiceStock: 0, isInStock: true })).stockStatus, 'out_of_stock');
  assert.equal(normalizeazaRand(rand({ stock: 0, invoiceStock: 4 })).stockStatus, 'supplier');
  assert.equal(normalizeazaRand(rand({ stock: 2, invoiceStock: 0 })).stockStatus, 'supplier');
});

test('galeria se ia în ordinea lor; poza de listă doar când galeria lipsește', () => {
  const g = imagini({
    productImages: [
      { pathToImage: 'https://x/b.jpg', imageIndex: 1 },
      { pathToImage: 'https://x/a.jpg', imageIndex: 0 },
    ],
    profileImage: 'https://y/lista.jpg',
  });
  assert.deepEqual(g.map((i) => i.url), ['https://x/a.jpg', 'https://x/b.jpg']);

  assert.deepEqual(imagini({ productImages: [], profileImage: 'https://y/lista.jpg' }), [{ url: 'https://y/lista.jpg' }]);
  assert.deepEqual(imagini({ productImages: [], profileImage: null }), []);
});

test('dublurile lor se colapsează: stocul bate prețul, prețul bate vechimea', () => {
  const a = normalizeazaRand(rand({ id: 100, price: 2800, stock: 0, invoiceStock: 0 }));
  const b = normalizeazaRand(rand({ id: 200, price: 2950, stock: 0, invoiceStock: 2 }));
  /* b e mai scumpă, dar se poate obține. Un preț bun la ceva ce n-au nu e un preț. */
  assert.deepEqual(alegeDintreDuplicate([a, b]).map((r) => r.id), ['200']);

  const c = normalizeazaRand(rand({ id: 300, price: 3320, stock: 0, invoiceStock: 0 }));
  const d = normalizeazaRand(rand({ id: 400, price: 4348, stock: 0, invoiceStock: 0 }));
  /* Amândouă indisponibile: câștigă cea ieftină. */
  assert.deepEqual(alegeDintreDuplicate([c, d]).map((r) => r.id), ['300']);
});

test('dublurile lor: rândul din depozit bate rândul vechi, mai ieftin, fără depozit', () => {
  /* Kumho WP72 235/40 R19, 25 septembrie 2026: 3.300 pe rândul vechi, 3.360 pe cel real. */
  const vechi = normalizeazaRand(rand({ id: 7941877, price: 3300, stock: 0, invoiceStock: 4 }));
  const nou = normalizeazaRand(rand({ id: 16712165, price: 3360, stock: 4, invoiceStock: 4 }));
  const [ales] = alegeDintreDuplicate([vechi, nou]);
  assert.equal(ales.id, '16712165');
  assert.equal(ales.priceMdl, 3360);
  /* Produsul legat de codul vechi își găsește prețul prin alias. */
  assert.deepEqual(ales.aliasuri, ['7941877']);
});

test('anvelope diferite NU se colapsează, oricât de asemănătoare ar fi', () => {
  /* Același model, aceeași dimensiune, alt indice de viteză: două produse. */
  const h = normalizeazaRand(rand({ id: 1, speedIndex: 'H', price: 1450 }));
  const v = normalizeazaRand(rand({ id: 2, speedIndex: 'V', price: 1800 }));
  assert.equal(alegeDintreDuplicate([h, v]).length, 2);

  /* Aceeași anvelopă, una XL și una nu: tot două produse. */
  const xl = normalizeazaRand(rand({ id: 3, invoiceName: '195/55R 16 87H TL WP-52 XL EXTRA LOAD KUMHO' }));
  const fara = normalizeazaRand(rand({ id: 4 }));
  assert.equal(alegeDintreDuplicate([xl, fara]).length, 2);
});

test('sezonul lor se traduce în cel al catalogului', () => {
  assert.equal(normalizeazaRand(rand({ season: 'WINTER' })).seasonRaw, 'iarna');
  assert.equal(normalizeazaRand(rand({ season: 'SUMMER' })).seasonRaw, 'vara');
  assert.equal(normalizeazaRand(rand({ season: 'ALL SEASONS' })).seasonRaw, 'all season');
});
