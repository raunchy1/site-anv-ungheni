import {
  LOGO_ACCENT_D,
  LOGO_MARK_D,
  LOGO_RATIO,
  LOGO_TRANSFORM,
  LOGO_VIEWBOX,
  MARK_ONLY_D,
  MARK_RATIO,
  MARK_TRANSFORM,
  MARK_VIEWBOX,
} from "./paths";

/**
 * Logo-ul, o singură dată.
 *
 * Fișierul sursă vine în două variante — una pentru fundal deschis, una pentru
 * fundal închis — dar căile sunt IDENTICE; diferă doar cele două culori. Deci
 * aici e un singur component, iar culorile se moștenesc:
 *
 *   semnul + „Anvelope"  ->  `currentColor`
 *   „Ungheni"            ->  `var(--lg-accent)`
 *
 * Antetul și subsolul nu au nevoie de componente diferite, ci doar de două
 * declarații CSS (`.logo` și `.f-logo`, în `globals.css`).
 *
 * De ce inline și nu `<img src="logo.svg">`: `currentColor` nu traversează
 * granița unui `<img>`, deci pe fundal închis semnul ar rămâne negru.
 *
 * `width` ȘI `height` sunt explicite, calculate din proporția reală. Fără
 * amândouă, antetul sare la încărcare — CLS-ul e 0 pe toate paginile și
 * trebuie să rămână.
 */
export function Logo({ height = 48, className }: { height?: number; className?: string }) {
  return (
    <svg
      width={Math.round(height * LOGO_RATIO)}
      height={height}
      viewBox={LOGO_VIEWBOX}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g transform={LOGO_TRANSFORM}>
        <path fill="currentColor" d={LOGO_MARK_D} />
        <path fill="var(--lg-accent, #D40608)" d={LOGO_ACCENT_D} />
      </g>
    </svg>
  );
}

/** Doar semnul de anvelopă: avatar, filigran, marcaj mic. Moștenește culoarea. */
export function LogoMark({ height = 32, className }: { height?: number; className?: string }) {
  return (
    <svg
      width={Math.round(height * MARK_RATIO)}
      height={height}
      viewBox={MARK_VIEWBOX}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g transform={MARK_TRANSFORM} fill="currentColor">
        <path d={MARK_ONLY_D} />
      </g>
    </svg>
  );
}

export { LOGO_RATIO, MARK_RATIO };
