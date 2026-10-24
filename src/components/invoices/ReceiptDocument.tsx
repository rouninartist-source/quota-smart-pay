import { formatDate, formatMZN } from "@/lib/format";
import { useCompany } from "@/lib/company-store";
import { documentKinds, paymentMethodLabels } from "@/lib/invoices-store";
import type { Receipt } from "@/lib/receipts-store";
import { QuotaSeal } from "@/components/invoices/QuotaSeal";

/**
 * Recibo de cliente em A4 — uma ou várias facturas pagas num só documento.
 * Usa a mesma folha (`invoice-sheet`) das facturas, para imprimir e gerar o PDF
 * da mesma forma.
 */
export function ReceiptDocument({ receipt }: { receipt: Receipt }) {
  const company = useCompany();
  const single = receipt.items.length === 1;
  const settled = receipt.items.every((i) => i.balanceAfter <= 0.01);
  const owed = receipt.items.reduce((a, i) => a + i.balanceAfter, 0);

  return (
    <div className="invoice-sheet relative mx-auto w-full max-w-[820px] overflow-hidden bg-white text-[13px] text-slate-900 shadow-card">
      <div className="h-2.5 w-full bg-emerald-600" />
      <div className="p-8 md:p-12">
        {company.logo && (
          <div className="mb-5 flex">
            <img src={company.logo} alt={`Logotipo de ${company.name}`} className="h-16 max-w-[220px] object-contain object-left" />
          </div>
        )}

        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Emitido por</p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{company.name}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
              {company.address}
              <br />
              NUIT {company.nuit} · {company.email} · {company.phone}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">Recibo</p>
            <p className="font-display text-xl font-semibold tabular-nums">{receipt.number}</p>
            <p className="mt-2 text-[12px] text-slate-500">
              Data: <span className="tabular-nums font-medium text-slate-700">{formatDate(receipt.issued)}</span>
            </p>
          </div>
        </header>

        <section className="mt-6 flex justify-end text-right">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Recebido de</p>
            <p className="mt-1.5 font-semibold">{receipt.client.name}</p>
            <p className="text-[12px] leading-relaxed text-slate-500">
              {receipt.client.nuit && <>NUIT {receipt.client.nuit}<br /></>}
              {receipt.client.address && <>{receipt.client.address}<br /></>}
              {[receipt.client.email, receipt.client.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
        </section>

        <p className="mt-8 text-[13px] leading-relaxed text-slate-700">
          Declaramos que recebemos de <b className="text-slate-900">{receipt.client.name}</b> a quantia de{" "}
          <b className="tabular-nums text-slate-900">{formatMZN(receipt.total)} MZN</b>, por{" "}
          {paymentMethodLabels[receipt.method]}
          {receipt.reference ? ` (ref. ${receipt.reference})` : ""}, para pagamento{" "}
          {single ? "do documento" : "dos documentos"} abaixo.
        </p>

        <table className="mt-6 w-full border-collapse">
          <thead>
            <tr className="bg-slate-900 text-left text-[10px] uppercase tracking-[0.14em] text-slate-200 [&>th]:px-2">
              <th className="py-2.5 font-medium">Documento</th>
              <th className="py-2.5 font-medium">Data</th>
              <th className="py-2.5 text-right font-medium">Valor</th>
              <th className="py-2.5 text-right font-medium">Pago agora</th>
              <th className="py-2.5 text-right font-medium">Saldo</th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
            {receipt.items.map((i) => (
              <tr key={i.invoiceId} className="border-b border-slate-100 [&>td]:px-2">
                <td className="py-2.5">
                  <span className="font-medium tabular-nums">{i.number}</span>
                  <span className="block text-[11px] text-slate-500">{documentKinds[i.kind]?.label ?? "Factura"}</span>
                </td>
                <td className="py-2.5 tabular-nums">{formatDate(i.issued)}</td>
                <td className="py-2.5 text-right tabular-nums">{formatMZN(i.invoiceTotal)}</td>
                <td className="py-2.5 text-right font-semibold tabular-nums">{formatMZN(i.amount)}</td>
                <td className="py-2.5 text-right tabular-nums">
                  {i.balanceAfter <= 0.01 ? <span className="text-emerald-600">Liquidada</span> : formatMZN(i.balanceAfter)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-[300px] space-y-2 rounded-sm border border-slate-200 p-4 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-slate-500">Forma de pagamento</dt>
              <dd>{paymentMethodLabels[receipt.method]}</dd>
            </div>
            {receipt.reference && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Referência</dt>
                <dd className="tabular-nums">{receipt.reference}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-[15px] font-semibold">
              <dt>Total recebido</dt>
              <dd className="tabular-nums">{formatMZN(receipt.total)} MZN</dd>
            </div>
            {!settled && (
              <div className="flex justify-between text-[12px] text-slate-500">
                <dt>Saldo em aberto</dt>
                <dd className="tabular-nums">{formatMZN(owed)} MZN</dd>
              </div>
            )}
          </dl>
        </div>

        <footer className="mt-10 flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-5 text-[11px] leading-relaxed text-slate-500">
          <div className="min-w-[220px] max-w-[70%]">
            {receipt.notes && <p className="mb-2 text-slate-700">{receipt.notes}</p>}
            <p>
              {settled ? "Recibo de quitação." : `Recibo de pagamento parcial; saldo em aberto ${formatMZN(owed)} MZN.`} Documento processado por{" "}
              {company.name} — válido sem assinatura nem selo branco.
            </p>
          </div>
          <QuotaSeal reference={receipt.number} />
        </footer>
      </div>
    </div>
  );
}
