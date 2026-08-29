import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Plus, FileText, Download, MessageCircle, ArrowRight, Copy, Ban, CheckCheck, X } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatMZN } from "@/lib/format";
import {
  cancelInvoice,
  duplicateInvoice,
  invoiceBalance,
  invoiceTotal,
  settleInvoice,
  statusMeta,
  statusToneClass,
  useInvoices,
  type Invoice,
} from "@/lib/invoices-store";
import { csvNumber, downloadCsv, stamp, toCsv } from "@/lib/csv";
import { quotations, receipts, type Quotation, type Receipt } from "@/lib/mock-data";
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
        content: "Lista única de facturas, recibos e cotações com pré-visualização lado a lado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentosList,
});

type Kind = "factura" | "recibo" | "cotacao";
type Filter = "todos" | Kind;

const filterLabels: Record<Filter, string> = {
  todos: "Todos",
  factura: "Facturas",
  recibo: "Recibos",
  cotacao: "Cotações",
};

/** Prefixo do número já identifica o tipo — a cor evita uma coluna inteira. */
const kindBadge: Record<Kind, string> = {
  factura: "bg-primary/12 text-primary",
  recibo: "bg-success/15 text-success",
  cotacao: "bg-muted text-muted-foreground",
};

const quoteTone: Record<string, string> = {
  aceite: "success",
  enviada: "info",
  rascunho: "muted",
  expirada: "muted",
};

type Row = {
  key: string;
  id: string;
  prefix: string;
  rest: string;
  kind: Kind;
  client: string;
  /** Método de pagamento — não é um estado, por isso vive junto do cliente. */
  method?: string;
  date: string;
  total: number;
  statusLabel: string;
  statusClass: string;
  invoice?: Invoice;
  quote?: Quotation;
  receipt?: Receipt;
};

function splitNumber(n: string) {
  const i = n.indexOf(" ");
  return i === -1 ? { prefix: n, rest: "" } : { prefix: n.slice(0, i), rest: n.slice(i + 1) };
}

