import { FileText, MessageCircle, Wallet, ShieldCheck, Repeat, BarChart3 } from "lucide-react";

const items = [
  { icon: FileText, title: "Documentos completos", desc: "Cotações, facturas, facturas-recibo, recibos e notas de crédito." },
  { icon: MessageCircle, title: "Envio por WhatsApp", desc: "O documento chega ao cliente na conversa onde ele já está." },
  { icon: Wallet, title: "M-Pesa e e-Mola", desc: "Receba por mobile money e concilie automaticamente." },
  { icon: ShieldCheck, title: "Conforme a lei", desc: "IVA, NUIT e numeração sequencial certificada." },
  { icon: Repeat, title: "Recorrências", desc: "Facturação mensal em piloto automático." },
  { icon: BarChart3, title: "Relatórios claros", desc: "Veja o essencial do negócio sem ruído." },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Produto
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
            Tudo o que precisa. Nada do que não precisa.
          </h2>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.title} className="bg-card p-7 transition-colors hover:bg-muted/40">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-5 font-display text-[15px] font-semibold">{it.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{it.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
