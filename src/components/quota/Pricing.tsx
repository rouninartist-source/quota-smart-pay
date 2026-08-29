const plans = [
  {
    name: "Starter",
    price: "0",
    tagline: "Para começar a facturar hoje",
    features: ["1 empresa", "1 utilizador", "Até 30 facturas/mês", "PDF + verificação pública", "Envio por WhatsApp"],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Business",
    price: "1 490",
    tagline: "Para PMEs em crescimento",
    features: [
      "3 empresas",
      "5 utilizadores",
      "Facturação ilimitada",
      "Assistente AI + voz",
      "Cobranças automáticas",
      "Imagens em cotações",
      "Dados M-Pesa & e-Mola no documento",
    ],
    cta: "Iniciar teste de 14 dias",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    tagline: "Para operações maiores",
    features: [
      "Empresas ilimitadas",
      "Utilizadores ilimitados",
      "API & integrações",
      "SAF-T avançado",
      "Templates premium",
      "Suporte dedicado",
    ],
    cta: "Falar com vendas",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Preços</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Simples como deve ser
          </h2>
          <p className="mt-4 text-muted-foreground">
            Comece grátis. Cresça sem surpresas. Preços em MZN, IVA incluído.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((p) => (
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
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                {p.price !== "Sob consulta" && <span className="text-sm text-muted-foreground">MZN / mês</span>}
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary/10 text-[10px] text-primary">✓</span>
                    <span className="text-foreground/80">{f}</span>
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
          ))}
        </div>
      </div>
    </section>
  );
}
