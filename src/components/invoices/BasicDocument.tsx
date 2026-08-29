import { formatDate, formatMZN } from "@/lib/format";
import { useCompany } from "@/lib/company-store";
import { BankMark, WalletMark } from "@/components/invoices/PaymentLogos";
import { QuotaSeal } from "@/components/invoices/QuotaSeal";
import { cn } from "@/lib/utils";
import {
  invoiceBalance,
  invoicePaid,
  invoiceTotals,
  lineNet,
  paymentMethodLabels,
  type Invoice,
} from "@/lib/invoices-store";
import type { DocKind } from "@/components/invoices/InvoiceDocument";

const kindLabel: Record<DocKind, string> = {
  factura: "Factura",
  recibo: "Recibo",
  cotacao: "Cotação",
};

/**
 * Layouts "Basic" (claro e escuro): bloco de cabeçalho arredondado, tabela
 * limpa e rodapé em três colunas com instruções de pagamento.
 */
export function BasicDocument({
  invoice,
  docKind = "factura",
  dark = false,
}: {
  invoice: Invoice;
  docKind?: DocKind;
  dark?: boolean;
}) {
  const { net, vat, total } = invoiceTotals(invoice);
  const company = useCompany();
  const paid = invoicePaid(invoice);
  const balance = invoiceBalance(invoice);
  const payments = invoice.payments ?? [];
  const bank = company.bank;
  const wallets = company.wallets ?? [];

  const isReceipt = docKind === "recibo";
  const reference = isReceipt ? (invoice.receiptNumber ?? invoice.number) : invoice.number;
  const issued = isReceipt ? (invoice.receiptIssued ?? invoice.issued) : invoice.issued;

  return (
    <div className="invoice-sheet mx-auto w-full max-w-[820px] bg-white p-6 text-[13px] text-slate-900 shadow-card md:p-10">
      {/* Cabeçalho */}
      <header
        className={cn(
          "rounded-2xl px-7 py-6",
          dark ? "bg-slate-900 text-white" : "bg-slate-100/80 text-slate-900",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-center gap-3">
            {company.logo && (
              <img
                src={company.logo}
                alt={`Logotipo de ${company.name}`}
                className="h-11 w-11 shrink-0 rounded-lg object-contain"
              />
            )}
            <p className="font-display text-[22px] font-bold tracking-tight">
              {dark ? company.name : kindLabel[docKind]}
            </p>
          </div>
          <div className="text-right">
            <p className={cn("text-[11px]", dark ? "text-slate-400" : "text-slate-500")}>
              {dark ? kindLabel[docKind] : `${kindLabel[docKind]} Nº`}
            </p>
            <p className="font-display text-[20px] font-bold tabular-nums">
              {dark ? "" : reference}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className={cn("text-[11px]", dark ? "text-slate-400" : "text-slate-500")}>
              {dark ? company.address : "Para:"}
            </p>
            {dark ? (
              <p className="mt-1 text-[12px] leading-relaxed text-slate-300">
                NUIT {company.nuit} · {company.email} · {company.phone}
              </p>
            ) : (
              <>
                <p className="mt-1 font-display text-[17px] font-bold">{invoice.client.name}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                  NUIT {invoice.client.nuit} · {invoice.client.address}
                  <br />
                  {invoice.client.email} · {invoice.client.phone}
                </p>
              </>
            )}
          </div>
          <div className="text-right">
            {dark ? (
              <>
                <p className="text-[11px] text-slate-400">Para:</p>
                <p className="mt-1 font-display text-[17px] font-bold">{invoice.client.name}</p>
                <p className="mt-1 text-[12px] text-slate-300">
                  NUIT {invoice.client.nuit} · {invoice.client.phone}
                </p>
                <p className="mt-2 text-[11px] tabular-nums text-slate-400">
                  {kindLabel[docKind]} {reference} · {formatDate(issued)}
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] text-slate-500">Emitida em</p>
                <p className="text-[13px] font-medium tabular-nums">{formatDate(issued)}</p>
                {!isReceipt && (
                  <>
                    <p className="mt-2 text-[11px] text-slate-500">Vencimento</p>
                    <p className="text-[13px] font-medium tabular-nums">{formatDate(invoice.due)}</p>
                  </>
                )}
                {isReceipt && invoice.receiptNumber && (
                  <p className="mt-2 text-[11px] tabular-nums text-slate-500">
                    Ref. factura {invoice.number}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Linhas */}
      <table className="mt-8 w-full border-collapse">
        <thead>
          <tr className="text-[12px] text-slate-500">
            <th className="pb-3 text-left font-display text-[15px] font-bold text-slate-900">Descrição</th>
            <th className="pb-3 text-right font-medium">Qtd</th>
            <th className="pb-3 text-right font-medium">Preço</th>
            <th className="pb-3 text-right font-medium">IVA</th>
            <th className="pb-3 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((l, i) => (
            <tr key={i}>
              <td className="py-2.5 pr-4 text-slate-700">{l.description}</td>
              <td className="py-2.5 text-right tabular-nums text-slate-500">{l.qty}</td>
              <td className="py-2.5 text-right tabular-nums text-slate-500">{formatMZN(l.price)}</td>
              <td className="py-2.5 text-right tabular-nums text-slate-500">{l.vat}%</td>
              <td className="py-2.5 text-right font-semibold tabular-nums">{formatMZN(lineNet(l))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totais */}
      <div className="mt-6 border-t border-slate-200 pt-6">
        <div className="flex justify-end">
          <dl className="w-full max-w-[300px] space-y-2 rounded-xl bg-slate-100/80 p-5 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="tabular-nums">{formatMZN(net)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">IVA</dt>
              <dd className="tabular-nums">{formatMZN(vat)}</dd>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <dt className="text-slate-500">Total (MZN)</dt>
              <dd className="font-display text-[20px] font-bold tabular-nums">{formatMZN(total)}</dd>
            </div>
            {paid > 0 && (
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <dt className="text-slate-500">{isReceipt ? "Recebido" : "Saldo"}</dt>
                <dd className="font-semibold tabular-nums">
                  {formatMZN(isReceipt ? paid : balance)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {payments.length > 0 && (
        <section className="mt-8">
          <p className="font-display text-[13px] font-bold">
            {isReceipt ? "Pagamentos deste recibo" : "Pagamentos recebidos"}
          </p>
          <table className="mt-2 w-full border-collapse text-[12px]">
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-2 tabular-nums text-slate-500">{formatDate(p.date)}</td>
                  <td className="py-2 text-slate-600">
                    {paymentMethodLabels[p.method]}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums">{formatMZN(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Rodapé em três colunas */}
      <footer className="mt-12 grid gap-8 border-t border-slate-100 pt-8 sm:grid-cols-3">
        <div className="min-w-0">
          {company.logo && (
            <img
              src={company.logo}
              alt={`Logotipo de ${company.name}`}
              className="mb-2 h-10 w-10 rounded-lg object-contain"
            />
          )}
          <p className="font-display text-[15px] font-bold">{company.name}</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
            {company.address}
            <br />
            NUIT {company.nuit} · {company.phone}
          </p>
          <p className="text-[11.5px] text-sky-600">{company.email}</p>
        </div>

        {company.showPaymentDetails && !isReceipt && (bank || wallets.length > 0) ? (
          <div className="min-w-0">
            <p className="font-display text-[13px] font-bold">Instruções de pagamento</p>
            <div className="mt-2.5 space-y-2.5">
              {bank && (
                <div className="flex items-start gap-2.5">
                  <BankMark id={bank.bankId} />
                  <p className="text-[10.5px] leading-snug text-slate-600">
                    Titular: {bank.accountName}
                    <br />
                    Conta {bank.account}
                    {bank.nib ? (
                      <>
                        <br />
                        NIB {bank.nib}
                      </>
                    ) : null}
                  </p>
                </div>
              )}
              {wallets.map((w) => (
                <div key={w.provider} className="flex items-center gap-2.5">
                  <WalletMark provider={w.provider} />
                  <p className="text-[10.5px] leading-snug tabular-nums text-slate-600">
                    {w.name}
                    <br />
                    {w.number}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div />
        )}

        <div className="min-w-0">
          <p className="font-display text-[13px] font-bold">Notas</p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">
            {invoice.notes ||
              (isReceipt
                ? `Recibo de quitação referente à factura ${invoice.number}.`
                : company.paymentNote)}
          </p>
          <div className="mt-3">
            <QuotaSeal reference={reference} />
          </div>
        </div>
      </footer>
    </div>
  );
}
