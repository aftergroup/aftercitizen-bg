/**
 * Admin-side lightbox preview of OUR generated PDF template for a form
 * code — not the blank PDF stored in R2. Builds the same schema the
 * public `/forms/:code` flow uses, renders the registered react-pdf
 * template with empty values, and hands the resulting blob URL to
 * `PdfPreviewModal` so admins can verify layout/wording without
 * submitting a real заявление.
 *
 * The chunk + template are dynamically imported so `@react-pdf/renderer`
 * doesn't ship with the admin list bundle until an admin actually
 * clicks the eye icon.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { baserow } from "@/lib/baserow";
import { hasPdfTemplate, loadPdfTemplate } from "@/lib/pdf/registry";
import PdfPreviewModal from "@/components/PdfPreviewModal";

export function FormTemplatePreview({
  formCode,
  onClose,
}: {
  formCode: string;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: schema, isLoading: isSchemaLoading } = useQuery({
    queryKey: ["admin", "renderedForm", formCode],
    queryFn: () => baserow.getRenderedForm(formCode),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!schema) return;
    let cancelled = false;
    let createdUrl: string | null = null;

    (async () => {
      try {
        if (!hasPdfTemplate(formCode)) {
          throw new Error("Няма регистриран PDF шаблон за този формуляр.");
        }
        const [Template, { pdf }] = await Promise.all([
          loadPdfTemplate(formCode),
          import("@react-pdf/renderer"),
        ]);
        if (!Template) throw new Error("Неуспешно зареждане на PDF шаблона.");
        const blob = await pdf(
          <Template schema={schema} values={{}} />,
        ).toBlob();
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [schema, formCode]);

  if (error) return <PreviewErrorModal message={error} onClose={onClose} />;

  if (isSchemaLoading || !blobUrl) {
    return <PreviewLoadingModal onClose={onClose} />;
  }

  return (
    <PdfPreviewModal
      url={blobUrl}
      filename={`${formCode}.pdf`}
      onClose={onClose}
    />
  );
}

function PreviewLoadingModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex items-center gap-3 rounded-md bg-white px-5 py-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm">Изграждане на PDF прегледа…</span>
      </div>
    </div>
  );
}

function PreviewErrorModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-w-md rounded-md bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm mb-1">
              Неуспешно зареждане на прегледа
            </div>
            <p className="text-sm text-muted-foreground break-words">{message}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Затвори"
            className="p-1 -mr-1 -mt-1 rounded hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
