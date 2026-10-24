import { formatMZN } from "@/lib/format";
import { companyBanks, companyWallets, useCompany } from "@/lib/company-store";
import { useDocTemplate, type DocTemplateId } from "@/lib/doc-templates";
import { amountInWords, docText } from "@/lib/doc-text";
import { BankMark, WalletMark } from "@/components/invoices/PaymentLogos";
import { DocFooter, DocSheet, PartyBlock, themeOf, themeStyles } from "@/components/invoices/DocTheme";
import { ReceiptDocument, receiptFromInvoice } from "@/components/invoices/ReceiptDocument";
import { cn } from "@/lib/utils";
import { invoiceTotals, isQuoteKind, lineNet, type Invoice } from "@/lib/invoices-store";

export type DocKind = "factura" | "recibo" | "cotacao";

/**
 * Documento A4 (factura, pró-forma, VD, cotação). Os recibos têm o seu próprio
 * formato, só com os campos obrigatórios — ver ReceiptDocument.
 */
export function InvoiceDocument({
  invoice,
  templateOverride,
  docKind = "factura",
  paymentId,
}: {
  invoice: Invoice;
  /** Força um layout específico (usado na página de Design). */
  templateOverride?: DocTemplateId;
  /** Tipo de documento a imprimir (factura, recibo ou cotação). */
  docKind?: DocKind;
  /** Recibo de um pagamento concreto (total ou parcial). Sem isto, recibo de quitação da factura. */
  paymentId?: string;
}) {
  const company = useCompany();
  const active = useDocTemplate();
  const theme = themeOf(templateOverride ?? active);

  if (docKind === "recibo") {
    return <ReceiptDocument receipt={receiptFromInvoice(invoice, paymentId)} templateOverride={templateOverride} />;
  }

  const s = themeStyles(theme);
  const lang = company.docLang ?? "pt";
  const tx = docText(lang);
  const { sub, discount, vat, total } = invoiceTotals(invoice);
  const banks = companyBanks(company);
  const wallets = companyWallets(company);
  const visual = invoice.kind === "cotv";
  const quote = isQuoteKind(invoice.kind);
  // Sem IVA liquidado (isento / regime simplificado): sem coluna nem linha de IVA, com a menção do regime.
  const regime = company.ivaRegime ?? "normal";
  const noVat = regime !== "normal" && vat === 0;
  const vatNote = regime === "normal" ? "" : company.vatNote?.trim() || (regime === "isento" ? tx.vatExempt : tx.vatSimplified);
  const title = tx.kinds[invoice.kind] ?? tx.kinds.ft;
  const fmtQty = (n: number) => new Intl.NumberFormat("pt-MZ", { maximumFractionDigits: 3 }).format(n);

  return (
    <DocSheet
      theme={theme}
      company={company}
      lang={lang}
      title={title}
      reference={invoice.number}
      dates={[
        [tx.issueDate, invoice.issued],
        [quote ? tx.validUntil : tx.dueDate, invoice.due],
      ]}
      side={<PartyBlock theme={theme} label={tx.client} party={invoice.client} />}
      cancelled={invoice.status === "cancelada"}
    >
      <table className="mt-8 w-full border-collapse">
        <thead>
          <tr className={cn("text-left", s.tableHead)}>
            <th className="w-8 pr-2 font-medium">#</th>
            {visual && <th className="w-16 font-medium">{tx.image}</th>}
            <th className={cn("font-medium", s.basic && "font-display text-[14px] font-bold text-slate-900")}>{tx.description}</th>
            <th className="text-right font-medium">{tx.qty}</th>
            <th className="text-right font-medium">{tx.price}</th>
            {!noVat && <th className="text-right font-medium">{tx.vat}</th>}
            <th className="text-right font-medium">{tx.total}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((l, i) => (
            <tr key={i} className={s.row}>
              <td className="py-2.5 pr-2 align-top tabular-nums text-slate-400">{i + 1}</td>
              {visual && (
                <td className="py-2 pr-3">
                  {l.img ? <img src={l.img} alt="" className="h-12 w-12 rounded-md object-cover" /> : <span className="block h-12 w-12 rounded-md bg-slate-100" />}
                </td>
              )}
              <td className="py-2.5 pr-4">
                {l.description}
                {l.note && <span className="block text-[11px] text-slate-500">{l.note}</span>}
              </td>
              <td className="py-2.5 text-right tabular-nums">{fmtQty(l.qty)}</td>
              <td className="py-2.5 text-right tabular-nums">{formatMZN(l.price)}</td>
              {!noVat && <td className="py-2.5 text-right tabular-nums">{l.vat}%</td>}
              <td className="py-2.5 text-right font-medium tabular-nums">{formatMZN(lineNet(l))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <dl className={cn("w-full max-w-[300px] space-y-2 text-[13px]", s.totals)}>
          <div className="flex justify-between">
            <dt className="text-slate-500">{tx.subtotal}</dt>
            <dd className="tabular-nums">{formatMZN(sub)}</dd>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-slate-500">{tx.discount} {invoice.discount}%</dt>
              <dd className="tabular-nums">− {formatMZN(discount)}</dd>
            </div>
          )}
          {!noVat && (
            <div className="flex justify-between">
              <dt className="text-slate-500">{tx.vat}</dt>
              <dd className="tabular-nums">{formatMZN(vat)}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-slate-200 pt-2 text-[15px] font-semibold">
            <dt>{tx.total}</dt>
            <dd className="tabular-nums">{formatMZN(total)} MZN</dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-slate-600">
        <span className="font-semibold text-slate-800">{tx.inWords}:</span> {amountInWords(total, lang)}.
      </p>
      {vatNote && <p className="mt-1 text-[12px] text-slate-600">{vatNote}</p>}

      {company.showPaymentDetails && (banks.length > 0 || wallets.length > 0) && (
        <section className={cn("mt-8", s.box)}>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{tx.paymentDetails}</p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            {banks.length > 0 && (
              <div className="space-y-3">
                {banks.map((bank, i) => (
                  <div key={i} className="space-y-1.5">
                    <BankMark id={bank.bankId} />
                    <p className="text-[12px] font-semibold">{bank.accountName}</p>
                    <p className="text-[11px] tabular-nums text-slate-500">
                      {tx.account} {bank.account}
                      {bank.nib && <><br />NIB {bank.nib}</>}
                      {bank.swift && <><br />SWIFT {bank.swift}</>}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {wallets.length > 0 && (
              <div className="space-y-2.5">
                {wallets.map((w) => (
                  <div key={w.provider} className="flex items-center gap-2.5">
                    <WalletMark provider={w.provider} />
                    <div className="leading-tight">
                      <p className="text-[12px] font-semibold tabular-nums">{w.number}</p>
                      <p className="text-[10.5px] uppercase text-slate-500">{w.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {company.paymentNote && <p className="mt-3 text-[11px] text-slate-500">{company.paymentNote}</p>}
        </section>
      )}

      <DocFooter lang={lang} reference={invoice.number} orgId={invoice.orgId}>
        {invoice.notes && <p className="mb-2 text-slate-700">{invoice.notes}</p>}
      </DocFooter>
    </DocSheet>
  );
}
