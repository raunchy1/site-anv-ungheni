"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { IconFilter } from "@/components/icons";
import type { Locale } from "@/lib/types";

/** Pe mobil filtrele stau într-un drawer cu contor de rezultate, nu într-un accordion. */
export function MobileFilterDrawer({
  label, resultsLabel, closeLabel, locale, children,
}: { label: string; resultsLabel: string; closeLabel: string; locale: Locale; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button variant="secondary" size="md" onClick={() => setOpen(true)} iconStart={<IconFilter size={16} />} className="w-full">
        {label}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={label} side="bottom" locale={locale}>
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto pb-[var(--sp-6)]">{children}</div>
          <div className="sticky bottom-0 border-t border-[var(--line)] bg-[var(--surface)] pt-[var(--sp-4)]">
            <p className="num mb-[var(--sp-3)] text-200 text-[var(--ink-muted)]" aria-live="polite">{resultsLabel}</p>
            <Button variant="primary" size="md" onClick={() => setOpen(false)} className="w-full">{closeLabel}</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
