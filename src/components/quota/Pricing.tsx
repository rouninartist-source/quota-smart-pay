import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, MessageCircle } from "lucide-react";
import { billingCycles, cyclePrice, plans, TRIAL_DAYS } from "@/lib/plans";
import { PlanComparison } from "@/components/quota/PlanComparison";

const fmt = (n: number) => new Intl.NumberFormat("pt-PT").format(Math.round(n));
const CONTACT = "https://wa.me/258840000000?text=" + encodeURIComponent("Olá, gostaria de um plano Empresarial do Quota (sob consulta).");

/** Página pública de preços: ciclos, cartões e tabela de comparação (dados em src/lib/plans.ts). */
export function Pricing() {
  const [months, setMonths] = useState<1 | 3 | 12>(3);

  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Preços</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Simples como deve ser</h2>
          <p className="mt-4 text-muted-foreground">
            Preços em MZN. Pague por M-Pesa ou e-Mola, mensal, trimestral ou anual — o anual tem 10% de desconto. O Basic tem {TRIAL_DAYS} dias grátis.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div role="tablist" aria-label="Ciclo de pagamento" className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
            {billingCycles.map((c) => (
              <button
                key={c.months}
                role="tab"
                aria-selected={months === c.months}
                onClick={() => setMonths(c.months)}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                  months === c.months ? "bg-gradient-primary text-primary-foreground shadow-elegant" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {c.label}
                {c.discount > 0 && (
                  <span className={["rounded-full px-1.5 py-0.5 text-[10px] font-semibold", months === c.months ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"].join(" ")}>
                    −{Math.round(c.discount * 100)}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => {
            const total = cyclePrice(p, months);
            const perMonth = total / months;
            return (
              <div
                key={p.id}
                className={[
                  "relative flex flex-col rounded-3xl border p-7 transition",
                  p.popular ? "border-primary/30 bg-card shadow-glow" : "border-border bg-card shadow-card hover:-translate-y-1",
                ].join(" ")}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                    Mais popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight tabular-nums">{fmt(perMonth)}</span>
                    <span className="text-sm text-muted-foreground">MT / mês</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {months === 1 ? "Cobrado mensalmente" : <>{perMonth < p.monthly && <span className="mr-1.5 line-through opacity-70">{fmt(p.monthly * months)} MT</span>}{fmt(total)} MT a cada {months} meses</>}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground/80">
                    {p.maxOrgs} empresa{p.maxOrgs === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground/80">{p.maxUsers} utilizadores</span>
                </div>

                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {p.highlights.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5 text-muted-foreground">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-muted"><Check className="h-3 w-3" /></span>
                    Suporte: {p.support}
                  </li>
                </ul>

                <Link
                  to="/registo"
                  search={{ plano: p.id }}
                  className={[
                    "mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-medium transition",
                    p.popular ? "bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95" : "border border-border bg-surface text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {p.id === "basic" ? `Começar ${TRIAL_DAYS} dias grátis` : `Escolher ${p.name}`}
                </Link>
              </div>
            );
          })}

          <div className="relative flex flex-col rounded-3xl border border-dashed border-border bg-surface p-7">
            <h3 className="text-lg font-semibold">Empresarial</h3>
            <p className="mt-1 text-sm text-muted-foreground">Para grupos e volumes maiores</p>
            <p className="mt-6 text-3xl font-semibold tracking-tight">Sob consulta</p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {["Empresas e utilizadores à medida", "Layout de documento personalizado", "Integrações e API", "Gestor de conta dedicado"].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Check className="h-3 w-3" /></span>
                  <span className="text-foreground/80">{f}</span>
                </li>
              ))}
            </ul>
            <a href={CONTACT} target="_blank" rel="noreferrer" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted">
              <MessageCircle className="h-4 w-4" /> Falar connosco
            </a>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-5xl">
          <h3 className="text-center text-3xl font-semibold tracking-tight">Compare os planos</h3>
          <p className="mt-2 text-center text-muted-foreground">Veja num só olhar o que cada plano inclui.</p>
          <PlanComparison className="mt-8" />
        </div>
      </div>
    </section>
  );
}
