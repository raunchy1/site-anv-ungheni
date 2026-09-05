/**
 * Teste pentru parserul de dimensiuni — cea mai fragilă bucată de logică din proiect.
 * Trei ramuri (metric cu profil, metric fără profil, imperial) și un fallback pe titlu.
 * De corectitudinea lor depinde dacă 15.010 produse pot fi găsite de clienți.
 *
 * Rulare: node --test tools/parse/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSize, normalizeSeason } from '../scraper/parse-product.mjs';

/** @param {string} raw @param {object} expected */
const check = (raw, expected) => {
  const got = parseSize(raw);
  for (const [k, v] of Object.entries(expected)) {
    assert.equal(got[k], v, `parseSize(${JSON.stringify(raw)}).${k}: așteptat ${JSON.stringify(v)}, obținut ${JSON.stringify(got[k])}`);
  }
};

test('metric — forma canonică', () => {
  check('205/55 R16', { size_system: 'metric', width: 205, aspect: 55, diameter: 'R16', size_raw: '205/55 R16' });
  check('245/40 R20', { size_system: 'metric', width: 245, aspect: 40, diameter: 'R20' });
  check('135/80 R13', { size_system: 'metric', width: 135, aspect: 80, diameter: 'R13' });
  check('325/30 R21', { size_system: 'metric', width: 325, aspect: 30, diameter: 'R21' });
});

test('metric — fără spațiu înainte de R', () => {
  check('205/55R16', { size_system: 'metric', width: 205, aspect: 55, diameter: 'R16' });
  check('225/45R17', { width: 225, aspect: 45, diameter: 'R17' });
});

test('metric — cu indici de sarcină și viteză în coadă', () => {
  check('205/55 R16 91V', { width: 205, aspect: 55, diameter: 'R16', size_raw: '205/55 R16' });
  check('205/55 R16 91V XL', { width: 205, aspect: 55, diameter: 'R16' });
  check('245/40 R20 99Y XL FR', { width: 245, aspect: 40, diameter: 'R20' });
  check('195/75 R16C 107/105R', { width: 195, aspect: 75, diameter: 'R16C' });
});

test('metric — ZR în loc de R', () => {
  check('255/35 ZR19', { size_system: 'metric', width: 255, aspect: 35, diameter: 'R19' });
  check('285/30ZR20 99Y', { width: 285, aspect: 30, diameter: 'R20' });
});

test('anvelope comerciale — sufixul C se păstrează', () => {
  for (const [raw, dia] of [['195/70 R15C', 'R15C'], ['215/65 R16C', 'R16C'], ['225/70 R17C', 'R17C'],
    ['145/80 R13C', 'R13C'], ['175/65 R14C', 'R14C'], ['155/80 R12C', 'R12C']]) {
    check(raw, { diameter: dia, size_system: 'metric' });
  }
});

test('metric fără profil — forma veche „185 R14"', () => {
  check('185 R14', { size_system: 'metric', width: 185, aspect: null, diameter: 'R14', size_raw: '185 R14' });
  check('195 R14C', { size_system: 'metric', width: 195, aspect: null, diameter: 'R14C' });
  check('155 R12', { width: 155, aspect: null, diameter: 'R12' });
  check('225 R17', { width: 225, aspect: null, diameter: 'R17' });
});

test('imperial — separator x', () => {
  check('31x10.50 R15', { size_system: 'imperial', width: null, aspect: null, diameter: 'R15',
    overall_diameter_in: 31, section_width_in: 10.5, size_raw: '31x10.50 R15' });
  check('33x12.50 R15 108Q', { size_system: 'imperial', overall_diameter_in: 33, section_width_in: 12.5, diameter: 'R15' });
  check('35x12.50 R15 113Q 6PR', { size_system: 'imperial', overall_diameter_in: 35, diameter: 'R15' });
});

test('imperial — majuscule, sufix LT, fără spații', () => {
  check('33X12.50 R15LT', { size_system: 'imperial', overall_diameter_in: 33, section_width_in: 12.5, diameter: 'R15' });
  check('31X10.50 R15LT 109Q', { size_system: 'imperial', overall_diameter_in: 31, diameter: 'R15' });
  check('30x9.50R15 104Q', { size_system: 'imperial', overall_diameter_in: 30, section_width_in: 9.5, diameter: 'R15' });
  check('30x9.50R 15LT 104S', { size_system: 'imperial', overall_diameter_in: 30, diameter: 'R15' });
});

test('imperial — separator /, o singură zecimală, lipit de model', () => {
  check('31/10.50 R15 109Q 6PR', { size_system: 'imperial', overall_diameter_in: 31, section_width_in: 10.5 });
  check('35x12.5 R15 113Q', { size_system: 'imperial', overall_diameter_in: 35, section_width_in: 12.5 });
  // fără spațiu între numele modelului și dimensiune — nicio graniță de cuvânt
  check('Grenlander DRAK M/T33X12.50 R15LT 108Q', { size_system: 'imperial', overall_diameter_in: 33, diameter: 'R15' });
});

