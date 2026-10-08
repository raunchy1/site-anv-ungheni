/**
 * Sursa autodoctor.md — listările randate pe server.
 *
 * Fiecare pagină de listare are în ea starea aplicației Angular, ca JSON, într-un
 * `<script id="autodoctor-state">`. Acolo stau, pe fiecare anvelopă, câmpurile
 * declarate de ei: lățime, înălțime, diametru, sezon, indice de viteză (uneori
 * și de sarcină), preț, stoc, marcă și poze. Citim structura declarată — nu
 * ghicim din markup.
 *
 * TREI ȘIRURI CU NUMELE, NICIUNUL COMPLET:
 *
 *   name         „GY-215/55R16 UG PERF+"        prefix intern + model prescurtat
 *   sku          „215/55R16 UG PERF +"          dimensiune + model, uneori gol
 *   application  „215/55R16 93H UG PERF 3 зима" dimensiune, indici, model, sezon
 *
 * Indicele de sarcină stă aproape mereu doar în `application` (la ~8% e și în
 * atribute). Modelul se ia din `sku`, apoi din `name`, apoi din `application` —
 * în ordinea în care e mai puțin zgomotos.
 *
 * PAGINA RUSĂ NU SE CERE. Numele lor sunt aceleași în ambele limbi, latinești;
 * atributele vin oricum după identificator, nu după text, pentru că serverul lor
 * le întoarce uneori în rusă și pe adresa românească.
 */
import { config } from './config.mjs';
import { construiesteTitlu } from '../pneu/json-source.mjs';

const ORIGIN = config.origin;

/* Identificatorii atributelor lor. Textul poate fi în română sau în rusă. */
const A = { sezon: 15, vehicul: 17, viteza: 27, sarcina: 28, latime: 31, inaltime: 32, diametru: 33 };
const SEZON = { 19: 'vara', 20: 'iarna', 21: 'all season' };
/* „Скутер"/„Мото" n-au apărut încă, dar dacă apar nu sunt anvelope de mașină. */
const VEHICUL_RESPINS = /scuter|скутер|мото|moto/i;

/** Mărcile-umbrelă, sub care ei pun anvelope de la mai mulți producători. */
const MARCA_GENERICA = /^(прочие|altele|other|others|diverse)$/i;

/* ------------------------------------------------------------- starea */

/**
 * Lista de produse din starea paginii, cu totalurile ei. `null` dacă pagina e
 * coaja goală a aplicației — semn că serverul lor nu ne-a randat-o.
 */
