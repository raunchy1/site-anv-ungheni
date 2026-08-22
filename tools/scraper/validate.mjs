/**
 * Faza 0.6 — validare completă + `data/raw/REPORT.md`.
 * Compară datele extrase cu contoarele live ale filtrelor (sursă independentă de adevăr)
 * și verifică integritatea rutării înainte de proiectarea schemei.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import readline from 'node:readline';
import { BRIEF_BRANDS, RESERVED_ROUTES, RESERVED_ROUTES_RU, SPEED_INDICES } from './brief-brands.mjs';

const RAW = new URL('../../data/raw/', import.meta.url);
const read = async (f) => JSON.parse(await fsp.readFile(new URL(f, RAW), 'utf8'));
const exists = (f) => fs.existsSync(new URL(f, RAW));

const urls = await read('urls.json');
const facets = await read('facets.json');
const pages = await read('pages.json');
const cat = facets['catalog-anvelope'] ?? {};
const facetMap = (g) => Object.fromEntries((cat[g] ?? []).map((x) => [x.label, x.count]));

const rows = [];
const rl = readline.createInterface({ input: fs.createReadStream(new URL('products.ndjson', RAW)), crlfDelay: Infinity });
for await (const line of rl) if (line.trim()) { try { rows.push(JSON.parse(line)); } catch { /* linie parțială */ } }

const failures = exists('failures.ndjson')
  ? (await fsp.readFile(new URL('failures.ndjson', RAW), 'utf8')).split('\n').filter(Boolean).map((l) => JSON.parse(l))
  : [];
const imagesManifest = exists('images-manifest.json') ? await read('images-manifest.json') : null;

const tally = (fn) => rows.reduce((m, r) => { const k = fn(r); if (k != null && k !== '') m[k] = (m[k] ?? 0) + 1; return m; }, {});
const pct = (a, b) => (b ? ((a / b) * 100).toFixed(2) : '0.00');

/* ---------- 1. totaluri ---------- */
const seasonExpected = { vara: facetMap('Sezon')['Vara'] ?? 0, iarna: facetMap('Sezon')['Iarna'] ?? 0, all_season: facetMap('Sezon')['All season'] ?? 0 };
const totalFacet = Object.values(seasonExpected).reduce((a, b) => a + b, 0);
const inStockFacet = facetMap('Disponibilitate')['In stoc'] ?? 0;

const seasons = tally((r) => r.ro.season);
const stocks = tally((r) => r.ro.stock_status);
const stocksRaw = tally((r) => r.ro.stock_raw);
const brandsFound = tally((r) => r.ro.brand);
const widths = tally((r) => r.ro.width);
const aspects = tally((r) => r.ro.aspect);
const diameters = tally((r) => r.ro.diameter);

const diffTable = (found, expected, keyFmt = (k) => k) => {
  const keys = [...new Set([...Object.keys(found), ...Object.keys(expected)])]
    .sort((a, b) => (isNaN(+a) || isNaN(+b) ? String(a).localeCompare(String(b)) : +a - +b));
  return keys.map((k) => {
    const f = found[k] ?? 0; const e = expected[k] ?? 0; const d = f - e;
    return { row: `| ${keyFmt(k)} | ${e} | ${f} | ${d === 0 ? '✅' : (d > 0 ? '+' : '') + d} |`, ok: d === 0 };
  });
};
const renderDiff = (t, onlyProblems = false) => (onlyProblems ? t.filter((x) => !x.ok) : t).map((x) => x.row).join('\n') || '| — | — | — | toate identice ✅ |';

/* ---------- 2. reconcilierea diferenței sitemap vs. facets ---------- */
const inCatalog = new Set(); // produse care apar în categoria „anvelope" (au breadcrumb Anvelope)
for (const r of rows) if (r.ro.breadcrumbs?.includes('Anvelope')) inCatalog.add(r.slug);
const notInCatalog = rows.filter((r) => !inCatalog.has(r.slug))
  .map((r) => ({ slug: r.slug, titlu: r.ro.title, breadcrumb: (r.ro.breadcrumbs ?? []).join(' › '), pret: r.ro.price, stoc: r.ro.stock_raw }));

