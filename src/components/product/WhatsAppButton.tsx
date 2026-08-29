import { IconWhatsApp } from "@/components/icons";
import { whatsappLink } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * WhatsApp e canal de comandă, nu buton decorativ: pe produsele indisponibile
 * e acțiunea principală, pe cele disponibile e a doua opțiune lângă coș.
 * Niciodată widget plutitor, niciodată popup.
 */
export function WhatsAppButton({
  message, label, variant = "secondary", className, href,
}: {
  message: string;
  label: string;
  variant?: "primary" | "secondary";
  className?: string;
  /** Legătură gata construită, când textul vine de pe server (confirmarea de comandă). */
  href?: string;
}) {
  return (
    <a
      href={href ?? whatsappLink(message)}
      target="_blank"
      rel="noopener"
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-[var(--sp-2)] rounded-[var(--radius-sm)] px-[var(--sp-5)] text-300 font-medium",
        "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
        variant === "primary"
          ? "bg-[var(--accent)] text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
          : "border border-[var(--line-strong)] text-[var(--ink-strong)] hover:border-[var(--ink-strong)]",
        className,
      )}
    >
      <IconWhatsApp size={17} />
      {label}
    </a>
  );
}
