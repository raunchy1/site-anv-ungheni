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

type Props = {
  id: number;
  priceMdl: number | null;
  sourcePriceMdl: number | null;
  priceLocked: boolean;
  stockStatus: StockStatus;
  /** `row` = celule `<td>` pentru tabel (md+); `card` = controale pe card mobil. */
  variant?: "row" | "card";
};

/**
 * Controalele editabile: preț, preț furnizor, marjă, stoc, lacăt.
 * Varianta `row` randează `<td>`-uri; `card` randează un layout vertical pe mobil.
 */
export function QuickEditRow({
  id,
  priceMdl,
  sourcePriceMdl,
  priceLocked,
  stockStatus,
  variant = "row",
}: Props) {
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

  const priceInput = (
    <div className="flex items-center gap-[var(--sp-2)]">
      <input
        type="number"
        step="1"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        aria-label="Preț (MDL)"
        className="h-9 w-full min-w-0 max-w-[8rem] rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-2)] text-300 text-[var(--ink-strong)] outline-none focus:border-[var(--accent)]"
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
  );

  const sourcePriceEl =
    sourcePriceMdl != null ? formatPriceWithUnit(sourcePriceMdl) : "—";

  const marginEl =
    margin != null && marginPct != null ? (
      <span className={margin >= 0 ? "text-[var(--ok)]" : "text-[var(--warn)]"}>
        {formatPriceWithUnit(margin)} · {marginPct.toFixed(0)}%
      </span>
    ) : (
      "—"
    );

  const stockSelect = (
    <select
      value={stock}
      onChange={(e) => changeStock(e.target.value as StockStatus)}
      disabled={pending}
      aria-label="Stare stoc"
      className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-2)] text-200 text-[var(--ink-strong)] outline-none focus:border-[var(--accent)] disabled:opacity-60"
    >
      {STOCK_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  const lockEl = (
    <div>
      {locked ? (
        <div className="flex flex-wrap items-center gap-[var(--sp-2)]">
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
    </div>
  );

  if (variant === "card") {
    return (
      <div className="mt-[var(--sp-3)] flex flex-col gap-[var(--sp-3)] border-t border-[var(--line)] pt-[var(--sp-3)]">
        <div className="grid grid-cols-2 gap-[var(--sp-3)]">
          <div className="flex flex-col gap-[var(--sp-1)]">
            <span className="text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]">Preț</span>
            {priceInput}
          </div>
          <div className="flex flex-col gap-[var(--sp-1)]">
            <span className="text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]">Furnizor</span>
            <span className="text-300 text-[var(--ink-muted)]">{sourcePriceEl}</span>
          </div>
          <div className="flex flex-col gap-[var(--sp-1)]">
            <span className="text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]">Marjă</span>
            <span className="text-300">{marginEl}</span>
          </div>
          <div className="flex flex-col gap-[var(--sp-1)]">
            <span className="text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]">Lacăt</span>
            {lockEl}
          </div>
        </div>
        <div className="flex flex-col gap-[var(--sp-1)]">
          <span className="text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]">Stoc</span>
          {stockSelect}
        </div>
      </div>
    );
  }

  return (
    <>
      <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)]">{priceInput}</td>
      <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink-muted)]">
        {sourcePriceEl}
      </td>
      <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-300">{marginEl}</td>
      <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)]">{stockSelect}</td>
      <td className="px-[var(--sp-3)] py-[var(--sp-2)]">{lockEl}</td>
    </>
  );
}
