import { DashboardPreview } from "./DashboardPreview";

const points = [
  {
    title: "Facture em segundos.",
    desc: "Crie documentos profissionais sem complicações.",
  },
  {
    title: "Registe os pagamentos.",
    desc: "Marque o que já recebeu e emita o recibo a partir da factura.",
  },
  {
    title: "Tenha tudo organizado.",
    desc: "Clientes, serviços, documentos e recibos num só lugar.",
  },
];

export function ProductSection() {
  return (
    <section id="produto" className="bg-gradient-soft px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Produto
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
            Cotação, factura, recibo. Nada a mais.
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {points.map((p) => (
            <div key={p.title}>
              <h3 className="font-display text-[15px] font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {p.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 overflow-hidden rounded-2xl border border-border/70 shadow-elegant">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
