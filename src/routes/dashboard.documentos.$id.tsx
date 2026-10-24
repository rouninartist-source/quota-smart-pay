import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Ban,
  CheckCheck,
  ChevronLeft,
  Copy,
  Download,
  Printer,
  Send,
  Plus,
  Receipt,
  Trash2,
  X,
} from "lucide-react";
import { ShareDialog, shareLink } from "@/components/documents/ShareDialog";
import { downloadDocumentPdf } from "@/lib/pdf";
import { toast } from "sonner";
import { InvoiceDocument, type DocKind } from "@/components/invoices/InvoiceDocument";
import { formatDate, formatMZN } from "@/lib/format";
import {
  addPayment,
  cancelInvoice,
  documentKinds,
  duplicateInvoice,
  invoiceBalance,
  invoicePaid,
  invoiceTotal,
  isQuoteKind,
  issuePaymentReceipt,
  receivePaymentWithReceipt,
  paymentMethodLabels,
  removePayment,
  statusMeta,
  statusToneClass,
  updateInvoiceStatus,
  useInvoice,
  useInvoicesReady,
  type PaymentMethod,
} from "@/lib/invoices-store";
import { cn } from "@/lib/utils";
import { getInvoice as useInvoiceSnapshot } from "@/lib/invoices-store";

