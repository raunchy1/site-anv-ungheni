/**
 * Faza 0.3 — pagini non-produs: servicii, branduri, categorii, contact, homepage.
 * RO + RU, cu HTML integral păstrat (nu rescriem conținutul migrat).
 * Output: data/raw/pages.json, data/raw/facets.json
 */
import fs from 'node:fs/promises';
import { createSession, BASE } from './session.mjs';
import { parseInfoPage } from './parse-product.mjs';

const RAW = new URL('../../data/raw/', import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { services, brands, categories } = JSON.parse(await fs.readFile(new URL('urls.json', RAW), 'utf8'));

const ro = createSession(); await ro.warmup();
const ru = createSession(); await ru.warmup('ru-ru');

/** Contoarele live din filtrele catalogului — sursa de adevăr pentru validare. */
function extractFacets(html) {
  const c = html.replace(/\s+/g, ' ');
  const groups = {};
  for (const g of c.matchAll(/<div id="attrb_(\d+)"[^>]*>\s*<div class="name_title[^"]*"><span class="title_p_f">([^<]*)<\/span>/g)) {
    groups[g[2].trim()] = {};
  }
  const flat = {};
  for (const m of c.matchAll(/<span class="text_param">([^<]*)<\/span>\s*<span class="total_product[^"]*">(\d+)<\/span>/g)) {
    flat[m[1].trim()] = Number(m[2]);
  }
  return { groups: Object.keys(groups), counts: flat };
}

async function fetchPair(path) {
  const roRes = await ro.get(`${BASE}/${path}`.replace(/([^:])\/\//g, '$1/'));
  await sleep(300);
  const ruPath = path.startsWith('index.php') ? path : `ru/${path}`;
  const ruRes = await ru.get(`${BASE}/${ruPath}`.replace(/([^:])\/\//g, '$1/'));
  await sleep(300);
  return {
    ro: roRes.status === 200 ? parseInfoPage(roRes.html, roRes.url) : { status: roRes.status },
    ru: ruRes.status === 200 ? parseInfoPage(ruRes.html, ruRes.url) : { status: ruRes.status },
    _roHtml: roRes.html,
  };
}

const out = { fetched_at: new Date().toISOString(), services: {}, brands: {}, categories: {}, info: {}, home: null };

for (const u of services) {
  const slug = u.replace(`${BASE}/`, '');
  const p = await fetchPair(slug);
  delete p._roHtml;
  out.services[slug] = p;
  console.log('serviciu', slug, p.ro.title ?? p.ro.status, '/', p.ru.title ?? p.ru.status);
}

for (const u of categories) {
  const slug = u.replace(`${BASE}/`, '');
  const p = await fetchPair(slug);
  out.categories[slug] = { ro: p.ro, ru: p.ru, facets: extractFacets(p._roHtml) };
  console.log('categorie', slug, Object.keys(out.categories[slug].facets.counts).length, 'contoare');
}

let n = 0;
for (const u of brands) {
  const slug = u.replace(`${BASE}/`, '');
  const p = await fetchPair(slug);
  delete p._roHtml;
  out.brands[slug] = p;
  if (++n % 20 === 0) console.log(`branduri ${n}/${brands.length}`);
}

const contact = await fetchPair('index.php?route=information/contact');
delete contact._roHtml;
out.info.contact = contact;

const home = await fetchPair('');
delete home._roHtml;
out.home = home;

await fs.writeFile(new URL('pages.json', RAW), JSON.stringify(out, null, 2));
await fs.writeFile(new URL('facets.json', RAW), JSON.stringify(
  Object.fromEntries(Object.entries(out.categories).map(([k, v]) => [k, v.facets])), null, 2));
console.log('\nsalvat data/raw/pages.json + facets.json');
