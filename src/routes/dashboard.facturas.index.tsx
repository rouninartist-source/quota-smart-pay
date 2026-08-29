import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Plus, ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { KpiCard } from "@/components/dashboard/cards";
import { formatDate, formatMZN } from "@/lib/format";
import {
  invoiceBalance,
  invoiceTotal,
  statusMeta,
  statusToneClass,
  useInvoices,
  type InvoiceStatus,
} from "@/lib/invoices-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/facturas/")({
  head: () => ({
    meta: [
      { title: "Facturas · Quota Studio" },
      {
        name: "description",
        content: "Emita, envie e acompanhe todas as facturas do seu negócio, com IVA automático e PDF pronto a imprimir.",
      },
      { property: "og:title", content: "Facturas · Quota Studio" },
      { property: "og:description", content: "Facturação certificada, IVA automático e PDF em um clique." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacturasList,
});

const filters: Array<{ label: string; value: "todas" | InvoiceStatus }> = [
  { label: "Todas", value: "todas" },
  { label: "Enviadas", value: "enviada" },
  { label: "Pagas", value: "paga" },
  { label: "Vencidas", value: "vencida" },
  { label: "Rascunhos", value: "rascunho" },
];

function FacturasList() {
  const invoices = useInvoices();
  const [filter, setFilter] = useState<"todas" | InvoiceStatus>("todas");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      invoices.filter((i) => {
        const okFilter = filter === "todas" || i.status === filter;
        const q = query.trim().toLowerCase();
        const okQuery = !q || i.number.toLowerCase().includes(q) || i.client.name.toLowerCase().includes(q);
        return okFilter && okQuery;
      }),
    [invoices, filter, query],
  );

  const totals = useMemo(() => {
    const sumBalance = (pred: (s: InvoiceStatus) => boolean) =>
      invoices.filter((i) => pred(i.status)).reduce((s, i) => s + invoiceBalance(i), 0);
    return {
      count: invoices.length,
      faturado: invoices.reduce((s, i) => s + invoiceTotal(i), 0),
      pendente: sumBalance((s) => s === "enviada" || s === "parcial"),
      atraso: sumBalance((s) => s === "vencida"),
      atrasoCount: invoices.filter((i) => i.status === "vencida").length,
    };
  }, [invoices]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Documentos</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-[36px]">Facturas</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Clique numa factura para ver os detalhes e descarregar o PDF.
          </p>
        </div>
        <Link
          to="/dashboard/facturas/nova"
          className="inline-flex items-center gap-1.5 self-start rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Nova factura
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <KpiCard label="Facturas" value={String(totals.count)} meta={<>no período actual</>} metaTone="muted" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <KpiCard
            label="Total facturado"
            value={formatMZN(totals.faturado, { decimals: false })}
            unit="MZN"
            meta={<>IVA incluído</>}
            metaTone="muted"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <KpiCard
            label="Pendentes"
            value={formatMZN(totals.pendente, { decimals: false })}
            unit="MZN"
            meta={<>a aguardar pagamento</>}
            metaTone="warning"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <KpiCard
            label="Em atraso"
            value={formatMZN(totals.atraso, { decimals: false })}
            unit="MZN"
            meta={<>{totals.atrasoCount} factura(s) vencida(s)</>}
            metaTone="destructive"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[11px] font-semibold transition",
                  filter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar factura ou cliente"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="grid place-items-center gap-2 px-5 py-16 text-center">
            <FileText className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhuma factura encontrada</p>
            <p className="text-xs text-muted-foreground">Ajuste os filtros ou crie uma nova factura.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Número</th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Emissão</th>
                    <th className="px-5 py-3 font-medium">Vencimento</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                    <th className="px-5 py-3 text-right font-medium">Saldo</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv) => {
                    const meta = statusMeta[inv.status];
                    return (
                      <tr key={inv.id} className="border-t border-border/50 transition hover:bg-muted/40">
                        <td className="px-5 py-3.5 font-medium tabular-nums">
                          <Link to="/dashboard/facturas/$id" params={{ id: inv.id }} className="hover:text-primary hover:underline">
                            {inv.number}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{inv.client.name}</td>
                        <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{formatDate(inv.issued)}</td>
                        <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{formatDate(inv.due)}</td>
                        <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                          {formatMZN(invoiceTotal(inv), { decimals: false })}
                        </td>
                        <td
                          className={cn(
                            "px-5 py-3.5 text-right tabular-nums",
                            invoiceBalance(inv) > 0 ? "text-destructive" : "text-success",
                          )}
                        >
                          {formatMZN(invoiceBalance(inv), { decimals: false })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn("inline-flex rounded-md px-2.5 py-0.5 text-[10px] font-medium", statusToneClass[meta.tone])}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to="/dashboard/facturas/$id"
                            params={{ id: inv.id }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                          >
                            Abrir <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border/60 md:hidden">
              {rows.map((inv) => {
                const meta = statusMeta[inv.status];
                return (
                  <li key={inv.id}>
                    <Link to="/dashboard/facturas/$id" params={{ id: inv.id }} className="flex items-center gap-3 px-4 py-3.5">
                      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md", statusToneClass[meta.tone])}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium tabular-nums">{inv.number}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {inv.client.name} · vence {formatDate(inv.due)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">{formatMZN(invoiceTotal(inv), { decimals: false })}</p>
                        <span className={cn("mt-0.5 inline-flex rounded-md px-2 py-0.5 text-[9px] font-medium", statusToneClass[meta.tone])}>
                          {meta.label}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