export const Route = createFileRoute("/dashboard/documentos/$id")({
  validateSearch: (search: Record<string, unknown>): { partilhar?: boolean } =>
    search.partilhar ? { partilhar: true } : {},
  head: () => ({
    meta: [
      { title: "Documento · Quota Studio" },
      { name: "description", content: "Documento emitido: pré-visualização, pagamentos, recibo e envio ao cliente." },
      { property: "og:title", content: "Documento · Quota Studio" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentoPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function DocumentoPage() {
  const { id } = Route.useParams();
  const { partilhar } = Route.useSearch();
  const ready = useInvoicesReady();
  const [share, setShare] = useState(false);
  // Vem da bancada com "Emitir e enviar": abre logo a escolha do canal.
  useEffect(() => {
    if (partilhar) setShare(true);
  }, [partilhar]);
  const invoice = useInvoice(id);
  const navigate = useNavigate();
  /** Pagamento cujo recibo está a ser visto; null = a factura/cotação. */
  const [viewPayment, setViewPayment] = useState<string | null>(null);
  const [withReceipt, setWithReceipt] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [payDate, setPayDate] = useState(today());
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("mpesa");
  const [payRef, setPayRef] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  if (!invoice) {
    return (
      <div className="grid place-items-center gap-3 rounded-lg border border-border/70 bg-card px-6 py-20 text-center">
        <p className="font-display text-lg font-semibold">
          {!ready ? "A carregar…" : "Documento não encontrado"}
        </p>
        <Link to="/dashboard/documentos" className="mt-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">{t("Voltar aos documentos")}</Link>
      </div>
    );
  }

  // `inv` é a factura já garantida — as funções abaixo fecham sobre ela sem o `undefined`.
  const inv = invoice;
  const kind = documentKinds[inv.kind];
  const quote = isQuoteKind(inv.kind);
  const meta = statusMeta[inv.status];
  const total = invoiceTotal(invoice);
  const paid = invoicePaid(invoice);
  const balance = invoiceBalance(invoice);
  const payments = inv.payments ?? [];
  const live = inv.status !== "cancelada";
  const viewed = viewPayment ? payments.find((p) => p.id === viewPayment && p.receiptNumber) : undefined;
  const docKind: DocKind = viewed ? "recibo" : quote ? "cotacao" : "factura";
  const printPath = `/facturas/${inv.id}/imprimir${viewed ? `?tipo=recibo&pagamento=${viewed.id}` : docKind === "cotacao" ? "?tipo=cotacao" : ""}`;
  const receiptPath = (pid: string) => `/facturas/${inv.id}/imprimir?tipo=recibo&pagamento=${pid}`;
  const link = shareLink(inv, docKind === "recibo" ? "recibo" : "documento", viewed?.id);

  async function savePdf() {
    setPdfBusy(true);
    try {
      await downloadDocumentPdf(inv, docKind, viewed?.id);
    } catch {
      toast.error("Não foi possível gerar o PDF");
    } finally {
      setPdfBusy(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard?.writeText(link);
    toast.success("Ligação copiada", { description: link });
  }
  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("Indique um valor válido.");
    if (amount > balance + 0.01) return toast.error(`O valor excede o saldo em aberto (${formatMZN(balance)} MZN).`);
    const input = { date: payDate, amount, method: payMethod, reference: payRef.trim() || undefined };
    if (withReceipt) {
      const ref = await receivePaymentWithReceipt(inv.id, input);
      if (ref) {
        toast.success(`Recibo ${ref} emitido`, { description: `${formatMZN(amount)} MZN · ${amount >= balance - 0.01 ? "liquidação total" : "pagamento parcial"}` });
        const p = getInvoiceForView()?.payments?.find((x) => x.receiptNumber === ref);
        if (p) setViewPayment(p.id);
      }
    } else {
      await addPayment(inv.id, input);
      toast.success("Pagamento registado", { description: `${formatMZN(amount)} MZN · ${paymentMethodLabels[payMethod]}` });
    }
    setPayAmount("");
    setPayRef("");
    setPayOpen(false);
  }
  function getInvoiceForView() {
    return useInvoiceSnapshot(inv.id);
  }
  async function receiptFor(pid: string) {
    const ref = await issuePaymentReceipt(inv.id, pid);
    if (ref) {
      toast.success(`Recibo ${ref} emitido`);
      setViewPayment(pid);
    }
  }
  async function issue() {
    await updateInvoiceStatus(inv.id, "emitida");
    toast.success(`${t(kind.label)} ${inv.number} emitida`, { description: "Agora pode enviá-la ao cliente." });
    setShare(true);
  }
  async function duplicate() {
    const copy = await duplicateInvoice(inv.id);
    if (copy) {
      toast.success("Duplicado como rascunho", { description: copy.number });
      navigate({ to: "/dashboard/documentos/$id", params: { id: copy.id } });
    }
  }
  async function cancel() {
    await cancelInvoice(inv.id);
    setConfirmCancel(false);
    toast.success(`${inv.number} anulada`);
  }

  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      {/* ─── Barra de contexto ─── */}
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dashboard/documentos"
            aria-label={t("Voltar a Documentos")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-[12.5px] font-semibold">
            {t(kind.label)} <span className="tabular-nums text-muted-foreground">{inv.number}</span>
          </span>
          <span className={cn("rounded-md px-2 py-0.5 text-[10.5px] font-semibold", statusToneClass[meta.tone])}>
            {t(meta.label)}
          </span>
          {payments.some((p) => p.receiptNumber) && (
            <div role="group" className="flex flex-wrap gap-0.5 rounded-lg border border-border/60 bg-surface p-0.5 text-[11px] font-semibold">
              <button onClick={() => setViewPayment(null)} className={cn("rounded-md px-2.5 py-1", !viewed ? "bg-card shadow-sm" : "text-muted-foreground")}>
                {t(kind.short)}
              </button>
              {payments.filter((p) => p.receiptNumber).map((p) => (
                <button key={p.id} onClick={() => setViewPayment(p.id)} className={cn("rounded-md px-2.5 py-1", viewed?.id === p.id ? "bg-card shadow-sm" : "text-muted-foreground")}>
                  {p.receiptNumber}
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {inv.status === "rascunho" && (
              <Action Icon={Send} onClick={issue} tone="success">{t("Emitir")}</Action>
            )}
            <Action Icon={Printer} onClick={() => window.open(printPath, "_blank", "noreferrer")}>{t("Imprimir")}</Action>
            <Action Icon={Download} onClick={savePdf} disabled={pdfBusy}>{pdfBusy ? t("A gerar…") : t("PDF")}</Action>
            <Action Icon={Copy} onClick={copyLink}>{t("Ligação")}</Action>
            {inv.status !== "rascunho" && (
              <Action Icon={Send} onClick={() => setShare(true)} disabled={!live} tone="success">{t("Enviar")}</Action>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:min-h-0 md:flex-1 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Documento */}
        <section className="min-h-0 overflow-y-auto overscroll-contain rounded-lg border border-border/70 bg-muted/30 p-3 md:p-5">
          <div className="mx-auto max-w-[820px]">
            <InvoiceDocument invoice={inv} docKind={docKind} paymentId={viewed?.id} />
          </div>
        </section>

        {/* Lateral: dinheiro e acções */}
        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain">
          <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("Cliente")}</p>
            <p className="mt-1 text-[13px] font-semibold">{inv.client.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {[inv.client.nuit && `NUIT ${inv.client.nuit}`, inv.client.phone, inv.client.email].filter(Boolean).join(" · ") || "Sem contactos"}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11.5px]">
              <Meta label={t("Emissão")} value={formatDate(inv.issued)} />
              <Meta label={quote ? "Validade" : "Vencimento"} value={formatDate(inv.due)} />
              <Meta label={t("Total")} value={`${formatMZN(total)} MZN`} strong />
              {!quote && <Meta label={t("Em dívida")} value={`${formatMZN(balance)} MZN`} strong tone={balance > 0.01 ? "warning" : "success"} />}
            </dl>
          </section>

          {!quote && (
            <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Pagamentos · {formatMZN(paid)} MZN
                </p>
                {live && balance > 0.01 && (
                  <button onClick={() => setPayOpen((v) => !v)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
                    {payOpen ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {payOpen ? t("Fechar") : t("Registar")}
                  </button>
                )}
              </div>

              {payOpen && (
                <form onSubmit={submitPayment} className="mt-3 grid gap-2 rounded-md border border-border/70 bg-surface p-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <Input label={t("Data")} type="date" value={payDate} onChange={setPayDate} />
                    <Input label={t("Valor (MZN)")} type="number" value={payAmount} onChange={setPayAmount} placeholder={String(balance)} />
                  </div>
                  <label className="grid gap-1">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t("Método")}</span>
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)} className="h-8 rounded-md border border-border bg-card px-2 text-[12px] outline-none focus:border-primary/60">
                      {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((m) => (
                        <option key={m} value={m}>{paymentMethodLabels[m]}</option>
                      ))}
                    </select>
                  </label>
                  <Input label={t("Referência")} value={payRef} onChange={setPayRef} placeholder={t("Opcional")} />
                  <label className="inline-flex items-center gap-2 text-[11.5px]">
                    <input type="checkbox" checked={withReceipt} onChange={(e) => setWithReceipt(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--primary)]" />{t("Emitir recibo deste pagamento")} {Number(payAmount) > 0 && Number(payAmount) < balance - 0.01 ? "(parcial)" : "(total)"}
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPayAmount(String(balance))} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold hover:bg-muted">{t("Saldo total")}</button>
                    <button type="submit" className="ml-auto rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90">{t("Guardar pagamento")}</button>
                  </div>
                </form>
              )}

              <ul className="mt-2 divide-y divide-border/60">
                {payments.length === 0 && <li className="py-2 text-[11.5px] text-muted-foreground">{t("Sem pagamentos.")}</li>}
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 py-2 text-[11.5px]">
                    <span className="tabular-nums text-muted-foreground">{formatDate(p.date)}</span>
                    <span className="min-w-0 flex-1 truncate">{paymentMethodLabels[p.method]}{p.reference ? ` · ${p.reference}` : ""}</span>
                    <span className="font-semibold tabular-nums">{formatMZN(p.amount)}</span>
                    {p.receiptNumber ? (
                      <button onClick={() => (p.receiptId ? navigate({ to: "/dashboard/recibos/$id", params: { id: p.receiptId } }) : window.open(receiptPath(p.id), "_blank", "noreferrer"))} title={p.receiptId ? "Abrir recibo" : "Imprimir recibo"} className="inline-flex items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-success hover:bg-success/15">
                        <CheckCheck className="h-3 w-3" /> {p.receiptNumber}
                      </button>
                    ) : live ? (
                      <button onClick={() => receiptFor(p.id)} title={t("Emitir recibo deste pagamento")} className="inline-flex items-center gap-1 rounded border border-success/30 px-1.5 py-0.5 text-[10.5px] font-semibold text-success hover:bg-success/10">
                        <Receipt className="h-3 w-3" />{t("Recibo")}</button>
                    ) : null}
                    {live && !p.receiptNumber && (
                      <button onClick={() => removePayment(inv.id, p.id)} aria-label="Remover pagamento" className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {live && balance > 0.01 && !payOpen && (
                <button onClick={() => { setPayAmount(String(balance)); setWithReceipt(true); setPayOpen(true); }} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[11.5px] font-semibold text-success hover:bg-success/15">
                  <Receipt className="h-3.5 w-3.5" />{t("Receber e emitir recibo (total ou parcial)")}</button>
              )}
              {live && balance > 0.01 && !payOpen && (
                <Link to="/dashboard/recibos/novo" search={{ factura: inv.id }} className="mt-1.5 block text-center text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline">
                  {t("Recibo com várias facturas deste cliente")}
                </Link>
              )}
            </section>
          )}

          <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("Mais acções")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Action Icon={Copy} onClick={duplicate}>{t("Duplicar")}</Action>
              {live && !confirmCancel && (
                <Action Icon={Ban} onClick={() => setConfirmCancel(true)} tone="destructive">{t("Anular")}</Action>
              )}
              {confirmCancel && (
                <>
                  <Action Icon={Ban} onClick={cancel} tone="destructive">{t("Confirmar anulação")}</Action>
                  <Action Icon={X} onClick={() => setConfirmCancel(false)}>{t("Não")}</Action>
                </>
              )}
            </div>
            {inv.notes && <p className="mt-3 whitespace-pre-wrap border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground">{inv.notes}</p>}
          </section>
        </aside>
      </div>
      {share && <ShareDialog invoice={inv} kind={docKind === "recibo" ? "recibo" : "documento"} paymentId={viewed?.id} onClose={() => setShare(false)} />}
    </div>
  );
}

function Action({
  Icon,
  onClick,
  children,
  disabled,
  tone,
}: {
  Icon: typeof Download;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  tone?: "success" | "destructive";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
        tone === "success" && "border-success/30 bg-success/10 text-success enabled:hover:bg-success/15",
        tone === "destructive" && "border-destructive/30 bg-card text-destructive enabled:hover:bg-destructive/8",
        !tone && "border-border bg-card enabled:hover:bg-muted",
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </button>
  );
}

function Meta({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "warning" | "success" }) {
  return (
    <div>
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", strong && "font-semibold", tone === "warning" && "text-warning-foreground dark:text-warning", tone === "success" && "text-success")}>{value}</dd>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-8 rounded-md border border-border bg-card px-2 text-[12px] outline-none focus:border-primary/60" />
    </label>
  );
}
