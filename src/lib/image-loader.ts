/**
 * Loader de imagini pentru `next/image`, catre Supabase, nu catre `/_next/image`.
 *
 * DE CE. Optimizatorul Vercel factureaza fiecare varianta generata, iar
 * catalogul are 23.099 de fotografii. Planul Hobby include 5.000 de
 * transformari pe luna, deci limita se atingea prin simpla rasfoire a
 * catalogului — dupa ce Fast Origin Transfer blocase deja contul pe 8
 * septembrie 2026. Pe deasupra, fiecare transformare insemna ca optimizatorul
 * descarca originalul din Supabase, il redimensiona si il tinea in cache-ul lui:
 * trafic si stocare platite la Vercel pentru fisiere care erau deja pe un CDN.
 *
 * Supabase Storage stie sa redimensioneze singur, prin `render/image`, si
 * serveste rezultatul cu `cache-control: max-age=31536000` de pe propriul CDN —
 * fata de `no-cache` pe originale. Masurat pe o fotografie de produs, la
 * latimea cardului:
 *
 *     original            3.612 KB   cache-control: no-cache
 *     render w=350 jpeg      33 KB   max-age=31536000
 *     render w=350 webp      25 KB   max-age=31536000
 *
 * Originalul de mai sus e dintre cele mari; pe un esantion de 400 de fisiere,
 * mediana e 0,12 MB si media 0,19 MB, adica ~4,3 GB de originale in bucket.
 * Raportul conteaza oricum mai mult decat cazul individual: nimic din ce se
 * afiseaza nu are nevoie de mai mult de 350 px pe cardul de catalog.
 *
 * Formatul se negociaza din antetul `Accept`, deci browserele moderne primesc
 * WebP fara sa cerem noi nimic — exact ce facea `formats: ["image/avif",
 * "image/webp"]` la Vercel.
 *
 * CE RAMANE LA NEXT. `deviceSizes` si `imageSizes` din `next.config.ts`, adica
 * lista de latimi din `srcSet`. Loader-ul primeste latimea aleasa de Next si o
 * traduce intr-un URL; restul logicii de `sizes` si `srcSet` e neatinsa.
 */

/** Marcajul din URL-urile publice de Storage. Nu depindem de numele proiectului. */
const OBJECT_PUBLIC = "/storage/v1/object/public/";

export default function supabaseImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  /* Orice nu e din Supabase Storage — host-ul vechi `anvelope-ungheni.md` din
     datele de proba, sau un fisier din `/public` — se serveste asa cum e.
     Loader-ul e global in Next, deci trebuie sa fie inofensiv pe ce nu cunoaste. */
  if (!src.includes(OBJECT_PUBLIC)) return src;

  /* SVG-urile sunt deja independente de rezolutie: o „redimensionare" ar fi un
     drum in plus prin transformator, fara niciun octet castigat. Se lasa la
     originalul lor.

     Nota: cat timp treceau prin optimizatorul Vercel, primeau si antetul
     `contentSecurityPolicy` cu `script-src 'none'; sandbox`. Acum vin direct de
     la Supabase, fara el. Riscul ramane teoretic — un `<img>` nu executa
     scripturi din SVG in niciun browser actual, iar in bucket scrie exclusiv
     `tools/seed/upload-brand-logos.mjs`, cu service role, din fisiere puse
     manual. Daca vreodata se incarca SVG de la utilizatori, asta se schimba. */
  if (src.toLowerCase().endsWith(".svg")) return src;

  const [base, path] = src.split(OBJECT_PUBLIC);
  const params = new URLSearchParams({
    width: String(width),
    /* 75 e implicitul lui Next; il pastram ca sa nu schimbam calitatea odata
       cu furnizorul. Supabase accepta 20-100. */
    quality: String(quality ?? 75),
    /*
     * `contain`, NU implicitul `cover`. Fara el, Supabase nu redimensioneaza —
     * DECUPEAZA. Cand primeste doar `width`, pastreaza inaltimea originalului si
     * taie lateral pana la latimea ceruta:
     *
     *     logo Kapsen  576x86   --width=192-->  192x86    „KAPSEN" -> „IPS("
     *     foto produs  944x1600 --width=350--> 350x1600   o fasie verticala
     *     foto produs  944x1600 --width=96 -->  96x1600   o dunga
     *
     * `object-contain` din CSS nu putea salva nimic: fisierul sosea deja taiat,
     * iar browserul incadra cuminte decupajul. Cu `contain`, aceleasi cereri dau
     * 192x29, 350x593, 96x163 — adica raportul originalului, pastrat.
     *
     * Bug-ul e vechi de cand e loader-ul, dar s-a vazut abia acum: pana la
     * migrarea pe contul nou, in productie rula tot optimizatorul Vercel.
     */
    resize: "contain",
  });
  return `${base}/storage/v1/render/image/public/${path}?${params}`;
}
