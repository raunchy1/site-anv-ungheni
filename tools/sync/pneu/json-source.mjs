/**
 * Sursa JSON — pneu.md.
 *
 * Singura dintre cele trei surse care nu parsează HTML, pentru că la ei nu
 * există HTML de parsat: aplicația e Angular fără randare pe server, iar orice
 * adresă de pe site întoarce aceeași pagină goală. În schimb, serviciul din
 * care își ia aplicația datele întoarce TOT catalogul într-un singur răspuns —
 * ~10 MB, 7.260 de anvelope, cu câmpurile deja separate.
 *
 * Nu mai ghicim nimic din titluri. Marca, modelul, lățimea, înălțimea,
 * diametrul, indicii și sezonul vin ca atare. Rămân trei lucruri de făcut:
 *
 * 1. TITLUL SE CONSTRUIEȘTE, ca la pneuexpert. Ei n-au un titlu de catalog, au
 *    un `invoiceName` de factură („195/55R 16 87H TL WP-52 KUMHO SOUTH KOREA").
 *    Îl construim noi din câmpuri, în convenția noastră — „Kumho WP-52 195/55
 *    R16 87H" — și de acolo încolo `parseTitle` îl citește ca pe oricare altul.
 *
 * 2. XL, RUNFLAT ȘI OMOLOGAREA SUNT DOAR ÎN `invoiceName`. Nu există câmpuri
 *    pentru ele. Se citesc din șirul de factură — iar unde `invoiceName`
 *    lipsește (829 de rânduri), NU se presupune nimic: rândul merge în
 *    carantină. Cheia noastră naturală cere XL, iar o anvelopă XL pusă peste
 *    una non-XL e exact potrivirea falsă împotriva căreia e făcută cheia.
 *
 * 3. CATALOGUL LOR ARE DUBLURI ÎN EL. 225 de anvelope apar de două ori, cu
 *    două prețuri și două `id`-uri. Se aleg înainte de import, nu după.
 *
 * ATENȚIE — `primeCost`. Fiecare rând de-al lor conține prețul LOR de achiziție,
 * plus `discount` și `transferLimit`. Nu ne privește, nu-l citim, nu-l scriem
 * nicăieri: `normalizeazaRand` copiază câmp cu câmp, deliberat, ca să nu poată
 * ajunge din greșeală în fotografie sau în baza noastră.
 */

/** Câmpurile lor care ne interesează. Tot ce nu e aici nu iese din modul. */
const CAMPURI = [
  'id', 'brand', 'model', 'width', 'height', 'diameter',
  'loadIndex', 'speedIndex', 'season', 'price', 'invoiceName',
  'eanCode', 'stock', 'invoiceStock', 'typeC',
  'fuelEfficiency', 'wetGrip', 'noiseEmissions',
  'productImages', 'profileImage',
];

/* ------------------------------------------------------------------ titlul */

/**
 * Marca lor e scrisă cu majuscule („HANKOOK"). Catalogul nostru o scrie
 * „Hankook". Potrivirea nu depinde de asta — `parseTitle` compară fără să țină
 * cont de litere mari — dar titlul afișat, da.
 */
