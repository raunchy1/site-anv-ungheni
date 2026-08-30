#!/usr/bin/env node
/**
 * ETAPA 0.1 — cele ~1.959 de produse unde titlul contrazice propriile coloane.
 *
 * NU SCRIE NIMIC. `db.mjs` n-are funcție de scriere.
 *
 * Întrebarea la care răspunde raportul nu e „câte sunt", ci „cine greșește,
 * titlul sau coloana". Comparația dintre ele e circulară — amândouă vin din
 * același import OpenCart. De aceea verdictul se dă cu o a treia sursă,
 * independentă: catalogul pandashop, unde aceeași anvelopă are indicii scriși de
 * altcineva. Pentru fiecare neconcordanță întrebăm catalogul lor:
 *
 *   - există la ei un produs cu cheia dedusă din TITLUL nostru?
 *   - există unul cu cheia dedusă din COLOANELE noastre?
 *
 * Cine e confirmat mai des, are dreptate. Asta e demonstrația, nu presupunerea.
 *
 *   node --env-file=.env.local tools/sync/pandashop/report-mismatch.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { config } from './config.mjs';
import { createHttp } from './http.mjs';
import { createHtmlSource } from './html-source.mjs';
import { readProducts, readBrands } from './db.mjs';
import { parseTitle } from './parse-title.mjs';
import { naturalKey, normalizeModel } from './natural-key.mjs';
import { tyreUrls, slugToTitle } from './sitemap.mjs';

const cheie = (t) => naturalKey({
  brand: t.brand, model: t.model, width: t.width, aspect: t.aspect, diameter: t.diameter,
  loadIndex: t.loadIndex, speedIndex: t.speedIndex, isXl: t.isXl, isRunflat: t.isRunflat,
});

/** Pagina originală de pe site-ul vechi, dacă mai e în cache-ul crawl-ului. */
function htmlVechi(slug) {
  const p = path.join('data/raw/html-cache', slug.slice(0, 2), `${slug}.ro.html.gz`);
  if (!fs.existsSync(p)) return null;
  try { return zlib.gunzipSync(fs.readFileSync(p)).toString('utf8'); } catch { return null; }
}

/** Ce scria sursa veche în tabelul de atribute, pentru un atribut anume. */
function atributDinHtml(html, nume) {
  if (!html) return null;
  const re = new RegExp(`<span class="attr-name">\\s*${nume}[^<]*</span>\\s*<span class="attr-text">([^<]*)</span>`, 'i');
  return html.match(re)?.[1]?.trim() ?? null;
}

function tipNeconcordanta(col, tit, modelColNorm, modelTitNorm) {
  const t = [];
  if (String(col.load_index ?? '') !== String(tit.loadIndex ?? '')) t.push('indice_sarcina');
  if (String(col.speed_index ?? '').toUpperCase() !== String(tit.speedIndex ?? '').toUpperCase()) t.push('indice_viteza');
  if (Boolean(col.is_xl) !== Boolean(tit.isXl)) t.push('xl');
  if (Boolean(col.is_runflat) !== Boolean(tit.isRunflat)) t.push('runflat');

  const dCol = String(col.diameter ?? '').toUpperCase();
  const dTit = String(tit.diameter ?? '').toUpperCase();
  if (dCol !== dTit) {
    /* Cazul cel mai des întâlnit e „R14" în coloană și „R14C" în titlu: atributul
       OpenCart a pierdut litera C. Nu e o eroare de indice și nu se repară la fel,
       deci nu se pune în aceeași grămadă. */
    t.push(dCol.replace(/C$/, '') === dTit.replace(/C$/, '') ? 'diametru_fara_C' : 'diametru');
  }
  if (String(col.width ?? '') !== String(tit.width ?? '') || String(col.aspect ?? '') !== String(tit.aspect ?? '')) t.push('latime_sau_profil');
  if (modelColNorm !== modelTitNorm) t.push('model');
  return t.length ? t.join('+') : 'altele';
}

