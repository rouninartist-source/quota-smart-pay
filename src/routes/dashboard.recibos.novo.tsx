import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, Loader2, Receipt, Search, X } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { formatDate, formatMZN } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useClients, type Client } from "@/lib/clients-store";
import {
  invoiceBalance,
  invoiceTotal,
  isQuoteKind,
  paymentMethodLabels,
  useInvoices,
  type Invoice,
  type PaymentMethod,
} from "@/lib/invoices-store";
import { issueClientReceipt } from "@/lib/receipts-store";
import { Field, inputClass } from "@/components/catalog/Modal";

export const Route = createFileRoute("/dashboard/recibos/novo")({
  validateSearch: (search: Record<string, unknown>): { cliente?: string; factura?: string } => ({
    ...(typeof search.cliente === "string" ? { cliente: search.cliente } : {}),
    ...(typeof search.factura === "string" ? { factura: search.factura } : {}),
  }),
  head: () => ({ meta: [{ title: "Novo recibo · Quota Studio" }] }),
  component: NovoRecibo,
});

type Mode = "total" | "metade" | "outro";

const METHODS: PaymentMethod[] = ["mpesa", "emola", "transferencia", "numerario", "cheque"];
const round2 = (n: number) => Math.round(n * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);

/** Facturas do cliente que ainda têm saldo: as mais antigas primeiro (são as que se pagam primeiro). */
function openInvoicesOf(client: Client, invoices: Invoice[]) {
  return invoices
    .filter((i) => (i.clientId ? i.clientId === client.id : i.client.name === client.name))
    .filter((i) => !isQuoteKind(i.kind) && i.status !== "rascunho" && i.status !== "cancelada")
    .filter((i) => invoiceBalance(i) > 0.01)
    .sort((a, b) => a.due.localeCompare(b.due) || a.issued.localeCompare(b.issued));
}

/** Quanto recebe cada factura: o saldo todo, metade de cada, ou um valor que vai liquidando das mais antigas para as mais recentes. */
function allocate(selected: Invoice[], mode: Mode, custom: number) {
  if (mode === "total") return selected.map((i) => round2(invoiceBalance(i)));
  if (mode === "metade") return selected.map((i) => round2(invoiceBalance(i) / 2));
  let left = round2(custom);
  return selected.map((i) => {
    const take = round2(Math.min(left, invoiceBalance(i)));
    left = round2(left - take);
    return take;
  });
}

