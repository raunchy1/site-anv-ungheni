/**
 * Sursa HTML — pneuexpert.md.
 *
 * Implementează același contract ca `pandashop/source.mjs`, dar pe un magazin
 * construit altfel, cu trei diferențe care contează:
 *
 * 1. NU AU JSON-LD DE PRODUS. Au însă microdate schema.org (`itemprop` pentru
 *    preț, monedă, disponibilitate, imagine) și un tabel „Caracteristici" cu
 *    câmpuri separate: Brand, Model, Sezon, Mărime, Lățime, Înălțime profil,
 *    Diametru, indicele de greutate, indicele de viteză. Citim structura
 *    declarată, exact ca la pandashop — nu ghicim din markup de prezentare.
 *
 * 2. TITLUL LOR E ÎN ALTĂ ORDINE decât al nostru: „MINERVA 255/35 R18 94V
 *    FROSTRACK UHP XL (rear)" — marcă, dimensiune, indici, model. Catalogul
 *    nostru scrie „Marcă Model Dimensiune Indici". Nu încercăm să rescriem
 *    șirul lor cu expresii regulate: RECONSTRUIM titlul din câmpurile tabelului,
 *    care sunt deja separate. De aici iese un titlu în convenția noastră, pe
 *    care `parseTitle` îl citește ca pe oricare altul din catalog.
 *
 * 3. NU SE CERE PAGINA RUSĂ. La pandashop titlul RU era text rusesc și trebuia
 *    adus. Aici pagina RU arată exact același șir latin, doar cu „Шина" în loc
 *    de „Anvelopă" — prefix pe care oricum îl tăiem. Ar fi 5.500 de cereri în
 *    plus pe serverul unui partener, pentru zero informație.
 *
 * ENUMERAREA MERGE PE DOUĂ CĂI, pentru că niciuna singură nu e catalogul întreg:
 * sitemap-ul lor e din noiembrie 2023 (nu are produsele noi), iar listarea
 * paginată arată doar ce e pe stoc azi. Reuniunea celor două e catalogul.
 */
import { SourceStructureChanged } from '../pandashop/source.mjs';
import { config } from './config.mjs';

const ORIGIN = config.origin;

const unescape = (s = '') => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
  .replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&(#x?[0-9a-f]+);/gi, (m, c) => String.fromCodePoint(c[1] === 'x' || c[1] === 'X' ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10)));

const stripTags = (s = '') => unescape(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** Scripturile și stilurile nu sunt conținut; scoase o dată, nu la fiecare regex. */
const faraScript = (html) => html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ');

/* ------------------------------------------------------------- enumerarea */

/** Adresele de produs din sitemap-ul lor de catalog. */
export function parseSitemap(xml) {
  const out = [];
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const cale = m[1].replace(/^https?:\/\/[^/]+/, '');
    const ref = refDinUrl(cale);
    if (ref) out.push(ref);
  }
  return out;
}

/**
 * O adresă de catalog -> referință de produs, sau null dacă e pagină de categorie.
 *
 * Produsele stau și la `/catalog/tires/<categorie>/<produs>/`, și la
 * `/catalog/tires/<produs>/` — catalogul lor are două generații de adrese. Le
 * deosebim de categorii prin lista de categorii cunoscute, nu prin adâncime.
 */
export function refDinUrl(cale) {
  const m = String(cale).match(/^\/catalog\/tires\/(.+?)\/?$/);
  if (!m) return null;
  const bucati = m[1].split('/').filter(Boolean);
  if (bucati.length === 0 || bucati.length > 2) return null;
  if (bucati.length === 2 && !config.categorii.includes(bucati[0])) return null;
  const id = bucati[bucati.length - 1];
  if (bucati.length === 1 && config.categorii.includes(id)) return null;
  if (id === 'filter' || id === 'tires') return null;
  return { id, url: `/catalog/tires/${bucati.join('/')}/` };
}

/** Adresele de produs de pe o pagină de listare. */
export function parseListare(html) {
  const b = faraScript(html);
  const out = new Map();
  for (const m of b.matchAll(/href="(\/catalog\/tires\/[^"]+?\/)"/g)) {
    const ref = refDinUrl(m[1]);
    if (ref) out.set(ref.id, ref);
  }
  return [...out.values()];
}

/* ---------------------------------------------------------------- produsul */

