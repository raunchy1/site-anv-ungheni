"use client";

import { useEffect, useRef, useState } from "react";
import { IconPin } from "@/components/icons";

/**
 * Harta Google aduce ~318 KB de JavaScript terț (`places.js`, `main.js`,
 * `init_embed.js`, `util.js`) și, măsurat, întârzia imaginea LCP a fișei de
 * produs cu 2,5 secunde. `loading="lazy"` nu ajută: Chrome încarcă iframe-ul
 * imediat ce e „aproape" de viewport, iar în randarea de audit e mereu aproape.
 *
 * Soluția e o facadă: un bloc care arată adresa, cu aceleași dimensiuni ca harta,
 * și care montează iframe-ul abia când intră efectiv în ecran — sau la clic.
 * Nu se pierde nimic: cine derulează până la hartă o primește.
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

  useEffect(() => {
    if (mounted || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setMounted(true); io.disconnect(); } },
      { rootMargin: "200px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [mounted]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ height }}
    >
      {mounted ? (
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
          onClick={() => setMounted(true)}
          className="flex h-full w-full flex-col items-center justify-center gap-[var(--sp-2)] bg-[var(--surface-2)] text-200 text-[var(--ink-muted)] transition-colors duration-[var(--dur-1)] hover:text-[var(--ink-strong)]"
        >
          <IconPin size={22} />
          <span>{address}</span>
          <span className="underline">{title}</span>
        </button>
      )}
    </div>
  );
}
