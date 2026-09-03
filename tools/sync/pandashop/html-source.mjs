/**
 * Sursa HTML — implementarea de azi a contractului din `source.mjs`.
 *
 * Nu e „scraping" în sensul rău: pandashop publică pe fiecare pagină de produs
 * un `application/ld+json` de tip Product (sku, nume, model, brand, descriere,
 * imagini, preț, disponibilitate, GTIN) și un tabel de caracteristici cu anotimp,
 * lățime, profil, diametru, indici de sarcină și viteză. Citim structura
 * declarată, nu ghicim din markup de prezentare — de aceea un redesign al lor nu
 * ne rupe, iar dacă dispare JSON-LD-ul, aruncăm `SourceStructureChanged` în loc
 * să importăm gunoi.
 *
 * Listarea o luăm din categoria de anvelope, paginată cu `?page_=page_N`.
 * Deliberat NU folosim `?sort_=`: robots.txt-ul lor îl interzice. Ordinea
 * implicită a catalogului e oricum descrescătoare după ID, adică exact
 * „cele mai noi întâi" de care are nevoie Partea A.2.
 */
import crypto from 'node:crypto';
import { ORIGIN } from './http.mjs';
import { SourceStructureChanged } from './source.mjs';

export const TYRES_PATH = '/catalog/auto_electronics/tires_and_wheels/tyres/';