export const titluMarca = (s = '') => String(s).trim().toLowerCase()
  .replace(/(^|[\s\-'`])([a-zà-ÿ])/g, (_, p, c) => p + c.toUpperCase());

/**
 * Modelul lor vine și cu majuscule („WINTERCRAFT WP52"), și normal
 * („Dynapro HPX (RA43)"). Se îmblânzesc doar cuvintele pur alfabetice mai lungi
 * de trei litere: codurile („WP52", „TS-830P", „4S2") rămân cum sunt, pentru că
 * acolo majusculele chiar înseamnă ceva.
 */
export function titluModel(model = '', marca = '') {
  let s = String(model ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  /* „NEXEN N`BLUE…" — marca repetată la începutul modelului nu se scrie de două ori. */
  const m = String(marca ?? '').trim();
  if (m && s.toUpperCase().startsWith(`${m.toUpperCase()} `)) s = s.slice(m.length).trim();
  return s.split(' ').map((tok) => (
    /^[A-Za-zÀ-ÿ]{4,}$/.test(tok) ? tok[0].toUpperCase() + tok.slice(1).toLowerCase() : tok
  )).join(' ');
}

/**
 * Dimensiunea în convenția catalogului: „225/55 R17", iar la cele comerciale
 * „195/70 R15C". Sufixul C e important: la noi e parte din `diameter` și intră
 * în cheia naturală, deci o anvelopă de marfă nu se poate contopi cu una de
 * autoturism de aceeași măsură.
 *
 * Întoarce null pentru dimensiunile pe care catalogul nostru nu le scrie așa —
 * agricole și industriale de tip „7.00-12", unde `height` e 0. Sunt trei la ei;
 * merg în carantină, nu în catalog cu o dimensiune inventată.
 */
export function dimensiune({ width, height, diameter, typeC }) {
  const w = Number(width);
  const h = Number(height);
  const d = String(diameter ?? '').trim();
  if (!w || !h || !d) return null;
  return `${w}/${h} R${d}${typeC ? 'C' : ''}`;
}

/* Markerele din șirul de factură. Se citesc de acolo pentru că nicăieri altundeva nu sunt. */
const RE_XL = /\bXL\b|\bEXTRA[\s-]?LOAD\b/i;
const RE_RUNFLAT = /\bRUN[\s-]?FLAT\b|\bRFT\b|\bROF\b|\bSSR\b|\bZP\b|\bMOE\b|\bDSST\b/i;
/* Omologarea de fabrică: „RO1" (Audi Sport), „MO" (Mercedes), „AO" (Audi),
   „N0".."N4" (Porsche), „VOL" (Volvo), „JLR", „MGT". `parseTitle` o culege
   singur din titlul întreg, deci e destul s-o punem la coadă. */
const RE_OE = /\b(MO|MOE|AO|RO1|RO2|N[0-4]|VOL|JLR|MGT)\b/;

/**
 * Indicele de viteză lipsește la 11 rânduri din câmp, dar e scris în șirul de
 * factură („225/65R 17 106H TL…"). Se recuperează de acolo, nu se aruncă rândul.
 */
export function indiciDinFactura(invoiceName = '') {
  const s = String(invoiceName ?? '');
  const m = s.match(/\b(\d{2,3})(?:\/(\d{2,3}))?\s*([A-Z]{1,2})\b(?=\s+(?:TL|TT)\b)/);
  if (!m) return { loadIndex: null, speedIndex: null };
  return { loadIndex: m[2] ? `${m[1]}/${m[2]}` : m[1], speedIndex: m[3] };
}

/**
 * Titlul, în convenția catalogului:
 *   „Kumho WinterCraft WP52 225/65 R17 106H XL"
 */
export function construiesteTitlu({ marca, model, size, loadIndex, speedIndex, xl, runflat, oe }) {
  const indici = loadIndex && speedIndex ? `${loadIndex}${speedIndex}` : null;
  return [
    titluMarca(marca),
    titluModel(model, marca),
    size,
    indici,
    xl ? 'XL' : null,
    runflat ? 'RunFlat' : null,
    oe ?? null,
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

/* ----------------------------------------------------------------- imaginile */

/**
 * Galeria lor, în ordinea pe care o declară. `productImages` are indexul
 * explicit; `profileImage` e poza singulară de listă și se ia doar când galeria
 * lipsește — nu pe lângă ea, ca să nu urcăm de două ori aceeași fotografie.
 */
export function imagini(x) {
  const gal = (x.productImages ?? [])
    .filter((im) => im && typeof im.pathToImage === 'string' && /^https?:\/\//.test(im.pathToImage))
    .sort((a, b) => (a.imageIndex ?? 0) - (b.imageIndex ?? 0))
    .map((im) => ({ url: im.pathToImage }));
  if (gal.length) return gal;
  if (typeof x.profileImage === 'string' && /^https?:\/\//.test(x.profileImage)) {
    return [{ url: x.profileImage }];
  }
  return [];
}

/* ------------------------------------------------------------- normalizarea */

const SEZON = { SUMMER: 'vara', WINTER: 'iarna', 'ALL SEASONS': 'all season' };

/**
 * Un rând de-al lor -> contractul pe care îl citește `import.mjs`, același ca
 * la pandashop și pneuexpert. Funcție pură: nicio cerere, niciun efect.
 *
 * Întoarce `{ respins: '<motiv>' }` pentru rândurile care nu pot deveni un
 * produs cinstit. Nu aruncă: motivul ajunge în carantină, cu rândul lor lângă el.
 */
export function normalizeazaRand(brut) {
  const x = {};
  for (const c of CAMPURI) x[c] = brut?.[c];   /* `primeCost` rămâne afară, intenționat */

  const id = x.id != null ? String(x.id) : null;
  if (!id) return { respins: 'rând fără id la ei' };

  const marca = String(x.brand ?? '').trim();
  if (!marca) return { id, respins: 'marcă lipsă la ei' };

  const size = dimensiune(x);
  if (!size) return { id, respins: 'dimensiune pe care catalogul nostru n-o scrie (agricolă/industrială)' };

  /*
   * XL ȘI RUNFLAT NUMAI DIN `invoiceName`. Fără el nu știm dacă e XL, iar cheia
   * naturală îl cere. Nu presupunem „non-XL": la 3.958 de rânduri din 6.431 cu
   * șir de factură markerul chiar e acolo, deci presupunerea ar fi greșită mai
   * des decât corectă, și ar contopi două anvelope diferite.
   */
  const factura = x.invoiceName ? String(x.invoiceName) : null;
  if (!factura) return { id, respins: 'XL/runflat necunoscute (le lipsește șirul de factură)' };

  const xl = RE_XL.test(factura);
  const runflat = RE_RUNFLAT.test(factura);
  const oe = factura.match(RE_OE)?.[1] ?? null;

  const dinFactura = indiciDinFactura(factura);
  const loadIndex = x.loadIndex != null && x.loadIndex !== '' ? String(x.loadIndex) : dinFactura.loadIndex;
  const speedIndex = (x.speedIndex || dinFactura.speedIndex || '').toUpperCase() || null;
  if (!loadIndex || !speedIndex) return { id, respins: 'indice de sarcină sau de viteză lipsă' };

  const titlu = construiesteTitlu({ marca, model: x.model, size, loadIndex, speedIndex, xl, runflat, oe });

  /*
   * STOCUL. `isInStock` e `true` pe toate cele 7.260 de rânduri ale lor — nu e
   * un semnal, e o constantă. Ce se poate obține chiar se vede în `stock` (ce au
   * în depozit) și `invoiceStock` (ce pot aduce). Oricare dintre ele pozitiv
   * înseamnă „Disponibil · livrare 1–3 zile"; niciunul înseamnă fișă stinsă.
   */
  const stoc = Number(x.stock ?? 0) > 0 || Number(x.invoiceStock ?? 0) > 0;

  return {
    id,
    titleRo: titlu,
    /* Ca la pneuexpert: n-au pagină rusă cu text rusesc, au același șir latin. */
    titleRu: titlu,
    brandRaw: marca,
    modelRaw: titluModel(x.model, marca) || null,
    priceMdl: Number(x.price) > 0 ? Number(x.price) : null,
    seasonRaw: SEZON[String(x.season ?? '').toUpperCase()] ?? null,
    stockStatus: stoc ? 'supplier' : 'out_of_stock',
    isStudded: false,
    images: imagini(x),
    attributes: {
      ean: x.eanCode || null,
      clasa_consum: x.fuelEfficiency || null,
      aderenta_umed: x.wetGrip || null,
      zgomot_db: x.noiseEmissions ?? null,
    },
    /* Cheia pe care se aleg dublurile lor. A NOASTRĂ, cea din `match.mjs`, se
       calculează mai târziu, din titlu — asta e doar pentru curățenia sursei. */
    cheieSursa: [
      marca.toUpperCase(), String(x.model ?? '').toUpperCase().replace(/\s+/g, ' ').trim(),
      size, loadIndex, speedIndex, xl ? 'XL' : '', runflat ? 'RF' : '', oe ?? '',
    ].join('|'),
    stocNumeric: Math.max(Number(x.stock ?? 0), Number(x.invoiceStock ?? 0)),
  };
}

/**
 * CATALOGUL LOR ARE DUBLURI ÎN EL — 225 de anvelope apar de două ori, cu două
 * `id`-uri și două prețuri („Kumho Solus 4S HA32 225/45 R19 96W XL": 2.800 și
 * 2.950 de lei). Dacă le-am importa pe amândouă, am sparge chiar regula pentru
 * care există `product_sources`: o anvelopă, un preț, un furnizor.
 *
 * Se alege un singur rând, în ordinea asta:
 *   1. cel care se poate obține (stoc > 0) — un preț bun la ceva ce n-au nu e un preț;
 *   2. la stoc egal, cel mai ieftin — clientul plătește mai puțin;
 *   3. la preț egal, `id`-ul mai mare — la ei, fișa mai nouă.
 */
export function alegeDintreDuplicate(randuri) {
  const peCheie = new Map();
  for (const r of randuri) {
    const vechi = peCheie.get(r.cheieSursa);
    if (!vechi) { peCheie.set(r.cheieSursa, r); continue; }
    peCheie.set(r.cheieSursa, maiBun(vechi, r));
  }
  return [...peCheie.values()];
}

function maiBun(a, b) {
  const stocA = a.stocNumeric > 0;
  const stocB = b.stocNumeric > 0;
  if (stocA !== stocB) return stocA ? a : b;
  const pA = a.priceMdl ?? Infinity;
  const pB = b.priceMdl ?? Infinity;
  if (pA !== pB) return pA < pB ? a : b;
  return Number(b.id) > Number(a.id) ? b : a;
}

/* --------------------------------------------------------------- contractul */

/**
 * DE CE UN CLIENT PROPRIU, ȘI NU `pandashop/http.mjs`.
 *
 * Clientul comun trimite `Accept: text/html` — potrivit, pentru că celelalte
 * două surse sunt magazine de citit pagini. Spring Boot-ul lor răspunde la el
 * cu 406 și o pagină de eroare. Clientul comun rulează în producție în fiecare
 * noapte pentru pandashop, iar regula 3 a planului spune să nu-l modific pe loc;
 * aici e nevoie de o singură cerere pe rulare, deci o scriem pe aceea.
 *
 * (Pe termen lung, locul curat e tot `http.mjs`, cu un `accept` opțional care
 * păstrează `text/html` implicit. Merită făcut când vine a doua sursă cu API.)
 *
 * Cache pe disc, ca la celelalte: răspunsul lor e de ~10 MB și se construiește
 * la ei la fiecare cerere. O reluare a importului nu-i mai deranjează.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 '
  + 'AnvelopeUngheniSyncBot/1.0 (+parteneriat comercial; info@anvelope-ungheni.md)';

const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));

/** @returns {{ adu: () => Promise<object[]>, stats: object }} */
export function createPneuSource(config, { useCache = true, log = () => {} } = {}) {
  const stats = { fetched: 0, cached: 0, retried: 0, bytes: 0 };
  const url = `${config.api.base}${config.api.tires}`;
  const cale = path.join(
    config.http.cacheDir,
    `${crypto.createHash('sha1').update(url).digest('hex').slice(0, 16)}.json`,
  );

  async function corp() {
    if (useCache && fs.existsSync(cale)) {
      stats.cached++;
      log(`· din cache: ${cale}`);
      return fs.readFileSync(cale, 'utf8');
    }

    let ultima;
    for (let incercare = 0; incercare <= config.http.retries; incercare++) {
      if (incercare > 0) {
        stats.retried++;
        /* Exponențial. Dacă sunt încărcați, insistența e exact ce nu trebuie. */
        await asteapta(Math.min(60_000, 2 ** incercare * 1000) + Math.random() * 1000);
      }
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': UA, Accept: 'application/json', Origin: config.origin },
          signal: AbortSignal.timeout(config.http.timeoutMs),
        });
        /* 429 și 5xx sunt tranzitorii — reîncercăm. Restul nu se reîncearcă: o
           schimbare de rută la ei nu se rezolvă cerând de patru ori. */
        if (res.status === 429 || res.status >= 500) { ultima = new Error(`HTTP ${res.status}`); continue; }
        if (!res.ok) throw new Error(`HTTP ${res.status} de la ${url}`);
        const text = await res.text();
        stats.fetched++;
        stats.bytes = text.length;
        fs.mkdirSync(path.dirname(cale), { recursive: true });
        fs.writeFileSync(cale, text);
        return text;
      } catch (e) {
        if (e.message.startsWith('HTTP ') && !/HTTP (429|5\d\d)/.test(e.message)) throw e;
        ultima = e;
      }
    }
    throw new Error(`${url}: ${ultima?.message ?? 'eșec necunoscut'}`);
  }

  /**
   * Tot catalogul, într-o singură cerere. Nu există paginare la ei: `?page=` și
   * `?limit=` sunt ignorate, răspunsul e întreg de fiecare dată. Nu insistăm.
   */
  async function adu() {
    const text = await corp();
    let brut;
    try {
      brut = JSON.parse(text);
    } catch {
      throw new Error(`răspunsul lor nu e JSON (${text.length} octeți, începe cu „${text.slice(0, 80)}")`);
    }
    if (!Array.isArray(brut)) throw new Error('răspunsul lor nu e o listă — structura API-ului s-a schimbat');
    return brut;
  }

  return { adu, stats };
}
