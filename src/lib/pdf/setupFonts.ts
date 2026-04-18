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
    ],
  });
}

registerPdfFonts();
