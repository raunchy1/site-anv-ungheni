/** Parsere pure HTML -> obiect. Fără efecte secundare, testabile pe fișiere salvate. */

const decode = (s = '') => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&(#x?[0-9a-f]+);/gi, (m, c) => String.fromCodePoint(c[0] === '#' && (c[1] === 'x' || c[1] === 'X') ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10)))
  .trim();

const text = (html = '') => decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));

const one = (html, re, g = 1) => { const m = html.match(re); return m ? decode(m[g]) : null; };

/** Blocul principal de conținut, fără header/footer. */
function contentBlock(html) {
  const i = html.indexOf('<div id="content"');
  if (i < 0) return html;
  const j = html.indexOf('<footer', i);
  return html.slice(i, j > 0 ? j : undefined);
}

/**
 * Dimensiunea anvelopei, în două sisteme:
 *   metric   — 245/40 R20        (lățime mm / profil % R jantă)
 *   imperial — 31x10.50 R15      (diametru exterior × lățime, în inci — off-road)
 * Catalogul are 20 de anvelope imperiale; filtrele vechi le excludeau din „Latime",
 * ceea ce explică diferența 14.982 vs 15.002 din contoare.
 */
const IMPERIAL = /(?<![\d.])(\d{2})\s*[x×\/]\s*(\d{1,2}[.,]\d{1,2})\s*R?\s*(\d{2})(?:LT|C)?/i;
const METRIC = /(\d{2,3}(?:[.,]\d+)?)\s*[/x]\s*(\d{2,3}(?:[.,]\d+)?)\s*(?:R|ZR)\s*(\d{1,2}(?:[.,]\d+)?C?)/i;
const METRIC_NO_ASPECT = /(\d{2,3}(?:[.,]\d+)?)\s*(?:R|ZR)\s*(\d{1,2}C?)/i;

const num = (v) => (v == null ? null : Number(String(v).replace(',', '.')));

export function parseSize(raw) {
  const empty = { size_system: null, width: null, aspect: null, diameter: null, overall_diameter_in: null, section_width_in: null, size_raw: null };
  if (!raw) return empty;
  const s = raw.replace(/\s+/g, ' ').trim();

  const imp = s.match(IMPERIAL);
  if (imp) {
    return {
      size_system: 'imperial',
      width: null,
      aspect: null,
      diameter: `R${imp[3]}`,
      overall_diameter_in: num(imp[1]),
      section_width_in: num(imp[2]),
      size_raw: `${imp[1]}x${String(imp[2]).replace(',', '.')} R${imp[3]}`,
    };
  }

  const m = s.match(METRIC);
  if (m) {
    return {
      size_system: 'metric',
      width: num(m[1]),
      aspect: num(m[2]),
      diameter: `R${m[3].toUpperCase()}`,
      overall_diameter_in: null,
      section_width_in: null,
      size_raw: `${num(m[1])}/${num(m[2])} R${m[3].toUpperCase()}`,
    };
  }

  const m2 = s.match(METRIC_NO_ASPECT);
  if (m2) {
    return {
      size_system: 'metric',
      width: num(m2[1]),
      aspect: null,
      diameter: `R${m2[2].toUpperCase()}`,
      overall_diameter_in: null,
      section_width_in: null,
      size_raw: `${num(m2[1])} R${m2[2].toUpperCase()}`,
    };
  }
  // Fără potrivire, `size_raw` rămâne NULL. Textul original se păstrează oricum în
  // `attributes`. Un câmp de dimensiune care conține „R15" sau titlul unui senzor
  // TPMS induce în eroare orice cod care îl citește ca dimensiune.
  return empty;
}

// Indicii de viteză sunt uneori tastați cu litere chirilice care arată identic cu cele latine.
// 3 produse au „Н" (U+041D) în loc de „H". Normalizăm la import, nu la randare.
const CYRILLIC_LOOKALIKE = { 'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'К': 'K', 'М': 'M',
  'О': 'O', 'Р': 'P', 'Т': 'T', 'У': 'Y', 'Х': 'X', 'Ј': 'J' };
const deCyrillic = (v) => (v ? [...v].map((ch) => CYRILLIC_LOOKALIKE[ch] ?? ch).join('') : v);

const SEASON_MAP = {
  vara: 'vara', 'vară': 'vara', 'лето': 'vara', 'летние': 'vara',
  iarna: 'iarna', 'iarnă': 'iarna', 'зима': 'iarna', 'зимние': 'iarna',
  'all season': 'all_season', 'all-season': 'all_season', 'всесезонные': 'all_season', 'всесезон': 'all_season',
};
export const normalizeSeason = (v) => (v ? SEASON_MAP[v.trim().toLowerCase()] ?? null : null);

