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

/**
 * O ETICHETĂ PENTRU TOT CATALOGUL ERA O ETICHETĂ PENTRU NIMIC.
 *
 * Până aici, fiecare citire din Supabase primea `tags: ["catalog"]`. Layout-ul
 * rădăcină cheamă `getSettings()`, deci eticheta ajungea pe absolut fiecare
 * pagină — cele 18.373 de fișe de produs × 2 limbi, plus catalogul. Un singur
 * `revalidateTag("catalog")` expira ~37.000 de intrări din cache, iar fiecare
 * pagină atinsă după aceea de un robot se re-randa și se rescria: o scriere ISR
 * bucata.
 *
 * Cronul o golea în fiecare zi. Iar jurnalul de sincronizări arată pentru ce:
 * pe 10 septembrie se schimbaseră 3 produse; pe 9 septembrie, 58. Aruncam tot
 * catalogul ca să împrospătăm trei fișe. De aici cele 325.000 de scrieri ISR
 * dintr-un buget de 200.000.
 *
 * Acum eticheta se deduce din interogare:
 *
 *   `products` căutat după un slug   ->  `produs:<slug>` (+ `produse-toate`)
 *   orice altceva                    ->  `catalog`
 *
 * Așa `revalidateTag("produs:michelin-…")` atinge exact fișa aceea și nimic
 * altceva. `catalog` rămâne, dar acoperă doar listările, paginile de marcă și
 * cele statice — nu și fișele de produs, fiindcă citirea lor după slug nu mai
 * poartă eticheta. `produse-toate` e frâna de mână: se golește doar când chiar
 * s-a schimbat aproape tot.
 */
function eticheteDinInterogare(input: RequestInfo | URL): string[] {
  const href =
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const i = href.indexOf("/rest/v1/");
  if (i < 0) return ["catalog"];

  const [tabel, interogare = ""] = href.slice(i + "/rest/v1/".length).split("?");
  if (tabel !== "products") return ["catalog"];

  /* `getProductBySlug` filtrează `slug_ro=eq.X`; `resolveRootSlug` întreabă
     `or=(slug_ru.eq.X,slug_ro.eq.X)`. Ambele caută o singură fișă și amândouă
     trebuie să dea aceeași etichetă — altfel una din cele două citiri ale
     paginii ar rămâne legată de `catalog` și ar reînvia exact problema. */
  let clar = interogare;
  try {
    clar = decodeURIComponent(interogare);
  } catch {
    /* Secvență procentuală stricată: se caută pe forma brută. O etichetă
       greșită ar fi mai rea decât o excepție aici — rămâne `catalog`. */
  }
  const m = clar.match(/slug_r[ou](?:=|\.)eq\.([^&,)]+)/);
  return m ? [`produs:${m[1]}`, "produse-toate"] : ["catalog"];
}

/**
 * O lună, nu o zi. Prospețimea nu mai vine de la ceas, ci de la etichete:
 * sincronizarea golește exact fișele pe care le-a schimbat. Ceasul e doar plasa
 * de siguranță pentru ce s-ar schimba pe lângă cron — și o plasă care se lasă
 * zilnic peste 37.000 de pagini costă singură mai mult decât tot bugetul.
 */
const O_LUNA = 2592000;

const cachedFetch: typeof fetch = (input, init) =>
  withRetry(input, {
    ...init,
    next: { revalidate: O_LUNA, tags: eticheteDinInterogare(input) },
  } as RequestInit);

export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false }, global: { fetch: cachedFetch } },
);

/**
 * Client pentru CE E ÎN JURUL fișei, nu pentru fișă: „alternative", „măsuri
 * apropiate", „recomandate".
 *
 * Sunt listări de produse, deci prin `db` ar primi eticheta `catalog` — și
 * atunci fișa de produs ar purta-o și ea, prin ele, iar golirea listărilor ar
 * expira din nou toate cele 37.000 de pagini. Exact ocolul pe care fixul de mai
 * sus îl închide pe ușa din față.
 *
 * Blocurile astea sunt sugestii, nu prețul de pe pagină. Se pot învechi cu o
 * lună fără să deranjeze pe nimeni, iar `secundar` nu se golește din cron.
 */
const cachedFetchSecundar: typeof fetch = (input, init) =>
  withRetry(input, { ...init, next: { revalidate: O_LUNA, tags: ["secundar"] } } as RequestInit);

export const dbSecundar = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false }, global: { fetch: cachedFetchSecundar } },
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
