/**
 * Planșa de CANDIDAȚI: tot ce a strâns `probe-official.mjs`, grupat pe marcă,
 * fiecare fișier pe fundal alb și pe fundal închis, cu domeniul de unde vine.
 *
 * Aici se decide, cu ochiul: care fișier e logo-ul mărcii, care e logo-ul
 * distribuitorului care găzduiește pagina, care e o iconiță de meniu și care e
 * altă firmă cu același nume. Nimic nu se promovează automat — de aceea planșa
 * arată și domeniul: `tracmaxtyres.com` care redirectează la `interpneu.de` nu e
 * sursă oficială, oricât de bine ar arăta fișierul.
 *
 * Rulare: node tools/logos/build-candidate-sheet.mjs
 * Rezultat: tools/logos/candidate-sheet.html
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SRC = path.join(ROOT, 'logos-candidate');
const OUT = path.join(ROOT, 'tools/logos/candidate-sheet.html');

const report = JSON.parse(fs.readFileSync(path.join(SRC, 'candidati.json'), 'utf8'));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function dataUri(slug, file) {
  const ext = path.extname(file).toLowerCase();
  const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg';
  const p = path.join(SRC, slug, file);
  if (!fs.existsSync(p)) return null;
  const b = fs.readFileSync(p);
  if (b.length > 900_000) return null;               // fișierele uriașe nu intră inline
  return `data:${mime};base64,${b.toString('base64')}`;
}

const brands = Object.entries(report)
  .filter(([, r]) => r.gasit && r.candidati?.length)
  .sort((a, b) => (b[1].produse ?? 0) - (a[1].produse ?? 0));

const blocks = brands.map(([slug, r]) => {
  const host = (() => { try { return new URL(r.site).host; } catch { return r.site; } })();
  const cards = r.candidati.map((c) => {
    const uri = dataUri(slug, c.file);
    const media = uri
      ? `<div class="pair"><div class="plate light"><img src="${uri}" alt=""></div><div class="plate dark"><img src="${uri}" alt=""></div></div>`
      : `<div class="pair"><div class="plate none">prea mare pentru planșă</div></div>`;
    return `<figure class="cand">
      ${media}
      <figcaption><b>${esc(slug)}/${esc(c.file)}</b><span>${esc(c.why)}${c.bytes ? ` · ${Math.round(c.bytes / 1024)} kB` : ''}</span></figcaption>
    </figure>`;
  }).join('');

  return `<section class="brand">
    <h2>${esc(r.marca)} <span class="n">${r.produse} produse</span> <a href="${esc(r.site)}" target="_blank" rel="noopener">${esc(host)}</a></h2>
    <div class="row">${cards}</div>
  </section>`;
}).join('\n');

const fara = Object.entries(report).filter(([, r]) => !r.gasit);

const html = `<!doctype html>
<html lang="ro"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Candidați de logo — de verificat</title>
<style>
  :root { color-scheme: light; font-family: ui-sans-serif, system-ui, sans-serif; }
  body { margin: 0; padding: 24px; background: #FAF8F5; color: #1C1B19; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .lead { font-size: 14px; color: #494640; margin: 0 0 24px; }
  .brand { margin-bottom: 22px; padding-bottom: 14px; border-bottom: 1px solid #E6E2DB; }
  h2 { font-size: 15px; margin: 0 0 10px; display: flex; gap: 10px; align-items: baseline; }
  h2 .n { font-weight: 400; color: #6C6862; font-variant-numeric: tabular-nums; }
  h2 a { margin-left: auto; font-size: 12px; color: #9B968C; }
  .row { display: flex; flex-wrap: wrap; gap: 12px; }
  .cand { margin: 0; border: 1px solid #E6E2DB; border-radius: 5px; overflow: hidden; background: #fff; width: 260px; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; }
  .plate { display: flex; align-items: center; justify-content: center; height: 84px; padding: 10px; }
  .plate.light { background: #fff; } .plate.dark { background: #121211; }
  .plate.none { grid-column: 1/-1; color: #9B968C; font-size: 12px; }
  img { max-width: 100%; max-height: 64px; object-fit: contain; }
  figcaption { padding: 7px 9px; border-top: 1px solid #E6E2DB; font-size: 11px; display: flex; flex-direction: column; gap: 2px; }
  figcaption span { color: #9B968C; }
  .fara { margin-top: 24px; font-size: 13px; color: #6C6862; }
</style>
<h1>Candidați de logo — de verificat</h1>
<p class="lead">${brands.length} mărci cu candidați · ${brands.reduce((s, [, r]) => s + r.candidati.length, 0)} fișiere. Verifică întâi domeniul din dreapta titlului: dacă e un distribuitor, fișierul nu se folosește.</p>
${blocks}
<p class="fara">Fără niciun candidat (${fara.length}): ${fara.map(([s]) => esc(s)).join(', ')}</p>
</html>`;

fs.writeFileSync(OUT, html);
console.log(`${brands.length} mărci cu candidați -> ${path.relative(ROOT, OUT)}`);
