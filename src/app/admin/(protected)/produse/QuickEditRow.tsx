"use client";

import { useState, useTransition } from "react";
import { updateProductPrice, updateProductStock, unlockProductPrice } from "./actions";
import { formatPriceWithUnit } from "@/lib/format";
import type { StockStatus } from "@/lib/types";

const STOCK_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "in_stock", label: "În stoc · atelier" },
  { value: "supplier", label: "La furnizor" },
  { value: "out_of_stock", label: "Indisponibil" },
];

/**
 * Cele cinci coloane editabile ale rândului: preț, preț furnizor, marjă,
 * stoc, lacăt. Randate direct ca `<td>`, nu ca `<tr>` — părintele (Server
 * Component) construiește restul rândului static în jurul lor.
 */
export function QuickEditRow({
  id,
  priceMdl,
  sourcePriceMdl,
  priceLocked,
  stockStatus,
}: {
  id: number;
  priceMdl: number | null;
  sourcePriceMdl: number | null;
  priceLocked: boolean;
  stockStatus: StockStatus;
}) {
  const [price, setPrice] = useState(priceMdl != null ? String(priceMdl) : "");
  const [locked, setLocked] = useState(priceLocked);
  const [stock, setStock] = useState(stockStatus);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const priceNum = Number(price.replace(",", "."));
  const hasPrice = price.trim() !== "" && Number.isFinite(priceNum);
  const margin = hasPrice && sourcePriceMdl != null ? priceNum - sourcePriceMdl : null;
  const marginPct = margin != null && sourcePriceMdl ? (margin / sourcePriceMdl) * 100 : null;

  function savePrice() {
    setMessage(null);
    startTransition(async () => {
      const res = await updateProductPrice(id, priceNum);
      if (res.ok) {
        setLocked(true);
        setMessage({ tone: "ok", text: "Salvat." });
      } else {
        setMessage({ tone: "err", text: res.error });
      }
    });
  }

  function changeStock(next: StockStatus) {
    const prev = stock;
    setStock(next);
    setMessage(null);
    startTransition(async () => {
      const res = await updateProductStock(id, next);
      if (!res.ok) {
        setStock(prev);
        setMessage({ tone: "err", text: res.error });
      }
    });
  }

  function unlock() {
    setMessage(null);
    startTransition(async () => {
      const res = await unlockProductPrice(id);
      if (res.ok) {
        setLocked(false);
        setMessage({ tone: "ok", text: "Deblocat." });
      } else {
        setMessage({ tone: "err", text: res.error });
      }
    });
  }

  return (
    <>
      <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)]">
        <div className="flex items-center gap-[var(--sp-2)]">
          <input
            type="number"
            step="1"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-label="Preț (MDL)"
            className="h-9 w-24 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-2)] text-300 text-[var(--ink-strong)] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="button"
            onClick={savePrice}
            disabled={pending || !hasPrice}
            className="h-9 shrink-0 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-2)] text-200 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Salvează
          </button>
        </div>
      </td>

      <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink-muted)]">
        {sourcePriceMdl != null ? formatPriceWithUnit(sourcePriceMdl) : "—"}
      </td>

      <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-300">
        {margin != null && marginPct != null ? (
          <span className={margin >= 0 ? "text-[var(--ok)]" : "text-[var(--warn)]"}>
            {formatPriceWithUnit(margin)} · {marginPct.toFixed(0)}%
          </span>
        ) : (
          "—"
        )}
      </td>

      <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)]">
        <select
          value={stock}
          onChange={(e) => changeStock(e.target.value as StockStatus)}
          disabled={pending}
          aria-label="Stare stoc"
          className="h-9 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-2)] text-200 text-[var(--ink-strong)] outline-none focus:border-[var(--accent)] disabled:opacity-60"
        >
          {STOCK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </td>

      <td className="px-[var(--sp-3)] py-[var(--sp-2)]">
        {locked ? (
          <div className="flex items-center gap-[var(--sp-2)]">
            <span className="whitespace-nowrap rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-2)] py-[2px] text-100 font-medium uppercase tracking-wide text-[var(--ink-strong)]">
              Fixat manual
            </span>
            <button
              type="button"
              onClick={unlock}
              disabled={pending}
              className="whitespace-nowrap text-200 text-[var(--ink-muted)] underline hover:text-[var(--ink-strong)] disabled:opacity-50"
            >
              Deblochează
            </button>
          </div>
        ) : (
          <span className="whitespace-nowrap text-200 text-[var(--ink-muted)]">De la furnizor</span>
        )}
        {message ? (
          <p className={`mt-[var(--sp-1)] text-100 ${message.tone === "ok" ? "text-[var(--ok)]" : "text-[var(--warn)]"}`}>
            {message.text}
          </p>
        ) : null}
      </td>
    </>
  );
}
