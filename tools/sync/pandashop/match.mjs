/**
 * POTRIVIREA, ca modul.
 *
 * Logica exista deja, dar traia in `report-match.mjs`, adica intr-un raport.
 * Din momentul in care si `refresh.mjs`, si `backfill.mjs` au nevoie de exact
 * aceeasi potrivire, ea nu mai poate sta intr-un script: doua copii ale unei
 * reguli de potrivire diverg, iar cand diverg, rezultatul e un duplicat in
 * catalog sau un pret scris pe produsul gresit.
 *
 * Aici e doar potrivirea. Nicio cerere de retea, nicio scriere, nicio decizie
 * despre ce se face cu rezultatul.
 */
import { parseTitle } from './parse-title.mjs';
import { naturalKey, loseKey, extrageOE } from './natural-key.mjs';

/**
 * Indexul catalogului nostru, pe toate cheile care ne trebuie.
 *
 * DOUA CHEI, nu una — motivul e masurat, nu teoretic: in catalogul nostru
 * `load_index`/`speed_index`/`is_xl` vin din atributele OpenCart si nu sunt mereu
 * de acord cu titlul aceluiasi rand (1.896 de produse din 15.116). Pandashop
 * scrie indicii in titlu. Daca am compara doar coloana cu titlu, aceleasi produse
 * ar aparea drept „noi" si le-am importa a doua oara.
 *
 * @param {object[]} produse  randurile noastre, din `readProducts()`
 * @param {string[]} brandNames  numele brandurilor, cele mai lungi intai
 */
export function indexeazaCatalogul(produse, brandNames) {
  const byKey = new Map();
  const byTitleKey = new Map();
  const byLose = new Map();
  const byPandashopId = new Map();
  let faraCheie = 0;
  let dezacord = 0;

  const pune = (m, k, p) => { const l = m.get(k); if (l) l.push(p); else m.set(k, [p]); };

  for (const p of produse) {
    if (p.category !== 'anvelope') continue;

    /* Legatura explicita bate orice potrivire prin atribute. Odata ce un produs
       are `pandashop_id`, nu mai depinde de cum isi scriu ei titlurile. */
    if (p.pandashop_id) byPandashopId.set(String(p.pandashop_id), p);

    if (!p.brand_name || !p.model || !p.diameter) { faraCheie++; continue; }

    /* Marcajul de omologare poate sta fie in `model` („Pilot Alpin 5 MO"), fie
       doar in titlu; se cauta in amandoua, in ordinea asta. */
    const oe = extrageOE(p.model) || extrageOE(p.title_ro);

    const k = naturalKey({
      brand: p.brand_name, model: p.model, width: p.width, aspect: p.aspect, diameter: p.diameter,
      loadIndex: p.load_index, speedIndex: p.speed_index, isXl: p.is_xl, isRunflat: p.is_runflat, oe,
    });
    pune(byKey, k, p);

    const t = parseTitle(p.title_ro, brandNames);
    if (t.brandKnown && t.size_raw) {
      const k2 = cheieDin(t);
      pune(byTitleKey, k2, p);
      if (k2 !== k) dezacord++;
    }

    pune(byLose, loseKey({ brand: p.brand_name, model: p.model, width: p.width, aspect: p.aspect, diameter: p.diameter, oe }), p);
  }

  return { byKey, byTitleKey, byLose, byPandashopId, faraCheie, dezacord };
}

