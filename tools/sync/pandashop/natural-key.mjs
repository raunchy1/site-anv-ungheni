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

/*
 * Marcajele de construcție și de flanc, care în catalogul nostru au ajuns lipite
 * de numele modelului („Winter MS FP", „X-privilo TX3 TL"), iar în titlurile lor
 * stau după indici. Se taie de la coadă în ambele cazuri, altfel aceeași anvelopă
 * are două chei diferite și apare ca produs nou.
 */
const TAIL_MARKER = /(?:\s|^)(?:m\s*\+?\s*s|ms|fp|fr|owl|rwl|bsw|3pmsf|\d{1,2}pr)\s*$/i;
const TAIL_INDEX = /(?:\s|^)\d{2,3}\/?\d{0,3}\s*[a-z]{1,2}\s*$/i;

/*
 * OMOLOGAREA DE FABRICA. „MO" (Mercedes), „AO" (Audi), „N0"…„N4" (Porsche),
 * „*" (BMW), „VOL" (Volvo), „RO1" (Audi Sport), „JLR", „MGT" (Maserati).
 *
 * DE CE E UN CAMP SEPARAT, nu parte din model. In catalogul nostru marcajul a
 * ajuns lipit de numele modelului („Pilot Alpin 5 MO"), iar in titlurile lor sta
 * dupa indici („…275/35 R19 100V MO"). Aceeasi anvelopa, doua chei diferite:
 * fisa noastra ramanea stinsa pe veci, iar a lor arata ca produs nou si ar fi
 * intrat in catalog ca duplicat. S-a vazut pe Michelin Pilot Alpin 5 275/35 R19.
 *
 * Nu se sterge pur si simplu, se muta in cheie: o anvelopa omologata Mercedes
 * chiar e alt produs decat aceeasi anvelopa fara omologare, cu alt cod si alt
 * pret. Daca l-am arunca, cele doua ar deveni una singura.
 */
const OE = /(?:^|[\s(])(mo1|moe|mo|aoe|ao|ro1|ro2|n0|n1|n2|n3|n4|vol|jlr|mgt|goe|\*)\s*\)?\s*$/i;

/** Marcajul de omologare de la coada unui text, normalizat. '' daca nu e. */
export function extrageOE(text) {
  let s = foldDiacritics(String(text ?? '')).trim();
  /* Marcajul sta dupa indici si dupa steaguri, deci se curata coada intai —
     altfel „100V MO" nu se vede, iar „MO XL" nici atat. */
  for (let i = 0; i < 4; i++) {
    const m = s.match(OE);
    if (m) return m[1] === '*' ? 'star' : m[1].toLowerCase();
    const dupa = s.replace(TAIL_FLAG, '').replace(TAIL_MARKER, '').replace(TAIL_INDEX, '').trim();
    if (dupa === s) return '';
    s = dupa;
  }
  return '';
}

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
  /* Marcajele și steagurile se taie mereu, cu sau fără dimensiune în șir: XL și
     runflat sunt câmpuri separate în cheie, deci n-au ce căuta și în model.
     Omologarea de fabrică la fel: e câmp separat în cheie, vezi `extrageOE`. */
  for (let i = 0; i < 8 && (TAIL_MARKER.test(s) || TAIL_FLAG.test(s) || OE.test(s)); i++) {
    s = s.replace(TAIL_MARKER, '').replace(TAIL_FLAG, '').replace(OE, '').trim();
  }
  /* Indicii se taie doar dacă în șir CHIAR era o dimensiune, adică suntem în cazul
     „model + dimensiune + indici" lipite de ei. Într-un model curat, venit din
     coloana noastră `model`, „868S" e parte din nume și rămâne. Repetat, pentru
     că „92V XL" are doi tokeni de coadă unul după altul. */
  /* Indicele de sarcină-viteză se taie DOAR dacă în șir chiar era o dimensiune,
     și o singură dată. Într-un model curat, „Rock 868S" e un nume, nu un indice;
     o tăiere lacomă l-ar confunda cu „Rock 515" al aceluiași brand. */
  if (aveaDimensiune) {
    s = s.replace(TAIL_INDEX, '').trim();
    for (let i = 0; i < 6 && (TAIL_MARKER.test(s) || TAIL_FLAG.test(s) || OE.test(s)); i++) {
      s = s.replace(TAIL_MARKER, '').replace(TAIL_FLAG, '').replace(OE, '').trim();
    }
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
    p.oe ?? '',
  ].join('|');
}

/** Cheie relaxată: fără indici și fără XL/runflat. Doar pentru a EXPLICA ambiguități. */
export function loseKey(p) {
  return [normalizeBrand(p.brand), normalizeModel(p.model, { brand: p.brand }), p.width ?? '', p.aspect ?? '', dia(p.diameter), p.oe ?? ''].join('|');
}