test('imperial — janta poate fi urmată direct de indicele de sarcină', () => {
  check('35x10.50 R16119L', { size_system: 'imperial', overall_diameter_in: 35, section_width_in: 10.5, diameter: 'R16' });
});

test('metricul nu e confundat cu imperialul', () => {
  // „205" nu trebuie citit ca „20" × „5"
  check('205/55 R16', { size_system: 'metric' });
  check('195/75 R16C 107/105R', { size_system: 'metric' });
  check('225/45 R17 94Y', { size_system: 'metric' });
});

test('fallback pe titlu — dimensiunea e mereu în titlu', () => {
  check('Michelin Pilot Sport 4 225/45 R17 94Y XL', { size_system: 'metric', width: 225, aspect: 45, diameter: 'R17' });
  check('BFGoodrich All Terrain T/A KO2 32X12.50 R15 108R', { size_system: 'imperial', overall_diameter_in: 32 });
  check("Nexen N'blue 4Season 2 255/50 R20 109W XL", { width: 255, aspect: 50, diameter: 'R20' });
  check('Uniroyal RainSport 5 245/40 R20 98Y XL', { width: 245, aspect: 40, diameter: 'R20' });
});

test('fără dimensiune — nu aruncă, întoarce câmpuri nule', () => {
  for (const raw of [
    'Senzor universal de presiune anvelope programabil Foxwell T10 (supapa cauciuc)',
    'R15', 'R16', '', '   ', 'gunoi', '12345', 'Michelin', '???', 'null', 'undefined',
  ]) {
    const got = parseSize(raw);
    assert.equal(got.size_system, null, `„${raw}" nu ar trebui să aibă sistem de dimensionare`);
    assert.equal(got.width, null);
    assert.equal(got.diameter, null);
  }
});

test('intrări nule nu aruncă', () => {
  for (const raw of [null, undefined, 0, false]) {
    const got = parseSize(raw);
    assert.equal(got.width, null);
    assert.equal(got.size_raw, null);
  }
});

test('size_raw nu copiază titlul când nu găsește dimensiune', () => {
  // altfel am pune titlul întreg într-un câmp de dimensiune și am induce în eroare
  assert.equal(parseSize('Senzor universal Foxwell T10 (supapa metalica)').size_raw, null);
  assert.equal(parseSize('R15').size_raw, null);
});

test('virgula zecimală e acceptată ca punct', () => {
  check('31x10,50 R15', { size_system: 'imperial', section_width_in: 10.5 });
});

test('normalizarea sezonului, RO și RU', () => {
  for (const [raw, expected] of [
    ['Vara', 'vara'], ['vara', 'vara'], ['Лето', 'vara'], ['Летние', 'vara'],
    ['Iarna', 'iarna'], ['Зима', 'iarna'], ['Зимние', 'iarna'],
    ['All season', 'all_season'], ['all-season', 'all_season'], ['Всесезонные', 'all_season'],
    ['', null], [null, null], ['ceva', null],
  ]) {
    assert.equal(normalizeSeason(raw), expected, `normalizeSeason(${JSON.stringify(raw)})`);
  }
});

const pick = (r) => ({ w: r.width, a: r.aspect, d: r.diameter });

test('indicele de viteză lipit de profil nu ascunde dimensiunea', () => {
  // „205/50Z R17" — Z-ul stă între profil și R. Fără el, 3 anvelope Laufenn
  // rămâneau fără dimensiune și nepotrivite cu sursa.
  assert.deepEqual(pick(parseSize('Laufenn LK01 S Fit EQ 205/50Z R17 93W XL')), { w: 205, a: 50, d: 'R17' });
  assert.deepEqual(pick(parseSize('Laufenn LH01 S Fit A/S 245/50Z R18 100W')), { w: 245, a: 50, d: 'R18' });
});

test('bara fără profil, la anvelopele de marfă', () => {
  // „185/R14C" — bară deși nu urmează niciun număr. Petlas și Nereus scriu așa.
  assert.deepEqual(pick(parseSize('Petlas Power PT825 185/R14C 102/100R')), { w: 185, a: null, d: 'R14C' });
  assert.deepEqual(pick(parseSize('Nereus NS913 195/R14C 106/104Q')), { w: 195, a: null, d: 'R14C' });
});

test('literele chirilice din dimensiune nu opresc parsarea', () => {
  // С rusesc (U+0421) în loc de C latin, într-o dimensiune de marfă.
  assert.deepEqual(pick(parseSize('Anvelopa Ceva 195/70 R15\u0421 104/102R')), { w: 195, a: 70, d: 'R15C' });
});
