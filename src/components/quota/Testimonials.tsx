const items = [
  {
    quote:
      "Antes demorava muito tempo a preparar as facturas. Com a Quota consigo emitir e enviar ao cliente em poucos segundos.",
    name: "Helena Macuácua",
    company: "Macuácua Serviços",
    city: "Maputo",
    initials: "MS",
  },
  {
    quote:
      "Os meus clientes recebem a factura no WhatsApp com o número M-Pesa já impresso. Pagam no mesmo dia e eu emito o recibo em segundos.",
    name: "António Chirindza",
    company: "Beira Logística",
    city: "Beira",
    initials: "BL",
  },
  {
    quote:
      "Consigo ver o que recebi e o que está em atraso sem abrir folhas de cálculo. É simples e faz o que promete.",
    name: "Fátima Assane",
    company: "Farmácia Nampula",
    city: "Nampula",
    initials: "FN",
  },
];

export function Testimonials() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
          Quem já factura com a Quota.
        </h2>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {items.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-border/70 bg-card p-7"
            >
              <blockquote className="flex-1 text-[14px] leading-relaxed text-foreground/85">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 font-display text-[11px] font-semibold text-primary">
                  {t.initials}
                </div>
                <div>
                  <p className="text-[13px] font-medium">{t.name}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {t.company} · {t.city}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
