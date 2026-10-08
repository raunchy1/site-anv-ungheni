import { test } from 'node:test';
import assert from 'node:assert/strict';
import { produsDin, parseListare, dimensiuneDin, modelDinAplicatie } from './source.mjs';
import { formaModel, potrivireTolerantă, indexTolerant } from './import.mjs';

/* Rânduri reale din listarea lor, 8 octombrie 2026, cu atributele reduse la ce contează. */
const attr = (slug, valoare, vSlug = 0) => ({ slug, name: '', values: [{ name: valoare, slug: vSlug }] });
const rand = (o) => ({
  id: 1, slug: 'X', price: 1429, availability: 'in-stock', images: ['/img/br/joy/2/1/wc/21560r17rx808.jpg'],
  brand: { name: 'JOYROAD' }, attributes: [], ...o,
});

test('titlul se reconstruiește din application, cu modelul cum îl scriem noi', () => {
  const p = produsDin(rand({
    name: 'JOY-215/60R17 RX808', sku: '215/60R17 RX808', application: '215/60R17 96H WINTER RX808 зима',
    attributes: [attr(15, 'Iarna', 20), attr(31, '215'), attr(32, '60'), attr(33, '17'), attr(27, 'H ( 210 Km/h )')],
  }));
  assert.equal(p.titleRo, 'Joyroad Winter RX808 215/60 R17 96H');
  assert.equal(p.seasonRaw, 'iarna');
  assert.equal(p.stockStatus, 'supplier');
  assert.equal(p.images[0].url, 'https://autodoctor.md/img/br/joy/2/1/wd/21560r17rx808.jpg');
});

test('indici lipiți de XL și T chirilic', () => {
  const a = produsDin(rand({ name: 'JOY-215/55R17 RX808', sku: '215/55R17 RX808', application: '215/55R17  98XLV  WINTER RX808  зима' }));
  assert.equal(a.loadIndex, '98');
  assert.equal(a.speedIndex, 'V');
  assert.equal(a.isXl, true);
  const b = produsDin(rand({ name: 'JOY-185/70R14', sku: '185/70R14', application: '185/70R14 88Т WINTER RX821 зима (защита диска)' }));
  assert.equal(b.titleRo, 'Joyroad Winter RX821 185/70 R14 88T');
});

test('marfă fără înălțime: „185R14C" devine „185 R14C"', () => {
  const d = dimensiuneDin(rand({ sku: '185R14C RX828', application: '185R14C 102/100Q RX828 зима', attributes: [attr(31, '185'), attr(33, '14С')] }));
  assert.equal(d.size, '185 R14C');
});

test('zgomotul de fabrică nu intră în model', () => {
  assert.equal(modelDinAplicatie('205/50R15 COMFORT PEAK 86V CW (HB) ECE-S PCI DCH лето 2026', 'CROSSWIND'), 'COMFORT PEAK');
  assert.equal(modelDinAplicatie('225/55R16 WINTER TYRE RW505 99V XLзима', 'HABILEAD'), 'RW505');
  assert.equal(modelDinAplicatie('215/55ZR17  98W AN 606 ( VANTAGE XU1 ) лето', 'ANNAITE'), 'AN606');
  /* „NOVA-" seamănă cu prefixul lor intern („GY-", „JOY-"), dar e parte din nume. */
  assert.equal(modelDinAplicatie('205/50R17 NOVA-FORCE HP100 93V XL LA (HB) ECE-S PCI P-trial лето', 'LEAO'), 'NOVA-FORCE HP100');
});

test('pagina fără stare (coaja aplicației) e null, nu o listă goală', () => {
  assert.equal(parseListare('<html><app-root></app-root></html>'), null);
});

test('forma comună a modelului prinde prescurtările și ordinea', () => {
  assert.equal(formaModel('UG PERF +').lipit, formaModel('UltraGrip Performance+').lipit);
  assert.equal(formaModel('ARCTIC S-8').lipit, formaModel('Arctic S8').lipit);
  assert.equal(formaModel('SUV RX706').sortat, formaModel('RX706 SUV').sortat);
  assert.notEqual(formaModel('Quatrac Pro').lipit, formaModel('Quatrac Pro+').lipit);
});

test('potrivirea tolerantă refuză indici diferiți și candidați dubli', () => {
  const noi = [
    { id: 1, category: 'anvelope', brand_name: 'Joyroad', model: 'RX706 SUV', width: 235, aspect: 65, diameter: 'R17', load_index: '104', speed_index: 'T' },
    { id: 2, category: 'anvelope', brand_name: 'Joyroad', model: 'RX706 SUV', width: 235, aspect: 65, diameter: 'R17', load_index: '108', speed_index: 'T' },
  ];
  const idx = indexTolerant(noi);
  const lor = { brandRaw: 'JOYROAD', modelRaw: 'SUV RX706', width: 235, aspect: 65, diameter: '17', typeC: false, loadIndex: '104', speedIndex: 'T' };
  assert.equal(potrivireTolerantă(lor, idx)?.id, 1);
  assert.equal(potrivireTolerantă({ ...lor, loadIndex: '110' }, idx), null);
  assert.equal(potrivireTolerantă({ ...lor, loadIndex: null }, idx), null);
});
