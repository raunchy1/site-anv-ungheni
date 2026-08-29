import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Ce se vede în timp ce catalogul se aduce de la server.
 *
 * Catalogul e singura rută dinamică din site: citește pagina și sortarea din
 * query, deci nu poate fi pre-generată și fiecare clic pe un filtru așteaptă
 * serverul. Fără asta, Next ține ecranul VECHI pe loc până sosește răspunsul —
 * apeși un filtru și nu se schimbă nimic o jumătate de secundă. Arată exact ca
 * o aplicație blocată, chiar dacă totul funcționează.
 *
 * Silueta e a paginii reale, cu aceleași dimensiuni: bara laterală de 240px,
 * grila de carduri cu aceeași proporție. Când sosesc datele, nimic nu sare.
 */
export function CatalogSkeleton() {
  return (
    <div className="shell py-[var(--sp-6)]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Se încarcă…</span>

      <Skeleton className="h-4 w-[220px]" />

      <div className="mt-[var(--sp-4)] flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
        <Skeleton className="h-9 w-[280px]" />
        <Skeleton className="h-5 w-[120px]" />
      </div>
      <Skeleton className="mt-[var(--sp-3)] h-2 w-full" />

      <div className="mt-[var(--sp-6)] grid gap-[var(--sp-6)] lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* bara de filtre — doar pe desktop, ca în pagina reală */}
        <div className="hidden flex-col gap-[var(--sp-6)] lg:flex">
          {[6, 4, 3, 8].map((n, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-[80px]" />
              <div className="mt-[var(--sp-3)] flex flex-wrap gap-[var(--sp-2)]">
                {Array.from({ length: n }, (_, j) => (
                  <Skeleton key={j} className="h-9 w-[64px]" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="min-w-0">
          <div className="mb-[var(--sp-5)] flex items-center justify-between gap-[var(--sp-4)]">
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-11 w-[200px]" />
          </div>
          <ul className="grid grid-cols-2 gap-[var(--sp-4)] sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }, (_, i) => (
              <li key={i} className="flex flex-col gap-[var(--sp-3)] rounded-[var(--radius-md)] border border-[var(--line)] p-[var(--sp-4)]">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-[85%]" />
                <Skeleton className="h-4 w-[55%]" />
                <Skeleton className="h-6 w-[70px]" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
