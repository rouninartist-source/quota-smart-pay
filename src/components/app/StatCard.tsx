import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  unit,
  delta,
  hint,
  Icon,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  hint?: string;
  Icon?: LucideIcon;
  className?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div
      className={cn(
        "rounded-md border border-border/70 bg-card p-4 transition-shadow duration-200 hover:shadow-soft",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[13px] font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden />}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs">
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              positive ? "text-success" : "text-destructive",
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            ) : (
              <ArrowDownRight className="h-3 w-3" aria-hidden />
            )}
            {positive ? "+" : ""}
            {delta}%
          </span>
        )}
        {hint && <span className="truncate text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>{children}</div>
  );
}
