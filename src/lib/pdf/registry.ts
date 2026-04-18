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

const loaders: Record<string, Loader> = {
  "GR-012": () => import("./GR012Template"),
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
