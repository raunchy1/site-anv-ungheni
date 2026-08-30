/**
 * CONTRACTUL DE SURSĂ.
 *
 * Tot ce urmează în pipeline — potrivire, normalizare, validare, scriere — vede
 * doar interfața asta. Azi în spate stă HTML-ul de pe pandashop.md; când
 * parteneriatul livrează un feed, se schimbă o linie în `config.mjs`, nu
 * pipeline-ul. De aceea `SourceProductRef` conține strict ce poate da orice
 * sursă (un ID și de unde s-a luat), iar tot restul intră în `SourceProduct`.
 *
 * @typedef {object} SourceProductRef
 * @property {string} id          ID-ul lor. Pentru pandashop, `sku` din JSON-LD (ex. "01290622").
 * @property {string} url         URL-ul canonic RO, relativ la origine.
 * @property {string} [urlRu]     Perechea RU, când sursa o cunoaște din listare.
 * @property {string} [listHash]  Hash peste ce s-a văzut în listare (preț+stoc+titlu).
 *                                Diferență de hash = merită refetch; egalitate = se poate sări.
 *
 * @typedef {object} SourceImage
 * @property {string} url
 * @property {string} [alt]
 *
 * @typedef {object} SourceProduct
 * @property {string} id
 * @property {string} url
 * @property {string|null} titleRo
 * @property {string|null} titleRu
 * @property {string|null} descriptionRo
 * @property {string|null} descriptionRu
 * @property {string|null} brandRaw        Numele brandului exact cum îl scriu ei.
 * @property {string|null} modelRaw
 * @property {string|null} sizeRaw         Textul de dimensiune, dacă sursa îl dă separat.
 * @property {string|null} seasonRaw
 * @property {string|null} loadIndex
 * @property {string|null} speedIndex
 * @property {boolean} isXl
 * @property {boolean} isRunflat
 * @property {boolean} isStudded
 * @property {number|null} priceMdl        Prețul LOR. Niciodată al nostru — vezi Partea E.
 * @property {number|null} oldPriceMdl
 * @property {'in_stock'|'supplier'|'out_of_stock'} stockStatus
 * @property {SourceImage[]} images
 * @property {string|null} gtin
 * @property {Record<string,string>} attributes  Tabelul lor de caracteristici, brut.
 *
 * Contractul propriu-zis:
 *
 *   listProducts(opts) : AsyncIterable<SourceProductRef>
 *     Enumeră referințele, în ordinea pe care sursa o consideră „cele mai noi întâi".
 *     `opts.limit` oprește enumerarea; `opts.onPage` primește (nrPagina, refs) pentru
 *     regula de oprire din Partea A.2 (2 pagini consecutive fără ID necunoscut).
 *
 *   fetchProduct(ref) : Promise<SourceProduct>
 *     Aduce produsul complet, în ambele limbi.
 *
 * O sursă nu normalizează și nu decide nimic. Întoarce ce a văzut, atât.
 */

export const SOURCE_CONTRACT_VERSION = 1;

/** @typedef {{ listProducts(opts?: object): AsyncIterable<SourceProductRef>, fetchProduct(ref: SourceProductRef): Promise<SourceProduct> }} CatalogSource */

/** Erori pe care pipeline-ul le tratează diferit de un bug de cod. */
export class SourceStructureChanged extends Error {
  constructor(msg) { super(msg); this.name = 'SourceStructureChanged'; }
}
