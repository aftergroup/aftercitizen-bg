/**
 * Form-code → PDF template registry.
 *
 * Templates are loaded on-demand so the ~1.5 MB of @react-pdf/renderer +
 * template code never ships in the main bundle. The renderer checks
 * `hasPdfTemplate(code)` to decide whether to show the download button,
 * then calls `loadPdfTemplate(code)` on click to pull the code-split chunk.
 *
 * Adding a new template = one import function + one set entry.
 */
import type { ComponentType } from "react";
import type { RenderedForm } from "@/lib/types";

export interface PdfTemplateProps {
  schema: RenderedForm;
  values: Record<string, string>;
}

export type PdfTemplate = ComponentType<PdfTemplateProps>;

type Loader = () => Promise<{ default: PdfTemplate }>;

const registryLoader: Loader = () => import("./Grao2022RegistryTemplate");
const civilStatusLoader: Loader = () => import("./GR012Template");
const app14Loader: Loader = () => import("./App14PostoyanenTemplate");
const zaverkaLoader: Loader = () => import("./ZaverkaDrugaDrzhavaTemplate");

const loaders: Record<string, Loader> = {
  // GRAO-2022-civilstatus: ЗАЯВЛЕНИЕ за административна услуга гражданска
  // регистрация (GR-012 and its siblings share the exact same blank).
  "GR-012": civilStatusLoader,
  "GR-018": civilStatusLoader,
  "GR-023": civilStatusLoader,

  // GRAO-2022-registry: universal ИСКАНЕ with a 9-option certificate grid.
  "GR-001": registryLoader,
  "GR-002": registryLoader,
  "GR-004": registryLoader,
  "GR-006": registryLoader,
  "GR-007": registryLoader,
  "GR-008": registryLoader,
  "GR-019": registryLoader,
  "GR-020": registryLoader,
  "GR-021": registryLoader,

  // APP14-2019-postoyanen: ЗАЯВЛЕНИЕ за постоянен адрес (Приложение № 14).
  "GR-005": app14Loader,

  // ZAVERKA-DRUG-DRAZHAVA: заверка на документи по гражданско състояние за чужбина.
  "GR-030": zaverkaLoader,
};

export function hasPdfTemplate(formCode: string): boolean {
  return formCode in loaders;
}

export async function loadPdfTemplate(formCode: string): Promise<PdfTemplate | undefined> {
  const loader = loaders[formCode];
  if (!loader) return undefined;
  const mod = await loader();
  return mod.default;
}
