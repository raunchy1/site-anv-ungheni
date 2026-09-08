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
 * O zi e cât ține și `revalidate` al rutelor de catalog; prețurile și stocurile
 * vin din același import zilnic, deci nu se învechește nimic ce nu era deja
 * vechi de o zi. Eticheta `catalog` nu mai e o rezervă teoretică: cronul o
 * golește la finalul fiecărei sincronizări, așa că datele proaspete ajung în
 * catalog imediat după import, nu la următoarea expirare.
 */
/**
 * O SINGURĂ ÎNCERCARE RATATĂ NU E UN RĂSPUNS.
 *
 * Gateway-ul Supabase răspunde 502/504/522 când baza e sub presiune — câteva
 * secunde, apoi trece. Fără reîncercare, fiecare astfel de secundă însemna:
 * la randare, o excepție (deci pagina veche din cache, acceptabil); la BUILD,
 * un deploy întreg pierdut, fiindcă o singură rută pre-generată care aruncă
 * oprește exportul. Pe 8 septembrie 2026 exact asta a blocat repararea:
 * build-ul nu putea porni cât timp baza clipea.
 *
 * Două reîncercări, cu pauză crescătoare și puțin zgomot ca să nu plece toate
 * odată. Nu mai multe: o bază în genunchi nu are nevoie să fie lovită de cinci
 * ori pentru aceeași pagină.
 */
const RETRY_STATUS = new Set([429, 500, 502, 503, 504, 520, 521, 522, 524]);

async function withRetry(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  let last: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const pauza = 400 * 2 ** (attempt - 1) + Math.random() * 200;
      await new Promise((r) => setTimeout(r, pauza));
    }
    try {
      const res = await fetch(input, init);
      if (!RETRY_STATUS.has(res.status)) return res;
      last = res;
    } catch (e) {
      /* Rețea căzută sau cerere anulată: ultima încercare o lasă să iasă. */
      if (attempt === 2) throw e;
    }
  }
  return last!;
}

const cachedFetch: typeof fetch = (input, init) =>
  withRetry(input, { ...init, next: { revalidate: 86400, tags: ["catalog"] } } as RequestInit);

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
