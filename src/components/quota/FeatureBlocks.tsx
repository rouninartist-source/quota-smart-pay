import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, FileText, Wallet } from "lucide-react";

const docs = [
  "Facturas",
  "Facturas-recibo",
  "Recibos",
  "Cotações",
  "Notas de crédito",
];

export function FeatureBlocks() {
  return (
    <section id="recursos" className="px-6 py-24">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border/70 bg-card p-8">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">
            Facturação sem complicações
          </h3>
          <ul className="mt-5 space-y-2 text-[13px] text-muted-foreground">
            {docs.map((d) => (
              <li key={d} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                {d}
              </li>
            ))}
          </ul>
          <Link
            to="/dashboard/facturas/nova"
            className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary transition hover:gap-2.5"
          >
            Criar documento <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-8">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">
            Dados de pagamento no documento
          </h3>
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
            Conta bancária com o logo do banco, número M-Pesa ou e-Mola com o nome
            de confirmação — tudo impresso na factura.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Banco", "M-Pesa", "e-Mola"].map((t) => (
              <span
                key={t}
                className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[12px] font-medium text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-8">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">
            Gestão que faz sentido
          </h3>
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
            Veja o que está pago, pendente e em atraso sem navegar
            por dezenas de menus.
          </p>
          <div className="mt-6 space-y-2.5">
            {[
              ["Receita do mês", "3.41M MZN"],
              ["Pendentes", "612 400 MZN"],
              ["Em atraso", "82 100 MZN"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-[12px]"
              >
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
