import { Skeleton } from "@/components/ui/Skeleton";

/**
 * `/[slug]` servește trei feluri de pagini: produs, marcă și serviciu. Cele
 * 1.087 pre-generate se deschid instantaneu, dar restul se randează la cerere —
 * și atunci ecranul vechi ar rămâne pe loc fără niciun semn.
 *
 * Silueta e cea comună celor trei: firimituri, titlu, imagine mare la stânga,
 * coloană de acțiuni la dreapta.
 */
export default function Loading() {
  return (
    <div className="shell py-[var(--sp-6)]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Se încarcă…</span>
      <Skeleton className="h-4 w-[260px]" />

      <div className="mt-[var(--sp-5)] grid gap-[var(--sp-8)] lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="min-w-0">
          <Skeleton className="h-10 w-[70%]" />
          <Skeleton className="mt-[var(--sp-3)] h-2 w-[128px]" />
          <Skeleton className="mt-[var(--sp-6)] aspect-[4/3] w-full" />
          <div className="mt-[var(--sp-6)] flex flex-col gap-[var(--sp-3)]">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
        <div className="flex flex-col gap-[var(--sp-4)]">
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-[220px] w-full" />
        </div>
      </div>
    </div>
  );
}
