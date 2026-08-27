/**
 * Descarcă un fișier anume de pe Commons pentru o marcă anume, când alegerea
 * automată a greșit. Titlul se dă exact, așa cum apare pe Commons.
 *
 * Rulare: node tools/logos/fetch-one.mjs <slug> "File:Titlu exact.svg"
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [slug, title] = process.argv.slice(2);
if (!slug || !title) { console.error('folosire: fetch-one.mjs <slug> "File:Titlu.svg"'); process.exit(1); }

const SRC = fileURLToPath(new URL('../../logos-sursa/', import.meta.url));
const UA = 'anvelope-ungheni-logo-fetch/1.0 (https://anvelope-ungheni.md; cristiermurache@gmail.com)';

const r = await fetch(`https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
  format: 'json', action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata',
})}`, { headers: { 'user-agent': UA } });
const info = Object.values((await r.json()).query?.pages ?? {})[0]?.imageinfo?.[0];
if (!info) { console.error(`nu există: ${title}`); process.exit(1); }

const ext = title.toLowerCase().split('.').pop();
const file = `${slug}.${ext}`;
const bin = await fetch(info.url, { headers: { 'user-agent': UA } });
fs.writeFileSync(path.join(SRC, file), Buffer.from(await bin.arrayBuffer()));

const mPath = path.join(SRC, 'manifest.json');
const m = JSON.parse(fs.readFileSync(mPath, 'utf8'));
m[slug] = {
  ...(m[slug] ?? {}), file, sursa: 'Wikimedia Commons', titlu: title,
  pagina: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
  url: info.url, mime: info.mime, latime: info.width, inaltime: info.height,
  licenta: info.extmetadata?.LicenseShortName?.value ?? null,
  verificat: 'ales manual, după verificarea paginii de pe Commons',
};
delete m[slug].suspect; delete m[slug].respins;
fs.writeFileSync(mPath, JSON.stringify(m, null, 1));
console.log(`✓ ${slug} <- ${title} (${info.width}×${info.height}, ${info.extmetadata?.LicenseShortName?.value ?? '?'})`);
