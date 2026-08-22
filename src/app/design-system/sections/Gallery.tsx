"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Accordion } from "@/components/ui/Accordion";
import { Badge, SeasonBadge } from "@/components/ui/Badge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Combobox } from "@/components/ui/Combobox";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Price, PriceOnRequest } from "@/components/ui/PriceOnRequest";
import { ProductCard } from "@/components/ui/ProductCard";
import { RangeSliderDemo } from "@/components/ui/RangeSlider";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { SpecTable, buildSpecRows } from "@/components/ui/SpecTable";
import { StockIndicator } from "@/components/ui/StockIndicator";
import { Tabs } from "@/components/ui/Tabs";
import { Toast } from "@/components/ui/Toast";
import {
  IconAlert, IconCart, IconFilter, IconSearch, IconTyre,
} from "@/components/icons";
import { products, type Product } from "@/lib/sample-products";
import { t, type Locale } from "@/lib/i18n";
import { formatCount } from "@/lib/format";

const brandOptions = Array.from(
  new Set(products.map((p) => p.brand).filter((b): b is string => b !== null)),
)
  .sort((a, b) => a.localeCompare(b, "ro"))
  .map((b) => ({
    value: b.toLowerCase(),
    label: b,
    count: products.filter((p) => p.brand === b).length,
  }));

function Block({
  title, note, children, className,
}: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <h3 className="text-400 font-semibold text-[var(--ink-strong)]">{title}</h3>
      {note ? (
        <p className="measure mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">{note}</p>
      ) : null}
      <div className="mt-[var(--sp-4)]">{children}</div>
    </div>
  );
}

