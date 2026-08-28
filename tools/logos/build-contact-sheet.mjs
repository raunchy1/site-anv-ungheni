/**
 * Planșa de verificare: toate mărcile, în ordinea din checklist, fiecare cu
 * logo-ul pe fundal alb ȘI pe fundal închis, cu numele și numărul de produse
 * dedesubt. Mărcile fără logo sunt marcate vizibil.
 *
 * Scopul e o singură privire: logo-ul greșit, cel pixelat și cel cu fundal alb
 * rămas se văd în două secunde pe perechea alb/închis — un logo negru pe
 * transparent dispare pe fundal închis, iar unul cu pătrat alb nedecupat apare
 * ca un dreptunghi luminos.
 *
 * Implicit citește din `logos-sursa/` — fișierele locale, înainte de import —
 * și le încorporează în pagină, ca planșa să fie un singur fișier trimisibil.
 * Cu `--live` folosește `brands.logo_url`, adică exact fișierele urcate: pagina
 * rămâne ușoară și verifică ce se vede efectiv pe site.
 *
 * Rulare: node --env-file=.env.local tools/logos/build-contact-sheet.mjs [--live]
 * Rezultat: tools/logos/contact-sheet.html
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SRC = path.join(ROOT, 'logos-sursa');
const OUT = path.join(ROOT, 'tools/logos/contact-sheet.html');

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: brands, error } = await db.from('brands')
  .select('name, slug_ro, product_count, logo_url, logo_on_dark')
  .order('product_count', { ascending: false });
if (error) throw new Error(error.message);

const manifest = fs.existsSync(path.join(SRC, 'manifest.json'))
  ? JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'))
  : {};

const files = fs.existsSync(SRC) ? fs.readdirSync(SRC) : [];
const fileFor = (slug) => files.find((f) => f.replace(/\.[^.]+$/, '') === slug && !f.endsWith('.json'));

/** Fișierele intră inline, ca planșa să fie un singur fișier care se poate trimite. */
function dataUri(file) {
  const ext = path.extname(file).toLowerCase();
  const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const b64 = fs.readFileSync(path.join(SRC, file)).toString('base64');
  return `data:${mime};base64,${b64}`;
}

const LIVE = process.argv.includes('--live');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const total = brands.reduce((s, b) => s + b.product_count, 0);
let cu = 0, acoperit = 0;

const cards = brands.map((b, i) => {
  const file = LIVE ? (b.logo_url ? path.basename(b.logo_url) : null) : fileFor(b.slug_ro);
  const meta = manifest[b.slug_ro];
  if (file) { cu++; acoperit += b.product_count; }

  const imgSrc = LIVE ? b.logo_url : file ? dataUri(file) : null;
  const media = imgSrc
    ? `<div class="pair">
         <div class="plate light${b.logo_on_dark ? ' flagged' : ''}"><img src="${esc(imgSrc)}" alt="${esc(b.name)}" loading="lazy"></div>
         <div class="plate dark"><img src="${esc(imgSrc)}" alt="${esc(b.name)}" loading="lazy"></div>
       </div>`
    : `<div class="pair missing"><div class="plate none">fără logo</div></div>`;

  // Sursa se arată doar dacă fișierul chiar există: altfel cardul unei mărci
  // respinse ar continua să afișeze titlul fișierului greșit.
  const src = !file ? (meta?.respins ? `respins: ${esc(meta.titlu_respins ?? '')} — ${esc(meta.respins)}` : '')
    : meta?.titlu
      ? `<a href="${esc(meta.pagina)}" target="_blank" rel="noopener">${esc(meta.titlu)}</a> · ${esc(meta.licenta ?? '?')}`
      : meta?.pagina
        ? `<a href="${esc(meta.pagina)}" target="_blank" rel="noopener">${esc(meta.sursa ?? 'site oficial')}</a>`
        : 'sursă locală';

  return `<figure class="card${file ? '' : ' empty'}">
  ${media}
  <figcaption>
    <span class="rank">${i + 1}</span>
    <span class="name">${esc(b.name)}</span>
    <span class="count">${b.product_count} produse</span>
    ${file ? `<span class="ext">${esc(path.extname(file).slice(1))}</span>` : ''}
    ${src ? `<span class="src">${src}</span>` : ''}
  </figcaption>
</figure>`;
}).join('\n');