/* ---------- 3. integritate ---------- */
const missing = {
  'fără preț': rows.filter((r) => r.ro.price == null),
  'fără imagine': rows.filter((r) => !r.ro.images?.length),
  'fără brand': rows.filter((r) => !r.ro.brand),
  'fără dimensiune parsabilă': rows.filter((r) => r.ro.width == null || r.ro.diameter == null),
  'fără înălțime (profil)': rows.filter((r) => r.ro.aspect == null),
  'fără sezon': rows.filter((r) => !r.ro.season),
  'fără indice de sarcină': rows.filter((r) => !r.ro.load_index),
  'fără indice de viteză': rows.filter((r) => !r.ro.speed_index),
  'fără versiune RU': rows.filter((r) => !r.ru),
  'fără slug_ru': rows.filter((r) => !r.slug_ru),
  'fără meta description RO': rows.filter((r) => !r.ro.meta_description),
  'fără meta description RU': rows.filter((r) => r.ru && !r.ru.meta_description),
  'cu descriere proprie (description_html)': rows.filter((r) => r.ro.description_html),
};

const suspectPrices = rows.filter((r) => r.ro.price != null && (r.ro.price < 200 || r.ro.price > 30000))
  .sort((a, b) => a.ro.price - b.ro.price);
const badSeason = rows.filter((r) => r.ro.season_raw && !r.ro.season);
const badStock = rows.filter((r) => r.ro.stock_raw && !r.ro.stock_status);
const badSpeed = rows.filter((r) => r.ro.speed_index && !SPEED_INDICES.includes(r.ro.speed_index.toUpperCase()));
const sizeSources = tally((r) => r.ro.size_source);

const MAPPED_ATTRS = new Set(['Dimensiune', 'Sezon', 'Indice de sarcina', 'Indice de viteza', 'Producator',
  'Размер', 'Сезон', 'Индекс нагрузки', 'Индекс скорости', 'Производитель']);
const attrCounts = {};
for (const r of rows) for (const k of Object.keys(r.ro.attributes ?? {})) attrCounts[k] = (attrCounts[k] ?? 0) + 1;
const unmappedAttrs = Object.entries(attrCounts).filter(([k]) => !MAPPED_ATTRS.has(k));

/* ---------- 4. coliziuni de rutare ---------- */
const slugCount = {}; for (const r of rows) slugCount[r.slug] = (slugCount[r.slug] ?? 0) + 1;
const dupSlugs = Object.entries(slugCount).filter(([, n]) => n > 1);
const slugRuCount = {}; for (const r of rows) if (r.slug_ru) slugRuCount[r.slug_ru] = (slugRuCount[r.slug_ru] ?? 0) + 1;
const dupSlugsRu = Object.entries(slugRuCount).filter(([, n]) => n > 1);

const brandSlugs = new Set(urls.brands.map((u) => u.split('/').pop()));
const serviceSlugs = new Set(urls.services.map((u) => u.split('/').pop()));
const productSlugs = new Set(rows.map((r) => r.slug));

const collideBrand = [...productSlugs].filter((s) => brandSlugs.has(s));
const collideService = [...productSlugs].filter((s) => serviceSlugs.has(s));
const collideReserved = [...productSlugs].filter((s) => RESERVED_ROUTES.includes(s));
const collideBrandService = [...brandSlugs].filter((s) => serviceSlugs.has(s) || RESERVED_ROUTES.includes(s));

const productSlugsRu = new Set(rows.map((r) => r.slug_ru).filter(Boolean));
const serviceSlugsRu = new Set(Object.values(pages.services).map((v) => (v.ru?.canonical ?? '').split('/ru/')[1]).filter(Boolean));
const brandSlugsRu = new Set(Object.values(pages.brands).map((v) => (v.ru?.canonical ?? '').split('/ru/')[1]).filter(Boolean));
const collideBrandRu = [...productSlugsRu].filter((s) => brandSlugsRu.has(s));
const collideServiceRu = [...productSlugsRu].filter((s) => serviceSlugsRu.has(s));
const collideReservedRu = [...productSlugsRu].filter((s) => RESERVED_ROUTES_RU.includes(s));

