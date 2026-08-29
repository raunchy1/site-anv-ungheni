import { createClient } from "@supabase/supabase-js";

/**
 * Client de citire pentru componentele server. Folosește cheia publică:
 * RLS permite `select` pe catalog, deci nu e nevoie de service role la randare.
 *
 * FETCH-UL E ÎNLOCUIT ca răspunsurile să intre în Data Cache-ul lui Next.
 * `cache()` din React ține un rezultat cât ține o cerere; catalogul e o rută
 * dinamică (citește `?pagina`, `?sortare`), deci fără asta fiecare clic pe un
 * filtru relua aceleași interogări în Supabase — 450 ms de așteptare în care
 * ecranul stă neschimbat. Cu `revalidate`, a doua vizită pe aceeași combinație
 * răspunde din cache.
 *
 * 15 minute e cât ține și `revalidate` al rutelor de catalog; prețurile și
 * stocurile vin din același import zilnic, deci nu se învechește nimic ce nu
 * era deja de 15 minute vechi. Eticheta `catalog` permite golirea imediată
 * dintr-o acțiune de server, dacă va fi nevoie.
 */
const cachedFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, next: { revalidate: 900, tags: ["catalog"] } });

export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false }, global: { fetch: cachedFetch } },
);

/**
 * Client de SCRIERE, tot cu cheia anonimă, dar fără cache.
 *
 * Comenzile se inserează cu cheia publică intenționat: honeypot-ul și limita de
 * 3 comenzi pe oră stau în declanșatoare de bază (migrarea 0007), iar
 * `service_role` le sare din construcție. Fetch-ul e cel implicit — un POST
 * n-are ce căuta în Data Cache, iar `revalidate` pe el ar fi doar zgomot.
 */
export const dbWrite = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

/** Doar pentru operații care trebuie să ocolească RLS. Niciodată importat în client. */
export function adminDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY lipsește");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "produse";

/** `produse/<hash>.jpg` -> URL public complet. */
export function imageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  const file = storagePath.startsWith(`${BUCKET}/`) ? storagePath.slice(BUCKET.length + 1) : storagePath;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${file}`;
}