const html = `<!doctype html>
<html lang="ro">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Planșă de verificare — logo-uri de marcă</title>
<style>
  :root { color-scheme: light; font-family: ui-sans-serif, system-ui, sans-serif; }
  body { margin: 0; padding: 24px; background: #FAF8F5; color: #1C1B19; }
  header { position: sticky; top: 0; background: #FAF8F5; padding-bottom: 16px; border-bottom: 1px solid #CBC6BC; margin-bottom: 24px; z-index: 2; }
  h1 { margin: 0 0 6px; font-size: 20px; }
  .stats { font-size: 14px; color: #494640; }
  .stats b { font-variant-numeric: tabular-nums; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; }
  .card { margin: 0; border: 1px solid #E6E2DB; border-radius: 6px; overflow: hidden; background: #fff; }
  .card.empty { border-style: dashed; border-color: #CBC6BC; background: #F2EFEA; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; }
  .plate { display: flex; align-items: center; justify-content: center; height: 96px; padding: 12px; }
  .plate.light { background: #fff; }
  /* Marcate: logo-uri albe, care în site primesc placă închisă. Aici rămân pe
     alb intenționat, ca să se vadă de ce au nevoie de tratamentul special. */
  .plate.light.flagged { background: repeating-linear-gradient(45deg,#fff,#fff 6px,#F6F3EE 6px,#F6F3EE 12px); }
  .plate.dark { background: #121211; }
  .plate.none { grid-column: 1 / -1; height: 96px; color: #9B968C; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; background: repeating-linear-gradient(45deg, #F2EFEA, #F2EFEA 8px, #EAE6DF 8px, #EAE6DF 16px); }
  .pair.missing { grid-template-columns: 1fr; }
  img { max-width: 100%; max-height: 72px; object-fit: contain; }
  figcaption { display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; padding: 10px 12px; border-top: 1px solid #E6E2DB; font-size: 13px; }
  .rank { font-variant-numeric: tabular-nums; color: #9B968C; font-size: 11px; }
  .name { font-weight: 600; }
  .count { color: #6C6862; font-variant-numeric: tabular-nums; }
  .ext { margin-left: auto; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #6C6862; border: 1px solid #E6E2DB; border-radius: 3px; padding: 1px 5px; }
  .src { flex-basis: 100%; font-size: 11px; color: #9B968C; overflow-wrap: anywhere; }
  .src a { color: inherit; }
</style>
<header>
  <h1>Planșă de verificare — logo-uri de marcă</h1>
  <p class="stats">
    <b>${cu}</b> din <b>${brands.length}</b> mărci au logo ·
    acoperă <b>${acoperit}</b> din <b>${total}</b> produse (<b>${((acoperit / total) * 100).toFixed(1)}%</b>) ·
    generat ${new Date().toISOString().slice(0, 16).replace('T', ' ')}
  </p>
  <p class="stats">Fiecare logo apare pe fundal alb și pe fundal închis. Un dreptunghi luminos pe partea dreaptă = fundal alb nedecupat. Un logo care dispare pe dreapta = logo negru fără variantă deschisă.</p>
</header>
<div class="grid">
${cards}
</div>
</html>`;

fs.writeFileSync(OUT, html);
console.log(`${cu}/${brands.length} mărci cu logo · acoperă ${acoperit}/${total} produse (${((acoperit / total) * 100).toFixed(1)}%)`);
console.log(`-> ${path.relative(ROOT, OUT)}`);