const slugChanged = rows.filter((r) => r.slug_ru && r.slug_ru !== r.slug).length;

/* ---------- 5. servicii ---------- */
const stripTags = (h = '') => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const descTab = (h = '') => {
  const m = h.replace(/\s+/g, ' ').match(/id="tab-description">([\s\S]*?)<div class="tab-pane" id="tab-review"/);
  return m ? stripTags(m[1]) : '';
};
const serviceRows = Object.entries(pages.services).map(([slug, v]) => {
  const roHtml = v.ro?.body_html ?? ''; const ruHtml = v.ru?.body_html ?? '';
  const imgs = [...new Set([...roHtml.matchAll(/<img[^>]+src="([^"]*\/uslugi\/[^"]*)"/g)].map((m) => m[1]))];
  return {
    slug,
    slug_ru: (v.ru?.canonical ?? '').split('/ru/')[1] ?? '—',
    titlu_ro: v.ro?.title ?? '—',
    titlu_ru: v.ru?.title ?? '—',
    continut_ro: descTab(roHtml).length,
    continut_ru: descTab(ruHtml).length,
    imagini: imgs.length,
    meta_ro: (v.ro?.meta_description ?? '').length,
  };
});

/* ---------- 6. rutele filtrate ---------- */
const filterRoutes = Object.entries(cat).flatMap(([grup, items]) => items.map((i) => ({ grup, ...i })));

/* ---------- 6b. regimuri speciale (B.1, B.2, B.3, B.6, B.7) ---------- */
const noSize = rows.filter((r) => r.ro.size_source === 'none');
const outOfStock = rows.filter((r) => r.ro.stock_status === 'out_of_stock');
const inactiveAtImport = new Set([...noSize.map((r) => r.slug), ...notInCatalog.map((x) => x.slug)]);

const brandMismatch = rows
  .map((r) => ({ slug: r.slug, link: r.ro.brand, attr: r.ro.attributes?.Producator }))
  .filter((x) => x.attr && x.link && x.attr.trim().toLowerCase() !== x.link.trim().toLowerCase());
const brandOnlyAttr = rows.filter((r) => !r.ro.brand && r.ro.attributes?.Producator);

