import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  FileCheck2,
  Receipt,
  ImagePlus,
  FileSpreadsheet,
  ArrowRight,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/dashboard/facturacao")({
  head: () => ({
    meta: [
      { title: "Facturas · Emitir documento · Quota Studio" },
      {
        name: "description",
        content: "Escolha o documento a emitir: cotação, cotação visual, factura pró-forma, factura ou VD/Factura-recibo.",
      },
      { property: "og:title", content: "Facturas · Emitir documento · Quota Studio" },
      {
        property: "og:description",
        content: "Um lugar simples para criar cotações, facturas e recibos da sua empresa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacturacaoHub,
});

type Option = {
  tipo: string;
  code: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  to?: string;
};

const propostas: Option[] = [
  { tipo: "cot", code: "COT", label: "Cotação normal", desc: "Proposta de preço simples para enviar ao cliente.", icon: FileSpreadsheet },
  { tipo: "cotv", code: "COTV", label: "Cotação visual", desc: "Proposta com imagem de cada produto — ideal para WhatsApp.", icon: ImagePlus },
  { tipo: "pf", code: "PF", label: "Factura pró-forma", desc: "Aspecto de factura, sem valor fiscal. Serve para aprovação.", icon: FileText },
];

const cobranca: Option[] = [
  { tipo: "ft", code: "FT", label: "Factura", desc: "Documento fiscal com IVA e prazo de pagamento.", icon: FileCheck2, to: "/dashboard/facturas/nova" },
  { tipo: "fr", code: "FR", label: "VD/Factura-recibo", desc: "Factura já paga no acto — emite e liquida de uma vez.", icon: Receipt },
];

function OptionCard({ o }: { o: Option }) {
  const Icon = o.icon;
  const target = o.to ?? "/dashboard/documentos/novo";
  const search = o.to ? undefined : { tipo: o.tipo };
  return (
    <Link
      to={target}
      search={search}
      className="group flex items-start gap-3 rounded-lg border border-border/70 bg-card p-4 transition hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border/70 bg-surface text-muted-foreground transition group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold">{o.label}</span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {o.code}
          </span>
        </span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">{o.desc}</span>
      </span>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

function FacturacaoHub() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturas"
        description="Escolha o que quer emitir. Cada opção abre o editor já preparado para esse tipo."
        Icon={FileCheck2}
        crumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Facturas" }]}
        actions={
          <Link
            to="/dashboard/documentos"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-3.5 py-2 text-xs font-semibold transition hover:bg-muted/50"
          >
            <FolderOpen className="h-3.5 w-3.5" /> Ver documentos emitidos
          </Link>
        }
      />

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Propostas</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {propostas.map((o) => (
            <OptionCard key={o.tipo} o={o} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cobrança</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {cobranca.map((o) => (
            <OptionCard key={o.tipo} o={o} />
          ))}
        </div>
      </section>
    </div>
  );
}
