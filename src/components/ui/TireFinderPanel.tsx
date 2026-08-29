import { TireFinder } from "./TireFinder";
import { getBrandOptions, getSeasonCounts } from "@/lib/db/queries";
import type { Locale } from "@/lib/i18n";

/**
 * Panoul de căutare, gata cu datele lui.
 *
 * `TireFinder` are nevoie de mărci și de contoarele pe sezon, iar acelea vin din
 * bază. Fără învelișul ăsta, fiecare pagină care vrea panoul trebuie să știe ce
 * să interogheze — și, mai devreme sau mai târziu, una uită și afișează o listă
 * de mărci goală. Interogările sunt `cache()`-uite pe cerere, deci al doilea
 * panou din aceeași pagină nu costă nimic.
 *
 * Pagina principală păstrează varianta directă: acolo aceleași două interogări
 * intră oricum în `Promise.all`-ul ei.
 */
export async function TireFinderPanel({ locale, className }: { locale: Locale; className?: string }) {
  const [brands, seasonCounts] = await Promise.all([getBrandOptions(), getSeasonCounts()]);
  return <TireFinder locale={locale} brands={brands} seasonCounts={seasonCounts} className={className} />;
}