/** Tabelul „Caracteristici", ca perechi cheie -> valoare. */
export function parseProprietati(html) {
  const out = {};
  for (const m of faraScript(html).matchAll(/<div class="detail-property-item">([\s\S]*?)<\/div>\s*<\/div>/g)) {
    const k = stripTags(m[1].match(/detail-property-title">([\s\S]*?)<\/div>/)?.[1] ?? '');
    const v = stripTags(m[1].match(/detail-property-value">([\s\S]*?)$/)?.[1] ?? '');
    if (k && v) out[k] = v;
  }
  return out;
}

/* Cheile tabelului lor, în română. Ce nu e aici rămâne în `attributes`, brut. */
const P = {
  brand: ['Brand', 'Бренд'],
  model: ['Model', 'Модель'],
  season: ['Sezon', 'Сезон'],
  size: ['Mărime', 'Marime', 'Размер'],
  width: ['Lățime anvelopa', 'Lăţime anvelopa', 'Ширина шины', 'Ширина'],
  aspect: ['Înălțime profil', 'Înălţime profil', 'Высота профиля'],
  diameter: ['Diametru', 'Диаметр'],
  load: ['Indicele de greutate', 'Индекс нагрузки'],
  speed: ['Indicele de viteza', 'Indicele de viteză', 'Индекс скорости'],
  type: ['Tip auto', 'Тип авто'],
  year: ['Anul de fabricare', 'Год выпуска'],
  country: ['Țara de origine', 'Tara de origine', 'Страна происхождения'],
};
const pick = (t, keys) => { for (const k of keys) if (t[k] != null && t[k] !== '') return t[k]; return null; };

const DISPONIBIL = {
  InStock: 'supplier',
  LimitedAvailability: 'supplier',
  PreOrder: 'supplier',
  BackOrder: 'supplier',
  OutOfStock: 'out_of_stock',
  SoldOut: 'out_of_stock',
  Discontinued: 'out_of_stock',
};

/* Chirilicele care arată exact ca literele latine, în ordinea din slug.mjs. */
const CHIRILICE_LATINE = { 'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'У': 'Y', 'Х': 'X' };

/**
 * Modelul, cules din numele lor când tabelul nu-l are.
 *
 * La ~7% din fișe lipsește rândul „Model" din caracteristici, dar numele îl
 * conține: „HANKOOK 235/50 R18 100V Dynapro HP2 RA33". Se scot pe rând marca,
 * dimensiunea, indicii și steagurile, iar ce rămâne e modelul. Fără pasul ăsta
 * anvelopele alea ar fi ajuns toate în carantină cu „model lipsă" — 19 din
 * primele 277 citite — deși modelul era scris pe pagină.
 *
 * Numele lor e cu majuscule; dacă am luat modelul de acolo, se scrie ca în
 * catalog („Dynapro HP2 RA33"), nu ca un strigăt.
 */
export function modelDinNume(nume, { brand, size, load, speed }) {
  /* Literele chirilice care arată ca latine apar și în numele lor: „95Т" cu Т
     rusesc. Fără normalizare, indicele nu se recunoaște și ajunge în model —
     s-a văzut pe Laufenn i*Fit Ice LW71, care ieșea „95Т i Fit Ice LW71". */
  let s = ` ${String(nume ?? '').replace(/[АВСЕНКМОРТУХ]/g, (c) => CHIRILICE_LATINE[c])} `;
  const taie = (re) => { s = s.replace(re, ' '); };

  if (brand) taie(new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'));
  if (size) taie(new RegExp(size.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*'), 'i'));
  /* Dimensiunea, și în forma în care o scriu ei în nume, dacă diferă de „Mărime". */
  taie(/\b\d{2,3}\s*[/x]\s*\d{1,3}(?:[.,]\d)?\s*(?:Z)?R\s*\d{1,2}(?:[.,]\d)?C?\b/i);
  taie(/\b\d{2,3}\s*(?:Z)?R\s*\d{1,2}C?\b/i);
  if (load) taie(new RegExp(`\\b${String(load).replace('/', '\\/')}\\s*${speed ?? ''}\\b`, 'i'));
  taie(/\b\d{2,3}(?:\/\d{2,3})?\s*[A-Z]{1,2}\b/);
  taie(/\b(XL|RunFlat|Run\s*Flat|RFT|RSC|ZP|SSR|TL|TT|\d{1,2}PR)\b/gi);
  taie(/\((front|rear|fata|față|spate)\)/gi);

  const model = s.replace(/\s+/g, ' ').trim();
  if (!model) return null;
  /* Doar dacă e strigat tot: „HP2" și „RA33" trebuie să rămână cum sunt. */
  const strigat = model === model.toUpperCase() && /[A-Z]{3,}/.test(model);
  return strigat
    ? model.toLowerCase().replace(/\b([a-z])([a-z]*)/g, (m, a, b) => a.toUpperCase() + b).replace(/\b([A-Z][a-z]*\d+)\b/g, (m) => m.toUpperCase())
    : model;
}

/**
 * Titlul, în convenția catalogului nostru: marcă · model · dimensiune · indici · XL.
 *
 * Se construiește din câmpuri, nu se rescrie șirul lor. Marcajele de poziție
 * („(front)", „(rear)") se păstrează: o anvelopă de punte față chiar e alt
 * produs, cu alt cod și alt preț, iar dacă le-am arunca două fișe diferite ar
 * primi același slug și una din ele n-ar mai intra niciodată în catalog.
 */
export function construiesteTitlu({ brand, model, size, load, speed, xl, runflat, pozitie }) {
  const bucati = [brand, model, size];
  const indici = `${load ?? ''}${speed ?? ''}`.trim();
  if (indici) bucati.push(indici);
  if (xl) bucati.push('XL');
  if (runflat) bucati.push('RunFlat');
  if (pozitie) bucati.push(`(${pozitie})`);
  return bucati.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

/** Dimensiunea, din câmpul lor gata format sau recompusă din cele trei numere. */
function dimensiune(props, numeLor) {
  const gata = pick(props, P.size);
  if (gata) {
    /* Câmpul „Mărime" e „255/35 R18". Litera C a anvelopelor de marfă lipsește de
       acolo, dar e în numele produsului — se ia de unde există. */
    const c = new RegExp(`${gata.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*C\\b`, 'i').test(numeLor);
    return c ? `${gata}C` : gata;
  }
  const w = pick(props, P.width); const a = pick(props, P.aspect); const d = pick(props, P.diameter);
  if (w && d) return a ? `${w}/${a} R${d}` : `${w} R${d}`;
  return null;
}

/**
 * O pagină de produs -> `SourceProduct`.
 *
 * @param {string} html   pagina RO
 * @param {{id: string, url: string}} ref
 */
export function parseProdus(html, ref) {
  const b = faraScript(html);

  const numeLor = stripTags(b.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '')
    .replace(/^\s*(anvelop[ăa]|anvelope|шина|шины)\s+/i, '').trim();
  if (!numeLor) throw new SourceStructureChanged(`fără <h1>: ${ref.url}`);

  const props = parseProprietati(b);
  if (Object.keys(props).length === 0) {
    throw new SourceStructureChanged(`fără tabelul de caracteristici: ${ref.url}`);
  }

  const pret = Number(b.match(/itemprop="price"\s+content="([\d.]+)"/)?.[1] ?? NaN);
  const disp = b.match(/itemprop="availability"\s+href="[^"]*schema\.org\/(\w+)"/)?.[1] ?? null;

  /* Steagurile stau în numele lor, nu în tabel. „XL" ca și cuvânt de sine
     stătător: „XLB" e un nume de model, nu un indice de sarcină mărită. */
  const xl = /\bXL\b/i.test(numeLor);
  const runflat = /\b(run\s*flat|runflat|rft|rsc|zp|ssr)\b/i.test(numeLor);
  const studded = /\b(шип|stud|pivot)/i.test(numeLor) || /\bstud\b/i.test(pick(props, P.model) ?? '');
  const pozitie = numeLor.match(/\((front|rear|fata|față|spate)\)/i)?.[1]?.toLowerCase() ?? null;

  const size = dimensiune(props, numeLor);
  const brand = pick(props, P.brand);
  const load = pick(props, P.load);
  const speed = pick(props, P.speed);
  /* Tabelul întâi, numele lor doar ca rezervă: acolo modelul e cu majuscule. */
  const model = pick(props, P.model) ?? modelDinNume(numeLor, { brand, size, load, speed });

  const titlu = construiesteTitlu({
    brand,
    model,
    size,
    load,
    speed,
    xl, runflat, pozitie,
  });

  return {
    id: ref.id,
    url: ref.url,
    /* Ambele limbi din același șir: pagina lor rusă arată exact același text
       latin, doar cu alt cuvânt de categorie în față. */
    titleRo: titlu || null,
    titleRu: titlu || null,
    /* Singurul text de pe pagina lor e meta-descrierea, care le numește
       magazinul. Nu se copiază; fișele noastre au oricum tabel de specificații. */
    descriptionRo: null,
    descriptionRu: null,
    brandRaw: brand,
    modelRaw: model,
    sizeRaw: size,
    seasonRaw: pick(props, P.season),
    loadIndex: load,
    speedIndex: speed,
    isXl: xl,
    isRunflat: runflat,
    isStudded: studded,
    priceMdl: Number.isFinite(pret) && pret > 0 ? pret : null,
    oldPriceMdl: null,
    stockStatus: DISPONIBIL[disp] ?? 'out_of_stock',
    images: imagini(b, numeLor),
    gtin: null,
    attributes: props,
    numeLor,
  };
}

/**
 * Fotografiile produsului, din galeria lui — nu din pagină la întâmplare.
 *
 * Pagina lor conține și pozele produselor recomandate de dedesubt; un regex peste
 * tot HTML-ul ar fi urcat în catalog fotografia altei anvelope. Galeria proprie e
 * `product-item-detail-slider-images-container`. `og:image` se adaugă la sfârșit
 * pentru că e o a doua variantă a aceleiași poze, uneori mai mare.
 */
export function imagini(html, alt) {
  const out = [];
  const vazute = new Set();
  const adauga = (src) => {
    if (!src || vazute.has(src)) return;
    vazute.add(src);
    out.push({ url: src.startsWith('http') ? src : `${ORIGIN}${src}`, alt });
  };

  const galerie = html.match(/<div class="product-item-detail-slider-images-container"[\s\S]*?(?=<div class="product-item-detail-slider-controls|<\/div>\s*<\/div>\s*<\/div>)/)?.[0] ?? '';
  for (const m of galerie.matchAll(/<img[^>]+src="(\/upload\/[^"]+)"/g)) adauga(m[1]);

  const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  if (og && !/logo/i.test(og)) adauga(og);

  return out;
}

/* --------------------------------------------------------------- contractul */

/** @returns {import('../pandashop/source.mjs').CatalogSource & {enumera: Function}} */
export function createPneuexpertSource(http) {
  const get = (cale) => http.get(cale.startsWith('http') ? cale : `${ORIGIN}${cale}`);

  /**
   * Toate referințele de produs: sitemap + listările celor șase categorii.
   *
   * Regula de oprire a paginării nu e „pagina goală": la ei, o pagină peste
   * ultima întoarce din nou pagina 1, cu 200 OK. Se oprește când setul de
   * produse se repetă — singurul semn cinstit că am trecut de capăt.
   */
  async function enumera({ log = () => {} } = {}) {
    const toate = new Map();

    const xml = await get(config.sitemap);
    const dinSitemap = parseSitemap(xml);
    for (const r of dinSitemap) toate.set(r.id, { ...r, dinSitemap: true });
    log(`· sitemap: ${dinSitemap.length} produse`);

    for (const cat of config.categorii) {
      let noiInCategorie = 0;
      let prima = null;
      for (let pagina = 1; pagina <= 200; pagina++) {
        const url = pagina === 1
          ? `/catalog/tires/${cat}/`
          : `/catalog/tires/${cat}/?PAGEN_1=${pagina}`;
        const refs = parseListare(await get(url));
        if (refs.length === 0) break;
        const amprenta = refs.map((r) => r.id).sort().join('|');
        if (pagina === 1) prima = amprenta;
        else if (amprenta === prima) break;  /* a dat roata înapoi la pagina 1 */
        for (const r of refs) {
          const vechi = toate.get(r.id);
          if (!vechi) { toate.set(r.id, { ...r, inStoc: true }); noiInCategorie++; }
          else vechi.inStoc = true;
        }
        if (refs.length < 20) break;
      }
      log(`· ${cat}: +${noiInCategorie} produse care nu erau în sitemap`);
    }

    return [...toate.values()];
  }

  async function fetchProduct(ref) {
    const html = await get(ref.url);
    if (!html || html.length < 500) return null;   /* 404 la ei */
    return parseProdus(html, ref);
  }

  return { enumera, fetchProduct };
}
