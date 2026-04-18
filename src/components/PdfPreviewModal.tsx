/**
 * Modal PDF preview. Uses an iframe pointing at the object URL so
 * preview stays in-app — no popup blocker, no tab navigation.
 */
import * as React from "react";
import { X, Download } from "lucide-react";

interface Props {
  url: string;
  filename?: string;
  onClose: () => void;
}

export default function PdfPreviewModal({ url, filename, onClose }: Props) {
  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Преглед на PDF"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h3 className="text-sm font-medium">Преглед на PDF</h3>
          <div className="flex items-center gap-1">
            <a
              href={url}
              download={filename ?? "document.pdf"}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs hover:bg-accent"
            >
              <Download className="h-4 w-4" />
              <span>Изтегли</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Затвори"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <iframe src={url} title="PDF Preview" className="w-full flex-1" />
      </div>
    </div>
  );
}
