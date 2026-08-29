const companies = [
  "Macuácua Serviços",
  "Beira Logística",
  "Farmácia Nampula",
  "Grupo Zambeze",
  "Nhamba Construções",
  "Tete Distribuição",
  "Xai-Xai Auto",
  "Costa do Sol Café",
];

export function LogoStrip() {
  return (
    <section className="border-y border-border/60 bg-surface/50 py-10">
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Empresas que já confiam na Quota
      </p>

      <div className="marquee mt-7">
        <div className="marquee-track">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center gap-3 pr-3">
              {companies.map((c) => (
                <span
                  key={`${dup}-${c}`}
                  className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2.5 text-[13px] font-medium text-muted-foreground"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/10 text-[9px] font-bold text-primary">
                    {c
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  {c}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
