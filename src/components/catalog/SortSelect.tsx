"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import type { CatalogHref } from "./hrefs";

/**
 * Sortarea stă în cale, ca filtrele: `/catalog-anvelope/latime_205/sortare_pret-asc`.
 *
 * Nu ca s-o indexăm — paginile sortate rămân `noindex` — ci pentru că un query
 * făcea toată ruta dinamică, iar catalogul plătea un drum până la bază la
 * fiecare clic. Căile vin gata construite de pe server, deci controlul nu mai
 * citește URL-ul curent și nu mai are nevoie de `useSearchParams`.
 */
export function SortSelect({
  value,
  hrefs,
}: {
  value: string;
  hrefs: Record<"default" | "price_asc" | "price_desc" | "name", CatalogHref>;
}) {
  const t = useTranslations("catalog");
  const router = useRouter();

  return (
    <Select
      label={t("sort")}
      labelHidden
      value={value}
      onChange={(e) => {
        const href = hrefs[e.target.value as keyof typeof hrefs] ?? hrefs.default;
        router.push(href, { scroll: false });
      }}
      options={[
        { value: "default", label: t("sortDefault") },
        { value: "price_asc", label: t("sortPriceAsc") },
        { value: "price_desc", label: t("sortPriceDesc") },
        { value: "name", label: t("sortName") },
      ]}
    />
  );
}
