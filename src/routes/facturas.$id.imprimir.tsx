import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Download, Printer, Loader2 } from "lucide-react";
import { z } from "zod";
import { InvoiceDocument, type DocKind } from "@/components/invoices/InvoiceDocument";
import { useInvoice, useInvoicesReady, type Invoice } from "@/lib/invoices-store";
import { defaultCompany, type Company } from "@/lib/company-store";
import { docTemplates, type DocTemplateId } from "@/lib/doc-templates";
import { downloadDocumentPdf } from "@/lib/pdf";

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
  const own = useInvoice(id);
  const ready = useInvoicesReady();
  const docKind: DocKind = tipo ?? "factura";

  // Quem recebe a ligação (WhatsApp / e-mail) não tem sessão: o documento vem do servidor,
  // com os dados da empresa e o layout que saem impressos.
  const [shared, setShared] = useState<{ invoice: Invoice; company: Company; template: DocTemplateId } | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (own) return;
    const t = setTimeout(() => {
      fetch(`/api/documento?id=${encodeURIComponent(id)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d: { invoice: Invoice; company: Partial<Company>; template: string }) =>
          setShared({
            invoice: d.invoice,
            company: { ...defaultCompany, ...d.company },
            template: (docTemplates.some((x) => x.id === d.template) ? d.template : "classico") as DocTemplateId,
          }),
        )
        .catch(() => setMissing(true));
      // Com sessão, espera um instante pelas facturas da empresa antes de ir ao servidor.
    }, ready ? 0 : 1500);
    return () => clearTimeout(t);
  }, [id, own, ready]);
  const invoice = own ?? shared?.invoice;

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!invoice || preview) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [invoice, preview]);

  /** Mesmo PDF que os botões da app: a folha A4 inteira, sem margens à volta. */
  async function downloadPdf() {
    if (!invoice) return;
    setSaving(true);
    try {
      await downloadDocumentPdf(invoice, docKind, pagamento, own ? undefined : shared ?? undefined);
    } finally {
      setSaving(false);
    }
  }

  if (!invoice) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-100 p-8 text-center text-slate-600">
        {missing ? (
          <p className="text-sm">Documento não encontrado. Confirme a ligação com quem lha enviou.</p>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> A abrir o documento…</p>
        )}
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
      <InvoiceDocument
        invoice={invoice}
        docKind={docKind}
        paymentId={pagamento}
        companyOverride={own ? undefined : shared?.company}
        templateOverride={own ? undefined : shared?.template}
      />
    </main>
  );
}
