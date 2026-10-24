import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Download, Loader2, MessageCircle, Plus, Printer } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { formatMZN } from "@/lib/format";
import { useReceipt, useReceiptsReady } from "@/lib/receipts-store";
import { useCompany } from "@/lib/company-store";
import { downloadReceiptPdf } from "@/lib/pdf";
import { ReceiptDocument } from "@/components/invoices/ReceiptDocument";

export const Route = createFileRoute("/dashboard/recibos/$id")({
  head: () => ({ meta: [{ title: "Recibo · Quota Studio" }] }),
  component: ReciboPage,
});

function ReciboPage() {
  const { id } = Route.useParams();
  const receipt = useReceipt(id);
  const ready = useReceiptsReady();
  const company = useCompany();
  const [pdfBusy, setPdfBusy] = useState(false);

  if (!receipt) {
    return (
      <div className="grid place-items-center gap-3 rounded-lg border border-border/70 bg-card px-6 py-20 text-center">
        <p className="font-display text-lg font-semibold">{ready ? "Recibo não encontrado" : "A carregar…"}</p>
        <Link to="/dashboard/documentos" search={{ tipo: "recibo" }} className="mt-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Voltar aos recibos</Link>
      </div>
    );
  }

  async function savePdf() {
    if (!receipt) return;
    setPdfBusy(true);
    try {
      await downloadReceiptPdf(receipt);
    } catch {
      toast.error("Não foi possível gerar o PDF");
    } finally {
      setPdfBusy(false);
    }
  }

  function sendWhatsApp() {
    if (!receipt) return;
    const phone = receipt.client.phone.replace(/\D/g, "");
    const text =
      `Olá ${receipt.client.name}, confirmamos a recepção de ${formatMZN(receipt.total)} MZN ` +
      `(recibo ${receipt.number}, ref. ${receipt.items.map((i) => i.number).join(", ")}). Obrigado! — ${company.name}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  const btn = "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12px] font-semibold transition hover:bg-muted disabled:opacity-60";

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/dashboard/documentos" search={{ tipo: "recibo" }} aria-label="Voltar aos recibos" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-[12.5px] font-semibold tabular-nums">{receipt.number}</span>
          <span className="border-l border-border/60 pl-3 text-[11px] text-muted-foreground">
            {receipt.client.name} · {formatMZN(receipt.total)} MZN
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <button className={btn} onClick={() => window.open(`/recibos/${receipt.id}/imprimir`, "_blank", "noreferrer")}>
              <Printer className="h-3.5 w-3.5" />{t("Imprimir")}</button>
            <button className={btn} onClick={savePdf} disabled={pdfBusy}>
              {pdfBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {pdfBusy ? t("A gerar…") : t("PDF")}</button>
            {receipt.client.phone && (
              <button className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[12px] font-semibold text-success transition hover:bg-success/15" onClick={sendWhatsApp}>
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp</button>
            )}
            <Link to="/dashboard/recibos/novo" search={{}} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground hover:opacity-90">
              <Plus className="h-3.5 w-3.5" />{t("Novo recibo")}</Link>
          </div>
        </div>
      </section>

      <div className="overflow-x-auto pb-6">
        <ReceiptDocument receipt={receipt} />
      </div>
    </div>
  );
}
