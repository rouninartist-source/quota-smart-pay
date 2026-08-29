import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen, Search, Plus, ArrowRight, FileText } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatMZN } from "@/lib/format";
import { invoiceTotal, statusMeta, statusToneClass, useInvoices } from "@/lib/invoices-store";
import { quotations, receipts } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/documentos/")({
  head: () => ({
    meta: [
      { title: "Documentos emitidos · Quota Studio" },
      {
        name: "description",
        content:
          "Veja todos os documentos criados na plataforma e filtre por tipo: facturas, recibos, cotações ou todos.",
      },
      { property: "og:title", content: "Documentos emitidos · Quota Studio" },
      {
        property: "og:description",
        content: "Lista única de facturas, recibos e cotações com filtro por tipo de documento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentosList,
});

type Kind = "factura" | "recibo" | "cotacao";
type Filter = "todos" | Kind;

const kindLabels: Record<Kind, string> = {
  factura: "Factura",
  recibo: "Recibo",
  cotacao: "Cotação",
};

const filterLabels: Record<Filter, string> = {
  todos: "Todos os documentos",
  factura: "Facturas",
  recibo: "Recibos",
  cotacao: "Cotações",
};

type Row = {
  id: string;
  number: string;
  kind: Kind;
  client: string;
  date: string;
  total: number;
  statusLabel: string;
  statusClass: string;
  to?: string;
};

const neutralStatus = "bg-muted text-muted-foreground";

function DocumentosList() {
  const invoices = useInvoices();
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");

  const rows = useMemo<Row[]>(() => {
    const fromInvoices: Row[] = invoices.map((inv) => {
      const meta = statusMeta[inv.status];
      return {
        id: inv.id,
        number: inv.number,
        kind: "factura",
        client: inv.client.name,
        date: inv.issued,
        total: invoiceTotal(inv),
        statusLabel: meta.label,
        statusClass: statusToneClass[meta.tone],
        to: inv.id,
      };
    });

    const fromQuotes: Row[] = quotations.map((q) => ({
      id: q.id,
      number: q.number,
      kind: "cotacao",
      client: q.client,
      date: q.issued,
      total: q.total,
      statusLabel: q.status.charAt(0).toUpperCase() + q.status.slice(1),
      statusClass: neutralStatus,
    }));

    const fromReceipts: Row[] = receipts.map((r) => ({
      id: r.id,
      number: r.number,
      kind: "recibo",
      client: r.client,
      date: r.date,
      total: r.amount,
      statusLabel: r.method,
      statusClass: neutralStatus,
    }));

    return [...fromInvoices, ...fromQuotes, ...fromReceipts].sort((a, b) => b.date.localeCompare(a.date));
  }, [invoices]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const okKind = filter === "todos" || r.kind === filter;
      const okQuery = !q || r.number.toLowerCase().includes(q) || r.client.toLowerCase().includes(q);
      return okKind && okQuery;
    });
  }, [rows, filter, query]);

  const counts = useMemo(
    () => ({
      todos: rows.length,
      factura: rows.filter((r) => r.kind === "factura").length,
      recibo: rows.filter((r) => r.kind === "recibo").length,
      cotacao: rows.filter((r) => r.kind === "cotacao").length,
    }),
    [rows],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Todos os documentos criados na plataforma. Use o filtro para ver apenas um tipo."
        Icon={FolderOpen}
        crumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Documentos" }]}
        actions={
          <Link
            to="/dashboard/facturacao"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Novo documento
          </Link>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <SelectTrigger className="w-[220px]" aria-label="Filtrar por tipo de documento">
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(filterLabels) as Filter[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {filterLabels[k]} ({counts[k]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[11px] text-muted-foreground">{visible.length} documento(s)</span>
          </div>
          <div className="relative md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar número ou cliente"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="grid place-items-center gap-2 px-5 py-16 text-center">
            <FileText className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum documento encontrado</p>
            <p className="text-xs text-muted-foreground">Ajuste o filtro ou emita um novo documento.</p>
          </div>
        ) : (
          <div className="max-h-[calc(100dvh-24rem)] min-h-[240px] overflow-y-auto overscroll-contain">
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">

                    <th className="px-5 py-3 font-medium">Número</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Data</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={`${r.kind}-${r.id}`} className="border-t border-border/50 transition hover:bg-muted/40">
                      <td className="px-5 py-3.5 font-medium tabular-nums">{r.number}</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-md border border-border/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {kindLabels[r.kind]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{r.client}</td>
                      <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{formatDate(r.date)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                        {formatMZN(r.total, { decimals: false })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("inline-flex rounded-md px-2.5 py-0.5 text-[10px] font-medium", r.statusClass)}>
                          {r.statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {r.to ? (
                          <Link
                            to="/dashboard/facturas/$id"
                            params={{ id: r.to }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                          >
                            Abrir <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/70">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border/60 md:hidden">
              {visible.map((r) => (
                <li key={`${r.kind}-${r.id}`} className="px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.number}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {kindLabels[r.kind]} · {r.client}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{formatMZN(r.total, { decimals: false })}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(r.date)}</p>
                    </div>
                  </div>
                  {r.to && (
                    <Link
                      to="/dashboard/facturas/$id"
                      params={{ id: r.to }}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary"
                    >
                      Abrir <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
