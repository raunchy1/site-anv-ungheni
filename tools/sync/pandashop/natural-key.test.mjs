/**
 * Teste pe cheia naturală. Aici se decide dacă primul import face 15.010
 * duplicate sau nu, deci fiecare caz de mai jos vine dintr-un titlu real din
 * catalogul lor sau dintr-un rând real din al nostru.
 *
 *   node --test tools/sync/pandashop/*.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeModel, normalizeBrand, naturalKey, extrageOE } from './natural-key.mjs';
import { parseTitle } from './parse-title.mjs';

const BRANDS = ['Centara', 'Ceat', 'Tracmax', 'Rockblade', 'Double Coin', 'Gt Radial', 'Michelin'];

test('modelul curat rămâne neatins', () => {
  assert.equal(normalizeModel('X-privilo TX2', { brand: 'Tracmax' }), 'x privilo tx2');
  assert.equal(normalizeModel('IceCruiser II', { brand: 'Rockblade' }), 'icecruiser ii');
});

test('cifrele din numele modelului NU se taie', () => {
  // Regresie: „Rock 868S" redus la „rock" ar fi confundat două modele diferite.
  assert.equal(normalizeModel('Rock 868S', { brand: 'Rockblade' }), 'rock 868s');
  assert.notEqual(
    normalizeModel('Rock 868S', { brand: 'Rockblade' }),
    normalizeModel('Rock 515', { brand: 'Rockblade' }),
  );
});

test('dimensiunea și indicii lipiți de model se taie', () => {
  assert.equal(normalizeModel('WinterDrive 225/40 R18 92V XL', { brand: 'Ceat' }), 'winterdrive');
  assert.equal(normalizeModel('Commercial 205/65 R16C 107/105R', { brand: 'Centara' }), 'commercial');
});

test('aceeași anvelopă scrisă de ei și de noi dă aceeași cheie', () => {
  const lor = parseTitle('Anvelopa Tracmax X-privilo TX2 165/70 R13 79T', BRANDS);
  const cheiaLor = naturalKey({
    brand: lor.brand, model: lor.model, width: lor.width, aspect: lor.aspect, diameter: lor.diameter,
    loadIndex: lor.loadIndex, speedIndex: lor.speedIndex, isXl: lor.isXl, isRunflat: lor.isRunflat,
  });
  const cheiaNoastra = naturalKey({
    brand: 'TRACMAX', model: 'X-privilo TX2', width: 165, aspect: 70, diameter: 'R13',
    loadIndex: '79', speedIndex: 'T', isXl: false, isRunflat: false,
  });
  assert.equal(cheiaLor, cheiaNoastra);
});

test('omologarea de fabrică se citește din oricare poziție', () => {
  // Cazul real: la noi marcajul e lipit de model, la ei stă după indici.
  assert.equal(extrageOE('Pilot Alpin 5 MO'), 'mo');
  assert.equal(extrageOE('Anvelopa Michelin Pilot Alpin 5 275/35 R19 100V MO'), 'mo');
  assert.equal(extrageOE('Pilot Sport 4 245/40 R18 97Y XL *'), 'star');
  assert.equal(extrageOE('Ventus Evo K137 225/45 R17 94Y XL'), '');
});

test('aceeași anvelopă omologată dă aceeași cheie din ambele părți', () => {
  // Regresie: „Michelin Pilot Alpin 5 275/35 R19 MO" rămânea stinsă la noi, iar
  // „…275/35 R19 100V MO" de la ei ar fi intrat în catalog ca produs nou.
  const lor = parseTitle('Anvelopa Michelin Pilot Alpin 5 275/35 R19 100V MO', BRANDS);
  const cheiaLor = naturalKey({
    brand: lor.brand, model: lor.model, width: lor.width, aspect: lor.aspect, diameter: lor.diameter,
    loadIndex: lor.loadIndex, speedIndex: lor.speedIndex, isXl: lor.isXl, isRunflat: lor.isRunflat, oe: lor.oe,
  });
  const cheiaNoastra = naturalKey({
    brand: 'Michelin', model: 'Pilot Alpin 5 MO', width: 275, aspect: 35, diameter: 'R19',
    loadIndex: '100', speedIndex: 'V', isXl: false, isRunflat: false, oe: extrageOE('Pilot Alpin 5 MO'),
  });
  assert.equal(cheiaLor, cheiaNoastra);
});

test('omologarea NU se aruncă: MO și fără MO rămân produse diferite', () => {
  const baza = { brand: 'Michelin', model: 'Pilot Alpin 5', width: 275, aspect: 35, diameter: 'R19', loadIndex: '100', speedIndex: 'V' };
  assert.notEqual(naturalKey({ ...baza, oe: 'mo' }), naturalKey({ ...baza, oe: '' }));
});

test('XL și runflat separă produse altfel identice', () => {
  const baza = { brand: 'Ceat', model: 'WinterDrive', width: 225, aspect: 40, diameter: 'R18', loadIndex: '92', speedIndex: 'V' };
  assert.notEqual(naturalKey({ ...baza, isXl: true }), naturalKey({ ...baza, isXl: false }));
  assert.notEqual(naturalKey({ ...baza, isRunflat: true }), naturalKey({ ...baza, isRunflat: false }));
});

test('diacriticele și punctuația nu produc chei diferite', () => {
  assert.equal(normalizeBrand('Continental'), normalizeBrand('CONTINENTAL'));
  assert.equal(normalizeModel('Grand Tourer H/T'), normalizeModel('grand tourer h t'));
});

test('brandul din două cuvinte nu se taie în două', () => {
  const t = parseTitle('Anvelopa Double Coin RLB1 315/80 R22.5 157/154L', BRANDS);
  assert.equal(t.brand, 'Double Coin');
  assert.equal(t.model, 'RLB1');
  assert.equal(t.loadIndex, '157/154');
  assert.equal(t.speedIndex, 'L');
});

test('un brand necunoscut rămâne necunoscut, nu se inventează', () => {
  const t = parseTitle('Anvelopa Marcanecunoscuta Ceva 185/65 R15 88H', BRANDS);
  assert.equal(t.brandKnown, false);
  assert.equal(t.brand, null);
});

test('dimensiunea imperială trece prin parserul existent', () => {
  const t = parseTitle('Anvelopa Gt Radial Savero 31x10.50 R15 109S', BRANDS);
  assert.equal(t.size_system, 'imperial');
  assert.equal(t.diameter, 'R15');
});

/* --------------------------------------------------- descoperirea prin sitemap */

