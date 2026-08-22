import type { ReactNode, SVGProps } from "react";

/**
 * O singura familie de iconite, desenata pentru acest proiect.
 * Reguli, respectate de toate: grila 24x24, contur 1.5, capete drepte (`butt`),
 * imbinari `miter`, zero umpluturi, zero colturi rotunjite.
 * Capetele drepte sunt decizia care le tine impreuna — un set tehnic nu are
 * capete rotunde, iar amestecul dintre cele doua e semnul cel mai rapid ca
 * iconitele vin din doua surse.
 *
 * Dimensiunea implicita e 20, nu 24: la 24 domina randul de text de 14-16px.
 */

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /** Latura in px. Iconita ramane patrata. */
  size?: number;
  /** Titlu accesibil. Absent = iconita e decorativa si se ascunde de la AT. */
  title?: string;
};

type IconBaseProps = IconProps & { children?: ReactNode };

function Icon({ size = 20, title, children, ...svg }: IconBaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...svg}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* ---------------------------------------------------------------- produs -- */

/** Sectiune de anvelopa: flanc, umar, patru blocuri de banda. */
export const IconTyre = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9.25" />
    <circle cx="12" cy="12" r="4.75" />
    <path d="M12 2.75v3.1M12 18.15v3.1M2.75 12h3.1M18.15 12h3.1" />
    <path d="M5.46 5.46l2.19 2.19M16.35 16.35l2.19 2.19M18.54 5.46l-2.19 2.19M7.65 16.35l-2.19 2.19" />
  </Icon>
);

/* --------------------------------------------------------------- sezoane --
   Trei semnale, aceeasi geometrie: un disc de raza 3.6 in centru, marcaje
   intre raza 5.4 si 8.4. Diferenta e in marcaje, nu in scara — asa se citesc
   ca un set, nu ca trei iconite separate.
   -------------------------------------------------------------------------- */

export const IconSummer = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3.6" />
    <path d="M12 3.6v2.6M12 17.8v2.6M3.6 12h2.6M17.8 12h2.6" />
    <path d="M6.06 6.06l1.84 1.84M16.1 16.1l1.84 1.84M17.94 6.06L16.1 7.9M7.9 16.1l-1.84 1.84" />
  </Icon>
);

export const IconWinter = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
    <path d="M9.8 5.2L12 7.4l2.2-2.2M9.8 18.8L12 16.6l2.2 2.2" />
    <path d="M5.1 11.1l.8-3l3 .8M18.9 12.9l-.8 3l-3-.8" />
    <path d="M18.9 11.1l-.8-3l-3 .8M5.1 12.9l.8 3l3-.8" />
  </Icon>
);

export const IconAllSeason = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3.6" />
    {/* stanga: trei raze scurte, drepte — soarele */}
    <path d="M6.4 12H3.8M9.45 9.45L7.2 7.2M9.45 14.55L7.2 16.8" />
    {/* dreapta: trei brate lungi terminate in furca — fulgul */}
    <path d="M17.6 12h3.4M21 12l-1.4-1.2M21 12l-1.4 1.2" />
    <path d="M14.9 7.5l2.4-3.4M17.3 4.1l-1.6.3M17.3 4.1l-.3 1.6" />
    <path d="M14.9 16.5l2.4 3.4M17.3 19.9l-1.6-.3M17.3 19.9l-.3-1.6" />
  </Icon>
);

/* -------------------------------------------------------------- comert ---- */

export const IconStock = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.75 7.5L12 3.75l8.25 3.75v9L12 20.25 3.75 16.5v-9z" />
    <path d="M3.75 7.5L12 11.25l8.25-3.75M12 11.25v9" />
  </Icon>
);

export const IconPhone = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8.6 3.75H5.4a1.65 1.65 0 0 0-1.65 1.8c.55 6.9 6.2 12.55 13.1 13.1a1.65 1.65 0 0 0 1.8-1.65v-3.2l-4.1-1.3-1.75 2.1a13.6 13.6 0 0 1-5.6-5.6l2.1-1.75L8.6 3.75z" />
  </Icon>
);

