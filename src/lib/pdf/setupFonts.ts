/**
 * Register a Cyrillic-capable font with @react-pdf/renderer.
 *
 * Runs once at module load (never inside a component). Roboto is sourced
 * directly from fonts.gstatic.com — Google's CSS API (with an old-browser
 * User-Agent) surfaces these stable per-subset TTF URLs, which is what
 * @react-pdf can ingest. Without this, Cyrillic renders as empty boxes.
 */
import { Font } from "@react-pdf/renderer";

const ROBOTO_CYRILLIC_400 =
  "https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbVmQiA8.ttf";
const ROBOTO_CYRILLIC_700 =
  "https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjalmQiA8.ttf";

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Roboto",
    fonts: [
      { src: ROBOTO_CYRILLIC_400, fontWeight: 400 },
      { src: ROBOTO_CYRILLIC_700, fontWeight: 700 },
      // Italic variants fall back to the regular Cyrillic glyphs. The Google
      // Italic TTFs don't cover Cyrillic well in the v51 snapshot, so rather
      // than shipping tofu we visually render italic sections as upright and
      // lean on surrounding styling (quote marks, underlines) for emphasis.
      { src: ROBOTO_CYRILLIC_400, fontWeight: 400, fontStyle: "italic" },
      { src: ROBOTO_CYRILLIC_700, fontWeight: 700, fontStyle: "italic" },
    ],
  });
}

registerPdfFonts();