const unescape = (s = '') => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&(#x?[0-9a-f]+);/gi, (m, c) => String.fromCodePoint(c[1] === 'x' || c[1] === 'X' ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10)));

const stripTags = (s = '') => unescape(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/* ------------------------------------------------------------------ listare */

/** Un card din listare. Conține deja destul cât să potrivim fără să deschidem produsul. */
function parseCards(html) {
  const out = [];
  const seen = new Set();
  for (const m of html.matchAll(/<div class="card-inner"[\s\S]*?(?=<div class="card-inner"|<div id="pnlPaging")/g)) {
    const card = m[0];
    const href = card.match(/href="(\/ro\/product\/[^"]+)"/)?.[1];
    if (!href) continue;
    /* Majoritatea URL-urilor se termină cu ID-ul lor numeric („…-01290622/"), dar
       o parte din catalogul vechi are slug de tip GUID. Pentru listare e de-ajuns
       un identificator stabil; cel adevărat e `sku` din JSON-LD, iar
       `fetchProduct` îl suprascrie cu el. Fără ramura asta pierdeam ~50 de
       produse, tăcut. */
    const id = href.match(/-(\d{6,10})\/$/)?.[1] ?? href.match(/\/([0-9a-f-]{16,})\/$/i)?.[1] ?? href.match(/\/([^/]+)\/$/)?.[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      url: href,
      title: stripTags(card.match(/itemprop="name">([\s\S]*?)<\/span>/)?.[1] ?? '') || null,
      price: Number(card.match(/itemprop="price" content="(\d+(?:\.\d+)?)"/)?.[1] ?? NaN) || null,
      oldPrice: Number((card.match(/card-price_old_inner">([\d\s]+)/)?.[1] ?? '').replace(/\s/g, '')) || null,
      available: /schema\.org\/InStock/.test(card),
      image: unescape(card.match(/itemprop="contentUrl" content="([^"]+)"/)?.[1] ?? '') || null,
    });
  }
  return out;
}

/** Câte produse declară ei în categorie. Zero = structura s-a schimbat (Partea G.1). */
function declaredTotal(html) {
  const n = html.match(/class="cards-total">\s*(\d[\d\s]*)/)?.[1];
  return n ? Number(n.replace(/\s/g, '')) : null;
}

const listHash = (c) => crypto.createHash('sha1')
  .update(`${c.title}|${c.price}|${c.oldPrice}|${c.available}`).digest('hex').slice(0, 16);

/* ------------------------------------------------------------------ produs */

function jsonLd(html, url) {
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const d = JSON.parse(m[1].trim());
      if (d && d['@type'] === 'Product') return d;
    } catch { /* pagina poate avea și alte blocuri ld+json, valide sau nu */ }
  }
  throw new SourceStructureChanged(`fără JSON-LD de tip Product: ${url}`);
}

/** Tabelul lor de caracteristici, ca perechi cheie->valoare, în limba paginii. */
function paramTable(html) {
  const out = {};
  for (const t of html.matchAll(/<table class="oneProd-paramsTbl">([\s\S]*?)<\/table>/g)) {
    for (const r of t[1].matchAll(/<tr[^>]*><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g)) {
      const k = stripTags(r[1]); const v = stripTags(r[2]);
      if (k && v) out[k] = v;
    }
  }
  return out;
}

/* Cheile din tabel, în ambele limbi. Ce nu e aici rămâne în `attributes`, brut. */
const P = {
  season:  ['Anotimp', 'Сезон'],
  type:    ['Tip', 'Тип'],
  width:   ['Lăţime', 'Lățime', 'Ширина'],
  aspect:  ['Înălţime', 'Înălțime', 'Высота профиля', 'Высота'],
  diam:    ['Diametru', 'Диаметр'],
  load:    ['Indice de sarcină', 'Индекс нагрузки'],
  speed:   ['Indice de viteza', 'Indice de viteză', 'Индекс скорости'],
  studded: ['Pivoţi', 'Pivoți', 'Шипы'],
  other:   ['Altele', 'Другое', 'Прочее'],
  brand:   ['Producător', 'Производитель'],
  model:   ['Model', 'Модель'],
  ean:     ['Cod EAN', 'EAN', 'Код EAN'],
};
const pick = (t, keys) => { for (const k of keys) if (t[k] != null) return t[k]; return null; };
const yes = (v) => v != null && /^(da|есть|yes|true)$/i.test(v.trim());

const AVAIL = {
  'https://schema.org/InStock': 'in_stock',
  'https://schema.org/PreOrder': 'supplier',
  'https://schema.org/BackOrder': 'supplier',
  'https://schema.org/LimitedAvailability': 'in_stock',
};

/** Imaginile, cerute direct la 900px — vezi Partea F. CDN-ul lor acceptă w/h în query. */
function imagesAt(d, px) {
  const list = Array.isArray(d.image) ? d.image : d.image ? [d.image] : [];
  const out = [];
  for (const im of list) {
    const raw = typeof im === 'string' ? im : im?.contentUrl;
    if (!raw) continue;
    out.push({ url: raw.replace(/([?&])w=\d+/, `$1w=${px}`).replace(/([?&])h=\d+/, `$1h=${px}`), alt: im?.caption ?? null });
  }
  return out;
}

export function createHtmlSource(http, { path = TYRES_PATH } = {}) {
  const abs = (u) => (u.startsWith('http') ? u : ORIGIN + u);

  async function* listProducts({ maxPages = Infinity, limit = Infinity, onPage } = {}) {
    let yielded = 0;
    let total = null;
    let lastPage = Infinity;   // se află de pe prima pagină, din totalul declarat
    const seen = new Set();
    for (let page = 1; page <= Math.min(maxPages, lastPage); page++) {
      const url = `${ORIGIN}/ro${path}${page > 1 ? `?page_=page_${page}` : ''}`;
      const html = await http.get(url);
      if (page === 1) {
        total = declaredTotal(html);
        if (!total) throw new SourceStructureChanged('listarea nu mai declară numărul de produse');
      }
      const cards = parseCards(html);
      /* Zero produse pe prima pagină = structura lor s-a schimbat. Nu continuăm. */
      if (page === 1 && cards.length === 0) throw new SourceStructureChanged('prima pagină de listare n-a dat niciun produs');
      if (cards.length === 0) return;
      /* Câte pagini are catalogul, aflat din prima. Fără asta am cere pagina de
         după ultima, iar serverul lor răspunde cu o eroare de rețea, nu cu o
         listă goală — adică o rulare de 138 de pagini ar muri la final. */
      if (page === 1) lastPage = Math.ceil(total / cards.length);

      /* Un ID văzut deja înseamnă că paginarea s-a repetat; ne oprim, nu ciclăm. */
      const noi = cards.filter((c) => !seen.has(c.id));
      if (noi.length === 0) return;
      for (const c of noi) seen.add(c.id);

      const refs = noi.map((c) => ({
        id: c.id,
        url: c.url,
        urlRu: c.url.replace('/ro/', '/ru/'),
        listHash: listHash(c),
        card: c,
      }));
      if (onPage && onPage(page, refs, { total }) === 'stop') return;

      for (const r of refs) {
        yield r;
        if (++yielded >= limit) return;
      }
    }
  }

  async function fetchProduct(ref) {
    const ro = await http.get(abs(ref.url));
    if (!ro) return null;                       // 404: a dispărut între listare și acum
    const dRo = jsonLd(ro, ref.url);
    const tRo = paramTable(ro);

    /* Perechea RU. `hreflang` e prima varianta incercata, dar NU e crezuta pe
       cuvant: paginile lor o scriu uneori cu doua prefixe de limba lipite
       (`/ru/ro/product/...`), iar aia raspunde 404. Un titlu RU lipsa trimite
       produsul intreg in carantina, deci merita a doua incercare pe URL-ul
       construit — acelasi slug, doar `/ro/` schimbat in `/ru/`. */
    const candidatiRu = [];
    const dinHreflang = ro.match(/hreflang="ru-MD" href="([^"]+)"/)?.[1];
    if (dinHreflang) candidatiRu.push(dinHreflang);
    const construit = abs(ref.urlRu ?? ref.url.replace('/ro/', '/ru/'));
    if (!candidatiRu.includes(construit)) candidatiRu.push(construit);

    let ruUrl = construit; let ru = '';
    for (const u of candidatiRu) {
      const h = await http.get(u);
      if (h) { ru = h; ruUrl = u; break; }
    }
    const dRu = ru ? (() => { try { return jsonLd(ru, ruUrl); } catch { return null; } })() : null;
    const tRu = ru ? paramTable(ru) : {};

    const other = `${pick(tRo, P.other) ?? ''} ${pick(tRu, P.other) ?? ''} ${dRo.name ?? ''}`;
    const w = pick(tRo, P.width); const a = pick(tRo, P.aspect); const dm = pick(tRo, P.diam);
    const numeric = (v) => { const n = Number(String(v ?? '').replace(/[^\d.,]/g, '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : null; };

    return {
      id: String(dRo.sku ?? ref.id),
      url: ref.url,
      titleRo: dRo.name ?? null,
      titleRu: dRu?.name ?? null,
      descriptionRo: dRo.description ?? null,
      descriptionRu: dRu?.description ?? null,
      brandRaw: dRo.brand?.name ?? pick(tRo, P.brand) ?? null,
      modelRaw: dRo.model ?? pick(tRo, P.model) ?? null,
      /* Dimensiunea reconstruită din tabel; dacă lipsește, `size_raw` rămâne null
         și o deduce parserul existent din titlu. */
      sizeRaw: numeric(w) && numeric(dm) ? `${numeric(w)}${numeric(a) ? `/${numeric(a)}` : ''} R${numeric(dm)}` : null,
      seasonRaw: pick(tRo, P.season) ?? pick(tRu, P.season),
      loadIndex: pick(tRo, P.load),
      speedIndex: pick(tRo, P.speed),
      isXl: /\bXL\b|Extra\s*Load/i.test(other),
      isRunflat: /run\s*flat|runflat|\bRFT\b|\bZP\b/i.test(other),
      isStudded: yes(pick(tRo, P.studded)) || yes(pick(tRu, P.studded)),
      priceMdl: Number(dRo.offers?.price ?? NaN) || null,
      oldPriceMdl: ref.card?.oldPrice ?? null,
      stockStatus: AVAIL[dRo.offers?.availability] ?? 'out_of_stock',
      images: imagesAt(dRo, 900),
      gtin: dRo.gtin ?? pick(tRo, P.ean) ?? null,
      attributes: { ro: tRo, ru: tRu },
    };
  }

  return { listProducts, fetchProduct, _internals: { parseCards, declaredTotal, paramTable, jsonLd } };
}
