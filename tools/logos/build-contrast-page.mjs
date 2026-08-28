/**
 * Măsoară, pentru fiecare logo urcat, cât din el rămâne vizibil pe fundal alb
 * și cât pe fundal închis — și scrie `brands.logo_on_dark` din rezultat.
 *
 * De ce prin browser: un SVG nu-ți spune ce se vede, ci doar ce culori conține.
 * Vredestein are text alb pe dreptunghi bleumarin (arată bine pe alb), ILINK are
 * un accent roșu lângă un cuvânt alb (nu se vede pe alb). Singura măsurătoare
 * care nu greșește e randarea: fiecare fișier se desenează într-un canvas peste
 * alb și peste închis, apoi se numără pixelii care diferă de fundal.
 *
 * Rulare, în doi pași:
 *   node --env-file=.env.local tools/logos/build-contrast-page.mjs      # scrie public/logo-check.html
 *   -> deschide http://localhost:3000/logo-check.html, așteaptă titlul „gata N",
 *      copiază `JSON.stringify(window.rezultate)` din consolă într-un fișier
 *   node --env-file=.env.local tools/logos/build-contrast-page.mjs --apply masuratori.json
 *
 * Regula: placă închisă dacă sub 9% din suprafață diferă de alb ȘI pe închis
 * se vede de cel puțin trei ori mai mult. Restul rămân pe placa deschisă.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const APPLY = process.argv.indexOf('--apply');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

if (APPLY !== -1) {
  const file = process.argv[APPLY + 1];
  const masuratori = JSON.parse(fs.readFileSync(file, 'utf8'));
  const dark = [], light = [];
  for (const [slug, m] of Object.entries(masuratori)) {
    ((m.peAlb < 0.09 && m.peInchis > m.peAlb * 3) ? dark : light).push(slug);
  }
  await db.from('brands').update({ logo_on_dark: true }).in('slug_ro', dark);
  await db.from('brands').update({ logo_on_dark: false }).in('slug_ro', light);
  // proporția fiecărui fișier, ca banda din interfață să nu fie mai lată decât desenul
  for (const [slug, m] of Object.entries(masuratori)) {
    if (m.ratie) await db.from('brands').update({ logo_ratio: Number(m.ratie.toFixed(3)) }).eq('slug_ro', slug);
  }
  console.log(`placă închisă: ${dark.length} (${dark.join(', ')})`);
  console.log(`placă deschisă: ${light.length}`);
  process.exit(0);
}

const { data, error } = await db.from('brands')
  .select('slug_ro, name, logo_url, logo_on_dark')
  .not('logo_url', 'is', null)
  .order('product_count', { ascending: false });
if (error) throw new Error(error.message);

const out = path.join(ROOT, 'public/logo-check.html');
fs.writeFileSync(out, `<!doctype html><meta charset="utf-8"><title>măsurătoare</title>
<script>
const LOGOS = ${JSON.stringify(data)};
async function masoara(url) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((ok, nu) => { img.onload = ok; img.onerror = nu; img.src = url; });
  const out = { ratie: img.naturalWidth / img.naturalHeight };
  for (const fundal of ['#ffffff', '#121211']) {
    const c = document.createElement('canvas');
    c.width = 240; c.height = 72;
    const x = c.getContext('2d');
    x.fillStyle = fundal; x.fillRect(0, 0, 240, 72);
    const s = Math.min(240 / img.naturalWidth, 72 / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    x.drawImage(img, (240 - w) / 2, (72 - h) / 2, w, h);
    const d = x.getImageData(0, 0, 240, 72).data;
    const fl = fundal === '#ffffff' ? 1 : 0.07;
    let diferit = 0;
    for (let i = 0; i < d.length; i += 4) {
      const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      if (Math.abs(l - fl) > 0.25) diferit++;
    }
    out[fundal === '#ffffff' ? 'peAlb' : 'peInchis'] = diferit / (240 * 72);
  }
  return out;
}
window.rezultate = null;
(async () => {
  const r = {};
  for (const b of LOGOS) {
    try { r[b.slug_ro] = { ...(await masoara(b.logo_url)), acum: b.logo_on_dark }; }
    catch (e) { r[b.slug_ro] = { eroare: String(e).slice(0, 40) }; }
  }
  window.rezultate = r;
  document.title = 'gata ' + Object.keys(r).length;
})();
</script>`);
console.log(`scris public/logo-check.html cu ${data.length} logo-uri`);
console.log('deschide http://localhost:3000/logo-check.html și salvează JSON.stringify(window.rezultate)');
