import { createFileRoute } from "@tanstack/react-router";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/app/DataTable";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { type Service } from "@/lib/mock-data";
import { useServices } from "@/lib/catalog-store";
import { formatMZN } from "@/lib/format";
import { csvNumber, downloadCsv, stamp, toCsv } from "@/lib/csv";

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
  const services = useServices();
  const n = services.length || 1;
  const avg = Math.round(services.reduce((a, s) => a + s.rate, 0) / n);
  const margin = Math.round(services.reduce((a, s) => a + s.margin, 0) / n);

  const exportCsv = () => {
    const csv = toCsv(
      ["Código", "Serviço", "Categoria", "Facturação", "Duração", "Margem (%)", "Tarifa (MZN)", "Estado"],
      services.map((r) => [
        r.code,
        r.name,
        r.category,
        r.billing,
        r.duration,
        String(r.margin),
        csvNumber(r.rate),
        r.status === "activo" ? "Activo" : "Pausado",
      ]),
    );
    downloadCsv(`quota-servicos-${stamp()}.csv`, csv);
    toast.success(`${services.length} serviços exportados`, {
      description: `quota-servicos-${stamp()}.csv`,
    });
  };

  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      {/* ─── Barra de contexto ─── */}
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="pl-1 text-[12px] font-semibold">Serviços</span>
          <span className="flex items-center gap-3 border-l border-border/60 pl-3 text-[11px] text-muted-foreground">
            <span>
              <b className="font-bold tabular-nums text-foreground">{services.length}</b> no catálogo
            </span>
            <span>
              Tarifa média{" "}
              <b className="font-bold tabular-nums text-foreground">
                {formatMZN(avg, { decimals: false })}
              </b>
            </span>
            <span className="hidden lg:inline">
              Margem média <b className="font-bold tabular-nums text-foreground">{margin}%</b>
            </span>
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" /> Exportar
            </Button>
            <Button size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5" /> Novo serviço
            </Button>
          </div>
        </div>
      </section>

      <div className="md:min-h-0 md:flex-1">
        <DataTable
          fill
          data={services}
          columns={columns}
          searchKeys={(r) => `${r.name} ${r.code} ${r.category}`}
          searchPlaceholder="Procurar serviço, código ou categoria…"
          filters={[
            {
              key: "billing",
              label: "Facturação",
              options: [
                { value: "Hora", label: "Hora" },
                { value: "Projecto", label: "Projecto" },
                { value: "Mensal", label: "Mensal" },
              ],
              match: (r, v) => r.billing === v,
            },
            {
              key: "status",
              label: "Estado",
              options: [
                { value: "activo", label: "Activo" },
                { value: "pausado", label: "Pausado" },
              ],
              match: (r, v) => r.status === v,
            },
          ]}
          bulkActions={[{ label: "Exportar", onClick: exportCsv }]}
          empty={{
            title: "Sem serviços",
            description: "Adicione o primeiro serviço ao catálogo para o poder facturar.",
          }}
          mobileCard={(r) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {r.code} · {r.billing}
                </p>
                <div className="mt-1.5">
                  <StatusBadge status={r.status} />
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatMZN(r.rate, { decimals: false })}
              </p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
