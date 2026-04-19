/**
 * Shared right-side slide-in drawer for add/edit flows in the admin panel.
 *
 * 60% viewport width on desktop, full-width on mobile. The 500ms ease-out
 * slide is paired with an opacity fade on the backdrop so both transitions
 * land together. The backdrop combines a 60% black overlay with a slight
 * blur so the page behind isn't a distracting silhouette while the drawer
 * is open. Closes on Escape or backdrop click; locks body scroll while
 * open so long forms inside the drawer don't scroll the page underneath.
 */
import { useEffect } from "react";
import { X } from "lucide-react";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, description, footer, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ease-out ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute top-0 right-0 bottom-0 w-full md:w-[60vw] bg-white shadow-2xl flex flex-col transform transition-transform duration-500 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-start justify-between gap-4 p-5 border-b">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight truncate">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Затвори"
            className="p-2 -mr-2 -mt-2 rounded hover:bg-accent flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {footer && <footer className="border-t p-4 flex justify-end gap-2">{footer}</footer>}
      </aside>
    </div>
  );
}
