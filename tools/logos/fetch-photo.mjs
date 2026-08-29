/**
 * Descarcă o fotografie de pe Wikimedia Commons, cu tot cu licența ei.
 *
 * Fotografiile de serviciu au aceeași regulă ca logo-urile: sursă verificabilă
 * și licență scrisă lângă fișier. Commons e singura sursă la îndemână unde
 * licența vine în răspuns, nu într-o pagină de termeni pe care trebuie s-o
 * citești separat.
 *
 * Rulare: node tools/logos/fetch-photo.mjs "File:Titlu.jpg" nume-fisier [dir]
 */
import fs from 'node:fs';
import path from 'node:path';

const [title, name, dir = 'public/servicii'] = process.argv.slice(2);
if (!title || !name) { console.error('folosire: fetch-photo.mjs "File:Titlu.jpg" nume [dir]'); process.exit(1); }

const UA = 'anvelope-ungheni-photo-fetch/1.0 (https://anvelope-ungheni.md; cristiermurache@gmail.com)';
const api = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
  format: 'json', action: 'query', titles: title, prop: 'imageinfo',
  iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600',
})}`;

const r = await fetch(api, { headers: { 'user-agent': UA } });
const info = Object.values((await r.json()).query?.pages ?? {})[0]?.imageinfo?.[0];
if (!info) { console.error(`nu există: ${title}`); process.exit(1); }

const meta = info.extmetadata ?? {};
const strip = (s) => (s ? String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '');

fs.mkdirSync(dir, { recursive: true });
const bin = await fetch(info.thumburl ?? info.url, { headers: { 'user-agent': UA } });
fs.writeFileSync(path.join(dir, name), Buffer.from(await bin.arrayBuffer()));

console.log(JSON.stringify({
  fisier: name,
  titlu: title,
  pagina: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
  autor: strip(meta.Artist?.value) || '—',
  licenta: strip(meta.LicenseShortName?.value) || '?',
  latime: info.thumbwidth ?? info.width,
  inaltime: info.thumbheight ?? info.height,
}));
