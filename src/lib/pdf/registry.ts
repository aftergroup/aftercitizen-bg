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
const raUtShellLoader: Loader = () => import("./RaUtShellTemplate");

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

  // RA-UT-SHELL: universal ЗАЯВЛЕНИЕ до Главния архитект shell used by 33
  // forms across отдел „Устройство на територията" (SI-* and UT-*).
  "SI-001": raUtShellLoader,
  "SI-002": raUtShellLoader,
  "SI-003": raUtShellLoader,
  "SI-004": raUtShellLoader,
  "SI-005": raUtShellLoader,
  "SI-007": raUtShellLoader,
  "SI-020": raUtShellLoader,
  "SI-021": raUtShellLoader,
  "SI-022": raUtShellLoader,
  "UT-002": raUtShellLoader,
  "UT-003": raUtShellLoader,
  "UT-004": raUtShellLoader,
  "UT-005-1": raUtShellLoader,
  "UT-005-2": raUtShellLoader,
  "UT-007": raUtShellLoader,
  "UT-008": raUtShellLoader,
  "UT-009": raUtShellLoader,
  "UT-010": raUtShellLoader,
  "UT-011-1": raUtShellLoader,
  "UT-013": raUtShellLoader,
  "UT-014-1": raUtShellLoader,
  "UT-014-2": raUtShellLoader,
  "UT-015-1": raUtShellLoader,
  "UT-015-2": raUtShellLoader,
  "UT-016": raUtShellLoader,
  "UT-017": raUtShellLoader,
  "UT-018": raUtShellLoader,
  "UT-027": raUtShellLoader,
  "UT-031": raUtShellLoader,
  "UT-032": raUtShellLoader,
  "UT-033": raUtShellLoader,
  "UT-043": raUtShellLoader,
  "UT-044": raUtShellLoader,
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
