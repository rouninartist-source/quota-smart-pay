import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { StatCard, StatGrid } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { services, type Service } from "@/lib/mock-data";
import { formatMZN } from "@/lib/format";

export const Route = createFileRoute("/dashboard/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços · Quota Studio" },
      { name: "description", content: "Catálogo de serviços, tarifas, modelos de facturação e margens." },
      { property: "og:title", content: "Serviços · Quota Studio" },
      { property: "og:description", content: "Catálogo de serviços, tarifas, modelos de facturação e margens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ServicosPage,
});

const columns: Column<Service>[] = [
  { key: "name", header: "Serviço", sortValue: (r) => r.name, cell: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{r.name}</p>
        <p className="truncate text-xs text-muted-foreground">{r.code} · {r.category}</p>
      </div>
    ) },
  { key: "billing", header: "Facturação", hideBelow: "lg", cell: (r) => <span className="text-muted-foreground">{r.billing}</span> },
  { key: "duration", header: "Duração", hideBelow: "xl", cell: (r) => <span className="text-muted-foreground">{r.duration}</span> },
  { key: "margin", header: "Margem", align: "right", hideBelow: "md", sortValue: (r) => r.margin, cell: (r) => <span>{r.margin}%</span> },
  { key: "rate", header: "Tarifa", align: "right", sortValue: (r) => r.rate, cell: (r) => <span className="font-medium">{formatMZN(r.rate, { decimals: false })} MZN</span> },
  { key: "status", header: "Estado", cell: (r) => <StatusBadge status={r.status} /> },
];

function ServicosPage() {
  const active = services.filter((s) => s.status === "activo").length;
  const avg = Math.round(services.reduce((a, s) => a + s.rate, 0) / services.length);
  const margin = Math.round(services.reduce((a, s) => a + s.margin, 0) / services.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços"
        description="Catálogo de serviços prestados, tarifas e modelos de facturação."
        Icon={Wrench}
        crumbs={[{ label: "Catálogo" }, { label: "Serviços" }]}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9"><Download className="h-4 w-4" /> Exportar</Button>
            <Button size="sm" className="h-9"><Plus className="h-4 w-4" /> Novo serviço</Button>
          </>
        }
      />
      <StatGrid>
        <StatCard label="Serviços activos" value={String(active)} delta={8} hint="vs. mês anterior" />
        <StatCard label="Tarifa média" value={formatMZN(avg, { decimals: false })} unit="MZN" />
        <StatCard label="Margem média" value={`${margin}%`} delta={3} />
        <StatCard label="Receita recorrente" value={formatMZN(38000, { decimals: false })} unit="MZN/mês" />
      </StatGrid>
      <DataTable
        data={services}
        columns={columns}
        searchKeys={(r) => `${r.name} ${r.code} ${r.category}`}
        searchPlaceholder="Procurar serviço, código ou categoria…"
        filters={[
          { key: "billing", label: "Facturação", options: [
            { value: "Hora", label: "Hora" }, { value: "Projecto", label: "Projecto" }, { value: "Mensal", label: "Mensal" },
          ], match: (r, v) => r.billing === v },
          { key: "status", label: "Estado", options: [
            { value: "activo", label: "Activo" }, { value: "pausado", label: "Pausado" },
          ], match: (r, v) => r.status === v },
        ]}
        bulkActions={[
          { label: "Exportar", onClick: () => {} },
          { label: "Arquivar", onClick: () => {}, destructive: true },
        ]}
        empty={{ title: "Sem serviços", description: "Adicione o primeiro serviço ao catálogo para o poder facturar." }}
        mobileCard={(r) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{r.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.code} · {r.billing}</p>
              <div className="mt-1.5"><StatusBadge status={r.status} /></div>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMZN(r.rate, { decimals: false })}</p>
          </div>
        )}
      />
    </div>
  );
}
