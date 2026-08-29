import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Check, Layers, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { selectWorkspace, useActiveWorkspace, workspaces } from "@/lib/workspaces";

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "Escolher empresa · Quota" },
      {
        name: "description",
        content:
          "Plano multi-empresas da Quota: escolha com qual das suas empresas quer entrar no sistema para facturar.",
      },
      { property: "og:title", content: "Escolher empresa · Quota" },
      {
        property: "og:description",
        content: "Um único login, até 5 empresas prontas a facturar no Quota.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkspacePicker,
});

function WorkspacePicker() {
  const active = useActiveWorkspace();
  const [picked, setPicked] = useState<string | null>(active?.id ?? null);
  const navigate = useNavigate();

  const enter = (id: string) => {
    selectWorkspace(id);
    navigate({ to: "/dashboard" });
  };

  return (
    <main className="min-h-screen bg-gradient-soft px-5 py-10 md:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary">
            <span className="font-display text-xs font-bold text-primary-foreground">Q</span>
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">Quota</span>
        </Link>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <Layers className="h-3.5 w-3.5" /> Plano Multi-empresas
            </span>
            <h1 className="mt-3 font-display text-[26px] font-semibold tracking-tight md:text-[30px]">
              Com que empresa quer facturar?
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              A sua conta tem {workspaces.length} empresas. Escolha uma para entrar no
              sistema — pode trocar em qualquer momento no topo do painel.
            </p>
          </div>
        </div>

        <ul className="mt-8 space-y-2.5">
          {workspaces.map((w) => {
            const isPicked = picked === w.id;
            return (
              <li key={w.id}>
                <button
                  onClick={() => setPicked(w.id)}
                  onDoubleClick={() => enter(w.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left transition",
                    isPicked
                      ? "border-primary/60 shadow-card ring-1 ring-primary/20"
                      : "border-border/60 hover:border-primary/40 hover:bg-primary/5",
                  )}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 font-display text-sm font-semibold text-primary">
                    {w.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{w.name}</span>
                      <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {w.role}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-[12px] text-muted-foreground">
                      NUIT {w.nuit} · {w.sector} · {w.city}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground/80">
                      {w.docs} documentos emitidos
                    </span>
                  </span>
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition",
                      isPicked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-transparent",
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            disabled={!picked}
            onClick={() => picked && enter(picked)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            Entrar no sistema <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            to="/registo"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Adicionar empresa
          </Link>
          <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" /> Os dados da empresa escolhida aparecem
            nas facturas e PDFs.
          </p>
        </div>
      </div>
    </main>
  );
}
