import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Logo-ul mărcii, sub fotografie, exact ca la magazinele de anvelope unde
 * șoferul recunoaște marca înainte să citească titlul.
 *
 * Trei reguli, toate impuse de faptul că logo-urile vin de la 134 de
 * producători diferiți și nu pot fi normalizate:
 *
 * 1. ÎNĂLȚIME FIXĂ, lățime pe măsura desenului. Înălțimea egală ține titlurile
 *    din grilă pe aceeași linie și păstrează CLS-ul zero; lățimea vine din
 *    `brands.logo_ratio`, altfel emblemele aproape pătrate (Joyroad, Nexen) ar
 *    pluti într-o bandă de trei ori mai lată decât ele — o bară, cu logo-ul ca
 *    accident. Lățimea e plafonată, ca un wordmark foarte lung (LingLong, 10:1)
 *    să nu împingă cardul.
 *
 *    Înălțimile: 38px pe card, 52 pe fișă, 72 pe pagina de marcă. La 26 px
 *    emblemele erau abia lizibile — un logo de marcă trebuie recunoscut dintr-o
 *    privire, altfel nu-și face treaba pentru care a fost pus acolo.
 * 2. PLACĂ, nu fundal transparent. Implicit e aceeași placă deschisă ca la
 *    fotografii (`--img-plate` + `mix-blend-mode`), pentru că logo-urile sunt
 *    aproape toate întunecate pe alb. Un sfert dintre producători publică însă
 *    doar varianta albă, cea din antetul propriului site: acelea primesc placă
 *    ÎNCHISĂ (`onDark`), adică exact suprafața pentru care au fost desenate.
 *    Alternativa — să le lăsăm pe alb — le-ar face invizibile.
 * 3. REZERVĂ TIPOGRAFICĂ, nu spațiu gol. Cât timp `brands.logo_url` e NULL —
 *    adică pentru toate mărcile până se încarcă fișierele oficiale — se afișează
 *    numele în versale, care e oricum identitatea de brand a site-ului
 *    (DECISIONS.md §A.3). Cardul arată la fel de terminat cu și fără logo.
 */
export function BrandLogo({
  name,
  src,
  onDark = false,
  ratio,
  size = "sm",
  className,
}: {
  name: string | null;
  src?: string | null;
  /** Logo desenat în alb: are nevoie de placă închisă ca să se vadă. */
  onDark?: boolean;
  /** Lățime/înălțime a fișierului. Lipsă = bandă la lățimea maximă. */
  ratio?: number | null;
  /** `sm` = card de produs (20px), `md` = fișă de produs, `lg` = pagină de marcă. */
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!name) return null;

  /* Banda e mai înaltă decât pare necesar pentru un wordmark, și e intenționat:
     o parte dintre mărci au emblemă aproape pătrată (Joyroad, Nexen), iar pe o
     bandă de 20px acelea se randau la 20×20 — o pată, nu un logo. La 26px,
     emblema rămâne lizibilă, iar wordmark-urile late nu pierd nimic. */
  const h = size === "lg" ? 72 : size === "md" ? 52 : 38;
  const maxW = size === "lg" ? 300 : size === "md" ? 210 : 150;
  // +8% pentru marginea interioară, ca desenul să nu atingă muchia plăcii
  const w = Math.round(Math.min(maxW, Math.max(h, h * (ratio ?? 6) * 1.08)));

  if (!src) {
    return (
      <p className={cn("label optical-left", size === "lg" && "text-300", className)}>{name}</p>
    );
  }

  return (
    <div
      style={{ width: w, height: h }}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[var(--radius-xs)]",
        onDark ? "bg-[var(--panel)]" : "bg-[var(--img-plate)]",
        className,
      )}
    >
      <Image
        src={src}
        alt={name}
        fill
        sizes="224px"
        className={cn(
          "object-contain object-center p-[6%]",
          // `multiply` lipește fotografia de placa deschisă; pe placa închisă
          // ar înnegri exact desenul alb pe care vrem să-l vedem.
          !onDark && "[mix-blend-mode:var(--img-blend)]",
        )}
      />
    </div>
  );
}
