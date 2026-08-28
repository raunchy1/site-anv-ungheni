import { ImageResponse } from "next/og";
import {
  LOGO_ACCENT_D,
  LOGO_MARK_D,
  LOGO_TRANSFORM,
  LOGO_VIEWBOX,
} from "@/components/brand/paths";

/**
 * Cartonașul social: logo-ul în varianta pentru fundal închis, centrat pe
 * `#101418` — exact fundalul pentru care a fost desenată varianta inversă.
 * Aceleași căi ca în antet; nicio a doua versiune a mărcii.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Anvelope Ungheni";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#101418",
        }}
      >
        <svg width="880" height="255" viewBox={LOGO_VIEWBOX}>
          <g transform={LOGO_TRANSFORM}>
            <path fill="#FFFFFF" d={LOGO_MARK_D} />
            <path fill="#F0393C" d={LOGO_ACCENT_D} />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
