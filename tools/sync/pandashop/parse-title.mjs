/**
 * Titlul lor -> câmpurile cheii naturale.
 *
 * Listarea dă titlul complet („Anvelopa Centara Vanti Touring Z3 185/60 R14 82H"),
 * iar din el se scot toate componentele cheii. Asta face raportul de potrivire
 * posibil din ~140 de pagini de listare, în loc de 8.221 de pagini de produs —
 * adică o rulare de câteva minute, nu una de câteva ore, pe serverul unui partener.
 *
 * Dimensiunea NU se parsează aici: se apelează `parseSize` din scraper, cel care
 * are deja aserțiunile de test. Un parser paralel ar diverge de primul de la
 * prima anvelopă imperială.
 */
import { parseSize } from '../../scraper/parse-product.mjs';
import { foldDiacritics } from './natural-key.mjs';

const PREFIX = /^\s*(anvelopa|anvelope|anvelopă|cauciuc|шина|шины|автошина)\s+/i;

/* Indicii stau la coadă: „82H", „121/119R", „92V XL". */
const IDX = /(\d{2,3})(?:\/(\d{2,3}))?\s*([A-Z]{1,2})\b/;

/**
 * @param {string} title
 * @param {string[]} knownBrands  Numele celor 132 de branduri din baza noastră.
 */
export function parseTitle(title, knownBrands = []) {
  const raw = String(title ?? '').trim();
  const body = raw.replace(PREFIX, '').trim();

  /* Brandul: cea mai lungă potrivire dintre brandurile pe care le avem deja.
     Deliberat nu ghicim „primul cuvânt" — brandurile din două cuvinte
     (Double Coin, Gt Radial) ar fi tăiate în două, iar unul necunoscut trebuie
     să rămână necunoscut, ca să ajungă în carantină, nu în catalog. */
  const hay = foldDiacritics(body);
  let brand = null;
  for (const b of knownBrands) {
    const n = foldDiacritics(b);
    if (!n) continue;
    if (hay === n || hay.startsWith(`${n} `)) { if (!brand || n.length > foldDiacritics(brand).length) brand = b; }
  }

  const size = parseSize(body);

  /* Restul dintre brand și dimensiune e modelul. */
  const afterBrand = brand ? body.slice(brand.length).trim() : body;
  const sizeAt = size.size_raw ? afterBrand.search(/\d{2,3}\s*[\/x]|\d{2,3}\s*(?:Z)?R\s*\d/i) : -1;
  const model = (sizeAt > 0 ? afterBrand.slice(0, sizeAt) : afterBrand).trim();

  /* Indicii: se caută DUPĂ dimensiune, ca „225/40" să nu fie citit ca „225 kg / 40".
     Regexul de mai jos trebuie să acopere ȘI forma fără profil („175 R14C"), altfel
     la „VS450 175 R14C 99R" dimensiunea rămâne în șir și „14C" e citit drept indice
     de sarcină-viteză. A ieșit la iveală în dry-run-ul corecției, nu în producție. */
  const tail = sizeAt >= 0 ? afterBrand.slice(sizeAt) : afterBrand;
  const afterSize = size.size_raw
    ? tail.replace(/\d{2,3}(?:\s*[\/x]\s*\d{1,3}(?:[.,]\d{1,2})?)?\s*(?:Z)?R\s*\d{1,2}(?:[.,]\d)?C?/i, ' ')
    : tail;
  const idx = afterSize.match(IDX);

  return {
    brand,
    brandKnown: Boolean(brand),
    model,
    ...size,
    loadIndex: idx ? (idx[2] ? `${idx[1]}/${idx[2]}` : idx[1]) : null,
    speedIndex: idx ? idx[3].toUpperCase() : null,
    isXl: /\b(XL|Extra\s*Load)\b/i.test(raw),
    isRunflat: /\b(run\s*flat|runflat|RFT|ZP|SSR|MOE|DSST)\b/i.test(raw),
    isStudded: /\b(шип|cu\s*crampoane|crampoane|studded)\b/i.test(raw),
  };
}
