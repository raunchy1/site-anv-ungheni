"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";

/**
 * Interval de pret, doua capete. Doua `<input type=range>` suprapuse, nu
 * `<div>`-uri cu handler de pointer: tastatura, VoiceOver si TalkBack merg
 * din prima, iar `aria-valuetext` spune „1 200 MDL”, nu „1200”.
 *
 * Sina are 2px, nu 6: pe un ecran care contine deja un tabel de cifre,
 * o bara groasa e al doilea element care cere atentie.
 * Portiunea selectata e in `--ink-strong`, nu in accent — filtrul nu e
 * actiunea principala a ecranului.
 */
export function RangeSlider({
  label,
  min,
  max,
  step = 50,
  valueMin,
  valueMax,
  onChange,
  unit = "MDL",
  className,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChange?: (next: { min: number; max: number }) => void;
  unit?: string;
  className?: string;
}) {
  const id = useId();
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div className={cn("flex flex-col gap-[var(--sp-3)]", className)}>
      <div className="flex items-baseline justify-between gap-[var(--sp-3)]">
        <span className="label" id={`${id}-label`}>
          {label}
        </span>
        <span className="num font-mono text-200 text-[var(--ink-strong)]">
          {formatPrice(valueMin)} – {formatPrice(valueMax)} {unit}
        </span>
      </div>

      <div className="relative h-11">
        {/* sina */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-[1px] bg-[var(--line-strong)]" />
        {/* portiunea selectata */}
        <div
          className="pointer-events-none absolute top-1/2 h-[2px] -translate-y-1/2 rounded-[1px] bg-[var(--ink-strong)]"
          style={{ left: `${pct(valueMin)}%`, right: `${100 - pct(valueMax)}%` }}
        />
        <input
          type="range"
          aria-labelledby={`${id}-label`}
          aria-valuetext={`${formatPrice(valueMin)} ${unit}`}
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={(e) =>
            onChange?.({
              min: Math.min(Number(e.target.value), valueMax - step),
              max: valueMax,
            })
          }
          className="range-thumb absolute inset-x-0 top-0 h-11 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          aria-labelledby={`${id}-label`}
          aria-valuetext={`${formatPrice(valueMax)} ${unit}`}
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={(e) =>
            onChange?.({
              min: valueMin,
              max: Math.max(Number(e.target.value), valueMin + step),
            })
          }
          className="range-thumb absolute inset-x-0 top-0 h-11 w-full appearance-none bg-transparent"
        />
      </div>
    </div>
  );
}

/** Varianta necontrolata, pentru demonstratie si pentru formulare simple. */
export function RangeSliderDemo(props: {
  label: string;
  min: number;
  max: number;
  step?: number;
  initialMin?: number;
  initialMax?: number;
}) {
  const [v, setV] = useState({
    min: props.initialMin ?? props.min,
    max: props.initialMax ?? props.max,
  });
  return (
    <RangeSlider
      label={props.label}
      min={props.min}
      max={props.max}
      step={props.step}
      valueMin={v.min}
      valueMax={v.max}
      onChange={setV}
    />
  );
}