export function parseListare(html) {
  const m = String(html ?? '').match(/<script id="autodoctor-state" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  let stare;
  try { stare = JSON.parse(m[1]); } catch { return null; }
  for (const v of Object.values(stare)) {
    const b = v && typeof v === 'object' ? v.b : null;
    if (b && Array.isArray(b.items) && 'pages' in b && 'total' in b) {
      return { items: b.items, total: Number(b.total), pagini: Number(b.pages), pagina: Number(b.page) };
    }
  }
  return null;
}

/* ------------------------------------------------------------- câmpurile */

const LATIN = { А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H', О: 'O', Р: 'P', С: 'C', Т: 'T', Х: 'X', У: 'Y' };

const valoare = (item, id) => item.attributes?.find((a) => Number(a.slug) === id)?.values?.[0] ?? null;

/** Spațiile lor: tab-uri, spații duble, „Т" chirilic în loc de „T" latin. */
const curata = (s = '') => String(s)
  .replace(/[\t ]+/g, ' ')
  /* Majusculele chirilice care arată latinesc: „88Т", „16С", „НP RX3", „ХL".
     Literele mici rămân: după ele recunoaștem cuvintele rusești („лето"). */
  .replace(/[АВЕКМНОРСТХУ]/g, (c) => LATIN[c])
  /* „81Tзима", „XLзима": sezonul lipit de indici. */
  .replace(/([A-Za-z0-9])(?=(зима|лето|всесезон))/g, '$1 ')
  .replace(/\s+/g, ' ')
  .trim();

/*
 * Dimensiunea, oriunde ar sta în șir: „215/55R16", „215/50ZR17", „LT245/75R16",
 * „195/55 R 16", „275/30 ZR 20", „265/55/R19", „17.5", și fără înălțime:
 * „185R14C".
 */
const RE_DIM = /(?:^|[\s(-]|LT)(\d{3})(?:\/(\d{2,3}))?[\s/]*Z?R\s*(\d{2}(?:[.,]5)?)(C|LT)?(?=[\s,)]|$|\d{2,3}[A-Z])/i;

/**
 * Lățime, înălțime, diametru și sufixul C. Atributele întâi; șirurile doar
 * dacă lipsesc. Diametrul lor „16С" are C-ul chirilic, iar „22,5" are virgulă.
 * Anvelopele de marfă fără înălțime („185R14C") se scriu „185 R14C", ca în
 * catalogul nostru.
 */
export function dimensiuneDin(item) {
  const sku = curata(item.sku);
  const app = curata(item.application);
  const dinSir = sku.match(RE_DIM) ?? app.match(RE_DIM) ?? curata(item.name).match(RE_DIM);

  const width = Number(valoare(item, A.latime)?.name) || Number(dinSir?.[1]) || null;
  const aspect = Number(valoare(item, A.inaltime)?.name) || Number(dinSir?.[2]) || null;
  const diaBrut = curata(valoare(item, A.diametru)?.name ?? '') || (dinSir ? `${dinSir[3]}${dinSir[4] ? 'C' : ''}` : '');
  const typeC = /C$/i.test(diaBrut) || Boolean(dinSir?.[4]);
  const diameter = diaBrut.replace(/C$/i, '').replace(',', '.') || null;

  if (!width || !diameter) return null;
  /* Fără înălțime e cinstit doar la anvelopele de marfă; în rest e o lipsă. */
  if (!aspect && !typeC) return null;
  const size = aspect ? `${width}/${aspect} R${diameter}${typeC ? 'C' : ''}` : `${width} R${diameter}C`;
  return { width, aspect, diameter, typeC, size };
}

/** Șirul fără dimensiune — acolo stau modelul și indicii, înainte sau după ea. */
function faraDimensiune(s) {
  return curata(s).replace(RE_DIM, ' ').replace(/\s+/g, ' ').trim();
}

/* Indicii: „93H", „104/102 T", „114 T", „(97Y)", „98XLV", „107TXL", „156L154M". */
const RE_INDICI = /(?:^|[\s(])(\d{2,3}(?:\/\d{2,3})?)\s?(?:XL\s?)?([A-Z])(?:XL)?(?=[\s)]|$)/;

/**
 * Indicii de sarcină și viteză. Viteza vine din atribut („H ( 210 Km/h )");
 * sarcina din atribut („103 ( 875 Kg)") sau din `application`.
 */
export function indiciDin(item) {
  const vitezaAttr = valoare(item, A.viteza)?.name?.trim()?.[0]?.toUpperCase() ?? null;
  const sarcinaAttr = valoare(item, A.sarcina)?.name?.match(/^\s*(\d{2,3}(?:\/\d{2,3})?)/)?.[1] ?? null;
  const m = faraDimensiune(item.application ?? '').match(RE_INDICI);
  return { loadIndex: sarcinaAttr ?? m?.[1] ?? null, speedIndex: vitezaAttr ?? m?.[2] ?? null };
}

const RE_XL = /\bXL|\d{2,3}\s?XL|\d[A-Z]XL\b|\bEXTRA[\s-]?LOAD\b/i;
const RE_RUNFLAT = /\bRUN[\s-]?(?:ON[\s-]?)?FLAT\b|\bRFT\b|\bROF\b|\bSSR\b|\bZP\b|\bDSST\b/i;

/*
 * Ce nu e nume de model în `application`: steaguri, omologări de țară, coduri
 * de fabrică, note de depozit. Lista e făcută pe cele 2.136 de rânduri ale lor
 * din 8 octombrie 2026, nu din imaginație.
 */
const ZGOMOT = [
  /\(\s*[^()]*[а-яё][^()]*\)/gi,                          // „(защита диска)", „(Mercedes original)" după tăierea sezonului
  /\(Mercedes original\)/gi,
  /\b\d{3}[A-Z]\d{3}[A-Z]\b/g,                           // „156L154M" la camioane
  /(?:^|\s)\(?\d{2,3}(?:\/\d{2,3})?\s?(?:XL\s?)?[A-Z](?:XL)?\)?(?=\s|$)/g, // indicii
  /\b\d{1,2}\s?PR\b/gi,
  /\bWINTER TYRE\b/gi,
  /(^|\s)C(?=\s|$)/g,                                   // „WINTER TYRE C 106/104S AW11"
  /\bCW\s*\(HB\)|\(HB\)|\bHB\b|\bECE-S\b|\bECE\b|\bPCI\b|\bDCH\b|\bDZH2\b|\bVCM\b|\bP-trial\b|\bCCC\b|\bFHE\d*\b/gi,
  /\b(?:XL|FP|MFS|MS|M\+S|3PSF|3PMSF|LRR|ROF|RFT|RunOnFlat|TL|TT|LA|LT|AU2|DA)\b/gi,
  /\bXL(?=[A-Za-zа-я])/g,                                 // „99V XLзима"
  /\b20[12]\d\b|\b\d{2}г\b/g,                             // anul de fabricație
  /\b(?:Germany|France|JAPAN|Франция|УСИЛЕНАЯ)\b|!+/gi,
  /\(\+\)/g,
];

/** Modelul din `application`: tot ce rămâne după dimensiune, indici, sezon, marcă și zgomot. */
export function modelDinAplicatie(app, marca) {
  let s = faraDimensiune(app ?? '')
    /* „зима (защита диска)", „лето, дата производства - 2021": tot ce e după sezon. */
    .replace(/[\s,]+(зима|лето|всесезонка|всесезонные|всесезон\S*|шип\S*)(?=[\s,(!]|$)[\s\S]*$/i, '')
    .replace(/(зима|лето)$/i, '');
  /* Orice cuvânt rusesc rămas e o notă de depozit („евровсесезонные,
     снежинка+горка", „ЗИМА !!!"): de acolo încolo nu mai e model. */
  s = s.replace(/[\s,]*\S*[а-яё][\s\S]*$/i, '');
  if (marca) s = s.replace(new RegExp(`(^|\\s)${marca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'gi'), ' ');
  for (const re of ZGOMOT) s = s.replace(re, ' ');
  /* Annaite scrie „AN 606 ( VANTAGE XU1 )"; la noi e „AN606". Codul de fabrică
     e numele, paranteza e porecla comercială. */
  s = s.replace(/\b(AN)\s(\d{3})\b\s*\([^()]*\)/g, '$1$2').replace(/\b(AN)\s(\d{3})\b/g, '$1$2');
  return s.replace(/\(\s*\)/g, ' ').replace(/\s+/g, ' ').replace(/^[\s,/-]+|[\s,/-]+$/g, '').trim();
}

/** Modelul din `sku`, rezerva: „225/45R17 94W XU1" -> „XU1". */
function modelDinSku(item, marca) {
  let s = faraDimensiune(item.sku ?? '').replace(/^[A-Z]{2,7}-\S*/, ' ');
  if (marca) s = s.replace(new RegExp(`(^|\\s)${marca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'gi'), ' ');
  for (const re of ZGOMOT) s = s.replace(re, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/*
 * Modele pe care ei le scriu mai scurt decât fabricantul și decât catalogul
 * nostru. Kelly își scrie gama de vară fără „Summer" („KELLY HP лето"); Leao
 * scrie „iGREEN" pentru „iGreen All Season". Doar perechi văzute la ei.
 */
const ALIAS_MODEL = {
  KELLY: { HP: 'Summer HP', UHP: 'Summer UHP', ST: 'Summer ST' },
  LEAO: { IGREEN: 'iGreen All Season', 'IGREEN VAN 4S': 'iGreen Van 4S' },
};

/**
 * Modelul. ÎNTÂI DIN `application`, nu din `sku`.
 *
 * Catalogul nostru are deja majoritatea anvelopelor lor (Joyroad, Hilo,
 * Habilead, Crosswind veneau din aceeași rețea de distribuție), iar acolo
 * modelul e scris ca în `application`: „Winter RX808", „Arctic S8", „Genesys
 * XP1". `sku`-ul lor scrie „RX808", „S8", „XP1" — luat de acolo, potrivirea
 * n-ar recunoaște fișele noastre și am dubla vreo 1.500 de anvelope.
 */
export function modelDin(item, marca) {
  /* Uneori `application` e chiar numele lor, cu prefixul intern: „GY-215/60R17 …". */
  const prefix = String(item.name ?? '').match(/^([A-Z]{2,7})-/)?.[1];
  const dinAplicatie = modelDinAplicatie(item.application, marca)
    .replace(prefix ? new RegExp(`^${prefix}\\b\\s*`) : /^$/, '');
  if (dinAplicatie && dinAplicatie.length <= 40 && /[A-Za-z]{2}|[A-Za-z]\d/.test(dinAplicatie)) {
    return ALIAS_MODEL[String(marca).toUpperCase()]?.[dinAplicatie.toUpperCase()] ?? dinAplicatie;
  }
  return modelDinSku(item, marca) || dinAplicatie || null;
}

/**
 * Marca. De regulă `brand.name`; sub „ПРОЧИЕ" („Altele") pun însă mai mulți
 * producători, iar marca adevărată stă în `application`, între dimensiune și
 * model: „215/65R15C Black ROYAL VAN A/S 104/102 T".
 */
export function marcaDin(item) {
  const nume = String(item.brand?.name ?? '').trim();
  if (nume && !MARCA_GENERICA.test(nume)) return nume;
  const rest = faraDimensiune(item.application ?? '');
  const model = faraDimensiune(item.sku ?? '').split(' ')[0];
  const i = model ? rest.toUpperCase().indexOf(model.toUpperCase()) : -1;
  const inainte = i > 0 ? rest.slice(0, i).trim() : '';
  return inainte && /^[A-Za-z][\w-]{1,20}$/.test(inainte) ? inainte : null;
}

/** Poza mare: `wd` e 800×800; listarea dă `wc`, 400×400, de pe aceeași cale. */
export function imaginiDin(item, alt) {
  const vazute = new Set();
  const out = [];
  for (const cale of item.images ?? []) {
    if (!cale || /noimage|no-image|placeholder/i.test(cale)) continue;
    const mare = String(cale).replace(/\/w[a-d]\//, '/wd/');
    const url = mare.startsWith('http') ? mare : `${ORIGIN}${mare}`;
    if (vazute.has(url)) continue;
    vazute.add(url);
    out.push({ url, alt });
  }
  return out;
}

/**
 * O anvelopă din listare -> forma comună a fotografiilor (aceeași ca la
 * pneuexpert și pneu.md), sau `{respins}` cu motivul.
 */
export function produsDin(item) {
  const vehicul = valoare(item, A.vehicul)?.name ?? '';
  if (VEHICUL_RESPINS.test(vehicul)) return { respins: `vehicul: ${vehicul}`, id: String(item.id) };

  const dim = dimensiuneDin(item);
  const marca = marcaDin(item);
  const { loadIndex, speedIndex } = indiciDin(item);
  const model = modelDin(item, marca);
  const toate = [item.name, item.sku, item.application].map(curata).join(' ');
  const pret = Number(item.price);
  const sezonId = valoare(item, A.sezon)?.slug;

  const isXl = RE_XL.test(toate);
  const isRunflat = RE_RUNFLAT.test(toate);
  /* Titlul în convenția catalogului: „Marcă Model Dimensiune Indici". Același
     șir în ambele limbi — numele lor sunt latinești și în pagina rusă. */
  /* „NOVA-FORCE", „NORD-TRAC2": `titluModel` nu îmblânzește cuvintele cu cratimă. */
  const modelAfisat = model?.replace(/\b([A-Z]{3,})-([A-Z]{3,})\b/g, (_, x, y) => `${x[0]}${x.slice(1).toLowerCase()}-${y[0]}${y.slice(1).toLowerCase()}`);
  const titlu = dim && marca
    ? construiesteTitlu({ marca, model: modelAfisat, size: dim.size, loadIndex, speedIndex, xl: isXl, runflat: isRunflat })
    : null;

  return {
    id: String(item.id),
    url: `${ORIGIN}/shop/products/${item.slug}`,
    titleRo: titlu,
    titleRu: titlu,
    brandRaw: marca,
    modelRaw: model || null,
    sizeRaw: dim?.size ?? null,
    width: dim?.width ?? null,
    aspect: dim?.aspect ?? null,
    diameter: dim?.diameter ?? null,
    typeC: dim?.typeC ?? false,
    seasonRaw: SEZON[sezonId] ?? null,
    loadIndex,
    speedIndex,
    isXl,
    isRunflat,
    isStudded: /шип|\bSTUD/i.test(toate),
    priceMdl: Number.isFinite(pret) && pret > 0 ? pret : null,
    stockStatus: item.availability === 'in-stock' ? 'supplier' : 'out_of_stock',
    images: imaginiDin(item, null),
    numeLor: item.name,
    aplicatie: item.application,
    attributes: Object.fromEntries((item.attributes ?? []).map((a) => [a.name, a.values?.map((v) => v.name).join(', ')])),
  };
}

/* --------------------------------------------------------------- contractul */

/**
 * Toate anvelopele din listare, pagină cu pagină, ordonate după nume.
 * Se oprește la ultima pagină declarată de ei; o pagină care vine goală (coaja
 * aplicației, fără date) e o eroare, nu sfârșitul catalogului.
 */
export function createAutodoctorSource(http) {
  const adresa = (pagina) => `${ORIGIN}${config.listare}?sort=${config.sortare}&page=${pagina}`;

  async function enumera({ log = () => {} } = {}) {
    const toate = new Map();
    const respinse = [];
    let total = null;
    let pagini = 1;
    for (let pagina = 1; pagina <= pagini; pagina++) {
      const l = parseListare(await http.get(adresa(pagina)));
      if (!l) throw new Error(`pagina ${pagina}: fără date (serverul lor a dat aplicația goală)`);
      if (pagina === 1) { total = l.total; pagini = l.pagini; log(`· ${total} anvelope pe ${pagini} pagini`); }
      for (const item of l.items) {
        const p = produsDin(item);
        if (p.respins) respinse.push(p); else toate.set(p.id, p);
      }
      if (pagina % 20 === 0) log(`  pagina ${pagina}/${pagini} · ${toate.size} anvelope`);
    }
    return { produse: [...toate.values()], respinse, total };
  }

  return { enumera, adresa };
}
