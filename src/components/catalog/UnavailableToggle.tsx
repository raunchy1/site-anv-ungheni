"use client";

import { useRouter } from "@/i18n/navigation";
import { Checkbox } from "@/components/ui/Checkbox";
import type { CatalogHref } from "./hrefs";

/**
 * 46% din catalog e indisponibil. Filtrul implicit le ascunde, dar comutatorul
 * e vizibil și poartă contorul — nu îngropat într-un accordion.
 */
export function UnavailableToggle({
  checked, label, count, hrefOn, hrefOff,
}: {
  checked: boolean;
  label: string;
  count: number;
  /* Adresele vin de pe server, ca la sortare: vezi SortSelect. */
  hrefOn: CatalogHref;
  hrefOff: CatalogHref;
}) {
  const router = useRouter();

  return (
    <Checkbox
      // Eticheta e lunga si trebuie citita intreaga: in bara de filtre de 240px
      // `truncate`-ul implicit al componentei ar taia tocmai cuvantul „indisponibile".
      className="[&_span:last-child]:overflow-visible [&_span:last-child]:whitespace-normal"
      checked={checked}
      label={`${label} (${count})`}
      onChange={(e) => router.push(e.target.checked ? hrefOn : hrefOff, { scroll: false })}
    />
  );
}
