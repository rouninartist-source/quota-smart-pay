import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  Printer,
  Send,
  CheckCircle2,
  Mail,
  Plus,
  Trash2,
  Eye,
  MessageCircle,
  Receipt,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InvoiceDocument, type DocKind } from "@/components/invoices/InvoiceDocument";
import { Field, FieldRow } from "@/components/app/FormSection";
import { formatDate, formatMZN } from "@/lib/format";
import { useCompany } from "@/lib/company-store";
import {
  addPayment,
  invoiceBalance,
  invoicePaid,
  invoiceTotal,
  issueReceipt,
  paymentMethodLabels,
  removePayment,
  statusMeta,
  statusToneClass,
  updateInvoiceStatus,
  useInvoice,
  type PaymentMethod,
} from "@/lib/invoices-store";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/dashboard/facturas/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da factura · Quota Studio" },
      { name: "description", content: "Veja os detalhes da factura, registe pagamentos, envie por email e descarregue o PDF." },
      { property: "og:title", content: "Detalhe da factura · Quota Studio" },
      { property: "og:description", content: "Factura com IVA, vencimento, pagamentos e PDF pronto a imprimir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacturaDetail,
});

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function today() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function FacturaDetail() {
  const { id } = Route.useParams();
  const invoice = useInvoice(id);
  const company = useCompany();
  const [openPay, setOpenPay] = useState(false);
  const [payDate, setPayDate] = useState(today());
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("mpesa");
  const [payRef, setPayRef] = useState("");
  const [payError, setPayError] = useState<string>();
  const [emailSent, setEmailSent] = useState(false);
  const [previewKind, setPreviewKind] = useState<DocKind | null>(null);

  if (!invoice) {
    return (
      <div className="grid place-items-center gap-3 rounded-lg border border-border/60 bg-card px-6 py-20 text-center shadow-card">
        <p className="font-display text-lg font-semibold">Factura não encontrada</p>
        <p className="text-sm text-muted-foreground">Pode ter sido removida deste dispositivo.</p>
        <Link to="/dashboard/facturas" className="mt-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
          Voltar às facturas
        </Link>
      </div>
    );
  }

  const meta = statusMeta[invoice.status];
  const printUrl = `/facturas/${invoice.id}/imprimir`;
  const receiptUrl = `${printUrl}?tipo=recibo`;
  const total = invoiceTotal(invoice);
  const paid = invoicePaid(invoice);
  const balance = invoiceBalance(invoice);
  const payments = invoice.payments ?? [];

  function docLink(kind: DocKind) {
    const path = kind === "recibo" ? receiptUrl : printUrl;
    return typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  }

  function shareMessage(kind: DocKind) {
    const isReceipt = kind === "recibo";
    return [
      `Estimado(a) ${invoice!.client.name},`,
      "",
      isReceipt
        ? `Segue o recibo ${invoice!.receiptNumber} referente à factura ${invoice!.number}, no valor de ${formatMZN(paid || total)} MZN.`
        : `Segue a factura ${invoice!.number} no valor de ${formatMZN(total)} MZN, com vencimento a ${formatDate(invoice!.due)}.`,
      !isReceipt && balance > 0 ? `Valor em dívida: ${formatMZN(balance)} MZN.` : "",
      "",
      `Documento em PDF: ${docLink(kind)}`,
      isReceipt ? "" : company.paymentNote,
      "",
      "Com os melhores cumprimentos,",
      company.name,
    ]
      .filter((l) => l !== "")
      .join("\n");
  }

  function sendEmail(kind: DocKind = "factura") {
    const subject =
      kind === "recibo"
        ? `Recibo ${invoice!.receiptNumber} — ${company.name}`
        : `Factura ${invoice!.number} — ${company.name}`;
    const href = `mailto:${encodeURIComponent(invoice!.client.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareMessage(kind))}`;
    if (typeof window !== "undefined") window.location.href = href;
    if (invoice!.status === "rascunho") updateInvoiceStatus(invoice!.id, "enviada");
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 4000);
  }

  function sendWhatsApp(kind: DocKind = "factura") {
    const phone = invoice!.client.phone.replace(/[^\d]/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(shareMessage(kind))}`;
    if (typeof window !== "undefined") window.open(url, "_blank", "noreferrer");
    if (invoice!.status === "rascunho") updateInvoiceStatus(invoice!.id, "enviada");
  }

  function convertToReceipt() {
    const ref = issueReceipt(invoice!.id, "numerario");
    if (ref) {
      toast.success(`Recibo ${ref} emitido`, {
        description: "A factura foi liquidada e o recibo está pronto para PDF, email ou WhatsApp.",
      });
      setPreviewKind("recibo");
    }
  }


  function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) return setPayError("Indique um valor válido.");
    setPayError(undefined);
    addPayment(invoice!.id, { date: payDate, amount, method: payMethod, reference: payRef.trim() || undefined });
    setPayAmount("");
    setPayRef("");
    setOpenPay(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/dashboard/facturas"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Facturas
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight tabular-nums">{invoice.number}</h1>
            <span className={cn("inline-flex rounded-md px-2.5 py-0.5 text-[10px] font-medium", statusToneClass[meta.tone])}>
              {meta.label}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Vence {formatDate(invoice.due)} · {invoice.client.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {invoice.status !== "enviada" && invoice.status !== "paga" && (
            <button
              onClick={() => updateInvoiceStatus(invoice.id, "enviada")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-xs font-semibold hover:bg-muted"
            >
              <Send className="h-3.5 w-3.5" /> Marcar enviada
            </button>
          )}
          {balance > 0 && (
            <button
              onClick={() => {
                setPayAmount(String(Math.round(balance * 100) / 100));
                setOpenPay(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-xs font-semibold hover:bg-muted"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Registar pagamento
            </button>
          )}
          {invoice.receiptNumber ? (
            <button
              onClick={() => setPreviewKind("recibo")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-xs font-semibold hover:bg-muted"
            >
              <Receipt className="h-3.5 w-3.5" /> Ver recibo {invoice.receiptNumber}
            </button>
          ) : (
            <button
              onClick={convertToReceipt}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-xs font-semibold hover:bg-muted"
            >
              <Receipt className="h-3.5 w-3.5" /> Converter em recibo
            </button>
          )}
          <button
            onClick={() => sendEmail("factura")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-xs font-semibold hover:bg-muted"
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
          <button
            onClick={() => sendWhatsApp("factura")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-xs font-semibold hover:bg-muted"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </button>
          <button
            onClick={() => setPreviewKind("factura")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-xs font-semibold hover:bg-muted"
          >
            <Eye className="h-3.5 w-3.5" /> Pré-visualizar A4
          </button>
          <a
            href={printUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-xs font-semibold hover:bg-muted"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </a>

          <a
            href={printUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" /> Descarregar PDF
          </a>
        </div>
      </div>

      {emailSent && (
        <p className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-xs font-medium text-primary">
          Email preparado para {invoice.client.email} com o link do PDF em anexo.
        </p>
      )}

      <section className="grid gap-4 rounded-lg border border-border/60 bg-card p-5 shadow-card md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Total da factura</p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums">{formatMZN(total)} MZN</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Recebido</p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-success">{formatMZN(paid)} MZN</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Saldo em dívida</p>
          <p
            className={cn(
              "mt-1 font-display text-xl font-semibold tabular-nums",
              balance > 0 ? "text-destructive" : "text-success",
            )}
          >
            {formatMZN(balance)} MZN
          </p>
        </div>
        {balance > 0 && (
          <button
            onClick={() => {
              setPayAmount(String(Math.round(balance * 100) / 100));
              setOpenPay(true);
            }}
            className="inline-flex items-center gap-1.5 self-start rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 md:self-center"
          >
            <Plus className="h-3.5 w-3.5" /> Pagamento
          </button>
        )}
      </section>

      {openPay && (
        <form onSubmit={submitPayment} className="space-y-4 rounded-lg border border-border/60 bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-[15px] font-semibold tracking-tight">Registar pagamento recebido</h2>
            <button type="button" onClick={() => setOpenPay(false)} className="text-xs font-semibold text-muted-foreground">
              Cancelar
            </button>
          </div>
          <FieldRow>
            <Field label="Valor recebido (MZN)" htmlFor="p-amount" hint={`Saldo actual: ${formatMZN(balance)} MZN`}>
              <input id="p-amount" type="number" min={0} step="0.01" className={inputClass} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </Field>
            <Field label="Data" htmlFor="p-date">
              <input id="p-date" type="date" className={inputClass} value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Método" htmlFor="p-method">
              <select id="p-method" className={inputClass} value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}>
                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Referência" htmlFor="p-ref" hint="Nº da transacção, opcional">
              <input id="p-ref" className={inputClass} value={payRef} onChange={(e) => setPayRef(e.target.value)} />
            </Field>
          </FieldRow>
          {payError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {payError}
            </p>
          )}
          <button type="submit" className="rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
            Confirmar pagamento
          </button>
        </form>
      )}

      {payments.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-card">
          <p className="border-b border-border/60 px-5 py-4 text-sm font-semibold">Histórico de pagamentos</p>
          <ul className="divide-y divide-border/60">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{paymentMethodLabels[p.method]}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(p.date)}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">{formatMZN(p.amount)} MZN</p>
                <button
                  onClick={() => removePayment(invoice.id, p.id)}
                  aria-label="Remover pagamento"
                  className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <InvoiceDocument invoice={invoice} />

      {previewKind && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pré-visualização A4 do documento"
          className="fixed inset-0 z-50 overflow-y-auto bg-foreground/70 p-4 backdrop-blur-sm md:p-8"
          onClick={() => setPreviewKind(null)}
        >
          <div className="mx-auto max-w-[880px]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-card px-4 py-3 shadow-card">
              <p className="text-sm font-semibold">
                Pré-visualização A4 ·{" "}
                {previewKind === "recibo" ? `Recibo ${invoice.receiptNumber}` : `Factura ${invoice.number}`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => sendEmail(previewKind)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </button>
                <button
                  onClick={() => sendWhatsApp(previewKind)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </button>
                <a
                  href={previewKind === "recibo" ? receiptUrl : printUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" /> Descarregar PDF
                </a>
                <button
                  onClick={() => setPreviewKind(null)}
                  aria-label="Fechar pré-visualização"
                  className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <InvoiceDocument invoice={invoice} docKind={previewKind} />
          </div>
        </div>
      )}

    </div>
  );
}
