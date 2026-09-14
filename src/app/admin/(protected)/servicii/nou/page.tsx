import type { Metadata } from "next";
import { ServiceForm } from "../ServiceForm";
import { createService } from "../actions";

export const metadata: Metadata = { title: "Serviciu nou" };

export default function ServiciuNouPage() {
  return (
    <ServiceForm
      service={{
        title_ro: "",
        title_ru: null,
        slug_ro: "",
        slug_ru: null,
        body_ro: null,
        body_ru: null,
        excerpt_ro: null,
        excerpt_ru: null,
        image_url: null,
        price_from_mdl: null,
        meta_title_ro: null,
        meta_title_ru: null,
        meta_desc_ro: null,
        meta_desc_ru: null,
        sort_order: 0,
        is_active: true,
      }}
      action={createService}
      title="Serviciu nou"
    />
  );
}
