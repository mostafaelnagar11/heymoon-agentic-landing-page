/* The site icon (WP0, SPEC §4.1): the four-point star (ui/Star.tsx's path) in white on a #010317 disc,
   32×32, generated rather than committed because no SVG rasteriser is installed. It sits at the app
   root, so v1 and the product get it too, replacing Next's default triangle (app/favicon.ico, deleted). */
import { ImageResponse } from "next/og";
import { STAR_PATH } from "./(site)/_site/ui/Star";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 32, height: 32, borderRadius: 16, background: "#010317", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d={STAR_PATH} fill="#ffffff" />
        </svg>
      </div>
    ),
    size,
  );
}