export const IconCart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.75 4.25h2.9l2.3 10.1h9.6l2.1-7.35H6.6" />
    <circle cx="9.5" cy="18.5" r="1.55" />
    <circle cx="16.9" cy="18.5" r="1.55" />
  </Icon>
);

export const IconFilter = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.25 7h4.1M11.15 7h9.6M3.25 12h11.4M18.45 12h2.3M3.25 17h6.4M13.45 17h7.3" />
    <path d="M9.25 4.9v4.2M16.55 9.9v4.2M11.55 14.9v4.2" />
  </Icon>
);

export const IconCompare = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.25 20.25h17.5" />
    <path d="M5.5 20.25V11.5h4v8.75M14.5 20.25V4.75h4v15.5" />
  </Icon>
);

/** Semn de carte, nu inima. Un atelier nu colectioneaza simpatii, marcheaza piese. */
export const IconFavorite = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.25 3.75h11.5v16.5L12 15.9l-5.75 4.35V3.75z" />
  </Icon>
);

/* ------------------------------------------------------------- utilitare -- */

export const IconSearch = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10.75" cy="10.75" r="6.5" />
    <path d="M15.5 15.5l5 5" />
  </Icon>
);

export const IconChevronDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 9l7 6.5L19 9" />
  </Icon>
);

export const IconChevronRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 4.5l6.5 7.5L9 19.5" />
  </Icon>
);

export const IconChevronLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="M15 4.5L8.5 12l6.5 7.5" />
  </Icon>
);

export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Icon>
);

export const IconClose = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 5l14 14M19 5L5 19" />
  </Icon>
);

export const IconMinus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 12h15" />
  </Icon>
);

export const IconPlus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 12h15M12 4.5v15" />
  </Icon>
);

export const IconAlert = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.25L21.5 20.5h-19L12 3.25z" />
    <path d="M12 9.5v5M12 17.2v.9" />
  </Icon>
);

export const IconInfo = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.75" />
    <path d="M12 11v6M12 7.4v1.1" />
  </Icon>
);

export const IconArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 12h16M13.5 6l6 6-6 6" />
  </Icon>
);

/* ---------------------------------------------------- elementul-semnatura --
   Profilul benzii de rulare. O linie continua + blocuri inclinate, taiate de
   un canal longitudinal. Se foloseste MAXIM de doua ori pe ecran: o data ca
   marcaj sub titlul principal, o data ca separator intre doua blocuri majore.
   Nu e ornament — e singurul element grafic recurent al site-ului.
   -------------------------------------------------------------------------- */

export type TreadRuleProps = {
  /** `mark` = scurt, sub un titlu. `full` = separator pe toata latimea. */
  variant?: "mark" | "full";
  className?: string;
  /** Marcaj sub titlu: cat de lat, in px. */
  width?: number;
};

export function TreadRule({
  variant = "mark",
  className,
  width = 96,
}: TreadRuleProps) {
  const id = variant === "mark" ? "tread-mark" : "tread-full";
  return (
    <svg
      className={className}
      height={12}
      aria-hidden="true"
      focusable="false"
      style={variant === "full" ? { width: "100%" } : { width, flex: "0 0 auto" }}
    >
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width="17"
          height="12"
          patternTransform="skewX(-20)"
        >
          <rect x="0" y="0" width="11" height="8" fill="currentColor" />
        </pattern>
      </defs>
      {/* lugurile inclinate */}
      <rect x="0" y="0" width="100%" height="8" fill={`url(#${id})`} />
      {/* coasta longitudinala continua — partea care il face sa citeasca
          drept banda de rulare si nu drept linie punctata */}
      <rect x="0" y="10" width="100%" height="2" fill="currentColor" />
    </svg>
  );
}