const imgDirs = {};
for (const r of rows) for (const i of r.ro.images ?? []) {
  const d = (i.match(/\/image\/(catalog\/[a-z]+)\//) ?? [])[1] ?? 'altul';
  imgDirs[d] = (imgDirs[d] ?? 0) + 1;
}
// reutilizarea imaginilor: după nume de fișier și, dacă manifestul există, după SHA-1
const imgRefs = rows.flatMap((r) => (r.ro.images ?? []).map((i) => ({ img: i, slug: r.slug, titlu: r.ro.title })));
const byName = {};
for (const x of imgRefs) (byName[x.img] ??= []).push(x);
const byHash = {};
if (imagesManifest) {
  for (const x of imgRefs) {
    const h = imagesManifest.by_source?.[x.img];
    if (h) (byHash[h] ??= []).push(x);
  }
}
const topReused = Object.entries(imagesManifest ? byHash : byName)
  .sort((a, b) => b[1].length - a[1].length).slice(0, 20);

// nume descriptive (nu pur numerice) — statistică, nu listă de erori
const BRAND_TOKENS = (cat.Producator ?? []).map((b) => b.label.toLowerCase().replace(/[^a-z0-9]/g, ''));
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
const descriptive = imgRefs.filter((x) => !/^\d+$/.test((x.img.split('/').pop() ?? '').replace(/\.[a-z]+$/i, '')));
const sizeInName = /(\d{3})[\/\-\s]?(\d{2})\s*r\s*(\d{2})/i;
const descrSizeDiff = descriptive.filter((x) => {
  const m = decodeURIComponent(x.img).match(sizeInName);
  if (!m) return false;
  const t = (x.titlu ?? '').match(sizeInName);
  return t && (m[1] !== t[1] || m[2] !== t[2] || m[3] !== t[3]);
});
// eroare reală: numele conține un brand DIFERIT de brandul produsului
const descrBrandDiff = descriptive.map((x) => {
  const fname = norm(decodeURIComponent(x.img.split('/').pop() ?? ''));
  const own = norm(rows.find((r) => r.slug === x.slug)?.ro.brand ?? '');
  const foreign = BRAND_TOKENS.filter((b) => b.length >= 4 && b !== own && fname.includes(b));
  return foreign.length ? { ...x, own, foreign } : null;
}).filter(Boolean);

const relatedTotal = rows.reduce((a, r) => a + (r.ro.related_slugs?.length ?? 0), 0);
const withRelated = rows.filter((r) => (r.ro.related_slugs?.length ?? 0) > 0).length;
const relatedUnresolved = [...new Set(rows.flatMap((r) => r.ro.related_slugs ?? []))].filter((s) => !productSlugs.has(s));

/* ---------- raport ---------- */
const md = `# REPORT — Faza 0, achiziția datelor de pe anvelope-ungheni.md

Generat: **${new Date().toISOString()}**
Sursă: scraping propriu (nu a existat export OpenCart în \`data/source/\`).
Crawl complet: **${failures.length === 0 && rows.length >= urls.counts.products ? 'DA' : 'NU — vezi §9'}**

---

## 1. Totaluri și reconciliere

| | Valoare |
|---|---|
| URL-uri produs în sitemap | **${urls.counts.products}** |
| Produse numărate de filtrele catalogului | **${totalFacet}** |
| Produse extrase cu succes | **${rows.length}** |
| Eșecuri de crawl | **${failures.length}** |
| Acoperire față de sitemap | **${pct(rows.length, urls.counts.products)}%** |
| Branduri în sitemap | ${urls.counts.brands} |
| Pagini de serviciu | ${urls.counts.services} |
| Imagini unice descărcate | ${imagesManifest ? Object.keys(imagesManifest.by_hash).length : 'încă nedescărcate'} |

### 1.1 Explicația diferenței ${urls.counts.products} (sitemap) vs. ${totalFacet} (catalog)

Produse extrase care **nu** au breadcrumb-ul \`Anvelope\` (deci nu intră în contorul catalogului): **${notInCatalog.length}**

${notInCatalog.length ? `| Slug | Titlu | Breadcrumb | Preț | Stoc |\n|---|---|---|---|---|\n${notInCatalog.map((x) => `| \`${x.slug}\` | ${x.titlu} | ${x.breadcrumb} | ${x.pret ?? '—'} | ${x.stoc ?? '—'} |`).join('\n')}` : 'Niciunul — toate produsele extrase aparțin catalogului de anvelope.'}

## 2. Distribuție pe sezon

| Sezon | Așteptat (filtru live) | Extras | Δ |
|---|---|---|---|
${renderDiff(diffTable(seasons, seasonExpected))}

## 3. Disponibilitate

Etichete brute găsite în sursă (RO):

| Etichetă sursă | Nr. | → enum |
|---|---|---|
${Object.entries(stocksRaw).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} | \`${rows.find((r) => r.ro.stock_raw === k)?.ro.stock_status ?? '**NEMAPAT**'}\` |`).join('\n')}

| Enum | Nr. |
|---|---|
${Object.entries(stocks).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| \`${k}\` | ${v} |`).join('\n')}

Contor live „In stoc" în catalog: **${inStockFacet}** · extras \`in_stock\`: **${stocks.in_stock ?? 0}** · Δ **${(stocks.in_stock ?? 0) - inStockFacet}**

## 4. Integritate a câmpurilor

| Verificare | Nr. | % | Exemple |
|---|---|---|---|
${Object.entries(missing).map(([k, v]) => `| ${k} | **${v.length}** | ${pct(v.length, rows.length)}% | ${v.slice(0, 3).map((r) => `\`${r.slug}\``).join(', ') || '—'} |`).join('\n')}

Sursa dimensiunii: ${Object.entries(sizeSources).map(([k, v]) => `\`${k}\`=${v}`).join(' · ')}

