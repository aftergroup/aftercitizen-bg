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

// --- Shared shells (one blank serves many services) ----------------
const registryLoader: Loader = () => import("./Grao2022RegistryTemplate");
const civilStatusLoader: Loader = () => import("./GR012Template");
const app14Loader: Loader = () => import("./App14PostoyanenTemplate");
const zaverkaLoader: Loader = () => import("./ZaverkaDrugaDrzhavaTemplate");
const raUtShellLoader: Loader = () => import("./RaUtShellTemplate");
const esShellLoader: Loader = () => import("./ESShellTemplate");
const gdprShellLoader: Loader = () => import("./GDPRShellTemplate");
const osHousingLoader: Loader = () => import("./OSHousingTemplate");
const osCertificateLoader: Loader = () => import("./OSCertificateTemplate");
const osArchiveCopyLoader: Loader = () => import("./OSArchiveCopyTemplate");
const tdStationaryHoursLoader: Loader = () => import("./TDStationaryHoursTemplate");
const tdMobileEquipmentLoader: Loader = () => import("./TDMobileEquipmentTemplate");
const tdOpenTradeLoader: Loader = () => import("./TDOpenTradeTemplate");
const tdPrivateOpenTradeLoader: Loader = () => import("./TDPrivateOpenTradeTemplate");
const tdFiutLoader: Loader = () => import("./TDFiutTemplate");
const tdTotemLoader: Loader = () => import("./TDTotemTemplate");
const hrShellLoader: Loader = () => import("./HRShellTemplate");
const aaAddressLoader: Loader = () => import("./AAAddressTemplate");
const siShellLoader: Loader = () => import("./SIShellTemplate");
const utShellLoader: Loader = () => import("./UTShellTemplate");

// --- Bespoke GR-* blanks -------------------------------------------
const gr010Loader: Loader = () => import("./GR010Template");
const gr011Loader: Loader = () => import("./GR011Template");
const gr017Loader: Loader = () => import("./GR017Template");
const gr024Loader: Loader = () => import("./GR024Template");
const gr025Loader: Loader = () => import("./GR025Template");
const gr026Loader: Loader = () => import("./GR026Template");
const gr028Loader: Loader = () => import("./GR028Template");
const gr029Loader: Loader = () => import("./GR029Template");
const gr031Loader: Loader = () => import("./GR031Template");
const gr033Loader: Loader = () => import("./GR033Template");
const gr034Loader: Loader = () => import("./GR034Template");
const gr035Loader: Loader = () => import("./GR035Template");
const gr036Loader: Loader = () => import("./GR036Template");

