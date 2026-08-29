const steps = [
  {
    n: "01",
    title: "Crie a sua conta",
    desc: "Registe a empresa, o NUIT e o endereço. Em minutos está pronto a facturar.",
  },
  {
    n: "02",
    title: "Adicione clientes e produtos",
    desc: "Guarde os seus clientes e serviços uma vez e reutilize em cada documento.",
  },
  {
    n: "03",
    title: "Facture, envie e emita o recibo",
    desc: "Envie a factura pelo WhatsApp, registe o pagamento recebido e emita o recibo.",
  },
];

export function HowItWorks() {
  return (
    <section id="recursos" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Como funciona
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
            Comece a facturar em 3 passos simples
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-border/70 bg-card p-7">
              <span className="font-display text-sm font-bold text-primary">{s.n}</span>
              <h3 className="mt-4 font-display text-[15px] font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