### 4.1 Prețuri suspecte (< 200 MDL sau > 30.000 MDL)

**${suspectPrices.length}** produse.

${suspectPrices.length ? `| Slug | Titlu | Preț MDL |\n|---|---|---|\n${suspectPrices.slice(0, 60).map((r) => `| \`${r.slug}\` | ${r.ro.title} | ${r.ro.price} |`).join('\n')}${suspectPrices.length > 60 ? `\n\n… și încă ${suspectPrices.length - 60}.` : ''}` : 'Niciunul.'}

### 4.2 Valori în afara enum-urilor

- Sezon nemapat: **${badSeason.length}** ${[...new Set(badSeason.map((r) => r.ro.season_raw))].slice(0, 10).map((s) => `\`${s}\``).join(', ')}
- Stoc nemapat: **${badStock.length}** ${[...new Set(badStock.map((r) => r.ro.stock_raw))].slice(0, 10).map((s) => `\`${s}\``).join(', ')}
- Indice de viteză neconform: **${badSpeed.length}** ${[...new Set(badSpeed.map((r) => r.ro.speed_index))].slice(0, 15).map((s) => `\`${s}\``).join(', ')}
- Indici de viteză întâlniți: ${Object.keys(tally((r) => r.ro.speed_index)).sort().map((s) => `\`${s}\``).join(' ')}

### 4.3 Atribute nemapate în schema propusă

${unmappedAttrs.length ? `| Atribut | Apariții |\n|---|---|\n${unmappedAttrs.sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}` : 'Niciunul — toate atributele din sursă au corespondent în schemă.'}

Atribute mapate: ${Object.entries(attrCounts).filter(([k]) => MAPPED_ATTRS.has(k)).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} (${v})`).join(' · ')}

## 5. Branduri

Găsite în produse: **${Object.keys(brandsFound).length}** · în sitemap: **${urls.counts.brands}** · în filtrul catalogului: **${(cat.Producator ?? []).length}** · în briefing §2.4: **${BRIEF_BRANDS.length}**

### 5.1 Diferențe față de contorul filtrului (doar cele care nu se potrivesc)

| Brand | Așteptat | Extras | Δ |
|---|---|---|---|
${renderDiff(diffTable(brandsFound, facetMap('Producator')), true)}

### 5.2 Diferențe față de lista din briefing

- În briefing, absente din filtru: ${BRIEF_BRANDS.filter((b) => !(cat.Producator ?? []).some((x) => x.label.toLowerCase() === b.toLowerCase())).map((b) => `\`${b}\``).join(', ') || '—'}
- În filtru, absente din briefing: ${(cat.Producator ?? []).map((x) => x.label).filter((b) => !BRIEF_BRANDS.some((x) => x.toLowerCase() === b.toLowerCase())).map((b) => `\`${b}\``).join(', ') || '—'}

## 6. Dimensiuni

### 6.1 Diametru
| Diametru | Așteptat | Extras | Δ |
|---|---|---|---|
${renderDiff(diffTable(diameters, facetMap('Diametru')))}

### 6.2 Lățime (doar diferențele)
| Lățime | Așteptat | Extras | Δ |
|---|---|---|---|
${renderDiff(diffTable(widths, facetMap('Latime')), true)}

### 6.3 Înălțime (doar diferențele)
| Înălțime | Așteptat | Extras | Δ |
|---|---|---|---|
${renderDiff(diffTable(aspects, Object.fromEntries(Object.entries(facetMap('Inaltime')).map(([k, v]) => [k.replace('/', ''), v]))), true)}

## 7. Servicii

| Slug RO | Slug RU | Titlu RO | Titlu RU | Conținut RO (car.) | Conținut RU (car.) | Imagini |
|---|---|---|---|---|---|---|
${serviceRows.map((s) => `| \`${s.slug}\` | \`${s.slug_ru}\` | ${s.titlu_ro} | ${s.titlu_ru} | **${s.continut_ro}** | **${s.continut_ru}** | ${s.imagini} |`).join('\n')}

