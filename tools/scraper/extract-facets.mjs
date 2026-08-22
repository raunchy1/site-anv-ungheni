/**
 * Faza 0.4 — contoarele live din filtrele catalogului (sursa de adevăr pentru validare)
 * + URL-urile canonice ale fiecărui filtru (necesare pentru redirect-uri și SEO).
 * Output: data/raw/facets.json
 */
import fs from 'node:fs/promises';
import { createSession, BASE } from './session.mjs';

const RAW = new URL('../../data/raw/', import.meta.url);

export function extractFacets(html) {
  const c = html.replace(/\s+/g, ' ');
  const start = c.indexOf('id="filter_vier"');
  if (start < 0) return {};
  const filterBlock = c.slice(start, c.indexOf('<!-- / filter_vier', start) + 1 || undefined);
  const groups = {};
  for (const part of filterBlock.split('<div class="block_param">').slice(1)) {
    const items = [];
    for (const m of part.matchAll(/<option value="([^"]+)">\s*([^<(]+?)\s*\((\d+)\)\s*<\/option>/g)) {
      items.push({ label: m[2].trim(), count: Number(m[3]), url: m[1].replace(BASE, '') });
    }
    for (const m of part.matchAll(/href="([^"]+)"[^>]*>\s*<span class="text_param">([^<]*)<\/span>\s*<span class="total_product[^"]*">(\d+)<\/span>/g)) {
      items.push({ label: m[2].trim(), count: Number(m[3]), url: '/' + m[1].replace(BASE + '/', '').replace(/^\//, '') });
    }
    if (!items.length) continue;
    const name = part.match(/<span class="title_p_f">([^<]*)<\/span>/)?.[1]?.trim()
      ?? (part.includes('qnts[') ? 'Disponibilitate' : `grup_${Object.keys(groups).length + 1}`);
    groups[name] = items;
  }
  return groups;
}

if (process.argv[1]?.endsWith('extract-facets.mjs')) {
  const s = createSession();
  await s.warmup();
  const out = {};
  for (const path of ['catalog-anvelope', 'senzori-presiune-anvelope']) {
    const r = await s.get(`${BASE}/${path}`);
    out[path] = extractFacets(r.html);
    console.log(path, Object.entries(out[path]).map(([k, v]) => `${k}:${v.length}`).join('  '));
  }
  await fs.writeFile(new URL('facets.json', RAW), JSON.stringify(out, null, 2));
  const sez = out['catalog-anvelope']?.Sezon ?? [];
  console.log('sezon:', sez.map((x) => `${x.label}=${x.count}`).join(' '));
  console.log('total sezon:', sez.reduce((a, b) => a + b.count, 0));
}