/**
 * A DOUA TRECERE, pentru fisele noastre carora le lipsesc indicii.
 *
 * Cheia stricta cere brand·model·dimensiune·sarcina·viteza·XL·runflat. O parte
 * din titlurile mostenite din OpenCart n-au indicii deloc — „Michelin Pilot
 * Alpin 5 275/35 R19 MO", fata de „…275/35 R19 100V MO" la ei. Cheia stricta le
 * declara produse diferite, cu doua urmari, amandoua gresite: fisa noastra ramane
 * stinsa pentru totdeauna, iar a lor arata ca produs nou si ar intra in catalog
 * ca duplicat al aceleiasi anvelope.
 *
 * Se accepta DOAR cand nu exista nicio ambiguitate reala:
 *   · un singur candidat pe cheia relaxata (brand·model·dimensiune);
 *   · candidatului chiar ii LIPSESC indicii, ori ii are identici — daca fisa
 *     noastra zice 100W si a lor 100V, sunt doua anvelope, nu una;
 *   · XL si runflat coincid: alea sunt constructii diferite, nu notatie.
 *
 * Orice altceva ramane nepotrivit. Cand nu stim, nu ghicim.
 */
export function potrivireRelaxata(t, candidati) {
  if (!candidati || candidati.length !== 1) return null;
  const c = candidati[0];

  const norm = (v) => (v == null || v === '' ? null : String(v).toUpperCase().replace(/\s/g, ''));
  const lorSarcina = norm(t.loadIndex); const lorViteza = norm(t.speedIndex);
  const noiSarcina = norm(c.load_index); const noiViteza = norm(c.speed_index);

  const sarcinaOk = noiSarcina === null || noiSarcina === lorSarcina;
  const vitezaOk = noiViteza === null || noiViteza === lorViteza;
  if (!sarcinaOk || !vitezaOk) return null;
  /* Cel putin unul dintre indici chiar trebuie sa lipseasca la noi — altfel cheia
     stricta ar fi potrivit deja, iar noi am fi pe cale sa relaxam degeaba. */
  if (noiSarcina !== null && noiViteza !== null) return null;

  if (Boolean(c.is_xl) !== Boolean(t.isXl)) return null;
  if (Boolean(c.is_runflat) !== Boolean(t.isRunflat)) return null;

  return c;
}

/** Cheia naturala dintr-un titlu deja parsat. */
export const cheieDin = (t) => naturalKey({
  brand: t.brand, model: t.model, width: t.width, aspect: t.aspect, diameter: t.diameter,
  loadIndex: t.loadIndex, speedIndex: t.speedIndex, isXl: t.isXl, isRunflat: t.isRunflat, oe: t.oe,
});

/**
 * Un titlu de-al lor -> produsul nostru, daca exista si daca e unul singur.
 *
 * @returns {{stare: 'gasit', produs: object, t: object, cheie: string}
 *          |{stare: 'ambiguu', candidati: object[], t: object, cheie: string}
 *          |{stare: 'brand_necunoscut'|'dimensiune_neparsata', t: object}
 *          |{stare: 'doar_la_ei', t: object, cheie: string, aproape: object[]|null}}
 */
export function potriveste(titlu, index, brandNames, { pandashopId = null } = {}) {
  /* Legatura explicita, cand exista. Nu se mai parseaza nimic. */
  if (pandashopId) {
    const direct = index.byPandashopId.get(String(pandashopId));
    if (direct) return { stare: 'gasit', produs: direct, t: null, cheie: `id:${pandashopId}`, prinId: true };
  }

  const t = parseTitle(titlu, brandNames);
  if (!t.brandKnown) return { stare: 'brand_necunoscut', t };
  if (!t.size_raw) return { stare: 'dimensiune_neparsata', t };

  const cheie = cheieDin(t);
  const hit = index.byKey.get(cheie) ?? index.byTitleKey.get(cheie);
  if (!hit) {
    const lk = loseKey({ brand: t.brand, model: t.model, width: t.width, aspect: t.aspect, diameter: t.diameter, oe: t.oe });
    return { stare: 'doar_la_ei', t, cheie, aproape: index.byLose.get(lk) ?? null };
  }
  if (hit.length > 1) return { stare: 'ambiguu', candidati: hit, t, cheie };
  return { stare: 'gasit', produs: hit[0], t, cheie, prinId: false };
}
