import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, Building2 } from "lucide-react";
import { toast } from "sonner";
import { setOrgPlan, useOrg } from "@/lib/org-store";
import { plans, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/planos")({
  head: () => ({
    meta: [
      { title: "Plano · Quota Studio" },
      { name: "description", content: "Consulte o plano actual e faça upgrade." },
    ],
  }),
  component: PlanosPage,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-PT").format(n);

function PlanosPage() {
  const { org, orgs } = useOrg();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const current = org?.plan ?? "basic";

  async function choose(id: PlanId) {
    if (id === current || busy) return;
    setBusy(id);
    const { error } = await setOrgPlan(id);
    setBusy(null);
    if (error) return toast.error("Não foi possível alterar o plano", { description: error });
    toast.success(`Plano ${plans.find((p) => p.id === id)?.name} activado`, {
      description: "A facturação do plano é tratada pela equipa Quota — entraremos em contacto.",
    });
  }

  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 pl-1 text-[12.5px] font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Plano
          </span>
          <span className="border-l border-border/60 pl-3 text-[11px] text-muted-foreground">
            {org?.name} · Plano actual: <span className="font-semibold text-foreground">{plans.find((p) => p.id === current)?.name}</span>
          </span>
          <Link to="/empresas" className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium hover:bg-muted">
            <Building2 className="h-3.5 w-3.5" /> Empresas ({orgs.length})
          </Link>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 gap-3 overflow-y-auto md:grid-cols-3">
        {plans.map((p) => {
          const active = p.id === current;
          const downgradeBlocked = orgs.length > p.maxOrgs;
          return (
            <article
              key={p.id}
              className={cn(
                "flex flex-col rounded-lg border bg-card p-5 shadow-sm",
                active ? "border-primary ring-[3px] ring-primary/12" : "border-border/70",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-[17px] font-semibold">{p.name}</h2>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">{p.tagline}</p>
                </div>
                {active && <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10.5px] font-semibold text-primary">Actual</span>}
              </div>
              <p className="mt-4 font-display text-[26px] font-semibold tabular-nums">
                {fmt(p.monthly)} <span className="text-[12px] font-normal text-muted-foreground">MT / mês</span>
              </p>
              <ul className="mt-4 space-y-2 text-[12.5px]">
                {[
                  `${p.maxOrgs} empresa${p.maxOrgs === 1 ? "" : "s"}`,
                  p.users,
                  "Documentos ilimitados",
                  "Templates standard",
                  "Cobranças por WhatsApp",
                  p.ai ? "Quota AI incluído" : "Sem Quota AI",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className={cn("h-3.5 w-3.5", f.startsWith("Sem") ? "text-muted-foreground/40" : "text-success")} /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choose(p.id)}
                disabled={active || busy !== null || downgradeBlocked}
                title={downgradeBlocked ? `Tem ${orgs.length} empresas — este plano permite ${p.maxOrgs}.` : undefined}
                className={cn(
                  "mt-auto inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2.5 pt-2.5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                  active ? "border border-border bg-surface" : "bg-primary text-primary-foreground hover:opacity-90",
                )}
                style={{ marginTop: "1.25rem" }}
              >
                {active ? "Plano actual" : busy === p.id ? "A activar…" : p.id === "multi" || plans.findIndex((x) => x.id === p.id) > plans.findIndex((x) => x.id === current) ? "Fazer upgrade" : "Mudar para este plano"}
              </button>
            </article>
          );
        })}
      </section>
      <p className="shrink-0 text-[11px] text-muted-foreground">
        Sem cobrança automática nesta fase: a alteração fica registada e a equipa Quota confirma a facturação consigo.
      </p>
    </div>
  );
}
