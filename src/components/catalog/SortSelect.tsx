"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import type { Locale } from "@/lib/types";

/** Sortarea stă în query, nu în cale: nu e o rută pe care vrem s-o indexăm. */
export function SortSelect({ locale, value }: { locale: Locale; value: string }) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  void locale;

  return (
    <Select
      label={t("sort")}
      labelHidden
      value={value}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        if (e.target.value === "default") next.delete("sortare");
        else next.set("sortare", e.target.value);
        next.delete("pagina");
        const qs = next.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
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