export function Gallery({ locale }: { locale: Locale }) {
  const d = t(locale);
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState(true);

  const inStock = products.find((p) => p.stock !== "out_of_stock" && p.price)!;
  const oos = products.find((p) => p.stock === "out_of_stock")!;
  const noImage = products.find((p) => !p.image)!;
  const imperial = products.find((p) => p.sizeSystem === "imperial" && p.price)!;

  return (
    <div className="flex flex-col gap-[var(--sp-12)]">
      {/* ------------------------------------------------------- butoane -- */}
      <Block
        title="Button"
        note="Un singur buton primar pe ecran. Al doilea buton roșu simultan e un bug de design, nu o opțiune. Înălțimi 36 / 44 / 52 — `md` e egal cu minimul de atingere pe mobil."
      >
        <div className="flex flex-col gap-[var(--sp-5)]">
          <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
            <Button variant="primary" size="lg" iconStart={<IconCart size={18} />}>
              {d.addToCart}
            </Button>
            <Button variant="secondary" size="lg">{d.compare}</Button>
            <Button variant="text" size="lg">{d.reset}</Button>
          </div>
          <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
            <Button variant="secondary" size="md" iconStart={<IconFilter size={17} />}>
              {d.filter}
            </Button>
            <Button variant="secondary" size="sm">{d.reset}</Button>
            <Button variant="primary" size="md" disabled>{d.addToCart}</Button>
            <Button variant="secondary" size="md" disabled>{d.compare}</Button>
          </div>
        </div>
      </Block>

      {/* -------------------------------------------------------- campuri -- */}
      <div className="grid gap-[var(--sp-8)] lg:grid-cols-3">
        <Block title="Input" note="Eticheta mereu deasupra și mereu vizibilă. Placeholder-ul nu ține loc de etichetă.">
          <div className="flex flex-col gap-[var(--sp-5)]">
            <Input label={d.search} placeholder={d.searchPlaceholder} iconStart={<IconSearch size={17} />} />
            <Input label={d.width} defaultValue="205" hint="135 – 325" inputMode="numeric" />
            <Input label={d.width} defaultValue="20555" error="Scrie doar lățimea, fără înălțime." />
            <Input label={d.width} defaultValue="205" disabled />
          </div>
        </Block>

        <Block title="Select" note="`<select>` nativ. Pe mobil deschide roata sistemului, care bate orice listbox rescris de la zero.">
          <div className="flex flex-col gap-[var(--sp-5)]">
            <Select
              label={d.season}
              placeholder="—"
              options={[
                { value: "vara", label: d.summer },
                { value: "iarna", label: d.winter },
                { value: "all", label: d.allSeason },
              ]}
            />
            <Select
              label={d.diameter}
              defaultValue="R16"
              options={["R13", "R14", "R15", "R16", "R17", "R18"].map((v) => ({ value: v, label: v }))}
            />
            <Select label={d.diameter} disabled options={[{ value: "", label: "—" }]} hint={d.pickWidthFirst} />
          </div>
        </Block>

        <Block title="Combobox" note="134 de mărci. Pragul de o literă e o stare proiectată, nu o listă goală.">
          <Combobox label={d.brand} options={brandOptions} locale={locale} minChars={1} />
          <p className="mt-[var(--sp-16)] text-200 text-[var(--ink-muted)]">
            Scrie o literă ca să vezi lista; șterge tot ca să vezi primele opt.
          </p>
        </Block>
      </div>

      <div className="grid gap-[var(--sp-8)] lg:grid-cols-2">
        <Block title="Checkbox" note="Zona de atingere e tot rândul, 44px. Bifat = negru, nu roșu: 12 căsuțe bifate ar face 12 pete roșii.">
          <div className="max-w-sm">
            <Checkbox label={d.showUnavailable} count={formatCount(6944)} defaultChecked />
            <Checkbox label="Michelin" count={formatCount(484)} />
            <Checkbox label="Continental" count={formatCount(410)} defaultChecked />
            <Checkbox label="Nokian Tyres" count={formatCount(0)} disabled />
          </div>
        </Block>

        <Block title="RangeSlider" note="Două `input[type=range]` suprapuse: tastatura și cititoarele de ecran merg din prima. Șina are 2px, nu 6.">
          <div className="max-w-sm">
            <RangeSliderDemo label="Preț" min={400} max={13600} step={100} initialMin={900} initialMax={4200} />
          </div>
        </Block>
      </div>

      {/* --------------------------------------------------------- badge --- */}
      <Block title="Badge · StockIndicator · Price" note="Badge-ul poartă contur și text colorat, niciodată fundal plin: într-o grilă de 24 de carduri, 24 de dreptunghiuri pline ar depăși butonul de comandă.">
        <div className="flex flex-col gap-[var(--sp-5)]">
          <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
            <SeasonBadge season="vara" locale={locale} />
            <SeasonBadge season="iarna" locale={locale} />
            <SeasonBadge season="all_season" locale={locale} />
            <Badge tone="neutral">XL</Badge>
            <Badge tone="quiet">Run Flat</Badge>
            <Badge tone="accent">{d.exactSize}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-[var(--sp-6)]">
            <StockIndicator status="in_stock" locale={locale} />
            <StockIndicator status="supplier" locale={locale} />
            <StockIndicator status="out_of_stock" locale={locale} />
          </div>
          <div className="flex flex-wrap items-end gap-[var(--sp-10)]">
            <Price value={1847} locale={locale} size="lg" />
            <Price value={13600} locale={locale} size="md" />
            <Price value={700} locale={locale} size="sm" />
            <PriceOnRequest locale={locale} size="md" />
          </div>
        </div>
      </Block>

      {/* ---------------------------------------------------------- card --- */}
      <Block title="Card · ProductCard" note="Cardul nu se ridică și nu se scalează la hover. Feedback-ul e o schimbare de fundal și de contur, în 90ms.">
        <div className="grid grid-cols-2 gap-[var(--sp-4)] lg:grid-cols-4">
          <ProductCard product={inStock} locale={locale} />
          <ProductCard product={oos} locale={locale} />
          <ProductCard product={imperial} locale={locale} />
          <ProductCard product={noImage} locale={locale} />
        </div>
        <div className="mt-[var(--sp-6)] grid gap-[var(--sp-4)] sm:grid-cols-3">
          <Card tone="flat" className="p-[var(--sp-4)] text-200 text-[var(--ink-muted)]">Card · flat</Card>
          <Card tone="raised" className="p-[var(--sp-4)] text-200 text-[var(--ink-muted)]">Card · raised</Card>
          <Card tone="sunken" className="p-[var(--sp-4)] text-200 text-[var(--ink-muted)]">Card · sunken</Card>
        </div>
      </Block>

      {/* ----------------------------------------------------- spec table -- */}
      <div className="grid gap-[var(--sp-8)] lg:grid-cols-2">
        <Block title="SpecTable" note="Coloana de etichete are lățime fixă. Cu `auto`, „Indice de sarcină” și „Индекс нагрузки” ar muta coloana de valori între limbi, iar tabelul ar arăta ca alt tabel în fiecare limbă.">
          <SpecTable rows={buildSpecRows(inStock, locale)} className="border-t border-[var(--line)]" />
        </Block>
        <Block title="SpecTable · imperial" note="Cele 20 de anvelope imperiale. `31x10.50 R15` are 12 caractere față de 10 — în mono, coloana nu se mișcă.">
          <SpecTable rows={buildSpecRows(imperial, locale)} className="border-t border-[var(--line)]" density="compact" />
        </Block>
      </div>

      {/* --------------------------------------------------- tabs/accord --- */}
      <div className="grid gap-[var(--sp-8)] lg:grid-cols-2">
        <Block title="Tabs" note="Indicatorul activ e o linie de 2px, nu o pastilă plină: același semnal, a zecea parte din suprafața colorată.">
          <Tabs
            label={d.catalog}
            items={[
              { id: "all", label: d.catalog, count: 15010, content: <TabBody text={d.catalog} /> },
              { id: "summer", label: d.summer, count: 7340, content: <TabBody text={d.summer} /> },
              { id: "winter", label: d.winter, count: 5805, content: <TabBody text={d.winter} /> },
              { id: "as", label: d.allSeason, count: 1858, content: <TabBody text={d.allSeason} /> },
            ]}
          />
        </Block>
        <Block title="Accordion" note="`<details>` nativ. Se deschide fără JavaScript și e accesibil din start. Semnul e plus/minus, nu chevron rotit.">
          <Accordion
            defaultOpen="livrare"
            items={[
              { id: "livrare", title: d.services, content: <p>TODO(cristian): text de serviciu. Câmpul `body_ro` este NULL pentru toate cele 9 servicii.</p> },
              { id: "montaj", title: d.contact, content: <p>Ln–Sm 9:00–20:00. TODO(cristian): confirmare duminică.</p> },
              { id: "garantie", title: d.compare, content: <p>TODO(cristian): text juridic.</p> },
            ]}
          />
        </Block>
      </div>

      {/* -------------------------------------------------- navigare ------- */}
      <div className="grid gap-[var(--sp-8)] lg:grid-cols-2">
        <Block title="Breadcrumb" note="Separatorul e o bară oblică, nu un chevron: un caracter care stă pe linia de bază, nu o iconiță în plus pe un rând de 13px.">
          <Breadcrumb
            items={[
              { label: d.home, href: "#" },
              { label: d.catalog, href: "#" },
              { label: "Michelin", href: "#" },
              { label: inStock.title },
            ]}
          />
        </Block>
        <Block title="Pagination" note="Linkuri reale. Paginile 2+ rămân crawlabile, cu canonical către ele însele.">
          <Pagination current={7} total={42} hrefFor={(p) => `#pagina-${p}`} locale={locale} />
        </Block>
      </div>

      {/* -------------------------------------------------- suprapuneri ---- */}
      <Block title="Modal · Drawer · Toast" note="`<dialog>` nativ pentru amândouă: blocarea focusului, Escape și inertizarea paginii vin de la browser. `::backdrop` e o culoare plată — blurul ar ascunde exact tabelul pentru care a venit omul.">
        <div className="flex flex-wrap items-start gap-[var(--sp-4)]">
          <Button variant="secondary" onClick={() => setModal(true)}>Modal</Button>
          <Button variant="secondary" onClick={() => setDrawer(true)}>Drawer</Button>
          <Button variant="secondary" onClick={() => setToast(true)}>Toast</Button>
        </div>

        <div className="mt-[var(--sp-6)] flex flex-col gap-[var(--sp-3)]">
          {toast ? (
            <Toast
              tone="success"
              title={`${inStock.brand} ${inStock.sizeRaw}`}
              body={d.addToCart}
              onDismiss={() => setToast(false)}
              action={<Button variant="text" size="sm">{d.cart}</Button>}
            />
          ) : null}
          <Toast tone="info" title={d.showUnavailable} body={`${formatCount(6944)} ${d.results}`} />
          <Toast tone="problem" title={d.errorTitle} body={d.errorBody} action={<Button variant="text" size="sm">{d.retry}</Button>} />
        </div>

        <Modal
          open={modal}
          onClose={() => setModal(false)}
          locale={locale}
          title={d.addToCart}
          description={`${inStock.brand} · ${inStock.sizeRaw}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(false)}>{d.cancel}</Button>
              <Button variant="primary" onClick={() => setModal(false)}>{d.confirm}</Button>
            </>
          }
        >
          <SpecTable rows={buildSpecRows(inStock, locale)} density="compact" />
        </Modal>

        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          locale={locale}
          title={d.filter}
          side="right"
          footer={
            <div className="flex items-center justify-between gap-[var(--sp-4)]">
              <span className="text-200 text-[var(--ink-muted)]">
                <span className="num font-mono text-500 font-semibold text-[var(--ink-strong)]">
                  {formatCount(8066)}
                </span>{" "}
                {d.resultsAvailable}
              </span>
              <Button variant="primary" onClick={() => setDrawer(false)}>{d.showResults}</Button>
            </div>
          }
        >
          <div className="flex flex-col gap-[var(--sp-6)]">
            <RangeSliderDemo label="Preț" min={400} max={13600} step={100} initialMin={900} initialMax={4200} />
            <div>
              <p className="label mb-[var(--sp-2)]">{d.brand}</p>
              {brandOptions.slice(0, 6).map((b) => (
                <Checkbox key={b.value} label={b.label} count={formatCount(b.count)} />
              ))}
            </div>
            <Checkbox label={d.showUnavailable} count={formatCount(6944)} />
          </div>
        </Drawer>
      </Block>

      {/* ------------------------------------------------------- stari ----- */}
      <Block
        title="Fiecare stare proiectată"
        note="Un site scump se recunoaște după stările marginale. Aici sunt toate șapte."
      >
        <div className="grid gap-[var(--sp-6)] lg:grid-cols-2">
          <StateCase caption="1 · Se încarcă — schelet cu aceeași grilă ca rezultatul">
            <div className="grid grid-cols-2 gap-[var(--sp-4)]">
              {[0, 1].map((i) => (
                <Card key={i} className="flex flex-col gap-[var(--sp-3)] p-[var(--sp-3)]">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-[var(--sp-2)] h-6 w-1/2" />
                </Card>
              ))}
            </div>
          </StateCase>

          <StateCase caption="2 · Zero rezultate — dimensiunea există, stocul nu">
            <EmptyState
              icon={<IconTyre size={28} />}
              title={d.noResultsTitle}
              body={d.noResultsBody}
              action={<Button variant="secondary">{d.showUnavailable}</Button>}
            />
          </StateCase>

          <StateCase caption="3 · Eroare tehnică — spune ce s-a rupt, oferă reîncercarea">
            <EmptyState
              tone="problem"
              icon={<IconAlert size={28} />}
              title={d.errorTitle}
              body={d.errorBody}
              action={<Button variant="secondary">{d.retry}</Button>}
            />
          </StateCase>

          <StateCase caption="4 · Gol — coș fără produse">
            <EmptyState
              icon={<IconCart size={28} />}
              title={d.emptyCartTitle}
              body={d.emptyCartBody}
              action={<Button variant="primary">{d.catalog}</Button>}
            />
          </StateCase>

          <StateCase caption="5 · O singură literă în căutare — prag, nu listă goală">
            <div className="rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--surface)]">
              <div className="flex h-11 items-center gap-[var(--sp-2)] border-b border-[var(--line)] px-[var(--sp-3)]">
                <IconSearch size={17} className="text-[var(--ink-muted)]" />
                <span className="text-300 text-[var(--ink-strong)]">M</span>
                <span className="h-4 w-px animate-pulse bg-[var(--ink-strong)]" />
              </div>
              <p className="px-[var(--sp-3)] py-[var(--sp-4)] text-200 text-[var(--ink-muted)]">
                {d.typeMore}
              </p>
            </div>
          </StateCase>

          <StateCase caption="6 · Produs fără fotografie — 10 din 15.010">
            <div className="max-w-[12rem]">
              <ProductCard product={noImage} locale={locale} />
            </div>
          </StateCase>

          <StateCase caption="7 · Indisponibil — 6.944, adică 46% din catalog" className="lg:col-span-2">
            <div className="grid gap-[var(--sp-6)] sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
              <ProductCard product={oos} locale={locale} />
              <div className="flex flex-col justify-center gap-[var(--sp-4)]">
                <PriceOnRequest locale={locale} size="lg" />
                <p className="measure text-200 text-[var(--ink-muted)]">
                  Butonul „{d.addToCart}” e ABSENT, nu dezactivat. Un buton gri e o
                  promisiune care nu se ține. Prețul nu devine „0 MDL” și nu apare
                  niciun preț barat inventat. URL-ul rămâne 200, cu `noindex, follow`.
                </p>
              </div>
            </div>
          </StateCase>
        </div>
      </Block>
    </div>
  );
}

function TabBody({ text }: { text: string }) {
  return (
    <p className="measure text-300 text-[var(--ink-muted)]">
      {text} — conținutul panoului. Panoul primește focus la Tab, ca să fie
      accesibil cu tastatura chiar dacă nu conține niciun link.
    </p>
  );
}

function StateCase({
  caption, children, className,
}: { caption: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="label mb-[var(--sp-3)]">{caption}</p>
      {children}
    </div>
  );
}

export type { Product };