function NovoRecibo() {
  const { cliente, factura } = Route.useSearch();
  const navigate = useNavigate();
  const clients = useClients();
  const invoices = useInvoices();

  const [clientId, setClientId] = useState(cliente ?? "");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [mode, setMode] = useState<Mode>("total");
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // Vindo de uma factura (?factura=), o cliente é o dela.
  useEffect(() => {
    if (clientId || !factura) return;
    const inv = invoices.find((i) => i.id === factura);
    const c = inv && clients.find((x) => (inv.clientId ? x.id === inv.clientId : x.name === inv.client.name));
    if (c) setClientId(c.id);
  }, [factura, invoices, clients, clientId]);

  const client = clients.find((c) => c.id === clientId);
  const open = useMemo(() => (client ? openInvoicesOf(client, invoices) : []), [client, invoices]);

  // Ao escolher o cliente: todas as facturas em aberto marcadas (ou só a que trouxe para aqui).
  useEffect(() => {
    setPicked(new Set(factura && open.some((i) => i.id === factura) ? [factura] : open.map((i) => i.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, open.length]);

  const selected = open.filter((i) => picked.has(i.id));
  const owed = round2(selected.reduce((a, i) => a + invoiceBalance(i), 0));
  const customValue = Number(custom.replace(/\s/g, "").replace(",", ".")) || 0;
  const amounts = allocate(selected, mode, customValue);
  const received = round2(amounts.reduce((a, n) => a + n, 0));
  const amountOf = (id: string) => amounts[selected.findIndex((i) => i.id === id)] ?? 0;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => !q || c.name.toLowerCase().includes(q) || c.nuit.includes(q)).slice(0, 8);
  }, [clients, query]);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return toast.error("Escolha o cliente.");
    if (selected.length === 0) return toast.error("Escolha pelo menos uma factura.");
    if (mode === "outro" && (customValue <= 0 || customValue > owed + 0.01))
      return toast.error(`Indique um valor entre 0 e ${formatMZN(owed)} MZN.`);
    if (received <= 0) return toast.error("O valor a receber tem de ser maior do que zero.");

    setBusy(true);
    const receipt = await issueClientReceipt({
      clientId: client.id,
      client: { name: client.name, nuit: client.nuit, email: client.email, phone: client.phone, address: client.address },
      items: selected.map((i, n) => ({ invoiceId: i.id, amount: amounts[n] })).filter((x) => x.amount > 0),
      method,
      reference: reference.trim() || undefined,
      date,
      notes: notes.trim() || undefined,
    });
    setBusy(false);
    if (!receipt) return;
    toast.success(`Recibo ${receipt.number} emitido`, { description: `${formatMZN(receipt.total)} MZN de ${client.name}` });
    navigate({ to: "/dashboard/recibos/$id", params: { id: receipt.id } });
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/dashboard/documentos" search={{ tipo: "recibo" }} aria-label="Voltar aos recibos" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Receipt className="h-3.5 w-3.5 text-success" />
          <span className="text-[12.5px] font-semibold">{t("Novo recibo")}</span>
          <span className="border-l border-border/60 pl-3 text-[11px] text-muted-foreground">Uma ou várias facturas do mesmo cliente</span>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form id="recibo" onSubmit={submit} className="grid content-start gap-5 rounded-lg border border-border/70 bg-card p-5 shadow-sm">
          {/* 1 · Cliente */}
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">1 · Cliente</p>
            {client ? (
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{client.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[client.nuit && `NUIT ${client.nuit}`, client.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <button type="button" onClick={() => { setClientId(""); setQuery(""); }} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium hover:bg-muted">
                  <X className="h-3 w-3" /> Trocar
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input autoFocus className={cn(inputClass, "pl-9")} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar cliente por nome ou NUIT" />
                </div>
                <ul className="mt-2 divide-y divide-border/60 overflow-hidden rounded-lg border border-border/70">
                  {matches.length === 0 && <li className="px-3 py-3 text-[12px] text-muted-foreground">Nenhum cliente encontrado.</li>}
                  {matches.map((c) => {
                    const n = openInvoicesOf(c, invoices).length;
                    return (
                      <li key={c.id}>
                        <button type="button" onClick={() => setClientId(c.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-medium">{c.name}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">{c.nuit ? `NUIT ${c.nuit}` : "—"}</span>
                          </span>
                          <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10.5px] font-semibold", n ? "bg-warning/15 text-warning-foreground dark:text-warning" : "bg-muted text-muted-foreground")}>
                            {n ? `${n} em aberto` : "sem dívida"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* 2 · Facturas */}
          {client && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">2 · Facturas em aberto</p>
                {open.length > 1 && (
                  <button type="button" onClick={() => setPicked(new Set(picked.size === open.length ? [] : open.map((i) => i.id)))} className="text-[11px] font-semibold text-primary hover:underline">
                    {picked.size === open.length ? "Desmarcar todas" : "Marcar todas"}
                  </button>
                )}
              </div>
              {open.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-border px-3 py-6 text-center text-[12px] text-muted-foreground">
                  {client.name} não tem facturas por pagar.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border/60 overflow-hidden rounded-lg border border-border/70">
                  {open.map((i) => {
                    const on = picked.has(i.id);
                    const overdue = new Date(i.due).getTime() < Date.now();
                    return (
                      <li key={i.id}>
                        <label className={cn("flex cursor-pointer items-center gap-3 px-3 py-2.5", on ? "bg-primary/5" : "hover:bg-muted/50")}>
                          <input type="checkbox" checked={on} onChange={() => toggle(i.id)} className="h-4 w-4 accent-[var(--color-primary)]" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12.5px] font-semibold tabular-nums">{i.number}</span>
                            <span className="block text-[11px] text-muted-foreground">
                              {formatDate(i.issued)} · vence {formatDate(i.due)}
                              {overdue && <span className="ml-1.5 rounded bg-destructive/10 px-1 py-px text-[10px] font-semibold text-destructive">Vencida</span>}
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block text-[12px] font-semibold tabular-nums">{formatMZN(invoiceBalance(i))} MZN</span>
                            <span className="block text-[10.5px] text-muted-foreground tabular-nums">
                              em dívida{invoiceBalance(i) < invoiceTotal(i) - 0.01 ? ` de ${formatMZN(invoiceTotal(i))}` : ""}
                            </span>
                          </span>
                          {on && (
                            <span className="w-24 text-right text-[12px] font-semibold tabular-nums text-success">
                              {formatMZN(amountOf(i.id))}
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* 3 · Valor */}
          {client && selected.length > 0 && (
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">3 · Valor recebido</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([
                  ["total", "Total", `${formatMZN(owed)} MZN`],
                  ["metade", "50%", `${formatMZN(round2(owed / 2))} MZN`],
                  ["outro", "Outro valor", "Pagamento parcial"],
                ] as const).map(([m, label, hint]) => (
                  <button key={m} type="button" onClick={() => setMode(m)} className={cn("rounded-lg border p-3 text-left transition", mode === m ? "border-primary bg-primary/5" : "border-border/70 bg-surface hover:border-border")}>
                    <span className="block text-[12.5px] font-semibold">{label}</span>
                    <span className="block text-[11px] tabular-nums text-muted-foreground">{hint}</span>
                  </button>
                ))}
              </div>
              {mode === "outro" && (
                <div className="mt-3 max-w-xs">
                  <Field label="Valor recebido (MZN)" hint={selected.length > 1 ? "Liquida primeiro as facturas mais antigas." : undefined}>
                    <input autoFocus className={inputClass} inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={formatMZN(owed)} />
                  </Field>
                </div>
              )}
            </div>
          )}

          {/* 4 · Pagamento */}
          {client && selected.length > 0 && (
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">4 · Pagamento</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {METHODS.map((m) => (
                  <button key={m} type="button" onClick={() => setMethod(m)} className={cn("rounded-md border px-3 py-1.5 text-[12px] font-medium transition", method === m ? "border-primary bg-primary/5 text-primary" : "border-border bg-surface hover:bg-muted")}>
                    {paymentMethodLabels[m]}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Referência / ID da transacção"><input className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Opcional" /></Field>
                <Field label="Data do pagamento"><input type="date" className={inputClass} value={date} max={today()} onChange={(e) => setDate(e.target.value)} /></Field>
              </div>
              <div className="mt-3">
                <Field label="Observações"><input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Aparecem no recibo (opcional)" /></Field>
              </div>
            </div>
          )}
        </form>

        <aside className="grid content-start gap-3">
          <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Resumo</p>
            <p className="mt-2 truncate font-display text-[16px] font-semibold">{client?.name ?? "Sem cliente"}</p>
            <dl className="mt-3 grid gap-1.5 text-[12px]">
              <div className="flex justify-between"><dt className="text-muted-foreground">Facturas</dt><dd>{selected.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Em dívida</dt><dd className="tabular-nums">{formatMZN(owed)} MZN</dd></div>
              <div className="flex justify-between border-t border-border/60 pt-1.5 text-[13px] font-semibold">
                <dt>A receber</dt><dd className="tabular-nums text-success">{formatMZN(received)} MZN</dd>
              </div>
              {received > 0 && received < owed - 0.01 && (
                <div className="flex justify-between text-[11.5px] text-muted-foreground"><dt>Fica em dívida</dt><dd className="tabular-nums">{formatMZN(round2(owed - received))} MZN</dd></div>
              )}
            </dl>
            <button type="submit" form="recibo" disabled={busy || !client || selected.length === 0 || received <= 0} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-success px-4 py-2.5 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> A emitir…</> : <><Check className="h-3.5 w-3.5" /> Emitir recibo</>}
            </button>
          </section>
          <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
            O recibo regista o pagamento em cada factura (saldo e estado actualizam-se) e fica pronto para imprimir, descarregar em PDF ou enviar.
          </p>
        </aside>
      </div>
    </div>
  );
}
