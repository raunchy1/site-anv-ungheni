"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { TreadRule } from "@/components/icons";
import { TireFinder, type BrandOption } from "@/components/ui/TireFinder";
import { Gallery } from "./sections/Gallery";
import { ProductPageMockup } from "./sections/ProductPage";
import {
  ColorSection, DoDont, IconSection, SignatureSection, SystemSection, TypeSection,
} from "./sections/Foundations";
import { products } from "@/lib/sample-products";
import type { Locale } from "@/lib/i18n";
import type { Season } from "@/lib/types";

type Theme = "light" | "dark";
type Accent = "oxid" | "signal" | "karmin";

const ACCENTS: Array<{
  id: Accent;
  name: string;
  claim: string;
  argument: string;
  light: string;
  dark: string;
  rows: Array<[string, string]>;
}> = [
  {
    id: "oxid",
    name: "1 · OXID",
    claim: "Roșu profund, bază caldă",
    argument:
      "Hue 27° în OKLCH, la 2° de roșul existent — recunoscut de clientul vechi, dar coborât cu 5,5% în luminozitate și cu 19% în cromă. Ce câștigă: la 6,09:1 pe fundal deschis nu mai vibrează pe alb, deci poate sta lângă un tabel de cifre fără să-l concureze. Ce pierde: la raft, în comparație directă cu un roșu-semnal, pare mai puțin „ieftin” — ceea ce e exact scopul. E roșul de atelier, nu de raion de promoții. Recomandarea mea, și implicitul sistemului.",
    light: "#B72121",
    dark: "#F15E54",
    rows: [
      ["#B72121 pe #FAF8F5 (fundal light)", "6,09:1 · AA / AAA mare"],
      ["#B72121 pe #F2EFEA (suprafață 2)", "5,63:1 · AA"],
      ["#FFFFFF pe #B72121 (buton primar)", "6,46:1 · AA"],
      ["#F15E54 pe #121211 (fundal dark)", "5,77:1 · AA"],
      ["#F15E54 pe #1C1B19 (suprafață dark)", "5,30:1 · AA"],
      ["#0A0A09 pe #F15E54 (buton primar dark)", "6,10:1 · AA"],
    ],
  },
  {
    id: "signal",
    name: "2 · SIGNAL",
    claim: "Roșu-semnal saturat, spre portocaliu",
    argument:
      "Hue 36,5°, adică 7,5° spre portocaliu față de brandul actual. E cel mai vizibil dintre cele trei pe un ecran de telefon în lumină directă — un argument real în Ungheni, unde 70% din trafic e mobil și o parte din el se întâmplă în parcare. Ce pierde: portocaliul e culoarea avertismentului rutier și a reducerilor. Pe un card cu preț, citește ca ofertă, nu ca marcă. Îl propun doar dacă poziționarea se mută dinspre atelier spre volum.",
    light: "#B93503",
    dark: "#F86034",
    rows: [
      ["#B93503 pe #FAF8F5 (fundal light)", "5,54:1 · AA"],
      ["#B93503 pe #F2EFEA (suprafață 2)", "5,12:1 · AA"],
      ["#FFFFFF pe #B93503 (buton primar)", "5,88:1 · AA"],
      ["#F86034 pe #121211 (fundal dark)", "5,99:1 · AA"],
      ["#F86034 pe #1C1B19 (suprafață dark)", "5,50:1 · AA"],
      ["#0A0A09 pe #F86034 (buton primar dark)", "6,33:1 · AA"],
    ],
  },
  {
    id: "karmin",
    name: "3 · KARMIN",
    claim: "Roșu rece, cu urmă de magenta",
    argument:
      "Hue 13,5°, sub roșul pur, cu suficientă magenta cât să se citească drept alegere, nu drept accident de gamut. E cel mai „scump” dintre cele trei: aceeași familie cu roșurile de modă și de automobile premium. Ce pierde: se rupe de gri-ul cald al restului paletei — ar cere neutralele să migreze spre rece, adică rescrierea celor 11 trepte. Costul lui nu e culoarea, e sistemul din jurul ei.",
    light: "#BB1C46",
    dark: "#F45974",
    rows: [
      ["#BB1C46 pe #FAF8F5 (fundal light)", "5,88:1 · AA"],
      ["#BB1C46 pe #F2EFEA (suprafață 2)", "5,44:1 · AA"],
      ["#FFFFFF pe #BB1C46 (buton primar)", "6,24:1 · AA"],
      ["#F45974 pe #121211 (fundal dark)", "5,83:1 · AA"],
      ["#F45974 pe #1C1B19 (suprafață dark)", "5,35:1 · AA"],
      ["#0A0A09 pe #F45974 (buton primar dark)", "6,16:1 · AA"],
    ],
  },
];

