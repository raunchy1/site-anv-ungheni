import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { sizeTree } from "@/lib/size-tree";

/**
 * CELE MAI ACOPERITE DIMENSIUNI, CA LINKURI — fără o singură interogare.
 *
 * Stă acolo unde stătea panoul de căutare: pe 404 și sub catalogul gol. Panoul
 * are nevoie de mărci și de contoarele pe sezon, adică de patru interogări în
 * bază, iar astea două sunt exact paginile pe care le cere un robot de o mie de
 * ori pe oră și pe care nu le ține niciun cache. Pe 8 septembrie 2026, fiecare
 * adresă inventată cerea patru interogări în plus, tocmai fiindcă nu găsea nimic
 * — cu cât baza mergea mai prost, cu atât primea mai mult de lucru.
 *
 * Arborele de dimensiuni e generat la build, deci lista de mai jos e la fel de
 * reală ca panoul și nu costă nimic.
 */
export async function SizeShortcuts({ limit = 8 }: { limit?: number }) {
  const t = await getTranslations();

  const sizes = Object.entries(sizeTree)
    .flatMap(([width, [, , aspects]]) =>
      Object.entries(aspects).flatMap(([aspect, [, , diameters]]) =>
        Object.entries(diameters).map(([diameter, [, available]]) => ({ width, aspect, diameter, available })),
      ),
    )
    .sort((a, b) => b.available - a.available)
    .slice(0, limit);

  return (
    <section>
      <h2 className="label">{t("home.popularSizes")}</h2>
      <ul className="mt-[var(--sp-3)] flex flex-wrap gap-[var(--sp-2)]">
        {sizes.map((s) => (
          <li key={`${s.width}-${s.aspect}-${s.diameter}`}>
            <Link
              href={{
                pathname: "/catalog/[...filtre]",
                params: { filtre: [`latime_${s.width}`, `inaltime_${s.aspect}`, `diametru_${s.diameter.toLowerCase()}`] },
              }}
              className="num inline-flex items-baseline gap-[var(--sp-2)] rounded-[var(--radius-sm)] border border-[var(--line)] px-[var(--sp-3)] py-[var(--sp-2)] text-300 transition-colors duration-[var(--dur-1)] hover:border-[var(--line-strong)]"
            >
              <span className="text-[var(--ink-strong)]">{s.width}/{s.aspect} {s.diameter}</span>
              <span className="text-100 text-[var(--ink-muted)]">{s.available}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/catalog" className="nav-link mt-[var(--sp-4)] inline-block text-200 underline">
        {t("catalog.title")}
      </Link>
    </section>
  );
}