const loaders: Record<string, Loader> = {
  // --- GR (Гражданска регистрация) ----------------------------------
  // Универсално ИСКАНЕ (Приложение № 1 към чл. 6, ал. 1).
  "GR-001": registryLoader,
  "GR-002": registryLoader,
  "GR-003": registryLoader,
  "GR-004": registryLoader,
  "GR-006": registryLoader,
  "GR-007": registryLoader,
  "GR-008": registryLoader,
  "GR-009": registryLoader,
  "GR-019": registryLoader,
  "GR-020": registryLoader,
  "GR-021": registryLoader,
  "GR-022": registryLoader,
  "GR-027": registryLoader,
  "GR-032": registryLoader,

  // Generic гражданска регистрация ЗАЯВЛЕНИЕ (GR-012 blank).
  "GR-012": civilStatusLoader,
  "GR-013": civilStatusLoader,
  "GR-014": civilStatusLoader,
  "GR-015": civilStatusLoader,
  "GR-016": civilStatusLoader,
  "GR-018": civilStatusLoader,
  "GR-023": civilStatusLoader,

  "GR-005": app14Loader,
  "GR-010": gr010Loader,
  "GR-011": gr011Loader,
  "GR-017": gr017Loader,
  "GR-024": gr024Loader,
  "GR-025": gr025Loader,
  "GR-026": gr026Loader,
  "GR-028": gr028Loader,
  "GR-029": gr029Loader,
  "GR-030": zaverkaLoader,
  "GR-031": gr031Loader,
  "GR-033": gr033Loader,
  "GR-034": gr034Loader,
  "GR-035": gr035Loader,
  "GR-036": gr036Loader,

  // --- ES (Етажна собственост) --------------------------------------
  // Only ES-001 is a citizen-fillable form. ES-002 (ministerial order)
  // and ES-003 (sample examples) are reference materials, not
  // submittable PDFs — omitted from the registry.
  "ES-001": esShellLoader,

  // --- GDPR (Защита на личните данни) -------------------------------
  // Single template handles all three variants (correction / erasure /
  // restriction) by switching the title and ground-checklist.
  "GDPR-001": gdprShellLoader,
  "GDPR-002": gdprShellLoader,
  "GDPR-003": gdprShellLoader,

  // --- OS (Общинска собственост) ------------------------------------
  // Only services with an actual blank on R2 are wired. The remaining
  // OS-* services in the catalog (001, 003, 006, 007, 008, 010, 012,
  // 013, 014) have no PDF form available and are omitted.
  "OS-002": osHousingLoader,
  "OS-004": osCertificateLoader, // удост. за претенции по ЗВСВНОИ
  "OS-005": osArchiveCopyLoader,  // справки по актовите книги
  "OS-009": osCertificateLoader, // удост. за акт за общинска собственост
  "OS-011": osCertificateLoader, // справка за идеални части на сграда

  // --- TD (Регистрация и контрол на търговската дейност) ------------
  // TD-001 — работно време стационарен обект
  // TD-002 — подвижни съоръжения пред стационарен обект
  // TD-003 / TD-005 / TD-006 — open-trade on общинска собственост
  //   (identical blank verified by reading the PDFs)
  // TD-004 — работно време частна собственост
  // TD-007 — ФИУТ (1 = заявление, 2 = декларация)
  // TD-008 — фирмен тотем (1 = заявление, 2 = декларация)
  // TD-009 has no form blank → omitted.
  "TD-001": tdStationaryHoursLoader,
  "TD-002": tdMobileEquipmentLoader,
  "TD-003": tdOpenTradeLoader,
  "TD-004": tdPrivateOpenTradeLoader,
  "TD-005": tdOpenTradeLoader,
  "TD-006": tdOpenTradeLoader,
  "TD-007": tdFiutLoader,
  "TD-007-1": tdFiutLoader,
  "TD-007-2": tdFiutLoader,
  "TD-008": tdTotemLoader,
  "TD-008-1": tdTotemLoader,
  "TD-008-2": tdTotemLoader,

  // --- HR (Човешки ресурси и правно обслужване) ---------------------
  "HR-001": hrShellLoader,
  "HR-002": hrShellLoader,
  "HR-003": hrShellLoader,
  "HR-004": hrShellLoader,
  "HR-005": hrShellLoader,

  // --- AA (Удостоверения за административни адреси) -----------------
  // Bespoke blank: УПИ / кв. / местност property description plus the
  // alternative-address pair (AA-001) or free-text subject (AA-002).
  "AA-001": aaAddressLoader,
  "AA-002": aaAddressLoader,

  // --- SI (Строителство и инфраструктура) ---------------------------
  // Bespoke SI shell with 7 per-service body variants (construction
  // permit, coordination, acceptance, addendum, inventory, copy,
  // simple). SI-014 and SI-015 reuse AAAddressTemplate because their
  // blanks are identical to AA-001 / AA-002.
  // SI-006, 008, 009, 011, 013 are not in the Baserow catalog.
  "SI-001": siShellLoader,
  "SI-002": siShellLoader,
  "SI-003": siShellLoader,
  "SI-004": siShellLoader,
  "SI-005": siShellLoader,
  "SI-007": siShellLoader,
  "SI-010": siShellLoader,
  "SI-012": siShellLoader,
  "SI-014": aaAddressLoader,
  "SI-015": aaAddressLoader,
  "SI-016": siShellLoader,
  "SI-017": siShellLoader,
  "SI-018": siShellLoader,
  "SI-019": siShellLoader,
  "SI-020": siShellLoader,
  "SI-021": siShellLoader,
  "SI-022": siShellLoader,
  "SI-023": siShellLoader,

  // --- UT (Устройство на територията) -------------------------------
  // Bespoke UT shell with 15 per-service body variants (permit, visa,
  // PUP, delba, technical passport, order book, executive docs, copy,
  // certificate, moveable object, addendum, notification, consent,
  // utility bypass, investment-project redraw). Mixed addressee
  // Главния архитект / Кмета resolved per service code.
  // UT-006, UT-012, UT-029, UT-030 are not in the Baserow catalog.
  "UT-001": utShellLoader,
  "UT-002": utShellLoader,
  "UT-003": utShellLoader,
  "UT-004": utShellLoader,
  "UT-005-1": utShellLoader,
  "UT-005-2": utShellLoader,
  "UT-007": utShellLoader,
  "UT-008": utShellLoader,
  "UT-009": utShellLoader,
  "UT-010": utShellLoader,
  "UT-011-1": utShellLoader,
  "UT-011-2": utShellLoader,
  "UT-011-3": utShellLoader,
  "UT-013": utShellLoader,
  "UT-014-1": utShellLoader,
  "UT-014-2": utShellLoader,
  "UT-015-1": utShellLoader,
  "UT-015-2": utShellLoader,
  "UT-016": utShellLoader,
  "UT-017": utShellLoader,
  "UT-018": utShellLoader,
  "UT-019": utShellLoader,
  "UT-020": utShellLoader,
  "UT-021": utShellLoader,
  "UT-022": utShellLoader,
  "UT-023": utShellLoader,
  "UT-024": utShellLoader,
  "UT-025": utShellLoader,
  "UT-026": utShellLoader,
  "UT-027": utShellLoader,
  "UT-028": utShellLoader,
  "UT-031": utShellLoader,
  "UT-032": utShellLoader,
  "UT-033": utShellLoader,
  "UT-034": utShellLoader,
  "UT-035": utShellLoader,
  "UT-036": utShellLoader,
  "UT-037": utShellLoader,
  "UT-038": utShellLoader,
  "UT-039": utShellLoader,
  "UT-040": utShellLoader,
  "UT-041": utShellLoader,
  "UT-042": utShellLoader,
  "UT-043": utShellLoader,
  "UT-044": utShellLoader,
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
