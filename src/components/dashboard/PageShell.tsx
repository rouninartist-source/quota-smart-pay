import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Plus, Sparkles } from "lucide-react";

export type PageMetric = { label: string; value: string; unit?: string; hint?: string };
export type PageAction = { label: string; primary?: boolean };
export type PageFeature = { title: string; desc: string; icon: LucideIcon };

export function PageShell({
  eyebrow,
  title,
  description,
  Icon,
  metrics,
  actions,
  features,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  metrics?: PageMetric[];
  actions?: PageAction[];
  features?: PageFeature[];
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 md:py-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
              {title}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((a) =>
              a.primary ? (
                <button
                  key={a.label}
                  className="inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow hover:opacity-95"
                >
                  <Plus className="h-3.5 w-3.5" /> {a.label}
                </button>
              ) : (
                <button
                  key={a.label}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-xs font-medium text-foreground shadow-card hover:bg-muted"
                >
                  {a.label}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Metrics */}
      {metrics && metrics.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-border/60 bg-card p-4 shadow-card"
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums">
                {m.value}
                {m.unit && (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">{m.unit}</span>
                )}
              </p>
              {m.hint && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">{m.hint}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Highlight card */}
          <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card p-6 shadow-card md:p-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-primary opacity-[0.10] blur-3xl" />
            <span className="relative inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Em construção
            </span>
            <h2 className="relative mt-5 max-w-xl font-display text-[22px] font-semibold tracking-tight md:text-[26px] md:leading-[1.2]">
              Esta área está a ser preparada
            </h2>
            <p className="relative mt-2.5 max-w-lg text-sm text-muted-foreground">
              Em breve terá aqui a experiência completa de {title.toLowerCase()}. Enquanto isso,
              pode continuar a usar o dashboard e as áreas já disponíveis.
            </p>
            <div className="relative mt-6 flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow hover:opacity-95">
                Ser notificado <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted">
                Sugerir funcionalidade
              </button>
            </div>
          </div>

          {/* Features */}
          {features && features.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((f) => {
                const FIcon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-lg border border-border/60 bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elegant"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                      <FIcon className="h-4 w-4" />
                    </div>
                    <h3 className="mt-4 font-display text-[15px] font-semibold">{f.title}</h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          )}

          {children}
        </div>

        {/* Right rail */}
        <aside className="space-y-6">
          <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-card p-6 shadow-card">
            <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-80" />
            <div className="relative flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" /> Assistente Quota
            </div>
            <p className="relative mt-2.5 text-sm leading-relaxed text-foreground/90">
              Precisa de ajuda com {title.toLowerCase()}? Pergunte-me em linguagem natural.
            </p>
            <button className="relative mt-4 inline-flex items-center gap-1 rounded-md bg-gradient-primary px-3.5 py-2 text-[11px] font-semibold text-primary-foreground shadow-glow">
              Abrir assistente <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="rounded-lg border border-border/60 bg-card p-6 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Sabia que...
            </p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              A Quota está a construir todas as áreas com o mesmo cuidado do dashboard. Cada
              módulo é pensado para PMEs moçambicanas.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
