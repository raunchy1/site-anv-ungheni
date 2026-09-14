import type { Metadata } from "next";
import Link from "next/link";
import { formatCount, formatPriceWithUnit } from "@/lib/format";
import {
  loadAnalizaMetrics,
  type BrandMargin,
  type MetricResult,
  type OrdersPeriod,
  type StockSummary,
  type TopProduct,
} from "@/lib/admin/analiza-metrics";

export const metadata: Metadata = { title: "Analiză" };

function Card({
  title,
  children,
  hint,
}: {
  title: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] p-[var(--sp-4)]">
      <h2 className="text-200 font-medium uppercase tracking-wide text-[var(--ink-muted)]">{title}</h2>
      {hint ? <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">{hint}</p> : null}
      <div className="mt-[var(--sp-3)]">{children}</div>
    </section>
  );
}

function MetricError({ result }: { result: MetricResult<unknown> }) {
  if (result.ok) return null;
  return <p className="text-300 text-[var(--warn)]">Eroare: {result.error}</p>;
}

function BigNumber({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <p className="text-600 font-semibold tabular-nums text-[var(--ink-strong)]">
      {value}
      {suffix ? <span className="ml-[var(--sp-2)] text-300 font-normal text-[var(--ink-muted)]">{suffix}</span> : null}
    </p>
  );
}

function OrdersBlock({ result }: { result: MetricResult<OrdersPeriod> }) {
  if (!result.ok) return <MetricError result={result} />;
  const { today, week, avgOrderValueMdl, avgSampleSize } = result.data;
  return (
    <div className="grid gap-[var(--sp-4)] sm:grid-cols-3">
      <div>
        <p className="text-200 text-[var(--ink-muted)]">Comenzi azi</p>
        <BigNumber value={formatCount(today)} />
      </div>
      <div>
        <p className="text-200 text-[var(--ink-muted)]">Comenzi săptămâna asta</p>
        <BigNumber value={formatCount(week)} />
        <p className="mt-[var(--sp-1)] text-100 text-[var(--ink-muted)]">de luni 00:00 (ora locală)</p>
      </div>
      <div>
        <p className="text-200 text-[var(--ink-muted)]">Valoare medie comandă</p>
        <BigNumber
          value={avgOrderValueMdl != null ? formatPriceWithUnit(avgOrderValueMdl) : "—"}
        />
        <p className="mt-[var(--sp-1)] text-100 text-[var(--ink-muted)]">
          {avgSampleSize > 0
            ? `din ${formatCount(avgSampleSize)} comenzi (fără anulate)`
            : "nicio comandă neanulată"}
        </p>
      </div>
    </div>
  );
}