function DocumentosList() {
  const invoices = useInvoices();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [confirmCancel, setConfirmCancel] = useState(false);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const rows = useMemo<Row[]>(() => {
    const fromInvoices: Row[] = invoices.map((inv) => {
      const meta = statusMeta[inv.status];
      return {
        key: `factura-${inv.id}`,
        id: inv.id,
        ...splitNumber(inv.number),
        kind: "factura" as const,
        client: inv.client.name,
        date: inv.issued,
        total: invoiceTotal(inv),
        statusLabel: meta.label,
        statusClass: statusToneClass[meta.tone],
        invoice: inv,
      };
    });

    const fromQuotes: Row[] = quotations.map((q) => ({
      key: `cotacao-${q.id}`,
      id: q.id,
      ...splitNumber(q.number),
      kind: "cotacao" as const,
      client: q.client,
      date: q.issued,
      total: q.total,
      statusLabel: q.status.charAt(0).toUpperCase() + q.status.slice(1),
      statusClass: statusToneClass[quoteTone[q.status] ?? "muted"],
      quote: q,
    }));

    // Um recibo é, por definição, dinheiro recebido — o estado é sempre Pago.
    const fromReceipts: Row[] = receipts.map((r) => ({
      key: `recibo-${r.id}`,
      id: r.id,
      ...splitNumber(r.number),
      kind: "recibo" as const,
      client: r.client,
      method: r.method,
      date: r.date,
      total: r.amount,
      statusLabel: "Pago",
      statusClass: statusToneClass.success,
      receipt: r,
    }));

    return [...fromInvoices, ...fromQuotes, ...fromReceipts].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [invoices]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const okKind = filter === "todos" || r.kind === filter;
      const number = `${r.prefix} ${r.rest}`.toLowerCase();
      const okQuery = !q || number.includes(q) || r.client.toLowerCase().includes(q);
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

  const current = visible.find((r) => r.key === selected) ?? visible[0];
  const sum = useMemo(() => visible.reduce((a, r) => a + r.total, 0), [visible]);

  const picked = useMemo(() => visible.filter((r) => checked.has(r.key)), [visible, checked]);

  /**
   * Só as facturas vivem no store — cotações e recibos vêm de mock-data e são
   * imutáveis. Por isso cada acção mostra a quantos documentos se aplica, em vez
   * de falhar em silêncio sobre a selecção toda.
   */
  const actionable = useMemo(() => {
    const invs = picked.map((r) => r.invoice).filter((i): i is Invoice => !!i);
    return {
      invoices: invs,
      unpaid: invs.filter((i) => i.status !== "cancelada" && invoiceBalance(i) > 0.01),
      live: invs.filter((i) => i.status !== "cancelada"),
    };
  }, [picked]);

  // A selecção nunca pode apontar para uma linha filtrada.
  useEffect(() => {
    if (selected && !visible.some((r) => r.key === selected)) setSelected(null);
  }, [visible, selected]);

  // Idem para as caixas: filtrar não pode deixar marcações invisíveis para trás.
  useEffect(() => {
    setChecked((prev) => {
      if (prev.size === 0) return prev;
      const keys = new Set(visible.map((r) => r.key));
      const next = new Set([...prev].filter((k) => keys.has(k)));
      return next.size === prev.size ? prev : next;
    });
  }, [visible]);

  useEffect(() => setConfirmCancel(false), [checked]);

  const allChecked = visible.length > 0 && picked.length === visible.length;

  const toggleAll = () =>
    setChecked(allChecked ? new Set() : new Set(visible.map((r) => r.key)));

  const toggleOne = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const clear = () => setChecked(new Set());

  const exportCsv = (rowsToExport: Row[], label: string) => {
    if (rowsToExport.length === 0) return;
    const csv = toCsv(
      ["Número", "Tipo", "Cliente", "NUIT", "Data", "Total (MZN)", "Estado", "Método"],
      rowsToExport.map((r) => [
        `${r.prefix} ${r.rest}`,
        r.kind === "factura" ? "Factura" : r.kind === "recibo" ? "Recibo" : "Cotação",
        r.client,
        r.invoice?.client.nuit ?? "",
        formatDate(r.date),
        csvNumber(r.total),
        r.statusLabel,
        r.method ?? "",
      ]),
    );
    downloadCsv(`quota-documentos-${stamp()}.csv`, csv);
    toast.success(`${rowsToExport.length} ${label} exportados`, {
      description: `quota-documentos-${stamp()}.csv`,
    });
  };

  const markPaid = () => {
    const n = actionable.unpaid.length;
    if (!n) return;
    actionable.unpaid.forEach((i) => settleInvoice(i.id));
    clear();
    toast.success(n === 1 ? "Factura marcada como paga" : `${n} facturas marcadas como pagas`, {
      description: "Pagamento registado pelo saldo em aberto.",
    });
  };

  const chase = () => {
    const inv = actionable.unpaid[0];
    if (!inv) return;
    const text = encodeURIComponent(
      `Olá ${inv.client.name}, lembramos o documento ${inv.number} no valor de ` +
        `${formatMZN(invoiceBalance(inv), { decimals: false })} MZN, com vencimento a ${formatDate(inv.due)}.`,
    );
    const phone = inv.client.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener");
  };

  const duplicate = () => {
    const n = actionable.invoices.length;
    if (!n) return;
    actionable.invoices.forEach((i) => duplicateInvoice(i.id));
    clear();
    toast.success(n === 1 ? "Documento duplicado" : `${n} documentos duplicados`, {
      description: "Criados como rascunho com a data de hoje.",
    });
  };

  const cancelSelected = () => {
    const n = actionable.live.length;
    if (!n) return;
    actionable.live.forEach((i) => cancelInvoice(i.id));
    clear();
    setConfirmCancel(false);
    toast.success(n === 1 ? "Documento anulado" : `${n} documentos anulados`, {
      description: "Continuam no histórico, marcados como anulados.",
    });
  };

  const move = (delta: number) => {
    if (visible.length === 0) return;
    const i = visible.findIndex((r) => r.key === current?.key);
    const next = visible[Math.min(visible.length - 1, Math.max(0, i + delta))];
    if (!next) return;
    setSelected(next.key);
    bodyRef.current
      ?.querySelector<HTMLElement>(`[data-key="${CSS.escape(next.key)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  };

  const openRow = (r: Row) => {
    if (r.invoice) navigate({ to: "/dashboard/facturas/$id", params: { id: r.id } });
  };

  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      {/* ─── Barra de contexto ─── */}
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filtrar por tipo"
            className="flex min-w-0 gap-0.5 overflow-x-auto rounded-lg border border-border/60 bg-surface p-0.5"
          >
            {(Object.keys(filterLabels) as Filter[]).map((k) => {
              const active = filter === k;
              return (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border border-border bg-card text-foreground shadow-sm"
                      : "border border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {filterLabels[k]}
                  <span
                    className={cn(
                      "rounded px-1.5 py-px text-[9.5px] font-bold tabular-nums",
                      active ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {counts[k]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative min-w-0 flex-1 sm:max-w-[280px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar número ou cliente"
              aria-label="Procurar documentos"
              className="h-8 w-full truncate rounded-lg border border-border bg-surface pl-8 pr-3 text-[12px] outline-none transition focus:border-primary/60"
            />
          </div>

          <Link
            to="/dashboard/documentos/novo"
            search={{ tipo: undefined }}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Novo documento
          </Link>
        </div>
      </section>

      <div className="grid gap-3 md:min-h-0 md:flex-1 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Lista */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
          {picked.length > 0 && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-3 py-2">
              <span className="text-[11.5px] font-semibold">
                {picked.length} seleccionado{picked.length === 1 ? "" : "s"}
                {actionable.invoices.length !== picked.length && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    · {actionable.invoices.length} factura{actionable.invoices.length === 1 ? "" : "s"}
                  </span>
                )}
              </span>

              <span className="flex flex-wrap items-center gap-1.5">
                <BulkButton onClick={() => exportCsv(picked, "documentos")} icon={Download}>
                  Exportar CSV
                </BulkButton>
                <BulkButton
                  onClick={markPaid}
                  icon={CheckCheck}
                  count={actionable.unpaid.length}
                  hint="Nenhuma factura por liquidar na selecção"
                >
                  Marcar paga
                </BulkButton>
                <BulkButton
                  onClick={chase}
                  icon={MessageCircle}
                  disabled={actionable.unpaid.length !== 1}
                  hint={
                    actionable.unpaid.length === 0
                      ? "Nenhuma factura por liquidar na selecção"
                      : "O WhatsApp abre um documento de cada vez — seleccione só uma factura"
                  }
                >
                  Cobrar
                </BulkButton>
                <BulkButton onClick={duplicate} icon={Copy} count={actionable.invoices.length}>
                  Duplicar
                </BulkButton>

                {confirmCancel ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-destructive">
                      Anular {actionable.live.length}?
                    </span>
                    <button
                      onClick={cancelSelected}
                      className="rounded-md bg-destructive px-2.5 py-1.5 text-[11px] font-semibold text-destructive-foreground"
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold"
                    >
                      Não
                    </button>
                  </span>
                ) : (
                  <BulkButton
                    onClick={() => setConfirmCancel(true)}
                    icon={Ban}
                    count={actionable.live.length}
                    destructive
                  >
                    Anular
                  </BulkButton>
                )}
              </span>

              <button
                onClick={clear}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-3 w-3" /> Limpar
              </button>
            </div>
          )}
          {visible.length === 0 ? (
            <div className="grid flex-1 place-items-center gap-2 px-5 py-16 text-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">Nenhum documento encontrado</p>
              <p className="text-xs text-muted-foreground">Ajuste o filtro ou emita um novo documento.</p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                    <th className="sticky top-0 z-10 w-8 bg-card pb-2 pl-2.5 pr-0 pt-3 text-left font-semibold">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        aria-label="Seleccionar todos os documentos visíveis"
                        className="h-3.5 w-3.5 cursor-pointer accent-primary align-middle"
                      />
                    </th>
                    <th className="sticky top-0 z-10 bg-card px-2.5 pb-2 pt-3 text-left font-semibold">
                      Número
                    </th>
                    <th className="sticky top-0 z-10 hidden w-full bg-card px-2.5 pb-2 pt-3 text-left font-semibold sm:table-cell">
                      Cliente
                    </th>
                    <th className="sticky top-0 z-10 hidden bg-card px-2.5 pb-2 pt-3 text-left font-semibold xl:table-cell">
                      Data
                    </th>
                    <th className="sticky top-0 z-10 bg-card px-2.5 pb-2 pt-3 text-right font-semibold">
                      Total
                    </th>
                    <th className="sticky top-0 z-10 bg-card px-2.5 pb-2 pt-3 text-left font-semibold">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody ref={bodyRef}>
                  {visible.map((r) => {
                    const isSel = current?.key === r.key;
                    return (
                      <tr
                        key={r.key}
                        data-key={r.key}
                        tabIndex={0}
                        aria-selected={isSel}
                        onClick={() => setSelected(r.key)}
                        onDoubleClick={() => openRow(r)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            move(1);
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            move(-1);
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            setSelected(r.key);
                            openRow(r);
                          }
                        }}
                        className={cn(
                          "cursor-pointer border-b border-border/50 outline-none transition",
                          isSel
                            ? "bg-primary/8 shadow-[inset_2px_0_0_var(--color-primary)]"
                            : "hover:bg-muted/50",
                          "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        )}
                      >
                        <td className="h-[34px] w-8 pl-2.5 pr-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked.has(r.key)}
                            onChange={() => toggleOne(r.key)}
                            aria-label={`Seleccionar ${r.prefix} ${r.rest}`}
                            className="h-3.5 w-3.5 cursor-pointer accent-primary align-middle"
                          />
                        </td>
                        <td className="h-[34px] w-full max-w-0 px-2.5 py-1.5 text-[12px] font-semibold tabular-nums sm:w-auto sm:max-w-none sm:whitespace-nowrap">
                          <span className="flex items-center">
                            <span
                              className={cn(
                                "mr-1.5 shrink-0 rounded px-1 py-0.5 text-[10px] font-bold tracking-[0.04em]",
                                kindBadge[r.kind],
                              )}
                            >
                              {r.prefix}
                            </span>
                            <span className="truncate">{r.rest}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground sm:hidden">
                            {r.client}
                            {r.method && ` · ${r.method}`}
                          </span>
                        </td>
                        <td className="hidden h-[34px] w-full max-w-0 truncate px-2.5 text-[12px] sm:table-cell">
                          {r.client}
                          {r.method && (
                            <span className="ml-1.5 text-[11px] text-muted-foreground">· {r.method}</span>
                          )}
                        </td>
                        <td className="hidden h-[34px] whitespace-nowrap px-2.5 text-[12px] tabular-nums text-muted-foreground xl:table-cell">
                          {formatDate(r.date)}
                        </td>
                        <td className="h-[34px] whitespace-nowrap px-2.5 text-right text-[12px] font-bold tabular-nums">
                          {formatMZN(r.total, { decimals: false })}
                        </td>
                        <td className="h-[34px] px-2.5">
                          <span
                            className={cn(
                              "inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold",
                              r.statusClass,
                            )}
                          >
                            {r.statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex shrink-0 items-center gap-3 border-t border-border/70 bg-surface px-4 py-2 text-[11px] text-muted-foreground">
              <span>
                {visible.length} documento{visible.length === 1 ? "" : "s"}
              </span>
              <span>
                Soma <b className="font-bold tabular-nums text-foreground">{formatMZN(sum, { decimals: false })}</b>
              </span>
              <button
                hidden={picked.length > 0}
                onClick={() => exportCsv(visible, "documentos")}
                disabled={visible.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground transition hover:bg-muted disabled:opacity-40"
              >
                <Download className="h-3 w-3" /> Exportar CSV
              </button>
              <span className="ml-auto hidden xl:inline">↑ ↓ para percorrer · Enter para abrir</span>
            </div>
        </section>

        {/* Documento seleccionado */}
        {current && <DocumentPanel row={current} onOpen={() => openRow(current)} />}
      </div>
    </div>
  );
}

function BulkButton({
  children,
  onClick,
  icon: Icon,
  count,
  disabled,
  destructive,
  hint,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  disabled?: boolean;
  destructive?: boolean;
  hint?: string;
}) {
  const off = disabled ?? count === 0;
  return (
    <button
      onClick={onClick}
      disabled={off}
      title={off ? hint : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-40",
        destructive
          ? "border-destructive/30 bg-card text-destructive enabled:hover:bg-destructive/8"
          : "border-border bg-card enabled:hover:bg-muted",
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
      {count !== undefined && count > 0 && (
        <span className="tabular-nums opacity-60">({count})</span>
      )}
    </button>
  );
}

function DocumentPanel({ row, onOpen }: { row: Row; onOpen: () => void }) {
  const kindLabel =
    row.kind === "factura" ? "Factura" : row.kind === "recibo" ? "Recibo" : "Cotação";

  // Um recibo já é dinheiro recebido e um rascunho ainda não saiu — nada a cobrar.
  const canChase =
    !!row.invoice && ["enviada", "vencida", "parcial"].includes(row.invoice.status);

  return (
    <section className="hidden min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-elegant xl:flex">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/70 bg-surface px-4 py-3">
        <div className="min-w-0">
          <p className="font-display text-[13px] font-semibold">Quota Studio, Lda.</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">NUIT 400987654 · Maputo</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-[11.5px] font-bold uppercase tracking-[0.07em] text-primary">
            {kindLabel}
          </p>
          <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
            {row.prefix} {row.rest}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-2.5">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Cliente
            </p>
            <p className="mt-1 truncate text-[12px] font-semibold">{row.client}</p>
            {row.invoice && (
              <p className="mt-0.5 whitespace-nowrap text-[10.5px] tabular-nums text-muted-foreground">
                NUIT {row.invoice.client.nuit}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Data
            </p>
            <p className="mt-1 text-[12px] font-semibold tabular-nums">{formatDate(row.date)}</p>
          </div>
        </div>

        {/* Só as facturas têm linhas guardadas; os outros tipos mostram o que existe. */}
        {row.invoice ? (
          <table className="mt-2.5 w-full border-collapse">
            <thead>
              <tr className="border-b border-border/70 text-[9px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                <th className="pb-1.5 text-left font-semibold">Descrição</th>
                <th className="pb-1.5 text-right font-semibold">Qtd</th>
                <th className="pb-1.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {row.invoice.lines.map((l, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="max-w-0 truncate py-2 pr-2 text-[11.5px]">{l.description}</td>
                  <td className="py-2 text-right text-[11.5px] tabular-nums">{l.qty}</td>
                  <td className="py-2 text-right text-[11.5px] tabular-nums">
                    {formatMZN(l.qty * l.price, { decimals: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <dl className="mt-2.5 flex flex-col gap-2">
            {row.quote && (
              <>
                <Meta label="Válida até" value={formatDate(row.quote.valid)} />
                <Meta label="Probabilidade" value={`${row.quote.probability}%`} />
                <Meta label="Estado" value={row.statusLabel} />
              </>
            )}
            {row.receipt && (
              <>
                <Meta label="Método" value={row.receipt.method} />
                <Meta label="Liquida" value={row.receipt.invoice} />
                <Meta label="Estado" value="Pago" />
              </>
            )}
          </dl>
        )}

        <div className="ml-auto mt-3 flex w-[min(200px,70%)] flex-col gap-1.5">
          <div className="flex items-baseline justify-between border-t border-border pt-2.5">
            <span className="text-[11.5px] font-semibold">Total</span>
            <span className="font-display text-[15px] font-semibold tabular-nums text-primary">
              {formatMZN(row.total, { decimals: false })} MZN
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-2 border-t border-border/70 bg-surface px-3 py-2.5">
        <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2 py-2 text-[11.5px] font-semibold transition hover:bg-muted">
          <Download className="h-3.5 w-3.5" /> PDF
        </button>
        {canChase && (
          <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2 py-2 text-[11.5px] font-semibold text-success transition hover:bg-success/15">
            <MessageCircle className="h-3.5 w-3.5" /> Cobrar
          </button>
        )}
        {row.invoice && (
          <button
            onClick={onOpen}
            className="inline-flex flex-[1.2] items-center justify-center gap-1.5 rounded-md bg-primary px-2 py-2 text-[11.5px] font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Abrir <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2">
      <dt className="text-[10.5px] text-muted-foreground">{label}</dt>
      <dd className="text-[11.5px] font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
