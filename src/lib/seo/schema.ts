/**
 * DATELE STRUCTURATE, ÎNTR-UN SINGUR LOC.
 *
 * Nu sunt decor pentru Google. Sunt singura formă în care un motor de căutare
 * — sau un asistent care răspunde la „unde cumpăr anvelope în Moldova" — poate
 * citi ce vindem, la ce preț, unde suntem și când suntem deschiși, fără să
 * ghicească din text. Un magazin care le scrie corect apare în răspuns cu preț
 * și disponibilitate; unul care nu le scrie apare, în cel mai bun caz, ca link.
 *
 * REGULA CARE NU SE ÎNCALCĂ: aici nu se inventează nimic. Fiecare câmp vine sau
 * din `settings` (telefon, adresă, program, coordonate, garanție), sau din
 * rândul produsului, sau dintr-o afirmație pe care site-ul o face deja vizibil
 * pe pagină. O politică de retur scrisă în JSON-LD, dar nescrisă nicăieri de om,
 * e o promisiune făcută în numele atelierului — și un motiv de penalizare când
 * nu se potrivește cu pagina.
 */
import type { Locale, Settings } from "@/lib/types";
import { SITE_URL } from "@/lib/format";

/** Identificatorii stabili. Un `@id` care se schimbă rupe legăturile dintre entități. */
export const ID = {
  organizatie: `${SITE_URL}/#organizatie`,
  atelier: `${SITE_URL}/#atelier`,
  site: `${SITE_URL}/#site`,
};

const RO = (l: Locale) => l === "ro";

/**
 * Programul, în forma cerută de schema.org.
 *
 * Duminica e `null` în `settings` până o confirmă atelierul (TODO-CRISTIAN §3).
 * Un program inventat e mai rău decât unul lipsă: clientul care vine duminica
 * degeaba nu se mai întoarce, iar Google arată ore greșite în panoul local.
 */
function program(settings: Settings) {
  const intervale: Array<{ "@type": "OpeningHoursSpecification"; dayOfWeek: string[]; opens: string; closes: string }> = [];
  const parse = (v: string) => {
    const m = v.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
    return m ? { opens: m[1].padStart(5, "0"), closes: m[2].padStart(5, "0") } : null;
  };
  const lv = parse(settings.opening_hours.mon_sat ?? "");
  if (lv) {
    intervale.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      ...lv,
    });
  }
  const d = settings.opening_hours.sun ? parse(settings.opening_hours.sun) : null;
  if (d) intervale.push({ "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday"], ...d });
  return intervale;
}

/**
 * Atelierul, ca afacere locală.
 *
 * `AutoRepair` și nu `Store`: vindem anvelope, dar le și montăm, iar căutarea
 * „vulcanizare Ungheni" e la fel de importantă ca „anvelope Ungheni".
 * `areaServed` e țara întreagă pentru că livrăm în toată Moldova — afirmație pe
 * care pagina principală o face de la primul rând.
 */
export function atelierSchema(settings: Settings, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "@id": ID.atelier,
    name: "Anvelope Ungheni",
    alternateName: "anvelope-ungheni.md",
    url: RO(locale) ? SITE_URL : `${SITE_URL}/ru`,
    telephone: settings.phone_e164,
    email: settings.email,
    image: `${SITE_URL}/opengraph-image`,
    logo: `${SITE_URL}/icon.svg`,
    priceRange: "$$",
    currenciesAccepted: "MDL",
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address.split(",")[0].trim(),
      addressLocality: settings.city,
      addressCountry: "MD",
    },
    geo: { "@type": "GeoCoordinates", latitude: settings.lat, longitude: settings.lng },
    hasMap: settings.maps_url,
    openingHoursSpecification: program(settings),
    areaServed: [
      { "@type": "Country", name: RO(locale) ? "Republica Moldova" : "Республика Молдова" },
      { "@type": "City", name: settings.city },
    ],
    knowsLanguage: ["ro", "ru"],
    parentOrganization: { "@id": ID.organizatie },
  };
}

/** Firma, ca entitate — separată de magazinul fizic, ca să se poată lega de site. */
export function organizatieSchema(settings: Settings) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ID.organizatie,
    name: "Anvelope Ungheni",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    image: `${SITE_URL}/opengraph-image`,
    telephone: settings.phone_e164,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address.split(",")[0].trim(),
      addressLocality: settings.city,
      addressCountry: "MD",
    },
    contactPoint: [{
      "@type": "ContactPoint",
      telephone: settings.phone_e164,
      contactType: "customer service",
      availableLanguage: ["ro", "ru"],
      areaServed: "MD",
    }],
  };
}

/** Site-ul. Fără `SearchAction`: n-avem pagină de căutare, iar una declarată și inexistentă e o minciună verificabilă. */
export function siteSchema(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": ID.site,
    url: SITE_URL,
    name: "Anvelope Ungheni",
    inLanguage: locale,
    publisher: { "@id": ID.organizatie },
  };
}

/** Firimiturile. Poziția începe de la 1, iar ultima verigă e pagina curentă. */
export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}

