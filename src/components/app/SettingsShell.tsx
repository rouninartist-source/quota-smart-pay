import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingsSection = {
  id: string;
  /** Rótulo no rail. */
  label: string;
  /** Segunda linha do rail — diz o que está lá dentro sem ser preciso entrar. */
  hint?: string;
  title: string;
  description?: string;
  content: React.ReactNode;
};

/**
 * Rail de secções à esquerda, secção activa à direita.
 *
 * Todas as secções ficam montadas e as inactivas escondem-se com `hidden`. É
 * deliberado: várias destas páginas usam inputs não controlados, e desmontar a
 * secção ao trocar de separador apagaria o que o utilizador tinha escrito.
 */
export function SettingsShell({
  sections,
  footer,
}: {
  sections: SettingsSection[];
  footer?: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const index = Math.max(
    0,
    sections.findIndex((s) => s.id === activeId),
  );
  const active = sections[index] ?? sections[0];
  const next = sections[index + 1];

  return (
    <div className="grid gap-3 md:min-h-0 md:flex-1 lg:grid-cols-[212px_minmax(0,1fr)]">
      <nav
        aria-label="Secções"
        className="flex min-h-0 flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-lg border border-border/70 bg-card p-1.5 shadow-sm lg:overflow-visible"
      >
        <p className="px-2.5 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Secções
        </p>
        {sections.map((s) => {
          const on = s.id === active?.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveId(s.id)}
              aria-current={on}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="text-[12px] font-semibold">{s.label}</span>
              {s.hint && (
                <span className="text-[10px] font-normal text-muted-foreground">{s.hint}</span>
              )}
            </button>
          );
        })}
      </nav>

      <section className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm md:min-h-0">
        <div className="shrink-0 border-b border-border/70 bg-surface px-4 py-3">
          <p className="font-display text-[13.5px] font-semibold">{active?.title}</p>
          {active?.description && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{active.description}</p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {sections.map((s) => (
            <div key={s.id} hidden={s.id !== active?.id} className="space-y-4">
              {s.content}
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-border/70 bg-surface px-4 py-2.5 text-[11px] text-muted-foreground">
          <span>
            Secção {index + 1} de {sections.length}
          </span>
          {footer}
          {next && (
            <button
              type="button"
              onClick={() => setActiveId(next.id)}
              className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition hover:bg-muted"
            >
              Seguinte: {next.label} <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
