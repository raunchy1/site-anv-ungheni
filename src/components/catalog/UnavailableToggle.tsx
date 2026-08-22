"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Checkbox } from "@/components/ui/Checkbox";

/**
 * 46% din catalog e indisponibil. Filtrul implicit le ascunde, dar comutatorul
 * e vizibil și poartă contorul — nu îngropat într-un accordion.
 */
export function UnavailableToggle({ checked, label, count }: { checked: boolean; label: string; count: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <Checkbox
      // Eticheta e lunga si trebuie citita intreaga: in bara de filtre de 240px
      // `truncate`-ul implicit al componentei ar taia tocmai cuvantul „indisponibile".
      className="[&_span:last-child]:overflow-visible [&_span:last-child]:whitespace-normal"
      checked={checked}
      label={`${label} (${count})`}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        if (e.target.checked) next.set("indisponibile", "1");
        else next.delete("indisponibile");
        next.delete("pagina");
        const qs = next.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }}
    />
  );
}
