const pillars = [
  ["Documentos", "Cotações, facturas e recibos"],
  ["Conformidade", "IVA, NUIT e numeração sequencial"],
  ["Dados de pagamento", "Banco, M-Pesa e e-Mola impressos no documento"],
  ["Acesso", "Web e telemóvel, sem instalações"],
];

export function Trust() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border/70 bg-surface px-8 py-14">
        <h2 className="max-w-lg text-balance font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Construída para o mercado moçambicano.
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(([k, v]) => (
            <div key={k}>
              <p className="font-display text-[15px] font-semibold text-primary">{k}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
