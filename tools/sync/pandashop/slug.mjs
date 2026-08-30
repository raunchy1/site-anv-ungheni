/**
 * Generatorul de slug-uri, dedus din catalogul existent și verificat pe el.
 *
 * Convenția nu e inventată aici: e citită din cele 15.008 slug-uri deja
 * publicate și reprodusă exact. Un produs importat cu alt tipar ar arăta străin
 * în catalog și ar rupe orice așteptare de URL.
 *
 *   RO:  titlul, minuscule, orice nu e literă sau cifră devine cratimă
 *        „Continental ContiWinterContact TS870P 235/45 R20 100W XL"
 *        -> „continental-contiwintercontact-ts870p-235-45-r20-100w-xl"
 *
 *   RU:  identic, DAR lățimea și profilul se lipesc: „235/45" -> „23545".
 *        -> „continental-contiwintercontact-ts870p-23545-r20-100w-xl"
 *
 * Ciudățenia de la RU nu e o greșeală de-a noastră; așa arată cele 15.008 și
 * așa trebuie să arate și importurile, altfel catalogul are două convenții.
 */

const DIACRITICE = { 'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ş': 's', 'ț': 't', 'ţ': 't' };

/* Literele chirilice care arată ca latine și apar în titlurile lor („88Т" cu Т rusesc). */
const CHIRILICE = { 'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'У': 'Y', 'Х': 'X' };

const curata = (s) => [...String(s ?? '')]
  .map((c) => CHIRILICE[c] ?? c)
  .join('')
  .toLowerCase()
  .replace(/[ăâîșşțţ]/g, (c) => DIACRITICE[c] ?? c);

const cratime = (s) => s
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/*
 * Titlurile lor încep cu un cuvânt de categorie — „Anvelopa Crosswind …",
 * „Шина Crosswind …" — pe care catalogul nostru nu-l are: cele 15.008 titluri
 * încep direct cu brandul. Se taie înainte de orice altceva, altfel și titlul, și
 * slug-ul ies dintr-o altă convenție decât restul site-ului, iar coliziunile de
 * slug nici măcar nu se mai detectează (un „anvelopa-x" nu se ciocnește cu „x").
 */
const PREFIX_CATEGORIE = /^\s*(anvelopa|anvelope|anvelopă|cauciuc|шина|шины|автошина|покрышка)\s+/i;

export const titluCatalog = (t) => String(t ?? '').replace(PREFIX_CATEGORIE, '').trim();

export function slugRo(titlu) {
  return cratime(curata(titluCatalog(titlu)));
}

/** La RU, „235/45" devine „23545" — restul e la fel ca la RO. */
export function slugRu(titlu) {
  const s = curata(titluCatalog(titlu)).replace(/(\d{2,3})\s*\/\s*(\d{2,3})/g, '$1$2');
  return cratime(s);
}

/** Cratimă în plus la coadă dacă titlul se termină cu punctuație; niciodată sufix numeric. */
export function slugPereche(titluRo, titluRu) {
  return { slug_ro: slugRo(titluRo), slug_ru: slugRu(titluRu ?? titluRo) };
}
