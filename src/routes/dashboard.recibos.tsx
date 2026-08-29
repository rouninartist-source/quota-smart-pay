import { createFileRoute } from "@tanstack/react-router";
import { ReceiptText, Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { StatCard, StatGrid } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { receipts, type Receipt } from "@/lib/mock-data";
import { formatMZN, formatDate } from "@/lib/format";

export const Route = createFileRoute("/dashboard/recibos")({
  head: () => ({
    meta: [
      { title: "Recibos · Quota Studio" },
      { name: "description", content: "Recibos emitidos, método de pagamento e factura associada." },
      { property: "og:title", content: "Recibos · Quota Studio" },
      { property: "og:description", content: "Recibos emitidos, método de pagamento e factura associada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecibosPage,
});

const columns: Column<Receipt>[] = [
  { key: "number", header: "Recibo", sortValue: (r) => r.number, cell: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{r.number}</p>
        <p className="truncate text-xs text-muted-foreground">{r.client}</p>
      </div>
    ) },
  { key: "invoice", header: "Factura", hideBelow: "lg", cell: (r) => <span className="text-muted-foreground">{r.invoice}</span> },
  { key: "method", header: "Método", hideBelow: "md", cell: (r) => <span className="text-muted-foreground">{r.method}</span> },
  { key: "date", header: "Data", hideBelow: "sm", sortValue: (r) => r.date, cell: (r) => <span className="text-muted-foreground">{formatDate(r.date)}</span> },
  { key: "amount", header: "Valor", align: "right", sortValue: (r) => r.amount, cell: (r) => <span className="font-medium">{formatMZN(r.amount)}</span> },
];

function RecibosPage() {
  const total = receipts.reduce((a, r) => a + r.amount, 0);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recibos"
        description="Comprovativos emitidos automaticamente sempre que um pagamento é confirmado."
        Icon={ReceiptText}
        crumbs={[{ label: "Vendas" }, { label: "Recibos" }]}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9"><Download className="h-4 w-4" /> Exportar</Button>
            <Button size="sm" className="h-9"><Plus className="h-4 w-4" /> Novo recibo</Button>
          </>
        }
      />
      <StatGrid>
        <StatCard label="Total recebido" value={formatMZN(total, { compact: true })} unit="MZN" delta={9} />
        <StatCard label="Recibos emitidos" value={String(receipts.length)} hint="este mês" />
        <StatCard label="Via M-Pesa" value="46%" delta={4} />
        <StatCard label="Valor médio" value={formatMZN(Math.round(total / receipts.length), { decimals: false })} unit="MZN" />
      </StatGrid>
      <DataTable
        data={receipts}
        columns={columns}
        searchKeys={(r) => `${r.number} ${r.client} ${r.invoice}`}
        searchPlaceholder="Procurar recibo, cliente ou factura…"
        filters={[
          { key: "method", label: "Método", options: [
            { value: "M-Pesa", label: "M-Pesa" }, { value: "e-Mola", label: "e-Mola" },
            { value: "Transferência", label: "Transferência" }, { value: "Numerário", label: "Numerário" },
            { value: "Cartão", label: "Cartão" },
          ], match: (r, v) => r.method === v },
        ]}
        bulkActions={[
          { label: "Descarregar PDF", icon: Download, onClick: () => {} },
          { label: "Enviar por WhatsApp", onClick: () => {} },
        ]}
        empty={{ title: "Sem recibos", description: "Os recibos aparecem aqui assim que registar um pagamento." }}
        mobileCard={(r) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{r.number}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.client} · {r.method}</p>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMZN(r.amount, { decimals: false })}</p>
          </div>
        )}
      />
    </div>
  );
}
