import { Check } from "lucide-react";

export function WhatsAppSection() {
  return (
    <section id="whatsapp" className="relative overflow-hidden bg-gradient-soft px-6 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            WhatsApp-first
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
            O seu negócio já está no WhatsApp.
            <span className="block text-primary">A sua facturação também.</span>
          </h2>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Envie facturas, lembretes e cobranças directamente para a conversa do
            cliente.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Factura em PDF", "Recibo", "WhatsApp"].map((t) => (
              <span
                key={t}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[320px]">
          <div className="absolute inset-0 -z-10 rounded-[3rem] bg-gradient-primary opacity-20 blur-3xl" />
          <div className="rounded-[2.5rem] border border-border/70 bg-card p-3 shadow-elegant">
            <div className="rounded-[2rem] bg-surface p-4">
              <div className="flex items-center gap-2.5 border-b border-border/70 pb-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary font-display text-[11px] font-bold text-primary-foreground">
                  Q
                </div>
                <div>
                  <p className="text-[13px] font-medium">Quota</p>
                  <p className="text-[11px] text-muted-foreground">online</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-4">
                <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-muted px-3.5 py-2.5 text-[13px] leading-relaxed">
                  Olá António 👋
                  <br />
                  A factura FT 2026/00184 no valor de 12 200 MZN vence amanhã.
                  <div className="mt-2.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-center text-[12px] font-medium">
                    Ver factura
                  </div>
                </div>

                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-3.5 py-2.5 text-center text-[13px] font-medium text-primary-foreground">
                  Ver factura em PDF
                </div>

                <div className="flex max-w-[90%] items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-[12px] font-medium text-success">
                  <Check className="h-3.5 w-3.5" /> Pagamento confirmado
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