function TopProductsBlock({ result }: { result: MetricResult<TopProduct[]> }) {
  if (!result.ok) return <MetricError result={result} />;
  if (result.data.length === 0) {
    return <p className="text-300 text-[var(--ink-muted)]">Nicio linie de comandă încă.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left text-300">
        <thead>
          <tr className="border-b border-[var(--line)] text-100 uppercase tracking-wide text-[var(--ink-muted)]">
            <th className="py-[var(--sp-2)] pr-[var(--sp-3)] font-medium">#</th>
            <th className="py-[var(--sp-2)] pr-[var(--sp-3)] font-medium">Produs</th>
            <th className="py-[var(--sp-2)] pr-[var(--sp-3)] font-medium tabular-nums">Cantitate</th>
            <th className="py-[var(--sp-2)] font-medium tabular-nums">Linii</th>
          </tr>
        </thead>
        <tbody>
          {result.data.map((p, i) => (
            <tr key={`${p.productId ?? p.slug ?? p.title}-${i}`} className="border-b border-[var(--line)]">
              <td className="py-[var(--sp-2)] pr-[var(--sp-3)] tabular-nums text-[var(--ink-muted)]">{i + 1}</td>
              <td className="py-[var(--sp-2)] pr-[var(--sp-3)]">
                {p.productId != null ? (
                  <Link href={`/admin/produse/${p.productId}`} className="text-[var(--accent)] hover:underline">
                    {p.title}
                  </Link>
                ) : (
                  <span className="text-[var(--ink-strong)]">{p.title}</span>
                )}
              </td>
              <td className="py-[var(--sp-2)] pr-[var(--sp-3)] tabular-nums">{formatCount(p.qty)}</td>
              <td className="py-[var(--sp-2)] tabular-nums">{formatCount(p.lines)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StockBlock({ result }: { result: MetricResult<StockSummary> }) {
  if (!result.ok) return <MetricError result={result} />;
  return (
    <div className="grid gap-[var(--sp-4)] sm:grid-cols-2">
      <div>
        <p className="text-200 text-[var(--ink-muted)]">Produse in_stock</p>
        <BigNumber value={formatCount(result.data.count)} />
      </div>
      <div>
        <p className="text-200 text-[var(--ink-muted)]">Valoare stoc (sumă price_mdl)</p>
        <BigNumber value={formatPriceWithUnit(result.data.valueMdl)} />
      </div>
    </div>
  );
}

function CountBlock({
  result,
  emptyLabel,
  linkHref,
  linkLabel,
}: {
  result: MetricResult<number>;
  emptyLabel: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  if (!result.ok) return <MetricError result={result} />;
  return (
    <div>
      <BigNumber value={formatCount(result.data)} />
      {result.data === 0 ? (
        <p className="mt-[var(--sp-2)] text-200 text-[var(--ink-muted)]">{emptyLabel}</p>
      ) : linkHref && linkLabel ? (
        <p className="mt-[var(--sp-2)] text-200">
          <Link href={linkHref} className="text-[var(--accent)] hover:underline">
            {linkLabel}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function BrandMarginsBlock({ result }: { result: MetricResult<BrandMargin[]> }) {
  if (!result.ok) return <MetricError result={result} />;
  if (result.data.length === 0) {
    return (
      <p className="text-300 text-[var(--ink-muted)]">
        Nicio marcă cu ambele prețuri (price_mdl și source_price_mdl).
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-left text-300">
        <thead>
          <tr className="border-b border-[var(--line)] text-100 uppercase tracking-wide text-[var(--ink-muted)]">
            <th className="py-[var(--sp-2)] pr-[var(--sp-3)] font-medium">Marcă</th>
            <th className="py-[var(--sp-2)] pr-[var(--sp-3)] font-medium tabular-nums">Produse</th>
            <th className="py-[var(--sp-2)] font-medium tabular-nums">Marjă medie</th>
          </tr>
        </thead>
        <tbody>
          {result.data.map((b) => (
            <tr key={b.brand} className="border-b border-[var(--line)]">
              <td className="py-[var(--sp-2)] pr-[var(--sp-3)] text-[var(--ink-strong)]">{b.brand}</td>
              <td className="py-[var(--sp-2)] pr-[var(--sp-3)] tabular-nums">{formatCount(b.products)}</td>
              <td
                className={`py-[var(--sp-2)] tabular-nums ${
                  b.avgMargin >= 0 ? "text-[var(--ok)]" : "text-[var(--warn)]"
                }`}
              >
                {(b.avgMargin * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-[var(--sp-2)] text-100 text-[var(--ink-muted)]">
        Formulă: (price_mdl − source_price_mdl) / price_mdl · doar produse active cu ambele prețuri · top după nr.
        de produse
      </p>
    </div>
  );
}

function UmamiCard() {
  const umamiUrl = process.env.UMAMI_URL?.trim().replace(/\/$/, "") ?? "";
  const websiteId = process.env.UMAMI_WEBSITE_ID?.trim() ?? "";
  const configured = Boolean(umamiUrl && websiteId);

  return (
    <Card
      title="Trafic (Umami)"
      hint="Traficul nu se măsoară în baza noastră — Umami e un serviciu separat în Coolify."
    >
      {configured ? (
        <div className="space-y-[var(--sp-3)]">
          <p className="text-300 text-[var(--ink)]">
            Umami e configurat. Deschide panoul de statistici sau încorporează iframe-ul din Umami.
          </p>
          <p className="text-200 text-[var(--ink-muted)]">
            URL: <code className="text-[var(--ink-strong)]">{umamiUrl}</code>
            <br />
            Website ID: <code className="text-[var(--ink-strong)]">{websiteId}</code>
          </p>
          <div className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface-2)]">
            <iframe
              title="Umami — statistici"
              src={`${umamiUrl}/share/${websiteId}`}
              className="h-[420px] w-full border-0 bg-white"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-100 text-[var(--ink-muted)]">
            Dacă iframe-ul e gol, verifică în Umami un share link public sau deschide{" "}
            <a href={umamiUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
              panoul Umami
            </a>{" "}
            direct. Vezi și <code>docs/umami-coolify.md</code>.
          </p>
        </div>
      ) : (
        <div className="space-y-[var(--sp-3)] text-300 text-[var(--ink)]">
          <p>
            Nu există contoare proprii de trafic în panou — așa e intenționat (GDPR, fără cookie-uri de tracking
            proprii). Instalează <strong>Umami</strong> ca serviciu separat în Coolify.
          </p>
          <ol className="list-decimal space-y-[var(--sp-2)] pl-[var(--sp-5)] text-200">
            <li>
              În Coolify: New Resource → Docker Image → <code>ghcr.io/umami-software/umami:postgresql-latest</code>{" "}
              (sau template-ul Umami, dacă e disponibil).
            </li>
            <li>Atașează o bază PostgreSQL (serviciu Coolify) și setează <code>DATABASE_URL</code>.</li>
            <li>
              Setează <code>APP_SECRET</code> (șir lung aleator) și domeniul public, ex.{" "}
              <code>https://analytics.anvelope-ungheni.md</code>.
            </li>
            <li>
              Creează website-ul în Umami; copiază URL-ul instanței și Website ID în variabilele de mediu ale
              site-ului: <code>UMAMI_URL</code>, <code>UMAMI_WEBSITE_ID</code>.
            </li>
            <li>
              Opțional pe site-ul public: scriptul de tracking Umami (
              <code>NEXT_PUBLIC_UMAMI_*</code> dacă îl adaugi ulterior) — separat de acest card.
            </li>
          </ol>
          <p className="text-200 text-[var(--ink-muted)]">
            Instrucțiuni detaliate: <code>docs/umami-coolify.md</code> din repo. După ce setezi env-urile și
            repornești app-ul, aici apare iframe-ul / linkul către statistici — fără cifre false între timp.
          </p>
          <p className="text-200 text-[var(--ink-muted)]">
            Env lipsă acum:{" "}
            {!umamiUrl ? <code>UMAMI_URL</code> : null}
            {!umamiUrl && !websiteId ? ", " : null}
            {!websiteId ? <code>UMAMI_WEBSITE_ID</code> : null}
          </p>
        </div>
      )}
    </Card>
  );
}

export default async function AnalizaPage() {
  const m = await loadAnalizaMetrics();

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
        <h1 className="text-500 font-semibold text-[var(--ink-strong)]">Analiză</h1>
        <p className="text-200 text-[var(--ink-muted)]">
          Comercial din baza noastră · trafic via Umami
        </p>
      </div>

      <div className="mt-[var(--sp-6)] grid gap-[var(--sp-4)]">
        <Card title="Comenzi" hint="Din tabela orders (zi / săptămână / AOV).">
          <OrdersBlock result={m.orders} />
          <p className="mt-[var(--sp-3)] text-200">
            <Link href="/admin/comenzi" className="text-[var(--accent)] hover:underline">
              Vezi toate comenzile →
            </Link>
          </p>
        </Card>

        <div className="grid gap-[var(--sp-4)] lg:grid-cols-2">
          <Card title="Stoc propriu (in_stock)" hint="Produse fizic în atelier · suma price_mdl.">
            <StockBlock result={m.inStock} />
            <p className="mt-[var(--sp-3)] text-200">
              <Link
                href="/admin/produse?stoc=in_stock"
                className="text-[var(--accent)] hover:underline"
              >
                Filtrează produsele in_stock →
              </Link>
            </p>
          </Card>

          <Card title="Calitate catalog">
            <div className="grid gap-[var(--sp-4)] sm:grid-cols-2">
              <div>
                <p className="text-200 text-[var(--ink-muted)]">Active fără imagine</p>
                <CountBlock
                  result={m.withoutImages}
                  emptyLabel="Toate produsele active au cel puțin o poză."
                  linkHref="/admin/produse"
                  linkLabel="Deschide catalogul →"
                />
              </div>
              <div>
                <p className="text-200 text-[var(--ink-muted)]">Active fără preț</p>
                <CountBlock
                  result={m.withoutPrice}
                  emptyLabel="Niciun produs activ fără price_mdl."
                  linkHref="/admin/produse"
                  linkLabel="Deschide catalogul →"
                />
              </div>
            </div>
          </Card>
        </div>

        <Card title="Produse cele mai comandate" hint="Agregat din order_items după cantitate (qty).">
          <TopProductsBlock result={m.topProducts} />
        </Card>

        <Card title="Marjă medie pe marcă">
          <BrandMarginsBlock result={m.brandMargins} />
        </Card>

        <UmamiCard />
      </div>
    </div>
  );
}
