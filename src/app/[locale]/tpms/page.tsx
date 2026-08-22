import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCard } from "@/components/ui/ProductCard";
import { TreadRule } from "@/components/icons";
import { db, imageUrl } from "@/lib/supabase/server";
import { toUiProduct } from "@/lib/adapt";
import type { Locale, Product } from "@/lib/types";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: t("tpms"),
    alternates: {
      canonical: locale === "ru" ? "/ru/datchiki-davleniya-v-shinah" : "/senzori-presiune-anvelope",
      languages: { ro: "/senzori-presiune-anvelope", ru: "/ru/datchiki-davleniya-v-shinah" },
    },
  };
}

export default async function TpmsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations();

  const { data } = await db
    .from("products")
    .select("*, product_images ( storage_path )")
    .eq("category", "tpms")
    .order("title_ro");

  const items = ((data as (Product & { product_images?: { storage_path: string }[] })[]) ?? []).map((p) => ({
    ...p, image_url: imageUrl(p.product_images?.[0]?.storage_path),
  }));

  return (
    <div className="shell py-[var(--sp-6)]">
      <Breadcrumb items={[{ label: t("nav.home"), href: l === "ru" ? "/ru" : "/" }, { label: t("nav.tpms") }]} />
      <h1 className="optical-left mt-[var(--sp-4)] text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-800">
        {t("nav.tpms")}
      </h1>
      <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />
      <ul className="mt-[var(--sp-8)] grid grid-cols-2 gap-[var(--sp-4)] sm:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => (<li key={p.id}><ProductCard product={toUiProduct(p)} locale={l} /></li>))}
      </ul>
    </div>
  );
}
