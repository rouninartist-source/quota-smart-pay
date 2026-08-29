import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";


/* ============================================================ */
/*   Reusable stat / metric cards                                */
/* ============================================================ */

export function StatCard({
  label,
  value,
  unit,
  delta,
  tone = "success",
  Icon,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  tone?: "success" | "warning" | "destructive" | "info";
  Icon?: LucideIcon;
}) {
  const toneClass: Record<string, string> = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-primary/10 text-primary",
  };
  return (
    <div className="group rounded-lg border border-border/60 bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && (
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {value} {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
      {delta && (
        <span className={cn("mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium", toneClass[tone])}>
          <ArrowUpRight className="h-3 w-3" /> {delta}
        </span>
      )}
    </div>
  );
}

/* ============================================================ */
/*   Bento KPI card — minimal, label-forward metric tile        */
/* ============================================================ */

export function KpiCard({
  label,
  value,
  unit,
  meta,
  metaTone = "success",
}: {
  label: string;
  value: string;
  unit?: string;
  meta?: ReactNode;
  metaTone?: "success" | "warning" | "destructive" | "muted" | "primary";
}) {
  const metaToneClass = {
    success: "text-success",
    warning: "text-warning-foreground",
    destructive: "text-destructive",
    muted: "text-muted-foreground",
    primary: "text-primary",
  };
  return (
    <div className="rounded-lg border border-border/60 bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elegant">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {value} {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
      {meta && (
        <div className={cn("mt-4 flex items-center text-[11px] font-semibold", metaToneClass[metaTone])}>
          {meta}
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/*   Circular health ring                                        */
/* ============================================================ */


export function HealthRing({ value, label = "Optimizado" }: { value: number; label?: string }) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative grid place-items-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.52 0.23 263)" />
            <stop offset="100%" stopColor="oklch(0.78 0.14 230)" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={radius} fill="none" stroke="var(--color-muted)" strokeWidth="10" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s var(--ease-out-soft)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/*   Progress bar with label                                     */
/* ============================================================ */

export function ProgressLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-primary transition-[width] duration-1000"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