Tabul „Descriere" al fiecărei pagini de serviciu este literalmente gol în HTML-ul sursă
(\`<div class="tab-pane active" id="tab-description"></div>\`). Nu există niciun preț.
Meta description există și se migrează.

**Paginile de brand** nu au nici ele text de prezentare — doar h1, meta title, meta description și grila de produse. Nu există logo-uri de brand în sursă.

## 7b. Regimuri speciale (deciziile B.1 – B.7)

### 7b.1 Produse care devin \`is_active = false\` la import

| Motiv | Nr. | Prag |
|---|---|---|
| \`size_source = 'none'\` (B.2) | **${noSize.length}** | ${noSize.length > 50 ? '**PESTE 50 — OPRIRE ÎNAINTE DE SEED**' : 'sub 50, se poate continua'} |
| Orfane, fără breadcrumb \`Anvelope\` (B.3) | **${notInCatalog.length}** | — |
| **Total distinct de dezactivat** | **${inactiveAtImport.size}** | |

${noSize.length ? `Produse fără dimensiune parsabilă:\n\n| Slug | Titlu | Atribute prezente |\n|---|---|---|\n${noSize.slice(0, 80).map((r) => `| \`${r.slug}\` | ${r.ro.title} | ${Object.keys(r.ro.attributes ?? {}).join(', ') || '—'} |`).join('\n')}${noSize.length > 80 ? `\n\n… și încă ${noSize.length - 80}.` : ''}` : 'Niciun produs fără dimensiune parsabilă ✅'}

### 7b.2 Produse indisponibile (B.1)

| | |
|---|---|
| \`out_of_stock\` | **${outOfStock.length}** (${pct(outOfStock.length, rows.length)}%) |
| dintre care fără preț | **${outOfStock.filter((r) => r.ro.price == null).length}** |
| \`out_of_stock\` **cu** preț | **${outOfStock.filter((r) => r.ro.price != null).length}** |
| \`in_stock\` sau \`supplier\` **fără** preț | **${rows.filter((r) => r.ro.stock_status !== 'out_of_stock' && r.ro.price == null).length}** |

Ultima linie e critică: încalcă \`CHECK (stock_status = 'out_of_stock' OR price_mdl IS NOT NULL)\` din C.2.
${rows.filter((r) => r.ro.stock_status !== 'out_of_stock' && r.ro.price == null).length ? `Exemple: ${rows.filter((r) => r.ro.stock_status !== 'out_of_stock' && r.ro.price == null).slice(0, 10).map((r) => `\`${r.slug}\``).join(', ')}` : 'Zero încălcări ✅'}

### 7b.3 Brand: link vs. atribut \`Producator\` (B.6)

| | |
|---|---|
| Discrepanțe link ≠ atribut | **${brandMismatch.length}** |
| Brand doar din atribut (link absent) | **${brandOnlyAttr.length}** |

${brandMismatch.length ? `| Slug | Link brand (primar) | Atribut Producator |\n|---|---|---|\n${brandMismatch.slice(0, 40).map((x) => `| \`${x.slug}\` | ${x.link} | ${x.attr} |`).join('\n')}${brandMismatch.length > 40 ? `\n\n… și încă ${brandMismatch.length - 40}.` : ''}` : 'Nicio discrepanță ✅'}

### 7b.4 Imagini (B.7 + punctele 3 și 4 din promptul 3B)

**Distribuția pe directoare sursă**

| Director sursă | Referințe |
|---|---|
${Object.entries(imgDirs).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| \`/image/${k}/\` | ${v} |`).join('\n')}

**Reutilizare**

