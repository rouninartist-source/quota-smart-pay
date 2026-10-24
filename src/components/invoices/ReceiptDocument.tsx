import { formatDate, formatMZN } from "@/lib/format";
import { useCompany } from "@/lib/company-store";
import { useDocTemplate, type DocTemplateId } from "@/lib/doc-templates";
import { amountInWords, docText } from "@/lib/doc-text";
import { invoiceTotal, type Invoice } from "@/lib/invoices-store";
import type { Receipt } from "@/lib/receipts-store";
import { DocFooter, DocSheet, PartyBlock, themeOf, themeStyles } from "@/components/invoices/DocTheme";
import { cn } from "@/lib/utils";

/**
 * Recibo — só o que a lei pede: emitente e NUIT, número e data, quem pagou,
 * valor recebido em algarismos e por extenso, a(s) factura(s) a que se refere
 * (número, data, valor) e a forma de pagamento.
 */
export function ReceiptDocument({ receipt, templateOverride }: { receipt: Receipt; templateOverride?: DocTemplateId }) {
  const company = useCompany();
  const active = useDocTemplate();
  const theme = themeOf(templateOverride ?? active);
  const s = themeStyles(theme);
  const lang = company.docLang ?? "pt";
  const tx = docText(lang);
  const method = tx.methods[receipt.method] ?? receipt.method;

  return (
    <DocSheet
      theme={theme}
      company={company}
      lang={lang}
      title={tx.receipt}
      reference={receipt.number}
      dates={[[tx.date, receipt.issued]]}
      side={<PartyBlock theme={theme} label={tx.receivedFrom} party={{ name: receipt.client.name, nuit: receipt.client.nuit, address: receipt.client.address }} />}
    >
      <p className="mt-8 text-[13px] leading-relaxed text-slate-700">
        {tx.receiptStatement(receipt.client.name, `${formatMZN(receipt.total)} MZN (${amountInWords(receipt.total, lang)})`, method, receipt.items.length > 1)}
      </p>

      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className={cn("text-left", s.tableHead)}>
            <th className="w-8 pr-2 font-medium">#</th>
            <th className="font-medium">{tx.document}</th>
            <th className="font-medium">{tx.date}</th>
            <th className="text-right font-medium">{tx.documentValue}</th>
            <th className="text-right font-medium">{tx.amountPaid}</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((i, n) => (
            <tr key={i.invoiceId} className={s.row}>
              <td className="py-2.5 pr-2 tabular-nums text-slate-400">{n + 1}</td>
              <td className="py-2.5">
                <span className="font-medium tabular-nums">{i.number}</span>
                <span className="ml-2 text-[11px] text-slate-500">{tx.kinds[i.kind] ?? tx.kinds.ft}</span>
              </td>
              <td className="py-2.5 tabular-nums">{formatDate(i.issued)}</td>
              <td className="py-2.5 text-right tabular-nums">{formatMZN(i.invoiceTotal)}</td>
              <td className="py-2.5 text-right font-semibold tabular-nums">{formatMZN(i.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <dl className={cn("w-full max-w-[300px] space-y-2 text-[13px]", s.totals)}>
          <div className="flex justify-between">
            <dt className="text-slate-500">{tx.paymentMethod}</dt>
            <dd>{method}</dd>
          </div>
          {receipt.reference && (
            <div className="flex justify-between">
              <dt className="text-slate-500">{tx.reference}</dt>
              <dd className="tabular-nums">{receipt.reference}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-slate-200 pt-2 text-[15px] font-semibold">
            <dt>{tx.totalReceived}</dt>
            <dd className="tabular-nums">{formatMZN(receipt.total)} MZN</dd>
          </div>
        </dl>
      </div>

      <DocFooter lang={lang} reference={receipt.number} orgId={receipt.orgId}>
        {receipt.notes && <p className="mb-2 text-slate-700">{receipt.notes}</p>}
      </DocFooter>
    </DocSheet>
  );
}

/**
 * Recibo de um pagamento numa factura (o formato antigo, por pagamento) no
 * mesmo formato do recibo de cliente. Sem `paymentId`: recibo de quitação.
 */
export function receiptFromInvoice(invoice: Invoice, paymentId?: string): Receipt {
  const total = invoiceTotal(invoice);
  const payments = invoice.payments ?? [];
  const payment = paymentId ? payments.find((p) => p.id === paymentId) : undefined;
  const amount = payment ? payment.amount : payments.reduce((a, p) => a + p.amount, 0) || total;
  const last = payment ?? payments[payments.length - 1];
  return {
    id: payment?.id ?? invoice.id,
    orgId: invoice.orgId,
    number: payment?.receiptNumber ?? invoice.receiptNumber ?? invoice.number,
    issued: payment?.receiptIssued ?? payment?.date ?? invoice.receiptIssued ?? invoice.issued,
    clientId: invoice.clientId,
    client: invoice.client,
    method: last?.method ?? "numerario",
    reference: payment?.reference,
    total: amount,
    items: [
      {
        invoiceId: invoice.id,
        number: invoice.number,
        kind: invoice.kind,
        issued: invoice.issued,
        invoiceTotal: total,
        amount,
        balanceAfter: 0,
      },
    ],
  };
}
