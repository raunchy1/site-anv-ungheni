/**
 * CHEIA NATURALĂ — piesa de care depinde tot.
 *
 * Cele 15.010 produse din bază n-au `pandashop_id`; au venit din același catalog,
 * importate manual de dezvoltatorul anterior. Dacă potrivirea greșește, primul
 * import face 15.010 duplicate. De aceea cheia e strict din atribute fizice, care
 * identifică o anvelopă fără ambiguitate:
 *
 *   brand · model · lățime · profil · diametru · indice sarcină · indice viteză · XL · runflat
 *
 * Ce NU intră în cheie și de ce: anotimpul (îl scriu inconsistent și e implicat
 * de model), prețul (se schimbă), stocul (se schimbă), titlul (formulare liberă),
 * slug-ul (al nostru, nu al lor).
 */

const DIACRITICE = { 'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ş': 's', 'ț': 't', 'ţ': 't' };

export const foldDiacritics = (s = '') =>
  s.normalize('NFC').toLowerCase().replace(/[ăâîșşțţ]/g, (c) => DIACRITICE[c] ?? c);

/** Prefixele de titlu care nu spun nimic despre produs. Ambele limbi. */
const PREFIX = /^\s*(anvelopa|anvelope|anvelopă|cauciuc|шина|шины|автошина|purtare|a)\s+/i;

/** Tokenii de dimensiune și indici, care la ei stau lipiți în `model`. */
const SIZE_TOKENS = [
  /\b\d{2,3}[\/x]\d{2,3}\s*(?:z)?r\s*\d{1,2}(?:\.\d)?c?\b/gi,   // 225/40 R18
  /\b\d{2,3}\s*(?:z)?r\s*\d{1,2}c?\b/gi,                        // 185 R14
  /\b\d{2}x\d{1,2}[.,]\d{1,2}\s*r?\s*\d{2}\b/gi,                // 31x10.50 R15
  /\b\d{2,3}\/\d{2,3}\b/gi,
];
/*
 * Indicii se taie DOAR de la coada șirului, niciodată din mijloc.
 * „Rock 868S" e un nume de model, nu un indice de sarcină; o regulă lacomă îl
 * reduce la „rock" și pune la un loc două modele diferite ale aceluiași brand —
 * fix genul de potrivire falsă care creează duplicate mai târziu.
 */
const TAIL_FLAG = /(?:\s|^)(?:xl|extra\s*load|rft|run\s*flat|runflat|zp|ssr|moe|dsst|dot|tl|tt|lt)\s*$/i;
const TAIL_INDEX = /(?:\s|^)\d{2,3}\/?\d{0,3}\s*[a-z]{1,2}\s*$/i;

/**
 * Modelul, redus la ce identifică efectiv produsul.
 * „WinterDrive 225/40 R18 92V XL" -> „winterdrive"
 * „X-privilo TX2"                 -> „x privilo tx2"
 */
export function normalizeModel(raw, { brand = null } = {}) {
  if (!raw) return '';
  let s = foldDiacritics(String(raw)).replace(PREFIX, ' ');
  if (brand) s = s.replace(new RegExp(`\\b${foldDiacritics(brand).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), ' ');
  let aveaDimensiune = false;
  for (const re of SIZE_TOKENS) s = s.replace(re, () => { aveaDimensiune = true; return ' '; });
  s = s.replace(/\s+/g, ' ').trim();
  /* Indicii se taie doar dacă în șir CHIAR era o dimensiune, adică suntem în cazul
     „model + dimensiune + indici" lipite de ei. Într-un model curat, venit din
     coloana noastră `model`, „868S" e parte din nume și rămâne. Repetat, pentru
     că „92V XL" are doi tokeni de coadă unul după altul. */
  if (aveaDimensiune) {
    /* Steagurile pot fi mai multe; indicele de sarcină-viteză e unul singur.
       Dacă am tăia lacom, „Rock 868S 88H" ar ajunge „rock" și s-ar confunda cu
       oricare alt model „Rock" al aceluiași brand. */
    for (let i = 0; i < 4 && TAIL_FLAG.test(s); i++) s = s.replace(TAIL_FLAG, '').trim();
    s = s.replace(TAIL_INDEX, '').trim();
    for (let i = 0; i < 2 && TAIL_FLAG.test(s); i++) s = s.replace(TAIL_FLAG, '').trim();
  }
  return s.replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

export const normalizeBrand = (raw) => foldDiacritics(String(raw ?? '')).replace(/[^\p{L}\p{N}]+/gu, '').trim();

const dia = (d) => {
  if (d == null) return '';
  const n = String(d).toUpperCase().replace(/[^\dR.C]/g, '');
  return n.startsWith('R') ? n : `R${n}`;
};

/**
 * Cheia, ca șir. Câmpurile lipsă rămân goale — două produse cărora le lipsește
 * același câmp se potrivesc între ele, ceea ce e corect; ce nu e corect ar fi
 * să inventăm o valoare ca să iasă cheia.
 */
export function naturalKey(p) {
  return [
    normalizeBrand(p.brand),
    normalizeModel(p.model, { brand: p.brand }),
    p.width ?? '',
    p.aspect ?? '',
    dia(p.diameter),
    String(p.loadIndex ?? '').toUpperCase().replace(/\s/g, ''),
    String(p.speedIndex ?? '').toUpperCase().replace(/\s/g, ''),
    p.isXl ? 'xl' : '',
    p.isRunflat ? 'rf' : '',
  ].join('|');
}

/** Cheie relaxată: fără indici și fără XL/runflat. Doar pentru a EXPLICA ambiguități. */
export function loseKey(p) {
  return [normalizeBrand(p.brand), normalizeModel(p.model, { brand: p.brand }), p.width ?? '', p.aspect ?? '', dia(p.diameter)].join('|');
}
