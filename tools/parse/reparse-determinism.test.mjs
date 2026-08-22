/**
 * C.5 — reparsarea din cache trebuie să fie deterministă.
 * Am reparsat catalogul de șapte ori într-o singură noapte; nimic nu garanta
 * până acum că a opta oară produce aceleași date ca a șaptea.
 *
 * Rulează pe un eșantion de 300 de pagini din cache, de două ori, și compară
 * hash-ul rezultatului. Rularea completă pe 15.010 e prea lentă pentru CI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { parseProduct } from '../scraper/parse-product.mjs';

const CACHE = path.join(process.cwd(), 'data/raw/html-cache');

function sample(n) {
  if (!fs.existsSync(CACHE)) return [];
  const out = [];
  for (const d of fs.readdirSync(CACHE).sort()) {
    const dir = path.join(CACHE, d);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).sort()) {
      if (f.endsWith('.ro.html.gz')) out.push(path.join(dir, f));
      if (out.length >= n) return out;
    }
  }
  return out;
}

const pass = (files) => {
  const h = crypto.createHash('sha256');
  for (const f of files) {
    const html = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8');
    // `reparsed_at` e singurul câmp variabil în timp; nu intră în hash.
    h.update(JSON.stringify(parseProduct(html, f)));
  }
  return h.digest('hex');
};

test('două reparsări consecutive produc date identice', { skip: !fs.existsSync(CACHE) && 'cache-ul HTML lipsește' }, () => {
  const files = sample(300);
  assert.ok(files.length > 0, 'cache-ul nu conține pagini');
  assert.equal(pass(files), pass(files), 'reparsarea nu e deterministă');
});

test('parserul nu aruncă pe nicio pagină din eșantion', { skip: !fs.existsSync(CACHE) && 'cache-ul HTML lipsește' }, () => {
  for (const f of sample(300)) {
    const html = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8');
    const p = parseProduct(html, f);
    assert.ok(p.title, `fără titlu: ${f}`);
    assert.ok(p.product_id, `fără product_id: ${f}`);
  }
});
