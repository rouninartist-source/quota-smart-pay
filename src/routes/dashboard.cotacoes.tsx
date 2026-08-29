import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSpreadsheet, Plus, Send } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { StatCard, StatGrid } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { quotations, type Quotation } from "@/lib/mock-data";
import { formatMZN, formatDate } from "@/lib/format";

export const Route = createFileRoute("/dashboard/cotacoes")({
  head: () => ({
    meta: [
      { title: "Cotações · Quota Studio" },
      { name: "description", content: "Propostas comerciais, validade, probabilidade de fecho e conversão em factura." },
      { property: "og:title", content: "Cotações · Quota Studio" },
      { property: "og:description", content: "Propostas comerciais, validade, probabilidade de fecho e conversão em factura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CotacoesPage,
});

const columns: Column<Quotation>[] = [
  { key: "number", header: "Cotação", sortValue: (r) => r.number, cell: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{r.number}</p>
        <p className="truncate text-xs text-muted-foreground">{r.client}</p>
      </div>
    ) },
  { key: "issued", header: "Emitida", hideBelow: "lg", sortValue: (r) => r.issued, cell: (r) => <span className="text-muted-foreground">{formatDate(r.issued)}</span> },
  { key: "valid", header: "Válida até", hideBelow: "md", sortValue: (r) => r.valid, cell: (r) => <span className="text-muted-foreground">{formatDate(r.valid)}</span> },
  { key: "probability", header: "Probabilidade", align: "right", hideBelow: "xl", sortValue: (r) => r.probability, cell: (r) => <span>{r.probability}%</span> },
  { key: "total", header: "Total", align: "right", sortValue: (r) => r.total, cell: (r) => <span className="font-medium">{formatMZN(r.total)}</span> },
  { key: "status", header: "Estado", cell: (r) => <StatusBadge status={r.status} /> },
];

function CotacoesPage() {
  const pipeline = quotations.filter((q) => q.status === "enviada").reduce((a, q) => a + q.total, 0);
  const won = quotations.filter((q) => q.status === "aceite").reduce((a, q) => a + q.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cotações"
        description="Acompanhe propostas em aberto e converta-as em facturas num clique."
        Icon={FileSpreadsheet}
        crumbs={[{ label: "Vendas" }, { label: "Cotações" }]}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9" asChild><Link to="/dashboard/facturas">Ver facturas</Link></Button>
            <Button size="sm" className="h-9"><Plus className="h-4 w-4" /> Nova cotação</Button>
          </>
        }
      />
      <StatGrid>
        <StatCard label="Pipeline aberto" value={formatMZN(pipeline, { compact: true })} unit="MZN" delta={12} />
        <StatCard label="Aceites este mês" value={formatMZN(won, { compact: true })} unit="MZN" delta={6} />
        <StatCard label="Taxa de conversão" value="38%" delta={-2} hint="últimos 30 dias" />
        <StatCard label="A expirar" value="3" hint="nos próximos 7 dias" />
      </StatGrid>
      <DataTable
        data={quotations}
        columns={columns}
        searchKeys={(r) => `${r.number} ${r.client}`}
        searchPlaceholder="Procurar por número ou cliente…"
        filters={[
          { key: "status", label: "Estado", options: [
            { value: "rascunho", label: "Rascunho" }, { value: "enviada", label: "Enviada" },
            { value: "aceite", label: "Aceite" }, { value: "expirada", label: "Expirada" },
          ], match: (r, v) => r.status === v },
        ]}
        bulkActions={[
          { label: "Enviar", icon: Send, onClick: () => {} },
          { label: "Converter em factura", onClick: () => {} },
          { label: "Eliminar", onClick: () => {}, destructive: true },
        ]}
        empty={{ title: "Sem cotações", description: "Crie a primeira proposta comercial para o seu cliente." }}
        mobileCard={(r) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{r.number}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.client}</p>
              <div className="mt-1.5"><StatusBadge status={r.status} /></div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums">{formatMZN(r.total, { decimals: false })}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(r.valid)}</p>
            </div>
          </div>
        )}
      />
    </div>
  );
}
