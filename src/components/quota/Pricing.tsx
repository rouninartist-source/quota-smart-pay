import { useState } from "react";

type Cycle = "trimestral" | "semestral" | "anual";

const cycles: { id: Cycle; label: string; months: number; discount: number; note?: string }[] = [
  { id: "trimestral", label: "Trimestral", months: 3, discount: 0 },
  { id: "semestral", label: "Semestral", months: 6, discount: 0 },
  { id: "anual", label: "Anual", months: 12, discount: 0.1, note: "-10%" },
];

type Plan = {
  name: string;
  monthly: number;
  tagline: string;
  empresas: string;
  utilizadores: string;
  features: { label: string; value: string; included: boolean }[];
  cta: string;
  highlighted: boolean;
};

const plans: Plan[] = [
  {
    name: "Basic",
    monthly: 600,
    tagline: "Para quem começa a facturar",
    empresas: "1 empresa",
    utilizadores: "2 ou 3 utilizadores",
    features: [
      { label: "Documentos", value: "Ilimitados", included: true },
      { label: "Verificação pública", value: "Incluída", included: true },
      { label: "Templates", value: "Standard", included: true },
      { label: "Cobranças automáticas", value: "Incluídas", included: true },
      { label: "AI QUOTA", value: "Não incluído", included: false },
    ],
    cta: "Começar com Basic",
    highlighted: false,
  },
  {
    name: "Smart",
    monthly: 900,
    tagline: "Para PMEs em crescimento",
    empresas: "1 empresa",
    utilizadores: "3 utilizadores",
    features: [
      { label: "Documentos", value: "Ilimitados", included: true },
      { label: "Verificação pública", value: "Incluída", included: true },
      { label: "Templates", value: "Standard", included: true },
      { label: "Cobranças automáticas", value: "Incluídas", included: true },
      { label: "AI QUOTA", value: "Incluído", included: true },
    ],
    cta: "Escolher Smart",
    highlighted: true,
  },
  {
    name: "Multi-Empresas",
    monthly: 1500,
    tagline: "Para grupos com várias empresas",
    empresas: "3 empresas",
    utilizadores: "5 utilizadores",
    features: [
      { label: "Documentos", value: "Ilimitados", included: true },
      { label: "Verificação pública", value: "Incluída", included: true },
      { label: "Templates", value: "Standard", included: true },
      { label: "Cobranças automáticas", value: "Incluídas", included: true },
      { label: "AI QUOTA", value: "Incluído", included: true },
    ],
    cta: "Escolher Multi-Empresas",
    highlighted: false,
  },
];

const fmt = (n: number) => new Intl.NumberFormat("pt-PT").format(Math.round(n));

export function Pricing() {
  const [cycle, setCycle] = useState<Cycle>("trimestral");
  const active = cycles.find((c) => c.id === cycle)!;

  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Preços</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Simples como deve ser
          </h2>
          <p className="mt-4 text-muted-foreground">
            Preços em MZN por mês. Escolha o ciclo de pagamento — o plano anual tem 10% de desconto.
          </p>
        </div>

        {/* Ciclo de pagamento */}
        <div className="mt-8 flex justify-center">
          <div
            role="tablist"
            aria-label="Ciclo de pagamento"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1"
          >
            {cycles.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={cycle === c.id}
                onClick={() => setCycle(c.id)}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                  cycle === c.id
                    ? "bg-gradient-primary text-primary-foreground shadow-elegant"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {c.label}
                {c.note && (
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      cycle === c.id ? "bg-primary-foreground/20" : "bg-primary/10 text-primary",
                    ].join(" ")}
                  >
                    {c.note}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((p) => {
            const perMonth = p.monthly * (1 - active.discount);
            const total = perMonth * active.months;
            return (
              <div
                key={p.name}
                className={[
                  "relative flex flex-col rounded-3xl border p-7 transition",
                  p.highlighted
                    ? "border-primary/30 bg-card shadow-glow"
                    : "border-border bg-card shadow-card hover:-translate-y-1",
                ].join(" ")}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                    Mais popular
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight tabular-nums">
                      {fmt(perMonth)}
                    </span>
                    <span className="text-sm text-muted-foreground">MT / mês</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {active.discount > 0 && (
                      <span className="mr-1.5 line-through opacity-70">{fmt(p.monthly)} MT</span>
                    )}
                    {fmt(total)} MT cobrados a cada {active.months} meses
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground/80">
                    {p.empresas}
                  </span>
                  <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground/80">
                    {p.utilizadores}
                  </span>
                </div>

                <ul className="mt-5 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2.5">
                      <span
                        className={[
                          "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px]",
                          f.included
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        ].join(" ")}
                      >
                        {f.included ? "✓" : "—"}
                      </span>
                      <span className={f.included ? "text-foreground/80" : "text-muted-foreground"}>
                        {f.label}
                        <span className="text-muted-foreground"> · {f.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={[
                    "mt-8 w-full rounded-xl px-4 py-3 text-sm font-medium transition",
                    p.highlighted
                      ? "bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95"
                      : "border border-border bg-surface text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {p.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
