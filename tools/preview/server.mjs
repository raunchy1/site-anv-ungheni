/**
 * Inspector de date pentru migrare — NU este site-ul nou și nu are legătură cu designul lui.
 * Servește ce a extras crawl-ul din data/raw/products.ndjson, ca să poată fi verificat vizual.
 * Fără dependențe, fără build. Rulare: node tools/preview/server.mjs [--port 4321]
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import readline from 'node:readline';

const RAW = new URL('../../data/raw/', import.meta.url);
const PORT = Number(process.argv[process.argv.indexOf('--port') + 1]) || 4321;
const LIVE = 'https://anvelope-ungheni.md';

let products = [];
let loadedAt = 0;
let facets = {};

async function load() {
  const out = [];
  const rl = readline.createInterface({ input: fs.createReadStream(new URL('products.ndjson', RAW)), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let d; try { d = JSON.parse(line); } catch { continue; }
    out.push({
      slug: d.slug, slug_ru: d.slug_ru,
      id: d.ro.product_id, title: d.ro.title, title_ru: d.ru?.title ?? null,
      brand: d.ro.brand, price: d.ro.price, stock: d.ro.stock_status, stock_raw: d.ro.stock_raw,
      season: d.ro.season, width: d.ro.width, aspect: d.ro.aspect, diameter: d.ro.diameter,
      load_index: d.ro.load_index, speed_index: d.ro.speed_index, size_source: d.ro.size_source,
      image: d.ro.images?.[0] ?? null, images: d.ro.images ?? [],
      meta_ro: d.ro.meta_description, meta_ru: d.ru?.meta_description ?? null,
      meta_title_ro: d.ro.meta_title, meta_title_ru: d.ru?.meta_title ?? null,
      related: d.ro.related_slugs ?? [], breadcrumbs: d.ro.breadcrumbs ?? [],
      attributes: d.ro.attributes ?? {}, description: d.ro.description_html,
    });
  }
  products = out;
  loadedAt = Date.now();
  try { facets = JSON.parse(await fsp.readFile(new URL('facets.json', RAW), 'utf8')); } catch { facets = {}; }
}

const uniq = (fn) => [...new Set(products.map(fn).filter((x) => x != null))];

function query(p) {
  const q = (p.get('q') ?? '').trim().toLowerCase();
  const f = {
    width: p.get('width'), aspect: p.get('aspect'), diameter: p.get('diameter'),
    season: p.get('season'), brand: p.get('brand'), stock: p.get('stock'),
  };
  let list = products.filter((x) => {
    if (q && !(`${x.title} ${x.slug}`.toLowerCase().includes(q))) return false;
    if (f.width && String(x.width) !== f.width) return false;
    if (f.aspect && String(x.aspect) !== f.aspect) return false;
    if (f.diameter && x.diameter !== f.diameter) return false;
    if (f.season && x.season !== f.season) return false;
    if (f.brand && x.brand !== f.brand) return false;
    if (f.stock && x.stock !== f.stock) return false;
    return true;
  });
  const sort = p.get('sort') ?? 'default';
  const key = { price_asc: (a, b) => (a.price ?? 1e9) - (b.price ?? 1e9), price_desc: (a, b) => (b.price ?? -1) - (a.price ?? -1), title: (a, b) => a.title.localeCompare(b.title) }[sort];
  if (key) list = [...list].sort(key);
  const page = Math.max(1, Number(p.get('page') ?? 1));
  const per = 60;
  return { total: list.length, page, pages: Math.ceil(list.length / per), items: list.slice((page - 1) * per, page * per) };
}

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n) => (n == null ? null : `${n.toLocaleString('ro-MD').replace(/[.,]/g, ' ')} MDL`);
const thumb = (img) => (img ? `${LIVE}/image/cache/${img.replace('/image/', '')}`.replace(/(\.[a-z]+)$/i, '-350x350$1') : null);

const STOCK_LABEL = { in_stock: 'În stoc', supplier: 'Stoc furnizor', out_of_stock: 'Stoc epuizat' };

function page(res, data, p) {
  const crawlLog = fs.existsSync(new URL('crawl-products.log', RAW)) ? fs.readFileSync(new URL('crawl-products.log', RAW), 'utf8').trim().split('\n').pop() : '';
  const opt = (name, values, cur, fmt = (v) => v) =>
    `<select name="${name}"><option value="">${name}</option>${values.map((v) => `<option value="${esc(v)}"${String(cur ?? '') === String(v) ? ' selected' : ''}>${esc(fmt(v))}</option>`).join('')}</select>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html lang="ro"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Inspector date migrare — anvelope-ungheni.md</title>
<style>
  :root { --fg:#16181c; --mut:#6b7280; --line:#e5e7eb; --bg:#fff; --card:#fafafa; --warn:#92400e; --warnbg:#fef3c7; }
  @media (prefers-color-scheme:dark){ :root{ --fg:#e8e8e8; --mut:#9ca3af; --line:#2a2d32; --bg:#121417; --card:#181b1f; --warn:#fbbf24; --warnbg:#2a2110; } }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--fg);
    font:14px/1.5 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  .band{background:var(--warnbg);color:var(--warn);padding:10px 20px;font-size:13px;border-bottom:1px solid var(--line)}
  header{padding:16px 20px;border-bottom:1px solid var(--line);display:flex;gap:16px;align-items:baseline;flex-wrap:wrap}
  h1{font-size:15px;margin:0;font-weight:600;letter-spacing:-.01em}
  .mut{color:var(--mut);font-size:12px;font-variant-numeric:tabular-nums}
  form{padding:12px 20px;border-bottom:1px solid var(--line);display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  input,select,button{font:inherit;padding:6px 9px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg)}
  input[type=search]{min-width:240px}
  button{cursor:pointer}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;padding:20px}
  .card{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--card);display:flex;flex-direction:column}
  .ph{aspect-ratio:1;background:#fff;display:flex;align-items:center;justify-content:center}
  .ph img{width:100%;height:100%;object-fit:contain}
  .noimg{color:var(--mut);font-size:11px}
  .body{padding:10px 11px;display:flex;flex-direction:column;gap:6px;flex:1}
  .t{font-size:13px;line-height:1.35;font-weight:500}
  .row{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-top:auto}
  .p{font-variant-numeric:tabular-nums;font-weight:600}
  .p.none{font-weight:400;color:var(--mut)}
  .tag{font-size:11px;color:var(--mut)}
  .st{font-size:11px;padding:1px 6px;border-radius:99px;border:1px solid var(--line)}
  .st.in_stock{color:#047857;border-color:#04785744} .st.supplier{color:#a16207;border-color:#a1620744}
  .st.out_of_stock{color:var(--mut)}
  .pag{padding:0 20px 40px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
  .pag a{padding:5px 9px;border:1px solid var(--line);border-radius:6px;text-decoration:none;color:var(--fg)}
  .pag a[aria-current]{background:var(--fg);color:var(--bg)}
  a.slug{color:var(--mut);font-size:11px;text-decoration:none;word-break:break-all}
  a.slug:hover{text-decoration:underline}
</style></head><body>
<div class="band"><strong>Inspector de date pentru migrare.</strong> Nu este site-ul nou și nu are nicio legătură cu designul lui — designul se decide în Faza 2. Aici vezi exact ce a extras crawl-ul, ca să poți verifica dacă datele sunt corecte.</div>
<header>
  <h1>anvelope-ungheni.md — date extrase</h1>
  <span class="mut">${products.length.toLocaleString('ro-MD')} produse încărcate · ${esc(crawlLog)}</span>
  <span class="mut">imaginile se încarcă de pe site-ul live (încă nedescărcate local)</span>
</header>
<form method="get">
  <input type="search" name="q" value="${esc(p.get('q') ?? '')}" placeholder="caută titlu sau slug…">
  ${opt('width', uniq((x) => x.width).sort((a, b) => a - b), p.get('width'))}
  ${opt('aspect', uniq((x) => x.aspect).sort((a, b) => a - b), p.get('aspect'))}
  ${opt('diameter', uniq((x) => x.diameter).sort(), p.get('diameter'))}
  ${opt('season', ['vara', 'iarna', 'all_season'], p.get('season'))}
  ${opt('stock', ['in_stock', 'supplier', 'out_of_stock'], p.get('stock'), (v) => STOCK_LABEL[v])}
  ${opt('brand', uniq((x) => x.brand).sort(), p.get('brand'))}
  ${opt('sort', ['price_asc', 'price_desc', 'title'], p.get('sort'))}
  <button>filtrează</button>
  <a class="slug" href="/">reset</a>
  <a class="slug" href="/reload">reîncarcă datele</a>
  <span class="mut">${data.total.toLocaleString('ro-MD')} rezultate</span>
</form>
<div class="grid">
${data.items.map((x) => `<article class="card">
  <div class="ph">${x.image ? `<img loading="lazy" src="${esc(thumb(x.image))}" alt="${esc(x.title)}">` : '<span class="noimg">fără imagine</span>'}</div>
  <div class="body">
    <div class="t">${esc(x.title)}</div>
    <div class="tag">${esc(x.brand ?? '—')} · ${x.width ?? '?'}/${x.aspect ?? '?'} ${esc(x.diameter ?? '?')} ${esc(x.load_index ?? '')}${esc(x.speed_index ?? '')}${x.size_source === 'title' ? ' <em>(dim. din titlu)</em>' : ''}</div>
    <div class="row">
      <span class="p${x.price == null ? ' none' : ''}">${x.price == null ? 'preț la cerere' : money(x.price)}</span>
      <span class="st ${x.stock}">${STOCK_LABEL[x.stock] ?? esc(x.stock_raw ?? '?')}</span>
    </div>
    <a class="slug" href="/p/${encodeURIComponent(x.slug)}">/${esc(x.slug)}</a>
  </div>
</article>`).join('')}
</div>
<div class="pag">
${Array.from({ length: Math.min(data.pages, 40) }, (_, i) => i + 1).map((n) => {
  const u = new URLSearchParams(p); u.set('page', n);
  return `<a href="/?${u}"${n === data.page ? ' aria-current="page"' : ''}>${n}</a>`;
}).join('')}${data.pages > 40 ? `<span class="mut">… ${data.pages} pagini</span>` : ''}
</div>
</body></html>`);
}

function detail(res, slug) {
  const x = products.find((y) => y.slug === slug);
  if (!x) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('produs negăsit în datele extrase'); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(x.title)} — date extrase</title>
<style>
 :root{--fg:#16181c;--mut:#6b7280;--line:#e5e7eb;--bg:#fff;--card:#fafafa}
 @media(prefers-color-scheme:dark){:root{--fg:#e8e8e8;--mut:#9ca3af;--line:#2a2d32;--bg:#121417;--card:#181b1f}}
 body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.6 ui-sans-serif,system-ui,sans-serif}
 .wrap{max-width:900px;margin:0 auto;padding:24px 20px 60px}
 a{color:inherit} h1{font-size:20px;margin:.4em 0}
 .cols{display:grid;grid-template-columns:280px 1fr;gap:28px;align-items:start}
 @media(max-width:700px){.cols{grid-template-columns:1fr}}
 .ph{aspect-ratio:1;background:#fff;border:1px solid var(--line);border-radius:10px;display:flex;align-items:center;justify-content:center}
 .ph img{width:100%;height:100%;object-fit:contain}
 table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
 td,th{border-bottom:1px solid var(--line);padding:7px 4px;text-align:left;vertical-align:top}
 th{color:var(--mut);font-weight:500;width:190px}
 pre{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px;overflow:auto;font-size:12px}
 .mut{color:var(--mut)}
</style></head><body><div class="wrap">
<a class="mut" href="/">← înapoi la listă</a>
<h1>${esc(x.title)}</h1>
<div class="cols">
 <div class="ph">${x.image ? `<img src="${esc(thumb(x.image))}" alt="${esc(x.title)}">` : '<span class="mut">fără imagine</span>'}</div>
 <table>
  <tr><th>legacy product_id</th><td>${esc(x.id ?? '—')}</td></tr>
  <tr><th>slug RO</th><td><a href="${LIVE}/${esc(x.slug)}" target="_blank">/${esc(x.slug)}</a></td></tr>
  <tr><th>slug RU</th><td>${x.slug_ru ? `<a href="${LIVE}/ru/${esc(x.slug_ru)}" target="_blank">/ru/${esc(x.slug_ru)}</a>${x.slug_ru !== x.slug ? ' <span class="mut">(diferit)</span>' : ''}` : '<span class="mut">lipsă</span>'}</td></tr>
  <tr><th>brand</th><td>${esc(x.brand ?? '—')}</td></tr>
  <tr><th>preț</th><td>${x.price == null ? '<span class="mut">niciun preț în sursă</span>' : esc(money(x.price))}</td></tr>
  <tr><th>stoc</th><td>${esc(STOCK_LABEL[x.stock] ?? '?')} <span class="mut">(sursă: „${esc(x.stock_raw ?? '')}")</span></td></tr>
  <tr><th>dimensiune</th><td>${x.width ?? '?'}/${x.aspect ?? '?'} ${esc(x.diameter ?? '?')} ${esc(x.load_index ?? '')}${esc(x.speed_index ?? '')} <span class="mut">(sursă: ${esc(x.size_source)})</span></td></tr>
  <tr><th>sezon</th><td>${esc(x.season ?? '—')}</td></tr>
  <tr><th>breadcrumb</th><td>${esc(x.breadcrumbs.join(' › '))}</td></tr>
  <tr><th>imagine</th><td class="mut">${esc(x.image ?? '—')}</td></tr>
  <tr><th>meta title RO</th><td>${esc(x.meta_title_ro ?? '—')}</td></tr>
  <tr><th>meta descr. RO</th><td>${esc(x.meta_ro ?? '—')}</td></tr>
  <tr><th>meta title RU</th><td>${esc(x.meta_title_ru ?? '—')}</td></tr>
  <tr><th>meta descr. RU</th><td>${esc(x.meta_ru ?? '—')}</td></tr>
  <tr><th>descriere</th><td>${x.description ? esc(x.description) : '<span class="mut">nu există în sursă</span>'}</td></tr>
  <tr><th>produse similare (legacy)</th><td>${x.related.length ? x.related.map((s) => `<a href="/p/${encodeURIComponent(s)}">${esc(s)}</a>`).join('<br>') : '<span class="mut">—</span>'}</td></tr>
 </table>
</div>
<h2 style="font-size:15px">Atribute brute din sursă</h2>
<pre>${esc(JSON.stringify(x.attributes, null, 2))}</pre>
</div></body></html>`);
}

await load();
http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  if (u.pathname === '/reload') { await load(); res.writeHead(302, { Location: '/' }); return res.end(); }
  if (u.pathname.startsWith('/p/')) return detail(res, decodeURIComponent(u.pathname.slice(3)));
  if (u.pathname === '/') return page(res, query(u.searchParams), u.searchParams);
  res.writeHead(404); res.end('404');
}).listen(PORT, () => console.log(`Inspector pornit: http://localhost:${PORT}  (${products.length} produse)`));
