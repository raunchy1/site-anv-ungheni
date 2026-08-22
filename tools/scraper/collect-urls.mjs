/**
 * Faza 0.1 — colectează toate URL-urile din sitemap-uri și le clasifică.
 * Output: data/raw/urls.json
 */
import fs from 'node:fs/promises';
import * as S from './session.mjs';

const OUT = new URL('../../data/raw/urls.json', import.meta.url);

const locsOf = (xml) => [...xml.matchAll(/<loc>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/loc>/g)].map((m) => m[1].trim());

const SERVICE_SLUGS = [
  'slefuirea-discurilor-de-frana', 'balansarea-rotilor', 'reparatia-anvelopelor',
  'reparatia-discurilor', 'schimbul-rotilor', 'sudura-cu-argon', 'vopsirea-discurilor',
  'hotel-anvelope', 'incarcare-conditionere-auto-cu-freon',
];

await S.warmup();

const index = await S.get(`${S.BASE}/sitemap.xml`, { accept: 'application/xml' });
const subMaps = locsOf(index.html);
console.log(`sitemap index: ${subMaps.length} sub-sitemaps`);

const buckets = { products: [], brands: [], categories: [], services: [], other: [] };
const seen = new Set();

for (const sm of subMaps) {
  const { html } = await S.get(sm, { accept: 'application/xml' });
  const urls = locsOf(html);
  const kind = sm.includes('sitemap-brand') ? 'brands' : sm.includes('sitemap-category') ? 'categories' : 'products';
  for (const u of urls) {
    if (seen.has(u)) continue;
    seen.add(u);
    const slug = u.replace(`${S.BASE}/`, '').replace(/\/$/, '');
    if (kind === 'products' && SERVICE_SLUGS.includes(slug)) buckets.services.push(u);
    else buckets[kind].push(u);
  }
  console.log(`  ${sm.split('/').pop()}: ${urls.length}`);
}

buckets.services.push(`${S.BASE}/servicii`);

const payload = {
  fetched_at: new Date().toISOString(),
  counts: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])),
  ...buckets,
};
await fs.mkdir(new URL('../../data/raw/', import.meta.url), { recursive: true });
await fs.writeFile(OUT, JSON.stringify(payload, null, 2));
console.log('\ncounts:', payload.counts);
