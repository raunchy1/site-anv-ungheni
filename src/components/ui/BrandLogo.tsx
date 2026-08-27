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
 * 2. ACEEAȘI PLACĂ ca la fotografii (`--img-plate` + `mix-blend-mode`).
 *    Logo-urile sunt aproape toate negre pe alb: pe fundal închis ar apărea ca
 *    dreptunghiuri albe decupate, iar fără placă ar dispărea complet.
 * 3. REZERVĂ TIPOGRAFICĂ, nu spațiu gol. Cât timp `brands.logo_url` e NULL —
 *    adică pentru toate mărcile până se încarcă fișierele oficiale — se afișează
 *    numele în versale, care e oricum identitatea de brand a site-ului
 *    (DECISIONS.md §A.3). Cardul arată la fel de terminat cu și fără logo.
 */
export function BrandLogo({
  name,
  src,
  size = "sm",
  className,
}: {
  name: string | null;
  src?: string | null;
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
        "relative overflow-hidden rounded-[var(--radius-xs)] bg-[var(--img-plate)]",
        box,
        className,
      )}
    >
      <Image
        src={src}
        alt={name}
        fill
        sizes="160px"
        className="object-contain object-left p-[4%] [mix-blend-mode:var(--img-blend)]"
      />
    </div>
  );
}