| | |
|---|---|
| Referințe totale | **${imgRefs.length}** |
| Fișiere unice după **nume** | **${Object.keys(byName).length}** |
| Fișiere unice după **SHA-1** | ${imagesManifest ? `**${Object.keys(imagesManifest.by_hash).length}**` : '_încă nedescărcate_' } |
| Raport produse / imagine (nume) | ${(imgRefs.length / (Object.keys(byName).length || 1)).toFixed(2)} |
| Raport produse / imagine (SHA-1) | ${imagesManifest ? (imgRefs.length / (Object.keys(imagesManifest.by_hash).length || 1)).toFixed(2) : '—'} |
| Produse cu exact o imagine | **${rows.filter((r) => (r.ro.images?.length ?? 0) === 1).length}** |
| Produse cu mai multe imagini | **${rows.filter((r) => (r.ro.images?.length ?? 0) > 1).length}** |
| Produse fără imagine | **${rows.filter((r) => !(r.ro.images?.length)).length}** |

${Object.keys(byName).length === imgRefs.length ? '> **Numele de fișier sunt unice per produs** — nu există reutilizare detectabilă la nivel de nume. Ipoteza „o fotografie per model" se poate confirma sau infirma **doar** după deduplicarea SHA-1 din pasul de descărcare.' : ''}

**Top 20 imagini reutilizate** (${imagesManifest ? 'după SHA-1' : 'după nume — SHA-1 indisponibil încă'})

${topReused[0] && topReused[0][1].length > 1 ? `| # | Imagine | Produse | Titluri |\n|---|---|---|---|\n${topReused.filter(([, v]) => v.length > 1).map(([k, v], i) => `| ${i + 1} | \`${k}\` | **${v.length}** | ${v.slice(0, 6).map((x) => x.titlu).join(' · ')}${v.length > 6 ? ` … +${v.length - 6}` : ''} |`).join('\n')}` : 'Nicio imagine reutilizată de mai mult de un produs la acest nivel de deduplicare.'}

**Nume de fișier descriptive** (statistică, nu erori)

| | |
|---|---|
| Imagini cu nume descriptiv (nu pur numeric) | **${descriptive.length}** (${pct(descriptive.length, imgRefs.length)}%) |
| … din care conțin o dimensiune | **${descriptive.filter((x) => sizeInName.test(decodeURIComponent(x.img))).length}** |
| … din care dimensiunea diferă de titlu | **${descrSizeDiff.length}** |

Fotografiile de anvelope sunt per **model**, nu per SKU — o dimensiune diferită în numele fișierului **nu** e un defect de date.

**Erori reale: numele fișierului indică alt brand decât produsul**

${descrBrandDiff.length ? `| Slug | Brand produs | Brand în numele fișierului | Fișier |\n|---|---|---|---|\n${descrBrandDiff.slice(0, 40).map((x) => `| \`${x.slug}\` | ${x.own} | ${x.foreign.join(', ')} | \`${x.img}\` |`).join('\n')}${descrBrandDiff.length > 40 ? `\n\n… și încă ${descrBrandDiff.length - 40}.` : ''}` : 'Niciuna ✅ — niciun fișier nu poartă numele unui brand diferit de cel al produsului.'}

### 7b.5 Produse similare din sursă (C.3)

| | |
|---|---|
| Produse cu recomandări legacy | **${withRelated}** (${pct(withRelated, rows.length)}%) |
| Total relații | **${relatedTotal}** |
| Medie per produs cu relații | ${withRelated ? (relatedTotal / withRelated).toFixed(1) : 0} |
| Slug-uri recomandate **nerezolvabile** | **${relatedUnresolved.length}** ${relatedUnresolved.slice(0, 8).map((s) => `\`${s}\``).join(', ')} |

## 8. Coliziuni de rutare

### 8.1 Spațiul RO (rădăcină)
| Verificare | Nr. | Detalii |
|---|---|---|
| Slug-uri produs duplicate | **${dupSlugs.length}** | ${dupSlugs.slice(0, 10).map(([s, n]) => `\`${s}\`×${n}`).join(', ') || '—'} |
| Slug și produs, și brand | **${collideBrand.length}** | ${collideBrand.slice(0, 10).map((s) => `\`${s}\``).join(', ') || '—'} |
| Slug și produs, și serviciu | **${collideService.length}** | ${collideService.slice(0, 10).map((s) => `\`${s}\``).join(', ') || '—'} |
| Slug produs pe rută rezervată | **${collideReserved.length}** | ${collideReserved.map((s) => `\`${s}\``).join(', ') || '—'} |
| Slug brand pe rută rezervată/serviciu | **${collideBrandService.length}** | ${collideBrandService.map((s) => `\`${s}\``).join(', ') || '—'} |

