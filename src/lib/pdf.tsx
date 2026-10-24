import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { InvoiceDocument, type DocKind } from "@/components/invoices/InvoiceDocument";
import { ReceiptDocument } from "@/components/invoices/ReceiptDocument";
import type { Invoice } from "@/lib/invoices-store";
import type { Receipt } from "@/lib/receipts-store";

/** A4 a 96 dpi: 210 × 297 mm. */
const A4_W = 794;
const A4_H = 1123;

/** Nome do ficheiro: o número do documento (ou do recibo), sem espaços nem barras. */
export function pdfFileName(invoice: Invoice, docKind: DocKind = "factura", paymentId?: string) {
  const number =
    docKind === "recibo"
      ? (paymentId ? invoice.payments?.find((p) => p.id === paymentId)?.receiptNumber : invoice.receiptNumber) ?? invoice.number
      : invoice.number;
  return `${number.replace(/[\s/]+/g, "-")}.pdf`;
}

/**
 * Descarrega o documento em PDF, sem abrir nenhuma página.
 *
 * A folha é desenhada fora do ecrã com a largura exacta de uma A4 e pelo menos
 * a altura de uma página, e só a folha é rasterizada — antes era o contentor à
 * volta, que num ecrã largo deixava o documento pequeno e descentrado no papel.
 */
export function downloadDocumentPdf(invoice: Invoice, docKind: DocKind = "factura", paymentId?: string) {
  return downloadSheetPdf(
    <InvoiceDocument invoice={invoice} docKind={docKind} paymentId={paymentId} />,
    pdfFileName(invoice, docKind, paymentId),
  );
}

export function downloadReceiptPdf(receipt: Receipt) {
  return downloadSheetPdf(<ReceiptDocument receipt={receipt} />, `${receipt.number.replace(/[\s/]+/g, "-")}.pdf`);
}

async function downloadSheetPdf(sheetElement: ReactElement, fileName: string) {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);

  const host = document.createElement("div");
  host.className = "pdf-capture";
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${A4_W}px;background:#fff;`;
  // O PDF é sempre claro, mesmo com o modo escuro activo.
  host.style.colorScheme = "light";
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    root.render(sheetElement);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await document.fonts?.ready;
    await Promise.all(
      [...host.querySelectorAll("img")].map((img) =>
        img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }),
      ),
    );

    const sheet = (host.querySelector(".invoice-sheet") as HTMLElement | null) ?? host;
    const jpeg = await toJpeg(sheet, { pixelRatio: 2, quality: 0.92, backgroundColor: "#ffffff", cacheBust: true });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (sheet.offsetHeight / sheet.offsetWidth) * pageW;
    // Documentos mais altos do que uma página continuam nas seguintes.
    for (let y = 0; y < imgH - 0.5; y += pageH) {
      if (y > 0) pdf.addPage();
      pdf.addImage(jpeg, "JPEG", 0, -y, pageW, imgH);
    }
    pdf.save(fileName);
  } finally {
    root.unmount();
    host.remove();
  }
}

export { A4_H, A4_W };
