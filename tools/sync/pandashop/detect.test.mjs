/**
 * Teste pe detector, cu o sursă fabricată. Fără rețea, fără bază.
 *
 *   node --test tools/sync/pandashop/*.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { detecteaza } from './detect.mjs';

/** Sursă falsă: `pagini` e o listă de liste de ID-uri. */
function sursaFalsa(pagini) {
  return {
    async *listProducts({ onPage } = {}) {
      for (const [i, ids] of pagini.entries()) {
        const refs = ids.map((id) => ({ id, url: `/ro/product/x-${id}/`, card: { title: `Anvelopa Test ${id}`, price: 1000 } }));
        if (onPage?.(i + 1, refs, { total: pagini.flat().length }) === 'stop') return;
        for (const r of refs) yield r;
      }
    },
  };
}

test('imediat după fotografia inițială nu se detectează nimic', async () => {
  const ids = ['00170643', '01129684', '105f6fc6-c8f0-11e4-9153-d43d7ef8efab'];
  const { noi } = await detecteaza({ cunoscute: new Set(ids), source: sursaFalsa([ids]), full: true });
  assert.equal(noi.length, 0);
});

test('un ID necunoscut e detectat', async () => {
  const { noi } = await detecteaza({
    cunoscute: new Set(['00170643']),
    source: sursaFalsa([['00170643', '09999999']]),
    full: true,
  });
  assert.deepEqual(noi.map((r) => r.id), ['09999999']);
});

test('zerourile din față contează: „00170643" nu e „170643"', async () => {
  const { noi } = await detecteaza({
    cunoscute: new Set(['170643']),
    source: sursaFalsa([['00170643']]),
    full: true,
  });
  assert.deepEqual(noi.map((r) => r.id), ['00170643'], 'ID-ul trebuie tratat ca text, nu ca număr');
});

test('UUID-urile trec la fel ca ID-urile numerice', async () => {
  const u = '105f6fc6-c8f0-11e4-9153-d43d7ef8efab';
  const { noi } = await detecteaza({ cunoscute: new Set(), source: sursaFalsa([[u]]), full: true });
  assert.deepEqual(noi.map((r) => r.id), [u]);
});

test('rularea rapidă se oprește după 2 pagini fără nimic nou', async () => {
  const cunoscute = new Set(['a1', 'a2', 'b1', 'b2', 'c1', 'c2']);
  const { noi, pagini } = await detecteaza({
    cunoscute,
    source: sursaFalsa([['a1', 'a2'], ['b1', 'b2'], ['c1', 'c2'], ['nou1']]),
    full: false,
  });
  assert.equal(pagini, 2, 'trebuie să se oprească înainte de pagina a patra');
  assert.equal(noi.length, 0);
});

test('enumerarea completă nu se oprește devreme și prinde produsul din coadă', async () => {
  const cunoscute = new Set(['a1', 'a2', 'b1', 'b2', 'c1', 'c2']);
  const { noi } = await detecteaza({
    cunoscute,
    source: sursaFalsa([['a1', 'a2'], ['b1', 'b2'], ['c1', 'c2'], ['nou1']]),
    full: true,
  });
  assert.deepEqual(noi.map((r) => r.id), ['nou1']);
});

test('a doua rulare nu mai vede nimic (idempotență)', async () => {
  const cunoscute = new Set(['a1']);
  const pagini = [['a1', 'a2']];
  const prima = await detecteaza({ cunoscute, source: sursaFalsa(pagini), full: true });
  assert.equal(prima.noi.length, 1);
  for (const r of prima.noi) cunoscute.add(r.id);          // ce ar face importul
  const doua = await detecteaza({ cunoscute, source: sursaFalsa(pagini), full: true });
  assert.equal(doua.noi.length, 0);
});

/* ------------------------------------------------------- întrerupătorul */

import { config } from './config.mjs';

test('pragurile întrerupătorului stau în configurare, nu în cod', () => {
  assert.equal(typeof config.breakers.maxNewPerRun, 'number');
  assert.equal(typeof config.breakers.maxQuarantineShare, 'number');
  assert.equal(typeof config.breakers.maxParseFailureRate, 'number');
  assert.ok(config.breakers.maxNewPerRun > 0);
});

test('peste pragul de produse noi, rularea se oprește', async () => {
  const prag = config.breakers.maxNewPerRun;
  const ids = Array.from({ length: prag + 1 }, (_, i) => `nou-${i}`);
  const { noi } = await detecteaza({ cunoscute: new Set(), source: sursaFalsa([ids]), full: true });
  assert.ok(noi.length > prag, `${noi.length} trebuie să depășească pragul de ${prag}`);
  /* Verificarea pragului trăiește în `import.mjs`; aici se demonstrează că
     detectorul chiar produce numărul care o declanșează. */
});

test('o enumerare goală e tratată ca structură schimbată, nu ca „nimic nou"', async () => {
  const { SourceStructureChanged } = await import('./source.mjs');
  const sursaGoala = {
    async *listProducts() { throw new SourceStructureChanged('prima pagină de listare n-a dat niciun produs'); },
  };
  await assert.rejects(
    () => detecteaza({ cunoscute: new Set(['a']), source: sursaGoala, full: true }),
    /structur|niciun produs/i,
  );
});

/* ------------------------------------------------------------- lacătul */

test('a doua rulare simultană nu pornește: lacătul e ocupat', async () => {
  /* Se testează contractul, cu un lacăt fals — funcția reală stă în bază
     (migrarea 0016) și e verificată acolo. Ce contează aici e că `ruleaza` NU se
     apelează a doua oară cât timp prima e în curs. */
  let ocupat = false;
  let porniri = 0;
  const iaLacatul = async () => (ocupat ? false : (ocupat = true));
  const elibereaza = async () => { ocupat = false; };
  const cuLacat = async (fn) => {
    if (!(await iaLacatul())) return { oprit: 'lacat_ocupat' };
    try { porniri++; return await fn(); } finally { await elibereaza(); }
  };

  const lenta = () => new Promise((r) => setTimeout(() => r({ ok: true }), 40));
  const [a, b] = await Promise.all([cuLacat(lenta), cuLacat(lenta)]);
  assert.equal(porniri, 1, 'o singură rulare trebuie să pornească');
  assert.ok(a.oprit === 'lacat_ocupat' || b.oprit === 'lacat_ocupat');

  /* După ce prima termină, lacătul se eliberează și următoarea poate porni. */
  const c = await cuLacat(lenta);
  assert.equal(c.ok, true);
  assert.equal(porniri, 2);
});

test('lacătul se eliberează și când rularea aruncă', async () => {
  let ocupat = false;
  const cuLacat = async (fn) => {
    if (ocupat) return { oprit: 'lacat_ocupat' };
    ocupat = true;
    try { return await fn(); } finally { ocupat = false; }
  };
  await assert.rejects(() => cuLacat(async () => { throw new Error('întrerupător'); }), /întrerupător/);
  assert.equal(ocupat, false, 'un eșec nu trebuie să lase sistemul blocat');
});