### 8.2 Spațiul RU (\`/ru/\`)
| Verificare | Nr. | Detalii |
|---|---|---|
| Slug-uri RU duplicate | **${dupSlugsRu.length}** | ${dupSlugsRu.slice(0, 10).map(([s, n]) => `\`${s}\`×${n}`).join(', ') || '—'} |
| Slug și produs, și brand | **${collideBrandRu.length}** | ${collideBrandRu.slice(0, 10).map((s) => `\`${s}\``).join(', ') || '—'} |
| Slug și produs, și serviciu | **${collideServiceRu.length}** | ${collideServiceRu.slice(0, 10).map((s) => `\`${s}\``).join(', ') || '—'} |
| Slug produs pe rută rezervată RU | **${collideReservedRu.length}** | ${collideReservedRu.map((s) => `\`${s}\``).join(', ') || '—'} |

Produse cu slug RU diferit de cel RO: **${slugChanged}** din ${rows.length} (${pct(slugChanged, rows.length)}%).
Slug-uri RU de categorie: \`/ru/katalog-shin\`, \`/ru/datchiki-davleniya-v-shinah\`, \`/ru/uslugi\`.
Slug-urile de brand sunt identice în ambele limbi.

## 9. Eșecuri de crawl

${failures.length ? `**${failures.length}** URL-uri eșuate:\n\n${failures.slice(0, 40).map((f) => `- \`${f.slug}\` — ${f.error}`).join('\n')}` : 'Niciunul.'}

## 10. Rute de filtru de păstrat (indexate azi, nu query params)

Total: **${filterRoutes.length}** rute RO.

${Object.entries(cat).map(([grup, items]) => `### ${grup} (${items.length})\n\n${items.map((i) => `- \`${i.url}\` — ${i.label} (${i.count})`).join('\n')}`).join('\n\n')}

**RU:** structura echivalentă pornește de la \`/ru/katalog-shin\`. Slug-urile de filtru RU se extrag separat (\`tools/scraper/extract-facets.mjs\`) — vezi §12.

---

## 11. Anexa A — 5 produse complet extrase

${rows.slice(0, 5).map((r) => `\`\`\`json\n${JSON.stringify(r, null, 1)}\n\`\`\``).join('\n\n')}

## 12. Anexa B — o pagină de brand extrasă

\`\`\`json
${JSON.stringify({
  slug: 'michelin',
  ro: { titlu: pages.brands.michelin?.ro?.title, meta_title: pages.brands.michelin?.ro?.meta_title, meta_description: pages.brands.michelin?.ro?.meta_description, canonical: pages.brands.michelin?.ro?.canonical },
  ru: { titlu: pages.brands.michelin?.ru?.title, meta_title: pages.brands.michelin?.ru?.meta_title, meta_description: pages.brands.michelin?.ru?.meta_description, canonical: pages.brands.michelin?.ru?.canonical },
  are_descriere_proprie: false,
  are_logo: false,
}, null, 1)}
\`\`\`

## 13. Anexa C — cele ${(cat.Producator ?? []).length} de branduri cu numărul de produse

| # | Brand | Slug | Produse (filtru) | Produse (extrase) |
|---|---|---|---|---|
${(cat.Producator ?? []).map((b, i) => `| ${i + 1} | ${b.label} | \`${b.url.split('marca_')[1] ?? ''}\` | ${b.count} | ${brandsFound[b.label] ?? 0} |`).join('\n')}
`;

await fsp.writeFile(new URL('REPORT.md', RAW), md);
console.log(`REPORT.md scris — ${rows.length} produse, ${failures.length} eșecuri, ${md.length} caractere.`);
