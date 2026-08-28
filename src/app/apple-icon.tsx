import { ImageResponse } from "next/og";
import { MARK_ONLY_D, MARK_TRANSFORM, MARK_VIEWBOX } from "@/components/brand/paths";

/**
 * Iconița pentru ecranul de start pe iOS: semnul alb, centrat pe pătrat roșu.
 * Colțurile rămân drepte — iOS le rotunjește singur, iar dacă le rotunjim și
 * noi ies două raze suprapuse.
 *
 * Se generează din aceleași căi ca logo-ul, nu dintr-un PNG desenat separat:
 * un fișier în plus ar fi încă o versiune a mărcii, care ar rămâne în urmă.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#D40608",
        }}
      >
        <svg width="132" height="75" viewBox={MARK_VIEWBOX}>
          <g transform={MARK_TRANSFORM} fill="#FFFFFF">
            <path d={MARK_ONLY_D} />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