function Section({
  n, title, lead, children, id,
}: {
  n: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-[var(--line-strong)] pt-[var(--sp-10)]">
      <p className="label">{n}</p>
      <h2 className="optical-left mt-[var(--sp-2)] text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]">
        {title}
      </h2>
      {lead ? (
        <p className="measure mt-[var(--sp-3)] text-400 leading-normal text-[var(--ink-muted)]">
          {lead}
        </p>
      ) : null}
      <div className="mt-[var(--sp-8)]">{children}</div>
    </section>
  );
}

function Toggle<T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-[var(--sp-2)]">
      <span className="label max-sm:hidden">{label}</span>
      <div className="flex rounded-[var(--radius-xs)] border border-[var(--line-strong)] p-[2px]">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={o.id === value}
            onClick={() => onChange(o.id)}
            className={cn(
              "min-h-9 px-[var(--sp-3)] text-200 font-semibold",
              "rounded-[1px] transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
              o.id === value
                ? "bg-[var(--ink-strong)] text-[var(--ink-invert)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-strong)]",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DesignSystemShell({
  brands,
  seasonCounts,
}: {
  /* Panoul de căutare se arată cu datele reale din catalog. Un design system
     care își desenează propriile cifre inventate arată bine și minte. */
  brands: readonly BrandOption[];
  seasonCounts: Record<Season, number>;
}) {
  const [locale, setLocale] = useState<Locale>("ro");
  const [theme, setTheme] = useState<Theme>("light");
  const [accent, setAccent] = useState<Accent>("oxid");

  const hero =
    products.find((p) => p.brand === "Michelin" && p.price && p.image) ??
    products.find((p) => p.price && p.image)!;
  const oos = products.find((p) => p.stock === "out_of_stock" && p.image)!;

  return (
    <div data-theme={theme} data-accent={accent} className="min-h-full bg-[var(--bg)] text-[var(--ink)]">
      {/* ---------------------------------------------------------- bara -- */}
      <div className="sticky top-0 z-40 border-b border-[var(--line-strong)] bg-[var(--bg)]/95 backdrop-blur-none">
        <div className="shell flex flex-wrap items-center gap-x-[var(--sp-6)] gap-y-[var(--sp-3)] py-[var(--sp-3)]">
          <span className="text-200 font-bold uppercase tracking-[var(--tr-label)] text-[var(--ink-strong)]">
            anvelope-ungheni.md
          </span>
          <Toggle
            label="limbă"
            value={locale}
            onChange={setLocale}
            options={[
              { id: "ro", label: "RO" },
              { id: "ru", label: "RU" },
            ]}
          />
          <Toggle
            label="temă"
            value={theme}
            onChange={setTheme}
            options={[
              { id: "light", label: "Light" },
              { id: "dark", label: "Dark" },
            ]}
          />
          <Toggle
            label="roșu"
            value={accent}
            onChange={setAccent}
            options={[
              { id: "oxid", label: "Oxid" },
              { id: "signal", label: "Signal" },
              { id: "karmin", label: "Karmin" },
            ]}
          />
        </div>
      </div>

      <main className="shell flex flex-col gap-[var(--sp-16)] pb-[var(--sp-32)] pt-[var(--sp-10)]">
        {/* ------------------------------------------------------- titlu -- */}
        <header>
          <p className="label">Design system · v1</p>
          <h1 className="optical-left mt-[var(--sp-3)] text-900 font-semibold leading-tight tracking-[var(--tr-display)] text-[var(--ink-strong)] sm:text-1000">
            Atelier, nu vitrină
          </h1>
          <TreadRule variant="mark" width={168} className="mt-[var(--sp-4)] text-[var(--accent)]" />
          <p className="measure mt-[var(--sp-6)] text-500 leading-snug text-[var(--ink)]">
            15.010 produse, 4 specificații fiecare, 8 descrieri în tot catalogul și niciun
            logo de marcă. Interfața e singurul conținut al acestui site — deci interfața
            trebuie să fie citibilă ca o fișă tehnică, nu ca o pagină de promoții.
          </p>
          <p className="measure mt-[var(--sp-4)] text-300 leading-normal text-[var(--ink-muted)]">
            Toate mockup-urile de mai jos folosesc produse reale din
            <code className="font-mono"> data/raw/products.ndjson</code>, cu prețuri,
            dimensiuni și stări de stoc nemodificate. Nimic nu e inventat — inclusiv
            fotografiile lipsă și dimensiunile imperiale.
          </p>
        </header>

        {/* -------------------------------------------------------- rosu -- */}
        <Section
          id="rosu"
          n="01"
          title="Trei rafinări de roșu, pe pagina de produs"
          lead="Roșul existent este #db0103. Trece 5,23:1 pe alb, dar doar 3,59:1 pe fundalul întunecat — sub pragul AA. Nu există un singur hex care să treacă 4,5:1 și pe #FAF8F5 și pe #121211 fără să fie atât de întunecat încât să nu se mai citească drept roșu. De aceea fiecare variantă livrează o pereche: un roșu de suprafață pentru light și unul pentru dark. Ratele de mai jos sunt calculate, nu estimate."
        >
          <div className="flex flex-col gap-[var(--sp-16)]">
            {ACCENTS.map((a) => (
              <div key={a.id} data-accent={a.id} className="min-w-0">
                <div className="grid gap-[var(--sp-6)] lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
                  <div>
                    <p className="label">{a.name}</p>
                    <h3 className="mt-[var(--sp-2)] text-600 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]">
                      {a.claim}
                    </h3>
                    <div className="mt-[var(--sp-4)] flex gap-[var(--sp-2)]">
                      <span className="flex h-12 flex-1 items-end justify-start rounded-[var(--radius-xs)] p-[var(--sp-2)] font-mono text-[10px] text-white" style={{ backgroundColor: a.light }}>
                        {a.light}
                      </span>
                      <span className="flex h-12 flex-1 items-end justify-start rounded-[var(--radius-xs)] p-[var(--sp-2)] font-mono text-[10px] text-[#0A0A09]" style={{ backgroundColor: a.dark }}>
                        {a.dark}
                      </span>
                    </div>
                    <p className="measure mt-[var(--sp-4)] text-300 leading-normal text-[var(--ink)]">
                      {a.argument}
                    </p>
                    <table className="mt-[var(--sp-4)] w-full border-t border-[var(--line)] text-left">
                      <tbody>
                        {a.rows.map(([k, v]) => (
                          <tr key={k} className="border-b border-[var(--line)]">
                            <td className="py-[var(--sp-2)] pr-[var(--sp-3)] font-mono text-200 text-[var(--ink-muted)]">{k}</td>
                            <td className="num py-[var(--sp-2)] text-right font-mono text-200 font-semibold text-[var(--ink-strong)]">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--line-strong)]">
                    <ProductPageMockup product={hero} locale={locale} compact />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DoDont
            className="mt-[var(--sp-10)]"
            doText="Roșul apare pe butonul „Adaugă în coș” și pe marcajul de sub titlu. Două locuri, sub 2% din suprafața ecranului."
            dontText="Roșul pe titlu, pe preț, pe conturul cardului, pe badge-ul de sezon și pe iconițele din antet. Cinci locuri, și niciunul nu mai înseamnă „apasă aici”."
          />
        </Section>

        {/* ------------------------------------------------- dimensiune -- */}
        <Section
          id="dimensiune"
          n="02"
          title="Panoul de căutare"
          lead="Ecranul care contează cel mai mult, și singurul instrument de căutare din site: pagina principală, 404-ul și catalogul fără rezultate arată exact panoul ăsta. Cinci liste numerotate, în ordinea de pe flancul anvelopei, cu contoare reale — 14.988 de anvelope metrice, numărate din catalog."
        >
          <div className="max-w-[380px]">
            <TireFinder locale={locale} brands={brands} seasonCounts={seasonCounts} />
          </div>
          <DoDont
            className="mt-[var(--sp-8)]"
            doText="Fiecare opțiune poartă numărul real de anvelope, iar listele se restrâng una pe alta: înălțimile sunt cele care există pe lățimea aleasă. Nicio combinație nu duce la zero rezultate."
            dontText="Aceleași cinci liste, dar cu opțiuni fixe și fără contoare. Arată identic până la apăsare, apoi dă un ecran gol — și omul nu află de ce."
          />
        </Section>

        {/* ------------------------------------------------- pagina prod -- */}
        <Section
          id="produs"
          n="03"
          title="Pagina de produs — disponibil și indisponibil"
          lead="46% din catalog nu se poate cumpăra. Starea „indisponibil” nu e un caz marginal, e jumătate din trafic — deci se proiectează ca ecran principal, nu ca eroare."
        >
          <div className="flex flex-col gap-[var(--sp-10)]">
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line-strong)]">
              <ProductPageMockup product={hero} locale={locale} />
            </div>
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line-strong)]">
              <ProductPageMockup product={oos} locale={locale} />
            </div>
          </div>
        </Section>

        {/* ------------------------------------------------------ culoare -- */}
        <Section
          id="culoare"
          n="04"
          title="Paleta neutră"
          lead="Roșul e ultima unealtă. Restul ierarhiei se construiește din scară, greutate și spațiu — iar suprafețele vin dintr-o singură scară de grafit cald."
        >
          <ColorSection />
        </Section>

        {/* --------------------------------------------------- tipografie -- */}
        <Section
          id="tipografie"
          n="05"
          title="Tipografie"
          lead="IBM Plex Sans pentru interfață și text, IBM Plex Mono pentru date. Două familii dintr-o singură superfamilie, cu cifre metric-compatibile: 600/1000em în amândouă."
        >
          <TypeSection />
        </Section>

        {/* ------------------------------------------------------- sistem -- */}
        <Section
          id="sistem"
          n="06"
          title="Spațiu, formă, umbră, mișcare"
        >
          <SystemSection />
        </Section>

        {/* -------------------------------------------------- semnatura ---- */}
        <Section
          id="semnatura"
          n="07"
          title="Elementul-semnătură"
        >
          <SignatureSection />
        </Section>

        {/* ----------------------------------------------------- iconite --- */}
        <Section id="iconite" n="08" title="Iconițe">
          <IconSection />
        </Section>

        {/* --------------------------------------------------- componente -- */}
        <Section
          id="componente"
          n="09"
          title="Componente"
          lead="Toate componentele livrate, în limba și tema selectate în bara de sus."
        >
          <Gallery locale={locale} />
        </Section>

        {/* ------------------------------------------------------- RO/RU --- */}
        <Section
          id="bilingv"
          n="10"
          title="RO și RU, una lângă alta"
          lead="Chirilicul trebuie să aibă aceeași calitate ca latina. Testul real nu e alfabetul, ci lungimea: „Indice de sarcină” are 17 caractere, „Индекс нагрузки” are 15, dar „Показать результаты” e cu 40% mai lat decât „Vezi rezultatele”. De aceea coloana de etichete din SpecTable are lățime fixă și butoanele nu au lățime calculată din text."
        >
          <div className="grid gap-[var(--sp-6)] xl:grid-cols-2">
            {(["ro", "ru"] as const).map((l) => (
              <div key={l} className="min-w-0">
                <p className="label mb-[var(--sp-3)]">{l.toUpperCase()}</p>
                <div className="flex flex-col gap-[var(--sp-6)]">
                  <TireFinder locale={l} brands={brands} seasonCounts={seasonCounts} />
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line-strong)]">
                    <ProductPageMockup product={hero} locale={l} compact />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ------------------------------------------------- light / dark -- */}
        <Section
          id="teme"
          n="11"
          title="Light și dark, una lângă alta"
          lead="Tokenii sunt scriși de la început în perechi. Dark nu e o inversare: fundalul rămâne cald, roșul urcă în luminozitate, iar textul de pe butonul primar devine negru — alb pe roșul de dark ar da 3,45:1 și ar pica AA."
        >
          <div className="grid gap-[var(--sp-6)] xl:grid-cols-2">
            {(["light", "dark"] as const).map((th) => (
              <div key={th} data-theme={th} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--bg)] p-[var(--sp-4)]">
                <p className="label mb-[var(--sp-3)]">{th}</p>
                <div className="flex flex-col gap-[var(--sp-6)]">
                  <TireFinder locale={locale} brands={brands} seasonCounts={seasonCounts} />
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line-strong)]">
                    <ProductPageMockup product={hero} locale={locale} compact />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}
