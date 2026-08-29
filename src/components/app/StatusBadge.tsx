import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-muted text-muted-foreground ring-border",
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/15 text-warning-foreground ring-warning/30 dark:text-warning",
  danger: "bg-destructive/10 text-destructive ring-destructive/20",
  info: "bg-primary/10 text-primary ring-primary/20",
} as const;

export type Tone = keyof typeof tones;

const statusMap: Record<string, { label: string; tone: Tone }> = {
  paga: { label: "Paga", tone: "success" },
  pago: { label: "Pago", tone: "success" },
  enviada: { label: "Enviada", tone: "info" },
  rascunho: { label: "Rascunho", tone: "neutral" },
  vencida: { label: "Vencida", tone: "danger" },
  parcial: { label: "Parcial", tone: "warning" },
  cancelada: { label: "Cancelada", tone: "neutral" },
  aceite: { label: "Aceite", tone: "success" },
  expirada: { label: "Expirada", tone: "neutral" },
  activo: { label: "Activo", tone: "success" },
  inactivo: { label: "Inactivo", tone: "neutral" },
  pausado: { label: "Pausado", tone: "warning" },
  risco: { label: "Em risco", tone: "danger" },
  esgotado: { label: "Esgotado", tone: "danger" },
  descontinuado: { label: "Descontinuado", tone: "neutral" },
  pendente: { label: "Pendente", tone: "warning" },
  aprovacao: { label: "Por aprovar", tone: "info" },
  confirmado: { label: "Confirmado", tone: "success" },
  falhado: { label: "Falhado", tone: "danger" },
  reembolsado: { label: "Reembolsado", tone: "neutral" },
};

export function StatusBadge({
  status,
  label,
  tone,
  className,
}: {
  status?: string;
  label?: string;
  tone?: Tone;
  className?: string;
}) {
  const preset = status ? statusMap[status] : undefined;
  const finalTone = tone ?? preset?.tone ?? "neutral";
  const finalLabel = label ?? preset?.label ?? status ?? "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[finalTone],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          finalTone === "success" && "bg-success",
          finalTone === "danger" && "bg-destructive",
          finalTone === "warning" && "bg-warning",
          finalTone === "info" && "bg-primary",
          finalTone === "neutral" && "bg-muted-foreground/60",
        )}
      />
      {finalLabel}
    </span>
  );
}
