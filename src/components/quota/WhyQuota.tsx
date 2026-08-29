const reasons = [
  { title: "Simples desde o primeiro dia", desc: "Não precisa de conhecimentos técnicos." },
  { title: "Feita para Moçambique 🇲🇿", desc: "MZN, NUIT, IVA e os dados de pagamento locais no próprio documento." },
  { title: "Tudo online", desc: "Aceda aos seus documentos onde estiver." },
  { title: "Selo de verificação", desc: "Cada documento traz um código Quota que o cliente pode confirmar." },
];

export function WhyQuota() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
          Feita para simplificar o seu negócio.
        </h2>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="bg-card p-7 transition-colors hover:bg-muted/40">
              <h3 className="font-display text-[15px] font-semibold">{r.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
