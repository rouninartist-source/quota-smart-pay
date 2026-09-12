import { useState } from "react";
import { Mail, MessageCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Modal, Field, inputClass } from "@/components/catalog/Modal";
import { formatDate, formatMZN } from "@/lib/format";
import { useCompany } from "@/lib/company-store";
import {
  documentKinds,
  invoiceBalance,
  invoicePaid,
  invoiceTotal,
  isQuoteKind,
  updateInvoiceStatus,
  type Invoice,
} from "@/lib/invoices-store";

export type ShareKind = "documento" | "recibo";

/** Ligação pública para o PDF, com os dados que o WhatsApp mostra na pré-visualização. */
export function shareLink(inv: Invoice, kind: ShareKind = "documento") {
  const isReceipt = kind === "recibo" && inv.receiptNumber;
  const params = new URLSearchParams();
  if (isReceipt) params.set("tipo", "recibo");
  else if (isQuoteKind(inv.kind)) params.set("tipo", "cotacao");
  params.set("n", isReceipt ? inv.receiptNumber! : inv.number);
  params.set("k", isReceipt ? "Recibo" : documentKinds[inv.kind].label);
  params.set("v", formatMZN(isReceipt ? invoicePaid(inv) || invoiceTotal(inv) : invoiceTotal(inv)));
  const path = `/facturas/${inv.id}/imprimir?${params.toString()}`;
  return typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
}

export function shareMessage(inv: Invoice, companyName: string, paymentNote: string, kind: ShareKind = "documento") {
  const isReceipt = kind === "recibo" && !!inv.receiptNumber;
  const quote = isQuoteKind(inv.kind);
  const total = invoiceTotal(inv);
  const balance = invoiceBalance(inv);
  const label = documentKinds[inv.kind].label.toLowerCase();
  return [
    `Estimado(a) ${inv.client.name},`,
    "",
    isReceipt
      ? `Segue o recibo ${inv.receiptNumber} referente a ${inv.number}, no valor de ${formatMZN(invoicePaid(inv) || total)} MZN.`
      : `Segue a ${label} ${inv.number} no valor de ${formatMZN(total)} MZN` +
        (quote ? `, válida até ${formatDate(inv.due)}.` : `, com vencimento a ${formatDate(inv.due)}.`),
    !isReceipt && !quote && balance > 0 && balance < total ? `Valor em dívida: ${formatMZN(balance)} MZN.` : "",
    "",
    `Documento em PDF: ${shareLink(inv, kind)}`,
    isReceipt || quote ? "" : paymentNote,
    "",
    "Com os melhores cumprimentos,",
    companyName,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/**
 * Escolha do canal de envio: WhatsApp (telefone da ficha), e-mail registado
 * ou outro e-mail escrito na hora. Enviar marca o rascunho como enviado.
 */
export function ShareDialog({ invoice, kind = "documento", onClose }: { invoice: Invoice; kind?: ShareKind; onClose: () => void }) {
  const company = useCompany();
  const [other, setOther] = useState("");
  const [copied, setCopied] = useState(false);
  const phone = invoice.client.phone.replace(/\D/g, "");
  const email = invoice.client.email;
  const message = shareMessage(invoice, company.name, company.paymentNote, kind);
  const subject = `${kind === "recibo" && invoice.receiptNumber ? `Recibo ${invoice.receiptNumber}` : `${documentKinds[invoice.kind].label} ${invoice.number}`} — ${company.name}`;

  const markSent = () => {
    if (invoice.status === "rascunho") void updateInvoiceStatus(invoice.id, "enviada");
  };
  const viaWhatsApp = () => {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noreferrer");
    markSent();
    onClose();
  };
  const viaEmail = (to: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return toast.error("Indique um e-mail válido.");
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    markSent();
    onClose();
  };
  const copy = async () => {
    await navigator.clipboard?.writeText(shareLink(invoice, kind));
    setCopied(true);
    toast.success("Ligação copiada");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal title="Enviar ao cliente" onClose={onClose}>
      <div className="grid gap-3">
        <p className="text-[12px] text-muted-foreground">
          {invoice.client.name} · {documentKinds[invoice.kind].label} {invoice.number}
        </p>

        <button
          type="button"
          onClick={viaWhatsApp}
          disabled={!phone}
          className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-3 text-left transition hover:bg-success/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MessageCircle className="h-4 w-4 text-success" />
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-semibold">WhatsApp</span>
            <span className="block truncate text-[11px] text-muted-foreground">{phone ? invoice.client.phone : "Cliente sem telefone na ficha"}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => viaEmail(email)}
          disabled={!email}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Mail className="h-4 w-4 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-semibold">E-mail registado</span>
            <span className="block truncate text-[11px] text-muted-foreground">{email || "Cliente sem e-mail na ficha"}</span>
          </span>
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            viaEmail(other.trim());
          }}
          className="grid gap-2 rounded-lg border border-border bg-card p-3"
        >
          <Field label="Outro e-mail">
            <div className="flex gap-2">
              <input className={inputClass} type="email" value={other} onChange={(e) => setOther(e.target.value)} placeholder="nome@empresa.co.mz" />
              <button type="submit" className="shrink-0 rounded-md bg-primary px-3 text-[12px] font-semibold text-primary-foreground hover:opacity-90">
                Enviar
              </button>
            </div>
          </Field>
        </form>

        <button type="button" onClick={copy} className="inline-flex items-center justify-center gap-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground">
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />} Copiar ligação do PDF
        </button>
      </div>
    </Modal>
  );
}
