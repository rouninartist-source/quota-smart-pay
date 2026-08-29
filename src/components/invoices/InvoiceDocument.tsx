import { formatDate, formatMZN } from "@/lib/format";
import { useCompany } from "@/lib/company-store";
import { useDocTemplate, type DocTemplateId } from "@/lib/doc-templates";
import { BankMark, WalletMark } from "@/components/invoices/PaymentLogos";
import { QuotaSeal } from "@/components/invoices/QuotaSeal";
import { BasicDocument } from "@/components/invoices/BasicDocument";
import { cn } from "@/lib/utils";
import {
  invoiceBalance,
  invoicePaid,
  invoiceTotals,
  lineNet,
  paymentMethodLabels,
  type Invoice,
} from "@/lib/invoices-store";

export type DocKind = "factura" | "recibo" | "cotacao";

const kindLabel: Record<DocKind, string> = {
  factura: "Factura",
  recibo: "Recibo",
  cotacao: "Cotação",
};

/** Printable A4 invoice sheet. Intentionally uses fixed light colours (paper). */
export function InvoiceDocument({
  invoice,
  templateOverride,
  docKind = "factura",
}: {
  invoice: Invoice;
  /** Força um layout específico (usado na página de Design). */
  templateOverride?: DocTemplateId;
  /** Tipo de documento a imprimir (factura, recibo ou cotação). */
  docKind?: DocKind;
}) {
  const { net, vat, total } = invoiceTotals(invoice);
  const company = useCompany();
  const active = useDocTemplate();
  const template = templateOverride ?? active;
  const paid = invoicePaid(invoice);
  const balance = invoiceBalance(invoice);
  const payments = invoice.payments ?? [];
  const bank = company.bank;
  const wallets = company.wallets ?? [];

  if (template === "basic-claro" || template === "basic-escuro") {
    return <BasicDocument invoice={invoice} docKind={docKind} dark={template === "basic-escuro"} />;
  }

  const modern = template === "moderno";
  const minimal = template === "minimal";
  const corporate = template === "corporativo";
  const elegant = template === "elegante";

  const isReceipt = docKind === "recibo";
  const reference = isReceipt ? (invoice.receiptNumber ?? invoice.number) : invoice.number;

  return (
    <div
      className={cn(
        "invoice-sheet mx-auto w-full max-w-[820px] overflow-hidden bg-white text-[13px] text-slate-900 shadow-card",
        corporate && "border-l-[10px] border-slate-900",
        elegant && "font-serif",
      )}
    >
      {modern && <div className="h-2.5 w-full bg-slate-900" />}
      <div className={cn("p-8 md:p-12", minimal && "md:p-14")}>
        <header
          className={cn(
            "gap-6 pb-6",
            elegant
              ? "flex flex-col items-center border-b-[3px] border-double border-slate-300 text-center"
              : "flex flex-wrap items-start justify-between",
            !elegant && (minimal ? "border-b border-slate-100" : "border-b border-slate-200"),
          )}
        >
          <div className={cn("flex items-start gap-4", elegant && "flex-col items-center")}>
            {company.logo && (
              <img
                src={company.logo}
                alt={`Logotipo de ${company.name}`}
                className="h-14 w-14 shrink-0 rounded-lg object-contain"
              />
            )}
            <div>
              <p className="font-display text-2xl font-semibold tracking-tight text-slate-900">{company.name}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                {company.address}
                <br />
                NUIT {company.nuit} · {company.email} · {company.phone}
              </p>
            </div>
          </div>
          <div className={cn(elegant ? "text-center" : "text-right")}>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {kindLabel[docKind]}
            </p>
            <p className="font-display text-xl font-semibold tabular-nums">{reference}</p>
            <p className="mt-2 text-[12px] text-slate-500">
              Emissão:{" "}
              <span className="tabular-nums">
                {formatDate(isReceipt ? (invoice.receiptIssued ?? invoice.issued) : invoice.issued)}
              </span>
              {!isReceipt && (
                <>
                  <br />
                  Vencimento:{" "}
                  <span className="tabular-nums font-medium text-slate-700">{formatDate(invoice.due)}</span>
                </>
              )}
              {isReceipt && invoice.receiptNumber && (
                <>
                  <br />
                  Ref. factura <span className="tabular-nums">{invoice.number}</span>
                </>
              )}
            </p>
          </div>
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Cliente</p>
            <p className="mt-1.5 font-semibold">{invoice.client.name}</p>
            <p className="text-[12px] leading-relaxed text-slate-500">
              NUIT {invoice.client.nuit}
              <br />
              {invoice.client.address}
              <br />
              {invoice.client.email} · {invoice.client.phone}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {isReceipt ? "Valor recebido" : balance > 0 ? "Valor em dívida" : "Total pago"}
            </p>
            <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums">
              {formatMZN(isReceipt ? paid || total : balance > 0 ? balance : total)}{" "}
              <span className="text-sm font-normal text-slate-500">MZN</span>
            </p>
            {(isReceipt || balance <= 0) && (
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-600">Pago</p>
            )}
          </div>
        </section>

        <table className="mt-8 w-full border-collapse">
          <thead>
            <tr
              className={cn(
                "text-left text-[10px] uppercase tracking-[0.14em]",
                modern
                  ? "bg-slate-100 text-slate-600 [&>th]:px-2"
                  : corporate
                    ? "bg-slate-900 text-slate-200 [&>th]:px-2"
                    : minimal
                      ? "border-b border-slate-200 text-slate-400"
                      : elegant
                        ? "border-y-2 border-slate-300 text-slate-500"
                        : "border-y border-slate-200 text-slate-500",
              )}
            >
              <th className="py-2.5 font-medium">Descrição</th>
              <th className="py-2.5 text-right font-medium">Qtd</th>
              <th className="py-2.5 text-right font-medium">Preço</th>
              <th className="py-2.5 text-right font-medium">IVA</th>
              <th className="py-2.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className={cn(corporate && "[&>tr:nth-child(even)]:bg-slate-50")}>
            {invoice.lines.map((l, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className={cn("py-2.5 pr-4", corporate && "px-2")}>{l.description}</td>
                <td className="py-2.5 text-right tabular-nums">{l.qty}</td>
                <td className="py-2.5 text-right tabular-nums">{formatMZN(l.price)}</td>
                <td className="py-2.5 text-right tabular-nums">{l.vat}%</td>
                <td className={cn("py-2.5 text-right font-medium tabular-nums", corporate && "px-2")}>
                  {formatMZN(lineNet(l))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl
            className={cn(
              "w-full max-w-[280px] space-y-2 text-[13px]",
              elegant && "rounded-sm bg-slate-50 p-4",
              corporate && "rounded-sm border border-slate-200 p-4",
            )}
          >
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="tabular-nums">{formatMZN(net)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">IVA</dt>
              <dd className="tabular-nums">{formatMZN(vat)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-[15px] font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMZN(total)} MZN</dd>
            </div>
            {paid > 0 && (
              <>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Pago</dt>
                  <dd className="tabular-nums">− {formatMZN(paid)}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                  <dt>Saldo</dt>
                  <dd className="tabular-nums">{formatMZN(balance)} MZN</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {payments.length > 0 && (
          <section className="mt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
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

        {company.showPaymentDetails && !isReceipt && (bank || wallets.length > 0) && (
          <section
            className={cn(
              "mt-8 rounded-sm p-4",
              modern
                ? "bg-slate-900 text-slate-100"
                : minimal
                  ? "border border-slate-100"
                  : "border border-slate-200",
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Dados de pagamento</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {bank && (
                <div className="space-y-1.5">
                  <BankMark id={bank.bankId} />
                  <p className={cn("text-[12px] font-semibold", modern && "text-white")}>{bank.accountName}</p>
                  <p className={cn("text-[11px] tabular-nums", modern ? "text-slate-300" : "text-slate-500")}>
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
              {wallets.length > 0 && (
                <div className="space-y-2.5">
                  {wallets.map((w) => (
                    <div key={w.provider} className="flex items-center gap-2.5">
                      <WalletMark provider={w.provider} />
                      <div className="leading-tight">
                        <p className={cn("text-[12px] font-semibold tabular-nums", modern && "text-white")}>
                          {w.number}
                        </p>
                        <p className={cn("text-[10.5px] uppercase", modern ? "text-slate-300" : "text-slate-500")}>
                          {w.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <footer
          className={cn(
            "mt-10 flex flex-wrap items-end justify-between gap-4 pt-5 text-[11px] leading-relaxed text-slate-500",
            minimal ? "border-t border-slate-100" : "border-t border-slate-200",
          )}
        >
          <div className="min-w-[220px] max-w-[70%]">
            {invoice.notes && <p className="mb-2 text-slate-700">{invoice.notes}</p>}
            <p>
              {isReceipt
                ? `Recibo de quitação referente à factura ${invoice.number}.`
                : company.paymentNote}{" "}
              Documento processado por {company.name} — válido sem assinatura nem selo branco.
            </p>
          </div>
          <QuotaSeal reference={reference} />
        </footer>
      </div>
    </div>
  );
}
