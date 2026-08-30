/**
 * Sursa de feed — schelet, deliberat gol.
 *
 * Există ca să fie clar unde se lipește feed-ul oficial când parteneriatul îl
 * livrează, și ca să nu se strecoare în pipeline presupuneri care merg doar cu
 * HTML. Când apare fișierul (XML sau CSV) în `data/source/`, se implementează
 * cele două metode aici și se schimbă `SOURCE` în `config.mjs`. Nimic altceva.
 *
 * Ce trebuie cerut de la ei, ca feed-ul să fie de fapt mai bun decât HTML-ul:
 *   - ID stabil per produs (același cu `sku` de pe site, ideal)
 *   - titlu și descriere în RO și RU
 *   - dimensiune în câmpuri separate: lățime, profil, diametru
 *   - indice de sarcină, indice de viteză, XL, runflat, anotimp, pivoți
 *   - preț în MDL și disponibilitate
 *   - URL-uri de imagine la rezoluție mare
 *   - `lastmod` sau echivalent, ca să nu recitim tot catalogul zilnic
 */
import { SourceStructureChanged } from './source.mjs';

export function createFeedSource() {
  return {
    async *listProducts() {
      throw new SourceStructureChanged('FeedSource nu e implementat: nu avem încă feed de la pandashop');
    },
    async fetchProduct() {
      throw new SourceStructureChanged('FeedSource nu e implementat: nu avem încă feed de la pandashop');
    },
  };
}
