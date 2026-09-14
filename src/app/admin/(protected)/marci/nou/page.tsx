import type { Metadata } from "next";
import { BrandForm } from "../BrandForm";
import { createBrand } from "../actions";

export const metadata: Metadata = { title: "Marcă nouă" };

export default function MarcaNouaPage() {
  return (
    <BrandForm
      brand={{
        name: "",
        slug_ro: "",
        slug_ru: null,
        description_ro: null,
        description_ru: null,
        logo_url: null,
        meta_title_ro: null,
        meta_title_ru: null,
        meta_desc_ro: null,
        meta_desc_ru: null,
        is_active: true,
      }}
      action={createBrand}
      title="Marcă nouă"
    />
  );
}