/**
 * O listă de produse — pagina de catalog, de marcă, de dimensiune.
 *
 * Doar URL-uri și poziții, nu fișe întregi: fișa completă stă pe pagina
 * produsului, iar repetarea ei aici ar fi aceeași informație în două locuri,
 * cu riscul ca cele două să nu mai coincidă după prima actualizare de preț.
 */
export function itemListSchema(urls: string[], name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: urls.length,
    itemListElement: urls.map((url, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
    })),
  };
}

/** Întrebări și răspunsuri. Textul trebuie să fie ȘI pe pagină, vizibil — altfel e spam. */
export function faqSchema(qa: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/**
 * FIȘA DE PRODUS, în forma pe care o citește un motor de căutare.
 *
 * Ce s-a adăugat față de varianta minimă și de ce fiecare câmp e acolo:
 *
 *   · `additionalProperty` — lățime, înălțime, diametru, sezon, indici, XL.
 *     Fără ele, „anvelope 205/55 R16 iarna" se potrivește doar dacă șirul apare
 *     în titlu. Cu ele, dimensiunea e un câmp, nu o coincidență de text, iar un
 *     asistent poate filtra după ea când i se cere „ceva de 16 țoli pe iarnă".
 *   · `itemCondition` — anvelopele sunt noi. Nespus, e o întrebare deschisă
 *     într-o piață unde jumătate din anunțuri sunt cu anvelope rulate.
 *   · `priceValidUntil` — Google cere un termen; fără el, prețul e ignorat în
 *     rezultatele îmbogățite. Se pune la 30 de zile: prețurile se confruntă
 *     zilnic cu furnizorul, deci o valabilitate mai lungă ar fi o ficțiune.
 *   · `shippingDetails` — livrarea în toată Moldova în 1–3 zile e exact ce scrie
 *     pagina, cuvânt cu cuvânt. Aici nu se adaugă nimic nou, se face citibil.
 *   · `hasMerchantReturnPolicy` LIPSEȘTE deliberat. Pagina „Retur și garanție"
 *     n-are încă text scris de atelier (TODO-CRISTIAN §5). O politică de retur
 *     declarată în JSON-LD, dar nescrisă nicăieri, e o promisiune făcută în
 *     numele altcuiva. Se adaugă în ziua în care pagina are text.
 */
export function produsSchema(p: {
  title: string;
  url: string;
  sku: string;
  brand: string | null;
  images: string[];
  description?: string;
  price: number | null;
  disponibil: boolean;
  width: number | null;
  aspect: number | null;
  diameter: string | null;
  season: string | null;
  loadIndex: string | null;
  speedIndex: string | null;
  isXl: boolean;
  isRunflat: boolean;
  isStudded: boolean;
}, settings: Settings, locale: Locale) {
  const et = (ro: string, ru: string) => (RO(locale) ? ro : ru);

  const prop = (name: string, value: string | number | boolean | null) =>
    (value === null || value === "" || value === false
      ? null
      : { "@type": "PropertyValue", name, value: value === true ? et("Da", "Да") : String(value) });

  const proprietati = [
    prop(et("Lățime", "Ширина"), p.width),
    prop(et("Înălțime profil", "Высота профиля"), p.aspect),
    prop(et("Diametru jantă", "Диаметр"), p.diameter),
    prop(et("Sezon", "Сезон"), p.season ? et(
      { vara: "Vară", iarna: "Iarnă", all_season: "All season" }[p.season] ?? p.season,
      { vara: "Лето", iarna: "Зима", all_season: "Всесезонные" }[p.season] ?? p.season,
    ) : null),
    prop(et("Indice de sarcină", "Индекс нагрузки"), p.loadIndex),
    prop(et("Indice de viteză", "Индекс скорости"), p.speedIndex),
    prop("XL", p.isXl),
    prop("RunFlat", p.isRunflat),
    prop(et("Cu crampoane", "Шипованные"), p.isStudded),
  ].filter(Boolean);

  const peste30zile = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    url: p.url,
    sku: p.sku,
    mpn: p.sku,
    description: p.description,
    inLanguage: locale,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    image: p.images.length ? p.images : undefined,
    category: et("Anvelope auto", "Автомобильные шины"),
    additionalProperty: proprietati.length ? proprietati : undefined,
    offers: {
      "@type": "Offer",
      url: p.url,
      priceCurrency: "MDL",
      price: p.price == null ? undefined : Number(p.price),
      priceValidUntil: p.price == null ? undefined : peste30zile,
      itemCondition: "https://schema.org/NewCondition",
      availability: p.disponibil ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": ID.atelier },
      /* „Livrare în toată Moldova, 1–3 zile" — exact ce scrie pagina. */
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "MD" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
        },
      },
    },
    /* Garanția e în `settings`, pusă de atelier, deci se poate declara. */
    ...(settings.warranty_years
      ? {
          hasEnergyConsumptionDetails: undefined,
          warranty: {
            "@type": "WarrantyPromise",
            durationOfWarranty: { "@type": "QuantitativeValue", value: settings.warranty_years, unitCode: "ANN" },
          },
        }
      : {}),
  };
}
