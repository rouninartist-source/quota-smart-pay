import { useEffect } from "react";
import { X } from "lucide-react";

/** Diálogo simples e leve para os formulários do catálogo. */
export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[85vh] w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-elegant ${wide ? "max-w-2xl" : "max-w-lg"}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3">
          <h2 className="text-[13px] font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-2.5 text-[12.5px] outline-none transition focus:border-primary/60 focus:ring-[3px] focus:ring-primary/12";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-[10.5px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
