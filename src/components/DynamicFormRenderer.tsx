/**
 * Renders any form defined in Baserow DB 265, grouped by sections.
 * Consumes the RenderedForm shape produced by baserow.getRenderedForm().
 */
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Download, Eye, Loader2 } from "lucide-react";
import type { RenderedForm } from "@/lib/types";
import { baserow } from "@/lib/baserow";
import { hasPdfTemplate, loadPdfTemplate } from "@/lib/pdf/registry";
import {
  Button, Input, Textarea, Label, Checkbox,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui";

interface Props {
  schema: RenderedForm;
}

export default function DynamicFormRenderer({ schema }: Props) {
  const { form, service, sections } = schema;
  const [submitted, setSubmitted] = useState(false);
  const [submittedValues, setSubmittedValues] = useState<Record<string, string> | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const canDownloadPdf = hasPdfTemplate(form["Form Code"]);

  const defaults: Record<string, string | boolean> = {};
  for (const s of sections) {
    for (const f of s.fields) {
      defaults[f.code] =
        f.typeCode === "boolean" ? false : (f.defaultValue ?? "");
    }
  }

  const { control, register, handleSubmit, getValues, formState: { errors, isSubmitting } } =
    useForm<Record<string, string | boolean>>({ defaultValues: defaults });

  async function onSubmit(values: Record<string, string | boolean>) {
    try {
      const { submissionId } = await baserow.createSubmission({
        formId: form.id,
        serviceId: service?.id,
        values,
      });
      const stringValues: Record<string, string> = {};
      for (const [k, v] of Object.entries(values)) stringValues[k] = String(v ?? "");
      setSubmittedValues(stringValues);
      toast.success(`Заявлението е подадено. Референтен номер: #${submissionId}`);
      setSubmitted(true);
    } catch (err) {
      toast.error("Грешка при подаване на заявлението. Моля опитайте отново.");
      console.error(err);
    }
  }

  async function buildPdfBlob(values: Record<string, string>): Promise<Blob> {
    const [PdfTemplate, { pdf }] = await Promise.all([
      loadPdfTemplate(form["Form Code"]),
      import("@react-pdf/renderer"),
    ]);
    if (!PdfTemplate) throw new Error("no template");
    return pdf(<PdfTemplate schema={schema} values={values} />).toBlob();
  }

  async function downloadPdf() {
    if (!canDownloadPdf || !submittedValues) return;
    setPdfLoading(true);
    try {
      const fileSaverMod = await import("file-saver");
      const saveAs = fileSaverMod.default ?? fileSaverMod.saveAs;
      const blob = await buildPdfBlob(submittedValues);
      saveAs(blob, `${form["Form Code"]}.pdf`);
    } catch (err) {
      toast.error("Грешка при генериране на PDF.");
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  }

  async function previewPdf() {
    if (!canDownloadPdf) return;
    setPreviewLoading(true);
    try {
      const current = getValues();
      const stringValues: Record<string, string> = {};
      for (const [k, v] of Object.entries(current)) stringValues[k] = String(v ?? "");
      const blob = await buildPdfBlob(stringValues);
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank", "noopener,noreferrer");
      // Browsers that block the popup (or revoke the URL immediately) get
      // a toast hint; otherwise free the URL after the tab has loaded it.
      if (!win) {
        toast.error("Изскачащият прозорец е блокиран — разрешете го за сайта.");
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast.error("Грешка при генериране на PDF.");
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl">
          ✓
        </div>
        <h2 className="text-2xl font-semibold">Заявлението е подадено успешно</h2>
        <p className="text-muted-foreground">
          Ще получите потвърждение на посочения e-mail адрес. Заявлението е препратено към{" "}
          <a href="mailto:deloviodstvo@triaditza.bg" className="text-primary hover:underline">
            deloviodstvo@triaditza.bg
          </a>
          .
        </p>
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          {canDownloadPdf && (
            <Button onClick={downloadPdf} disabled={pdfLoading}>
              {pdfLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {pdfLoading ? "Генериране…" : "Изтегли PDF"}
            </Button>
          )}
          <Button variant="outline" onClick={() => window.location.reload()}>
            Подай ново заявление
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 max-w-3xl mx-auto">
      <header className="space-y-3 border-b pb-6">
        <div className="text-xs font-medium text-primary uppercase tracking-wide">
          {form["Form Code"]}
        </div>
        <h1 className="text-2xl font-semibold leading-tight">
          {service?.["Service Title BG"] ?? form["Form Title BG"]}
        </h1>
        {service?.["Service Legal Basis"] && (
          <p className="text-sm text-muted-foreground">
            Правно основание: {service["Service Legal Basis"]}
          </p>
        )}
        {canDownloadPdf && (
          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={previewPdf}
              disabled={previewLoading}
            >
              {previewLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {previewLoading ? "Генериране…" : "Преглед на PDF"}
            </Button>
          </div>
        )}
      </header>

      {sections.map((section) => (
        <section key={section.code} className="space-y-4">
          <h2 className="text-lg font-medium border-b pb-2">{section.nameBg}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((f) => {
              const id = `field-${f.formFieldId}`;
              const error = errors[f.code];

              const isFullWidth =
                f.htmlInput === "textarea" ||
                f.code.includes("description") ||
                f.code.includes("address") ||
                f.code.includes("content") ||
                f.code.includes("signature") ||
                f.code === "gdpr_consent";

              return (
                <div
                  key={f.formFieldId}
                  className={isFullWidth ? "md:col-span-2 space-y-1.5" : "space-y-1.5"}
                >
                  {f.typeCode === "boolean" ? (
                    <div className="flex items-start gap-2 pt-2">
                      <Controller
                        name={f.code}
                        control={control}
                        rules={{ required: f.required }}
                        render={({ field }) => (
                          <Checkbox
                            id={id}
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor={id} className="leading-tight">
                        {f.labelBg}
                        {f.required && <span className="text-destructive ml-0.5">*</span>}
                        {f.helpBg && (
                          <span className="block text-xs text-muted-foreground font-normal mt-1">
                            {f.helpBg}
                          </span>
                        )}
                      </Label>
                    </div>
                  ) : (
                    <>
                      <Label htmlFor={id}>
                        {f.labelBg}
                        {f.required && <span className="text-destructive ml-0.5">*</span>}
                      </Label>
                      {f.helpBg && (
                        <p className="text-xs text-muted-foreground">{f.helpBg}</p>
                      )}

                      {f.htmlInput === "textarea" ? (
                        <Textarea
                          id={id}
                          rows={4}
                          {...register(f.code, { required: f.required })}
                        />
                      ) : f.dictionary ? (
                        <Controller
                          name={f.code}
                          control={control}
                          rules={{ required: f.required }}
                          render={({ field }) => (
                            <Select
                              value={String(field.value ?? "")}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger id={id}>
                                <SelectValue placeholder="Изберете…" />
                              </SelectTrigger>
                              <SelectContent>
                                {f.dictionary!.entries.map((e) => (
                                  <SelectItem key={e.key} value={e.key}>
                                    {e.labelBg}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      ) : f.htmlInput === "file" ? (
                        <Input id={id} type="file" {...register(f.code)} />
                      ) : (
                        <Input
                          id={id}
                          type={f.htmlInput || "text"}
                          {...register(f.code, { required: f.required })}
                        />
                      )}
                    </>
                  )}

                  {error && (
                    <p className="text-xs text-destructive">
                      {error.type === "required" ? "Това поле е задължително" : "Невалидна стойност"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t pt-6">
        <div className="text-xs text-muted-foreground order-2 md:order-1">
          Полета, маркирани с <span className="text-destructive">*</span>, са задължителни
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full md:w-auto order-1 md:order-2"
        >
          {isSubmitting ? "Подаване…" : "Подай заявлението"}
        </Button>
      </div>
    </form>
  );
}
