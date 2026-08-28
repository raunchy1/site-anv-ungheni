import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Logo-ul mărcii, sub fotografie, exact ca la magazinele de anvelope unde
 * șoferul recunoaște marca înainte să citească titlul.
 *
 * Trei reguli, toate impuse de faptul că logo-urile vin de la 134 de
 * producători diferiți și nu pot fi normalizate:
 *
 * 1. CUTIE DE ÎNĂLȚIME FIXĂ, `object-contain`. Un logo lat (`CONTINENTAL`) și
 *    unul pătrat (`GT`) trebuie să ocupe aceeași bandă verticală, altfel
 *    titlurile din grilă nu mai cad pe aceeași linie.
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
  size = "sm",
  className,
}: {
  name: string | null;
  src?: string | null;
  /** Logo desenat în alb: are nevoie de placă închisă ca să se vadă. */
  onDark?: boolean;
  /** `sm` = card de produs (20px), `md` = fișă de produs, `lg` = pagină de marcă. */
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!name) return null;

  const box = size === "lg" ? "h-12 w-40" : size === "md" ? "h-8 w-28" : "h-5 w-20";

  if (!src) {
    return (
      <p className={cn("label optical-left", size === "lg" && "text-300", className)}>{name}</p>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-xs)]",
        onDark ? "bg-[var(--panel)]" : "bg-[var(--img-plate)]",
        box,
        className,
      )}
    >
      <Image
        src={src}
        alt={name}
        fill
        sizes="160px"
        className={cn(
          "object-contain object-left p-[6%]",
          // `multiply` lipește fotografia de placa deschisă; pe placa închisă
          // ar înnegri exact desenul alb pe care vrem să-l vedem.
          !onDark && "[mix-blend-mode:var(--img-blend)]",
        )}
      />
    </div>
  );
}