test('slug-ul de anvelopă se întoarce într-un titlu parsabil', async () => {
  const { slugToTitle } = await import('./sitemap.mjs');
  const t = slugToTitle('shina-rockblade-rock-868s-205-55-r16-91h-01259984');
  const p = parseTitle(t, BRANDS);
  assert.equal(p.brand, 'Rockblade');
  assert.equal(p.size_raw, '205/55 R16');
  assert.equal(p.loadIndex, '91');
  assert.equal(p.speedIndex, 'H');
});

test('XL din slug ajunge în cheie', async () => {
  const { slugToTitle } = await import('./sitemap.mjs');
  const p = parseTitle(slugToTitle('shina-ceat-sport-drive-225-50-r18-99w-xl-01255621'), BRANDS);
  assert.equal(p.isXl, true);
  assert.equal(p.speedIndex, 'W');
});

test('dimensiunea fără profil nu-și pierde indicii', () => {
  // Regresie prinsă în dry-run: „175 R14C 99R" citea „14C" drept indice.
  const t = parseTitle('Anvelopa Tracmax X-privilo VS450 175 R14C 99R', [...BRANDS, 'Tracmax']);
  assert.equal(t.size_raw, '175 R14C');
  assert.equal(t.loadIndex, '99');
  assert.equal(t.speedIndex, 'R');
});

test('marcajele de flanc lipite de model nu produc chei diferite', () => {
  // „Winter MS FP" din coloana noastră și „Winter" din titlul lor.
  assert.equal(normalizeModel('Winter MS FP', { brand: 'Voyager' }), normalizeModel('Winter', { brand: 'Voyager' }));
  assert.equal(normalizeModel('X-privilo TX3 TL', { brand: 'Tracmax' }), normalizeModel('X-privilo TX3', { brand: 'Tracmax' }));
});
