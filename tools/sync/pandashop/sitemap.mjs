/**
 * Descoperirea prin sitemap — jumătatea de catalog pe care listarea n-o arată.
 *
 * DE CE EXISTĂ FIȘIERUL ĂSTA. Categoria de anvelope listează 8.221 de produse,
 * dar numai pe cele în stoc la ei. Sitemap-ul e împărțit explicit în
 * `products-instock-*` și `products-outofstock-*`, iar al doilea conține anvelope
 * care lipsesc cu totul din listare. Fără pasul ăsta, orice produs de-al nostru
 * care la ei e temporar fără stoc ar apărea drept „dispărut de la ei" și ar fi
 * marcat `delisted` — vreo 8.000 de produse retrogradate din cauza unei
 * descoperiri incomplete.
 *
 * Fișierele sunt mari (~25 MB fiecare, 11 pentru „fără stoc"), așa că NU se pun
 * în cache-ul HTML. Se citesc o dată, se filtrează la zbor, și se păstrează doar
 * URL-urile care arată a anvelopă — câteva sute de KB.
 */
import fs from 'node:fs';
import path from 'node:path';
import { UA } from './http.mjs';

const ORIGIN = 'https://www.pandashop.md';

/** Semnătura de dimensiune din slug: „…-205-55-r16-…" sau „…-31x10-50-r15-…". */
const TYRE_SLUG = /-(\d{2,3})-(\d{2,3})-(r\d{2}(?:-\d)?c?)-/i;

/**
 * Slug -> ceva ce `parseTitle` poate citi.
 * „shina-rockblade-rock-868s-205-55-r16-91h-01259984"
 *   -> „rockblade rock 868s 205/55 R16 91H"
 */
export function slugToTitle(slug) {
  let s = slug.replace(/-\d{6,10}$/, '').replace(/^(shina|anvelopa|a)-/i, '');
  s = s.replace(TYRE_SLUG, (_, w, a, d) => ` ${w}/${a} ${d.toUpperCase().replace('-', '.')} `);
  s = s.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  /* Indicii se scriu cu majuscule, ca în titlurile lor. Deliberat doar la coadă:
     `parseTitle` recunoaște indicele după litera mare, iar dacă am ridica tot
     șirul, „868s" din numele modelului ar deveni „868S" și ar fi citit ca indice. */
  return s.replace(/(\s\d{2,3}(?:\/\d{2,3})?)([a-z]{1,2})(?=\s|$)/g, (m, n, l) => `${n}${l.toUpperCase()}`);
}

async function indexFiles(kind, lang) {
  const res = await fetch(`${ORIGIN}/sitemaps/products-${kind}-index-${lang}.xml`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`sitemap index ${kind}: HTTP ${res.status}`);
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

/**
 * Toate URL-urile de produs care arată a anvelopă, dintr-un fel de sitemap.
 * Rezultatul se pune într-un fișier mic și se refolosește; `--refresh` îl reface.
 */
export async function tyreUrls({ kind = 'outofstock', lang = 'ro', stateDir = 'data/sync', refresh = false, onFile } = {}) {
  const out = path.join(stateDir, `sitemap-${kind}-${lang}.json`);
  if (!refresh && fs.existsSync(out)) return JSON.parse(fs.readFileSync(out, 'utf8'));

  fs.mkdirSync(stateDir, { recursive: true });
  const files = await indexFiles(kind, lang);
  const urls = [];
  for (const [i, f] of files.entries()) {
    const res = await fetch(f, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`);
    const xml = await res.text();          // se citește o dată și se aruncă
    for (const m of xml.matchAll(/<loc>([^<]*\/product\/([^<\/]+)\/)<\/loc>/g)) {
      if (TYRE_SLUG.test(`-${m[2]}-`)) urls.push({ url: m[1], slug: m[2] });
    }
    onFile?.(i + 1, files.length, urls.length);
  }
  fs.writeFileSync(out, JSON.stringify(urls));
  return urls;
}
