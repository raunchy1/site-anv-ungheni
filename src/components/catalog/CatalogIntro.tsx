import { getTranslations } from "next-intl/server";
import type { CatalogSummary } from "@/lib/db/queries";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/types";

/**
 * PROPOZIȚIA CARE FACE PAGINA SĂ MERITE INDEXATĂ.
 *
 * Câteva sute de rute de dimensiune arată, pentru un robot, identic: același
 * antet, aceleași filtre, treizeci de carduri. Ce le deosebește e un rând de
 * text care spune ce nu scrie nicăieri altundeva — câte anvelope sunt pe
 * 205/55 R16, de la ce preț încep, ce mărci le acoperă. Exact răspunsul pe care
 * îl caută și omul care tastează „anvelope 205 55 r16 pret", și asistentul
 * întrebat „cât costă un set de 205/55 R16 în Moldova".
 *
 * Fiecare cifră vine din aceleași rânduri pe care le arată lista de dedesubt.
 * Nu e text de umplutură optimizat pentru roboți: dacă mâine nu mai avem decât
 * trei anvelope pe dimensiunea asta, propoziția o spune.
 */
export async function CatalogIntro({
  summary, eticheta, locale,
}: {
  summary: CatalogSummary;
  /** „205/55 R16", „Michelin", „iarnă" — ce anume s-a filtrat. */
  eticheta: string | null;
  locale: Locale;
}) {
  const t = await getTranslations();
  if (summary.total === 0) return null;

  const ru = locale === "ru";
  const numeSezon = (s: string) => t(`season.${s}`).toLowerCase();
  const sezoane = summary.sezoane.map(numeSezon);
  const marci = summary.marci;

  const bucati: string[] = [];

  bucati.push(
    ru
      ? `${eticheta ? `Шины ${eticheta}: ` : "В каталоге "}${summary.total} ${summary.total === 1 ? "позиция" : "позиций"} в наличии`
      : `${eticheta ? `Anvelope ${eticheta}: ` : "În catalog sunt "}${summary.total} ${summary.total === 1 ? "anvelopă disponibilă" : "de anvelope disponibile"}`,
  );

  if (summary.pretMin != null) {
    bucati.push(
      ru
        ? `цены от ${formatPrice(summary.pretMin)} MDL за штуку`
        : `cu prețuri de la ${formatPrice(summary.pretMin)} MDL bucata`,
    );
  }

  if (marci.length) {
    const listate = marci.slice(0, 6).join(", ");
    bucati.push(
      marci.length > 6
        ? (ru ? `${marci.length} марок, среди них ${listate}` : `de la ${marci.length} de mărci, printre care ${listate}`)
        : (ru ? `марки: ${listate}` : `mărcile ${listate}`),
    );
  }

  if (sezoane.length > 1) {
    bucati.push(ru ? `сезоны: ${sezoane.join(", ")}` : `pentru ${sezoane.join(", ")}`);
  }

  return (
    <p className="mt-[var(--sp-4)] max-w-[70ch] text-300 text-[var(--ink-muted)]">
      {`${bucati.join(", ")}. `}
      {ru
        ? "Доставка по всей Молдове за 1–3 дня, шиномонтаж в мастерской в Унгенах."
        : "Livrare în toată Moldova în 1–3 zile, montaj în atelierul din Ungheni."}
    </p>
  );
}
