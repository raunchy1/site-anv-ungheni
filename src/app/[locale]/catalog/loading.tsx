import { Skeleton } from "@/components/ui/Skeleton";

/**
 * CATALOGUL SE DESCHIDE PE LOC, IAR REZULTATELE VIN DUPĂ.
 *
 * Fără fișierul ăsta, Next schimbă pagina abia când are catalogul întreg — o
 * listare are câteva sute de KB, deci pe un telefon trecea peste o secundă în
 * care apăsarea pe „Caută" părea să nu fi făcut nimic, iar clienții apăsau
 * din nou. Cu el, adresa și scheletul paginii apar imediat.
 *
 * Așezarea e a lui `CatalogView`: titlu, filtre în stânga, grila de anvelope.
 * Când sosesc rezultatele, pagina nu sare.
 */
export default function CatalogLoading() {
  return (
    <div className="shell py-[var(--sp-6)]" aria-busy="true">
      <Skeleton className="h-4 w-48" />
      <div className="mt-[var(--sp-4)] flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
        <Skeleton className="h-9 w-[min(28rem,80%)]" />
        <Skeleton className="h-5 w-28" />
      </div>
      <Skeleton className="mt-[var(--sp-3)] h-4 w-[min(40rem,100%)]" />

      <div className="mt-[var(--sp-6)] grid gap-[var(--sp-6)] lg:grid-cols-[240px_1fr]">
        <div className="hidden flex-col gap-[var(--sp-3)] lg:flex">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
        <div className="min-w-0">
          <div className="mb-[var(--sp-4)] flex justify-end">
            <Skeleton className="h-10 w-44" />
          </div>
          <ul className="grid grid-cols-2 gap-[var(--sp-4)] sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i} className="flex flex-col gap-[var(--sp-2)]">
                <Skeleton className="aspect-square w-full rounded-[var(--radius-md)]" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-6 w-2/5" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