/** Perechile atribut->valoare din tabul Descriere. */
function attributes(block) {
  const out = {};
  for (const m of block.matchAll(/<div class="short-attribute">\s*<span class="attr-name">(.*?)<\/span>\s*<span class="attr-text">(.*?)<\/span>/gs)) {
    const k = text(m[1]); const v = text(m[2]);
    if (k && v) out[k] = v;   // atributele goale din sursă nu se propagă mai departe
  }
  return out;
}

/** Doar galeria produsului: blocul .image-block, nu carusele de produse recomandate. */
function galleryBlock(block) {
  const i = block.indexOf('class="image-block');
  if (i < 0) return '';
  const stop = [block.indexOf('class="center-inf-block', i), block.indexOf('class="info-manufacturer', i), block.indexOf('id="tab-description', i)]
    .filter((x) => x > i);
  return block.slice(i, stop.length ? Math.min(...stop) : undefined);
}

function images(block) {
  const g = galleryBlock(block);
  const urls = [];
  const real = (u) => u && !u.includes("'") && !u.includes('+') && /\/image\//.test(u);
  for (const m of g.matchAll(/data-fancybox="gallery"[^>]*href="([^"]*)"/g)) if (real(m[1])) urls.push(m[1]);
  for (const m of g.matchAll(/<img[^>]+src="([^"]*\/image\/[^"]*)"/g)) if (real(m[1])) urls.push(m[1]);
  const full = new Set();
  for (const u of urls) {
    // /image/cache/catalog/product/2954662-700x800.jpg -> originalul /image/catalog/product/2954662.jpg
    const m = u.match(/\/image\/cache\/(catalog\/.*?)-\d+x\d+(\.[a-z]+)$/i);
    full.add(m ? `/image/${m[1]}${m[2]}` : u.replace(/^https?:\/\/[^/]+/, ''));
  }
  return [...full];
}

/** Slug-urile produselor din blocul „Recomandam" — utile pentru „produse similare". */
function relatedSlugs(block, html) {
  const i = block.indexOf('class="image-block');
  const tail = i < 0 ? block : block.slice(block.indexOf('id="tab-description') > 0 ? 0 : 0);
  const out = new Set();
  for (const m of tail.matchAll(/<a href="https:\/\/anvelope-ungheni\.md\/(?:ru\/)?([a-z0-9][a-z0-9\-]{6,})"[^>]*>\s*<img/g)) out.add(m[1]);
  return [...out];
}

const STOCK = {
  'în stoc': 'in_stock', 'in stoc': 'in_stock', 'в наличии': 'in_stock',
  'stoc furnizor': 'supplier', 'под заказ': 'supplier', 'на складе поставщика': 'supplier',
  'stoc epuizat': 'out_of_stock', 'нет в наличии': 'out_of_stock', 'закончился': 'out_of_stock',
  'la comanda': 'supplier', 'la comandă': 'supplier',
};

