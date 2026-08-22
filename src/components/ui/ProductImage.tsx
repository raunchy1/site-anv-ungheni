import Image from "next/image";
import { cn } from "@/lib/cn";
import { IconTyre } from "@/components/icons";
import { IMAGE_HOST } from "@/lib/sample-products";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/**
 * O singura fotografie per produs, fundal alb, incadrare inconsistenta,
 * catalog extern. De aici, trei reguli:
 *
 * 1. Container cu proportie FIXA 1:1 si `object-contain`. Nu `cover`:
 *    `cover` ar taia flancul anvelopei la produsele incadrate strans.
 * 2. Padding interior de 8-12%: fotografiile vin cu marja proprie inegala,
 *    iar un padding constant nu o rezolva — dar o face predictibila.
 * 3. Fotografia sta pe o PLACA deschisa si calda (`--img-plate`), identica in
 *    light si in dark, cu `mix-blend-mode: multiply`. Pe alb pur, marginea
 *    neregulata a fotografiei ar fi invizibila si produsele ar parea de
 *    dimensiuni diferite. Iar in dark, o fotografie cu fundal alb pe o
 *    suprafata inchisa apare ca un dreptunghi alb decupat — exact efectul
 *    care face un catalog sa arate ieftin. Placa il elimina in ambele teme.
 */
export function ProductImage({
  src,
  alt,
  locale,
  sizes = "(min-width: 1024px) 280px, 45vw",
  priority = false,
  className,
}: {
  src: string | null;
  alt: string;
  locale: Locale;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const d = t(locale);
  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-[var(--radius-xs)] bg-[var(--img-plate)]",
        className,
      )}
    >
      {src ? (
        <Image
          // Imaginile din Supabase Storage vin cu URL absolut; cele din
          // `sample-products` sunt cai relative pe host-ul vechi.
          src={/^https?:\/\//.test(src) ? src : `${IMAGE_HOST}${src}`}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-[10%] [mix-blend-mode:var(--img-blend)]"
        />
      ) : (
        /* 10 produse din 15.010 n-au fotografie. Nu un patrat gri gol:
           silueta produsului + eticheta, ca sa se vada ca lipsa e cunoscuta. */
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--sp-2)] text-[var(--img-plate-ink)]">
          <IconTyre size={40} />
          <span className="text-100 font-semibold uppercase tracking-[var(--tr-label)]">
            {d.noImage}
          </span>
        </div>
      )}
    </div>
  );
}
