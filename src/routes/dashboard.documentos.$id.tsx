import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Ban,
  CheckCheck,
  ChevronLeft,
  Copy,
  Download,
  Mail,
  MessageCircle,
  Plus,
  Receipt,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { InvoiceDocument, type DocKind } from "@/components/invoices/InvoiceDocument";
import { formatDate, formatMZN } from "@/lib/format";
import { useCompany } from "@/lib/company-store";
import {
  addPayment,
  cancelInvoice,
  documentKinds,
  duplicateInvoice,
  invoiceBalance,
  invoicePaid,
  invoiceTotal,
  isQuoteKind,
  issueReceipt,
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

export const Route = createFileRoute("/dashboard/documentos/$id")({
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
  const ready = useInvoicesReady();
  const invoice = useInvoice(id);
  const company = useCompany();
  const navigate = useNavigate();
  const [view, setView] = useState<DocKind>("factura");
  const [payOpen, setPayOpen] = useState(false);
  const [payDate, setPayDate] = useState(today());
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("mpesa");
  const [payRef, setPayRef] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!invoice) {
    return (
      <div className="grid place-items-center gap-3 rounded-lg border border-border/70 bg-card px-6 py-20 text-center">
        <p className="font-display text-lg font-semibold">
          {!ready ? "A carregar…" : "Documento não encontrado"}
        </p>
        <Link to="/dashboard/documentos" className="mt-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
          Voltar aos documentos
        </Link>
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
  const docKind: DocKind = view === "recibo" && inv.receiptNumber ? "recibo" : quote ? "cotacao" : "factura";
  const printPath = `/facturas/${inv.id}/imprimir${docKind === "recibo" ? "?tipo=recibo" : docKind === "cotacao" ? "?tipo=cotacao" : ""}`;
  const link = typeof window !== "undefined" ? `${window.location.origin}${printPath}` : printPath;

  const message = () =>
    [
      `Estimado(a) ${inv.client.name},`,
      "",
      docKind === "recibo"
        ? `Segue o recibo ${inv.receiptNumber} referente a ${inv.number}, no valor de ${formatMZN(paid || total)} MZN.`
        : `Segue ${quote ? "a cotação" : "a factura"} ${inv.number} no valor de ${formatMZN(total)} MZN` +
          (quote ? `, válida até ${formatDate(inv.due)}.` : `, com vencimento a ${formatDate(inv.due)}.`),
      !quote && docKind !== "recibo" && balance > 0 ? `Valor em dívida: ${formatMZN(balance)} MZN.` : "",
      "",
      `Documento em PDF: ${link}`,
      quote || docKind === "recibo" ? "" : company.paymentNote,
      "",
      "Com os melhores cumprimentos,",
      company.name,
    ]
      .filter((l) => l !== "")
      .join("\n");

  const markSent = () => inv.status === "rascunho" && void updateInvoiceStatus(inv.id, "enviada");

  function sendWhatsApp() {
    const phone = inv.client.phone.replace(/\D/g, "");
    if (!phone) return toast.error("O cliente não tem telefone na ficha.");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message())}`, "_blank", "noreferrer");
    markSent();
  }
  function sendEmail() {
    if (!inv.client.email) return toast.error("O cliente não tem email na ficha.");
    const subject = `${docKind === "recibo" ? "Recibo " + inv.receiptNumber : kind.label + " " + inv.number} — ${company.name}`;
    window.location.href = `mailto:${inv.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message())}`;
    markSent();
  }
  async function copyLink() {
    await navigator.clipboard?.writeText(link);
    toast.success("Ligação copiada", { description: link });
  }
  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("Indique um valor válido.");
    await addPayment(inv.id, { date: payDate, amount, method: payMethod, reference: payRef.trim() || undefined });
    toast.success("Pagamento registado", { description: `${formatMZN(amount)} MZN · ${paymentMethodLabels[payMethod]}` });
    setPayAmount("");
    setPayRef("");
    setPayOpen(false);
  }
  async function receipt() {
    const ref = await issueReceipt(inv.id, payMethod);
    if (ref) {
      toast.success(`Recibo ${ref} emitido`, { description: "A factura ficou liquidada." });
      setView("recibo");
    }
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
            aria-label="Voltar a Documentos"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-[12.5px] font-semibold">
            {kind.label} <span className="tabular-nums text-muted-foreground">{inv.number}</span>
          </span>
          <span className={cn("rounded-md px-2 py-0.5 text-[10.5px] font-semibold", statusToneClass[meta.tone])}>
            {meta.label}
          </span>
          {inv.receiptNumber && (
            <div role="group" className="flex gap-0.5 rounded-lg border border-border/60 bg-surface p-0.5 text-[11px] font-semibold">
              {(["factura", "recibo"] as DocKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={cn("rounded-md px-2.5 py-1", (view === "recibo") === (k === "recibo") ? "bg-card shadow-sm" : "text-muted-foreground")}
                >
                  {k === "recibo" ? `Recibo ${inv.receiptNumber}` : kind.short}
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Action Icon={Download} onClick={() => window.open(printPath, "_blank", "noreferrer")}>PDF</Action>
            <Action Icon={Copy} onClick={copyLink}>Ligação</Action>
            <Action Icon={Mail} onClick={sendEmail} disabled={!live}>Email</Action>
            <Action Icon={MessageCircle} onClick={sendWhatsApp} disabled={!live} tone="success">WhatsApp</Action>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:min-h-0 md:flex-1 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Documento */}
        <section className="min-h-0 overflow-y-auto overscroll-contain rounded-lg border border-border/70 bg-muted/30 p-3 md:p-5">
          <div className="mx-auto max-w-[820px]">
            <InvoiceDocument invoice={inv} docKind={docKind} />
          </div>
        </section>

        {/* Lateral: dinheiro e acções */}
        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain">
          <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Cliente</p>
            <p className="mt-1 text-[13px] font-semibold">{inv.client.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {[inv.client.nuit && `NUIT ${inv.client.nuit}`, inv.client.phone, inv.client.email].filter(Boolean).join(" · ") || "Sem contactos"}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11.5px]">
              <Meta label="Emissão" value={formatDate(inv.issued)} />
              <Meta label={quote ? "Validade" : "Vencimento"} value={formatDate(inv.due)} />
              <Meta label="Total" value={`${formatMZN(total)} MZN`} strong />
              {!quote && <Meta label="Em dívida" value={`${formatMZN(balance)} MZN`} strong tone={balance > 0.01 ? "warning" : "success"} />}
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
                    {payOpen ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {payOpen ? "Fechar" : "Registar"}
                  </button>
                )}
              </div>

              {payOpen && (
                <form onSubmit={submitPayment} className="mt-3 grid gap-2 rounded-md border border-border/70 bg-surface p-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Data" type="date" value={payDate} onChange={setPayDate} />
                    <Input label="Valor (MZN)" type="number" value={payAmount} onChange={setPayAmount} placeholder={String(balance)} />
                  </div>
                  <label className="grid gap-1">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Método</span>
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)} className="h-8 rounded-md border border-border bg-card px-2 text-[12px] outline-none focus:border-primary/60">
                      {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((m) => (
                        <option key={m} value={m}>{paymentMethodLabels[m]}</option>
                      ))}
                    </select>
                  </label>
                  <Input label="Referência" value={payRef} onChange={setPayRef} placeholder="Opcional" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPayAmount(String(balance))} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold hover:bg-muted">
                      Saldo total
                    </button>
                    <button type="submit" className="ml-auto rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90">
                      Guardar pagamento
                    </button>
                  </div>
                </form>
              )}

              <ul className="mt-2 divide-y divide-border/60">
                {payments.length === 0 && <li className="py-2 text-[11.5px] text-muted-foreground">Sem pagamentos.</li>}
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 py-2 text-[11.5px]">
                    <span className="tabular-nums text-muted-foreground">{formatDate(p.date)}</span>
                    <span className="min-w-0 flex-1 truncate">{paymentMethodLabels[p.method]}{p.reference ? ` · ${p.reference}` : ""}</span>
                    <span className="font-semibold tabular-nums">{formatMZN(p.amount)}</span>
                    {live && !inv.receiptNumber && (
                      <button onClick={() => removePayment(inv.id, p.id)} aria-label="Remover pagamento" className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {live && !inv.receiptNumber && (
                <button onClick={receipt} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[11.5px] font-semibold text-success hover:bg-success/15">
                  <Receipt className="h-3.5 w-3.5" /> {balance > 0.01 ? "Liquidar e emitir recibo" : "Emitir recibo"}
                </button>
              )}
              {inv.receiptNumber && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-success"><CheckCheck className="h-3.5 w-3.5" /> Recibo {inv.receiptNumber} · {formatDate(inv.receiptIssued ?? inv.issued)}</p>
              )}
            </section>
          )}

          <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mais acções</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Action Icon={Copy} onClick={duplicate}>Duplicar</Action>
              {live && !confirmCancel && (
                <Action Icon={Ban} onClick={() => setConfirmCancel(true)} tone="destructive">Anular</Action>
              )}
              {confirmCancel && (
                <>
                  <Action Icon={Ban} onClick={cancel} tone="destructive">Confirmar anulação</Action>
                  <Action Icon={X} onClick={() => setConfirmCancel(false)}>Não</Action>
                </>
              )}
            </div>
            {inv.notes && <p className="mt-3 whitespace-pre-wrap border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground">{inv.notes}</p>}
          </section>
        </aside>
      </div>
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