/** Parsează o pagină de produs (RO sau RU). */
export function parseProduct(html, sourceUrl) {
  const block = contentBlock(html);
  const attrs = attributes(block);
  const stockBlock = one(block, /<div class="info-product-stock">([\s\S]*?)<\/div>/) ?? '';
  const stockRaw = text(stockBlock);
  // 29 de produse au blocul de stoc gol, dar cu clasa `qty-not-in-stock`:
  // eticheta OpenCart lipsește, starea e totuși „epuizat".
  const stockClass = /qty-not-in-stock/.test(stockBlock) ? 'out_of_stock'
    : /stock_status_success/.test(stockBlock) ? 'supplier' : null;
  const priceRaw = one(block, /<span class='autocalc-product-price'>([^<]*)<\/span>/)
    ?? one(block, /class="autocalc-product-price"[^>]*>([^<]*)</);
  const oldRaw = one(block, /<span class="price-old"[^>]*>([^<]*)</);
  const seasonKey = attrs['Sezon'] ?? attrs['Сезон'] ?? null;
  const title = text(one(html, /<h1 class="h1-prod-name">([\s\S]*?)<\/h1>/) ?? one(html, /<h1[^>]*>([\s\S]*?)<\/h1>/) ?? '');
  // Unele produse au atributul Dimensiune prezent dar GOL, altele îl ratează complet.
  // În ambele cazuri cădem pe titlu, care conține întotdeauna 205/55 R16.
  const sizeAttr = (attrs['Dimensiune'] || attrs['Размер'] || '').trim();
  const fromAttr = parseSize(sizeAttr);
  // Atributul e uneori gol, alteori conține doar janta („R15") la anvelopele imperiale.
  // Titlul conține întotdeauna dimensiunea completă, deci e plasa de siguranță.
  const size = fromAttr.diameter && (fromAttr.width || fromAttr.section_width_in) ? fromAttr : parseSize(title);

  return {
    source_url: sourceUrl,
    product_id: one(block, /name="product_id" value="(\d+)"/),
    canonical: one(html, /property="og:url" content="([^"]*)"/),
    title: title || null,
    brand: text(one(block, /<div class="info-manufacturer">[\s\S]*?<span>([\s\S]*?)<\/span>/) ?? '') || attrs['Producator'] || attrs['Производитель'] || null,
    brand_url: one(block, /<div class="info-manufacturer">[\s\S]*?<a href="([^"]*)"/),
    badge: text(one(block, /<div class="sticker-ns[^"]*">([\s\S]*?)<\/div>/) ?? '') || null,
    price_raw: priceRaw && priceRaw.trim(),
    price: priceRaw ? Number(priceRaw.replace(/[^\d,.]/g, '').replace(/\s/g, '').replace(',', '.')) : null,
    old_price: oldRaw ? Number(oldRaw.replace(/[^\d,.]/g, '').replace(',', '.')) : null,
    stock_raw: stockRaw || null,
    stock_status: STOCK[stockRaw.toLowerCase()] ?? stockClass,
    season_raw: seasonKey,
    season: normalizeSeason(seasonKey),
    ...size,
    size_source: size === fromAttr ? 'attribute' : (size.diameter ? 'title' : 'none'),
    load_index: attrs['Indice de sarcina'] ?? attrs['Индекс нагрузки'] ?? null,
    speed_index: deCyrillic(attrs['Indice de viteza'] ?? attrs['Индекс скорости'] ?? null),
    // marcaje derivate din titlu și atribute
    is_xl: /\bXL\b/.test(title),
    is_runflat: Object.keys(attrs).some((k) => /runflat/i.test(k))
      || /\bRun[\s-]?Flat\b|\bRFT\b|\bROF\b|\bSSR\b|\bZP\b/i.test(title),
    is_studded: /\bstud/i.test(title),
    is_commercial: /C$/.test(size.diameter ?? '') || /\bC\b/.test(attrs['Dimensiune'] ?? ''),
    attributes: attrs,
    images: images(block),
    related_slugs: relatedSlugs(block, html),
    // OpenCart lasă adesea `<p><br></p>` în loc de câmp gol. Un înveliș HTML fără
    // text util nu e o descriere; altfel raportăm conținut care nu există.
    description_html: (() => {
      const raw = (one(block, /<div class="description-p">([\s\S]*?)<\/div>/) ?? '').trim();
      return text(raw).length > 2 ? raw : null;
    })(),
    meta_title: one(html, /<title>([\s\S]*?)<\/title>/),
    meta_description: one(html, /<meta name="description" content="([^"]*)"/),
    reviews_count: Number(one(block, /Recenzii\s*<sup>(\d+)<\/sup>/) ?? one(block, /Отзывы\s*<sup>(\d+)<\/sup>/) ?? 0),
    category: /senzori presiune|датчики давления/i.test((one(html, /<ul class="breadcrumb">([\s\S]*?)<\/ul>/) ?? '')) ? 'tpms' : 'anvelope',
    breadcrumbs: [...html.matchAll(/<ul class="breadcrumb">([\s\S]*?)<\/ul>/g)]
      .flatMap((m) => [...m[1].matchAll(/<span>([\s\S]*?)<\/span>/g)].map((x) => text(x[1]))),
    lang: one(html, /<html dir="ltr" lang="(\w+)"/),
  };
}

/** Pagină de serviciu / informațională: păstrăm HTML-ul integral al corpului. */
export function parseInfoPage(html, sourceUrl) {
  const block = contentBlock(html);
  return {
    source_url: sourceUrl,
    canonical: one(html, /property="og:url" content="([^"]*)"/),
    title: text(one(html, /<h1[^>]*>([\s\S]*?)<\/h1>/) ?? ''),
    meta_title: one(html, /<title>([\s\S]*?)<\/title>/),
    meta_description: one(html, /<meta name="description" content="([^"]*)"/),
    body_html: block.replace(/<script[\s\S]*?<\/script>/gi, '').trim(),
    body_text: text(block),
    lang: one(html, /<html dir="ltr" lang="(\w+)"/),
  };
}