async function main() {
  const t0 = Date.now();
  console.log('· citesc catalogul nostru…');
  const [ours, brands] = await Promise.all([readProducts(), readBrands()]);
  const brandNames = brands.map((b) => b.name).filter(Boolean).sort((a, b) => b.length - a.length);

  console.log('· construiesc universul de chei al lor (în stoc + fără stoc)…');
  const http = createHttp({ ...config.http });
  const source = createHtmlSource(http);
  const lorKeys = new Map();   // cheie -> titlul lor, ca dovadă citabilă
  for await (const ref of source.listProducts({})) {
    const t = parseTitle(ref.card.title, brandNames);
    if (t.brandKnown && t.size_raw) lorKeys.set(cheie(t), ref.card.title);
  }
  const oos = await tyreUrls({ stateDir: config.paths.state });
  for (const u of oos) {
    const t = parseTitle(slugToTitle(u.slug), brandNames);
    if (t.brandKnown && t.size_raw) lorKeys.set(cheie(t), slugToTitle(u.slug));
  }
  console.log(`  ${lorKeys.size} chei distincte la ei`);

  /* ------------------------------------------------- neconcordanțele noastre */
  const rele = [];
  for (const p of ours) {
    if (p.category !== 'anvelope' || !p.brand_name || !p.model || !p.diameter) continue;
    const tit = parseTitle(p.title_ro, brandNames);
    if (!tit.brandKnown || !tit.size_raw) continue;

    const kCol = naturalKey({
      brand: p.brand_name, model: p.model, width: p.width, aspect: p.aspect, diameter: p.diameter,
      loadIndex: p.load_index, speedIndex: p.speed_index, isXl: p.is_xl, isRunflat: p.is_runflat,
    });
    const kTit = cheie(tit);
    if (kCol === kTit) continue;

    rele.push({
      p, tit, kCol, kTit,
      tip: tipNeconcordanta(p, tit, normalizeModel(p.model, { brand: p.brand_name }), normalizeModel(tit.model, { brand: tit.brand })),
      lorConfirmaTitlul: lorKeys.has(kTit),
      lorConfirmaColoana: lorKeys.has(kCol),
    });
  }
  console.log(`  ${rele.length} neconcordanțe`);

  /* ------------------------------------------------------------- verdictul */
  const doarTitlu = rele.filter((r) => r.lorConfirmaTitlul && !r.lorConfirmaColoana).length;
  const doarColoana = rele.filter((r) => !r.lorConfirmaTitlul && r.lorConfirmaColoana).length;
  const ambele = rele.filter((r) => r.lorConfirmaTitlul && r.lorConfirmaColoana).length;
  const niciuna = rele.filter((r) => !r.lorConfirmaTitlul && !r.lorConfirmaColoana).length;
  const decisive = doarTitlu + doarColoana;
  const verdict = decisive === 0 ? 'nedecis'
    : doarTitlu > doarColoana * 2 ? 'TITLUL are dreptate'
    : doarColoana > doarTitlu * 2 ? 'COLOANELE au dreptate'
    : 'amestecat — nu se poate corecta automat';

  /* ------------------------------------------------------ grupare pe tipuri */
  const peTip = new Map();
  for (const r of rele) (peTip.get(r.tip) ?? peTip.set(r.tip, []).get(r.tip)).push(r);
  const tipuri = [...peTip.entries()].sort((a, b) => b[1].length - a[1].length);

  const exemplu = (r) => {
    const html = htmlVechi(r.p.slug_ro);
    const attrs = r.p.attributes ?? {};
    return `- **#${r.p.id}** \`${r.p.slug_ro}\`
  - titlu: **${r.p.title_ro}** → titlul spune \`${r.tit.loadIndex ?? '—'}${r.tit.speedIndex ?? ''}${r.tit.isXl ? ' XL' : ''}\`
  - coloane: \`load_index=${r.p.load_index ?? 'NULL'}\`, \`speed_index=${r.p.speed_index ?? 'NULL'}\`, \`is_xl=${r.p.is_xl}\`
  - \`attributes\`: sarcină \`${attrs['Indice de sarcina'] ?? '—'}\`, viteză \`${attrs['Indice de viteza'] ?? '—'}\`, dimensiune \`${attrs.Dimensiune ?? '—'}\`
  - HTML-ul vechi: sarcină \`${atributDinHtml(html, 'Indice de sarcina') ?? (html ? '—' : 'fără cache')}\`, viteză \`${atributDinHtml(html, 'Indice de viteza') ?? (html ? '—' : 'fără cache')}\`
  - la pandashop: titlul ${r.lorConfirmaTitlul ? `**confirmat** (\`${lorKeys.get(r.kTit)}\`)` : 'negăsit'} · coloana ${r.lorConfirmaColoana ? `**confirmată** (\`${lorKeys.get(r.kCol)}\`)` : 'negăsită'}`;
  };

  const dir = config.paths.reports;
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

  const md = `# Etapa 0.1 — titlul contra coloanelor

Rulare: ${new Date().toISOString()} · ${Math.round((Date.now() - t0) / 1000)}s · **nu s-a scris nimic**

**${rele.length} produse** au titlul în dezacord cu propriile coloane.

## Verdict: ${verdict}

Comparația titlu-coloană e circulară: amândouă vin din același import OpenCart.
Arbitrul e catalogul pandashop, unde aceeași anvelopă are indicii scriși de
altcineva. Din ${rele.length} de neconcordanțe, cele în care catalogul lor
confirmă exact una din cele două variante:

| Ce confirmă pandashop | Câte |
|---|---|
| **Doar titlul nostru** | **${doarTitlu}** |
| **Doar coloanele noastre** | **${doarColoana}** |
| Ambele (există și 84H, și 86H la ei — variante reale) | ${ambele} |
| Niciuna (nu au produsul deloc) | ${niciuna} |

${decisive === 0 ? '' : `Din ${decisive} de cazuri decisive, **${((Math.max(doarTitlu, doarColoana) / decisive) * 100).toFixed(1)}%** dau dreptate ${doarTitlu > doarColoana ? 'titlului' : 'coloanelor'}.`}

Cele ${ambele} „ambele" sunt importante: acolo pandashop are **și** varianta din
titlu, **și** pe cea din coloană, ca produse distincte. Nu e o eroare de scriere;
sunt două anvelope diferite, iar rândul nostru le amestecă. Alea nu se corectează
automat, indiferent de verdict.

## Pe tipuri de neconcordanță

| Tip | Câte | Titlul confirmat | Coloana confirmată |
|---|---|---|---|
${tipuri.map(([tip, list]) => `| \`${tip}\` | ${list.length} | ${list.filter((r) => r.lorConfirmaTitlul && !r.lorConfirmaColoana).length} | ${list.filter((r) => !r.lorConfirmaTitlul && r.lorConfirmaColoana).length} |`).join('\n')}

${tipuri.map(([tip, list]) => `### \`${tip}\` — ${list.length} produse\n\n${list.slice(0, 10).map(exemplu).join('\n')}`).join('\n\n')}
`;

  fs.writeFileSync(path.join(dir, `etapa0-neconcordante-${stamp}.md`), md);
  fs.writeFileSync(path.join(dir, `etapa0-neconcordante-${stamp}.json`), JSON.stringify({
    verdict, total: rele.length, doarTitlu, doarColoana, ambele, niciuna,
    produse: rele.map((r) => ({
      id: r.p.id, slug: r.p.slug_ro, titlu: r.p.title_ro, tip: r.tip,
      coloane: { load_index: r.p.load_index, speed_index: r.p.speed_index, is_xl: r.p.is_xl, width: r.p.width, aspect: r.p.aspect, diameter: r.p.diameter },
      din_titlu: { loadIndex: r.tit.loadIndex, speedIndex: r.tit.speedIndex, isXl: r.tit.isXl, width: r.tit.width, aspect: r.tit.aspect, diameter: r.tit.diameter },
      lor_confirma_titlul: r.lorConfirmaTitlul, lor_confirma_coloana: r.lorConfirmaColoana,
    })),
  }, null, 2));

  console.log(`\n${md.split('## Pe tipuri')[0]}`);
  console.log(`Raport: ${path.join(dir, `etapa0-neconcordante-${stamp}.md`)}`);
}

main().catch((e) => { console.error('\nRULAREA A EȘUAT:', e); process.exit(1); });
