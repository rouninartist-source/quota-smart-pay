import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, Building2, Clock, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { rootOf, setOrgPlan, trialState, useOrg } from "@/lib/org-store";
import { plans, TRIAL_AI_LIMIT, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/planos")({
  head: () => ({
    meta: [
      { title: "Plano · Quota Studio" },
      { name: "description", content: "Consulte o plano actual, o período experimental e faça upgrade." },
    ],
  }),
  component: PlanosPage,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-PT").format(n);
const CONTACT = "https://wa.me/258840000000?text=" + encodeURIComponent("Olá, gostaria de um plano Empresarial do Quota (sob consulta).");

function PlanosPage() {
  const { org, orgs } = useOrg();
  const root = rootOf(org, orgs);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const current = root?.plan ?? "basic";
  const trial = trialState(root);
  const children = orgs.filter((o) => o.parentOrg === root?.id);
  const isChild = !!org?.parentOrg;
  const rank = (id: PlanId) => plans.findIndex((p) => p.id === id);

  async function choose(id: PlanId) {
    if (busy) return;
    setBusy(id);
    const { error } = await setOrgPlan(id);
    setBusy(null);
    if (error) return toast.error("Não foi possível alterar o plano", { description: error });
    toast.success(`Plano ${plans.find((p) => p.id === id)?.name} activado`, {
      description: "O período experimental terminou. A facturação do plano é confirmada pela equipa Quota.",
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
            {root?.name} · Plano actual: <span className="font-semibold text-foreground">{plans.find((p) => p.id === current)?.name}</span>
            {trial.active && <span className="ml-2 rounded bg-warning/15 px-1.5 py-0.5 font-semibold text-warning-foreground dark:text-warning">Trial · {trial.daysLeft} dia{trial.daysLeft === 1 ? "" : "s"}</span>}
            {trial.expired && <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 font-semibold text-destructive">Trial terminado</span>}
          </span>
          <Link to="/empresas" className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium hover:bg-muted">
            <Building2 className="h-3.5 w-3.5" /> Empresas ({orgs.length})
          </Link>
        </div>
      </section>

      {isChild && (
        <p className="shrink-0 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-[12px]">
          <b>{org?.name}</b> está incluída no plano de <b>{root?.name}</b>. O plano gere-se na empresa principal — as empresas adicionais não têm plano próprio.
        </p>
      )}
      {trial.active && (
        <p className="shrink-0 inline-flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12px]">
          <Clock className="h-3.5 w-3.5" />
          Período experimental de 14 dias no plano Basic: faltam <b>{trial.daysLeft} dia{trial.daysLeft === 1 ? "" : "s"}</b>. Inclui {TRIAL_AI_LIMIT} operações de Quota AI ({root?.aiUses ?? 0} usadas).
          {root?.planRequested && <> Plano escolhido no registo: <b>{plans.find((p) => p.id === root.planRequested)?.name}</b>.</>}
        </p>
      )}
      {trial.expired && (
        <p className="shrink-0 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px]">
          O período experimental terminou. Escolha um plano para continuar a emitir documentos.
        </p>
      )}

      <section className="grid min-h-0 flex-1 gap-3 overflow-y-auto md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const active = p.id === current && !trial.active;
          const downgradeBlocked = children.length > 0 && p.id !== "multi";
          const label = active ? "Plano actual" : busy === p.id ? "A activar…" : trial.active || trial.expired ? "Escolher este plano" : rank(p.id) > rank(current) ? "Fazer upgrade" : "Mudar para este plano";
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
                {trial.active && p.id === "basic" && <span className="rounded-md bg-warning/15 px-2 py-0.5 text-[10.5px] font-semibold text-warning-foreground dark:text-warning">Em trial</span>}
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
                disabled={active || busy !== null || downgradeBlocked || isChild}
                title={downgradeBlocked ? `Tem ${children.length + 1} empresas — este plano permite ${p.maxOrgs}.` : isChild ? "Gerido na empresa principal" : undefined}
                className={cn(
                  "mt-5 inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2.5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                  active ? "border border-border bg-surface" : "bg-primary text-primary-foreground hover:opacity-90",
                )}
              >
                {label}
              </button>
            </article>
          );
        })}

        <article className="flex flex-col rounded-lg border border-dashed border-border/70 bg-surface p-5">
          <h2 className="font-display text-[17px] font-semibold">Empresarial</h2>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">Para grupos e volumes maiores</p>
          <p className="mt-4 font-display text-[22px] font-semibold">Sob consulta</p>
          <ul className="mt-4 space-y-2 text-[12.5px]">
            {["Empresas e utilizadores à medida", "Templates personalizados", "Integrações e API", "Apoio dedicado"].map((f) => (
              <li key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> {f}</li>
            ))}
          </ul>
          <a href={CONTACT} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-[12px] font-semibold hover:bg-muted" style={{ marginTop: "1.25rem" }}>
            <MessageCircle className="h-3.5 w-3.5" /> Falar connosco
          </a>
        </article>
      </section>
      <p className="shrink-0 text-[11px] text-muted-foreground">
        Sem cobrança automática nesta fase: a escolha fica registada e a equipa Quota confirma a facturação consigo.
      </p>
    </div>
  );
}
