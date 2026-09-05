"use client";

import { useEffect, useRef, useState } from "react";
import { IconPin } from "@/components/icons";
import { useConsent, usePermis } from "@/lib/consent/store";

/**
 * Harta Google aduce ~318 KB de JavaScript terț (`places.js`, `main.js`,
 * `init_embed.js`, `util.js`) și, măsurat, întârzia imaginea LCP a fișei de
 * produs cu 2,5 secunde. `loading="lazy"` nu ajută: Chrome încarcă iframe-ul
 * imediat ce e „aproape" de viewport, iar în randarea de audit e mereu aproape.
 *
 * Soluția e o facadă: un bloc care arată adresa, cu aceleași dimensiuni ca harta,
 * și care montează iframe-ul abia când intră efectiv în ecran — sau la clic.
 * Nu se pierde nimic: cine derulează până la hartă o primește.
 *
 * CONSIMȚĂMÂNTUL. Din momentul în care site-ul are bară de cookie, facada nu mai
 * e doar o optimizare: e bariera care ține datele acasă. Iframe-ul Google pune
 * cookie-uri și dezvăluie IP-ul vizitatorului, deci montarea automată la
 * derulare se face DOAR dacă omul a spus da. Fără acord, harta rămâne o facadă
 * pe care scrie de ce, iar un clic pe ea e un acord explicit pentru vizita
 * asta — cel mai clar consimțământ care există, dat exact pentru lucrul cerut.
 */
export function MapEmbed({
  lat, lng, locale, title, address, className, height = 320,
}: {
  lat: number;
  lng: number;
  locale: string;
  title: string;
  address: string;
  className?: string;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const permis = usePermis("harta");
  const { accepta } = useConsent();

  useEffect(() => {
    if (mounted || !ref.current) return;
    /* Fără acord nu se observă nimic: montarea la derulare ar ocoli bara. */
    if (!permis) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setMounted(true); io.disconnect(); } },
      { rootMargin: "200px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [mounted, permis]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ height }}
    >
      {mounted && permis ? (
        <iframe
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
          src={`https://www.google.com/maps?q=${lat},${lng}&hl=${locale}&z=17&output=embed`}
        />
      ) : (
        <button
          type="button"
          /* Clicul e și acordul. Se scrie în preferințe, ca harta să nu mai
             ceară voie la fiecare pagină după ce omul a spus o dată da. */
          onClick={() => { if (!permis) accepta({ harta: true }); setMounted(true); }}
          className="flex h-full w-full flex-col items-center justify-center gap-[var(--sp-2)] bg-[var(--surface-2)] px-[var(--sp-4)] text-center text-200 text-[var(--ink-muted)] transition-colors duration-[var(--dur-1)] hover:text-[var(--ink-strong)]"
        >
          <IconPin size={22} />
          <span>{address}</span>
          <span className="underline">{title}</span>
          {!permis ? (
            <span className="measure text-100 text-[var(--ink-muted)]">
              {locale === "ru"
                ? "Карта загружается с сервера Google и устанавливает его cookie. Нажмите, чтобы разрешить."
                : "Harta se încarcă de la Google și pune cookie-urile lui. Apasă pentru a permite."}
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
}
