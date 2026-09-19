import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";
import { Download, Printer, Loader2 } from "lucide-react";
import { z } from "zod";
import { InvoiceDocument, type DocKind } from "@/components/invoices/InvoiceDocument";
import { useInvoice } from "@/lib/invoices-store";

const searchSchema = z.object({
  tipo: z.enum(["factura", "recibo", "cotacao"]).optional(),
  /** Pré-visualização A4 sem abrir a caixa de impressão. */
  preview: z.coerce.boolean().optional(),
  /**
   * Dados públicos da pré-visualização (WhatsApp/e-mail lêem as meta tags sem
   * sessão, por isso vêm no próprio URL): número, tipo e valor.
   */
  n: z.string().optional(),
  k: z.string().optional(),
  v: z.string().optional(),
  /** Recibo de um pagamento concreto. */
  pagamento: z.string().optional(),
});

const ogImage = (kind?: string, tipo?: string) => {
  const k = (kind ?? "").toLowerCase();
  const file = tipo === "recibo" || k === "recibo" ? "recibo" : k.includes("pró-forma") || k.includes("pro-forma") ? "proforma" : k.startsWith("vd") ? "vd" : tipo === "cotacao" || k.includes("cota") ? "cotacao" : k.includes("factura") ? "factura" : "documento";
  // O WhatsApp exige URL absoluto na imagem.
  const base = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || "https://quota.milsonuix.com";
  return `${base}/og/${file}.png`;
};

export const Route = createFileRoute("/facturas/$id/imprimir")({
  validateSearch: searchSchema,
  head: ({ match }) => {
    const { n, k, v, tipo } = match.search;
    const title = n ? `${k ?? "Documento"} ${n}` : "Documento para impressão";
    const description = v ? `Total ${v} MZN · abra para ver e guardar o PDF.` : "Pré-visualize em A4 e guarde o documento em PDF.";
    return {
      meta: [
        { title: `${title} · Quota` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: ogImage(k, tipo) },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: PrintInvoice,
});

function PrintInvoice() {
  const { id } = Route.useParams();
  const { tipo, preview, pagamento } = Route.useSearch();
  const invoice = useInvoice(id);
  const docKind: DocKind = tipo ?? "factura";

  const sheetRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!invoice || preview) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [invoice, preview]);

  /** Gera um ficheiro PDF a sério: a folha é rasterizada pelo próprio browser e colocada numa página A4. */
  async function downloadPdf() {
    if (!sheetRef.current || !invoice) return;
    setSaving(true);
    try {
      const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      const node = sheetRef.current;
      const png = await toJpeg(node, { pixelRatio: 2, quality: 0.9, backgroundColor: "#ffffff", cacheBust: true });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = node.offsetHeight / node.offsetWidth;
      const imgW = pageW;
      const imgH = pageW * ratio;
      // documentos mais altos que uma página continuam nas seguintes
      let y = 0;
      pdf.addImage(png, "JPEG", 0, 0, imgW, imgH);
      while (imgH - y > pageH) {
        y += pageH;
        pdf.addPage();
        pdf.addImage(png, "JPEG", 0, -y, imgW, imgH);
      }
      const number = (docKind === "recibo" ? (pagamento ? invoice.payments?.find((p) => p.id === pagamento)?.receiptNumber : invoice.receiptNumber) : invoice.number) ?? invoice.number;
      pdf.save(`${number.replace(/[\s/]+/g, "-")}.pdf`);
    } finally {
      setSaving(false);
    }
  }

  if (!invoice) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-100 p-8 text-center text-slate-600">
        <p className="text-sm">Documento não encontrado neste dispositivo.</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-slate-100 p-4 md:p-10 print:bg-white print:p-0">
      <div className="mb-4 flex justify-center print:hidden">
        {preview ? (
          <button
            onClick={downloadPdf}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {saving ? "A gerar o PDF…" : t("Descarregar PDF")}
          </button>
        ) : (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </button>
        )}
      </div>
      <div ref={sheetRef}>
        <InvoiceDocument invoice={invoice} docKind={docKind} paymentId={pagamento} />
      </div>
    </main>
  );
}
