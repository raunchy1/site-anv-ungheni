/** Facetele din catalogul RU (/ru/katalog-shin) — slug-urile de filtru pot diferi de RO. */
import fs from 'node:fs/promises';
import { createSession, BASE } from './session.mjs';
import { extractFacets } from './extract-facets.mjs';

const RAW = new URL('../../data/raw/', import.meta.url);
const ru = createSession();
await ru.warmup('ru-ru');

const out = {};
for (const p of ['ru/katalog-shin', 'ru/datchiki-davleniya-v-shinah']) {
  const r = await ru.get(`${BASE}/${p}`);
  out[p] = extractFacets(r.html);
  console.log(p, r.status, Object.entries(out[p]).map(([k, v]) => `${k}:${v.length}`).join(' '));
  for (const [g, items] of Object.entries(out[p])) console.log(`  ${g}: ${items.slice(0, 3).map((x) => `${x.label}=${x.count}@${x.url}`).join('  ')}`);
}
const cur = JSON.parse(await fs.readFile(new URL('facets.json', RAW), 'utf8'));
await fs.writeFile(new URL('facets.json', RAW), JSON.stringify({ ...cur, ...out }, null, 2));
console.log('facets.json actualizat cu facetele RU');
