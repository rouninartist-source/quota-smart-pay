import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
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
  const { tipo, preview } = Route.useSearch();
  const invoice = useInvoice(id);
  const docKind: DocKind = tipo ?? "factura";

  useEffect(() => {
    if (!invoice || preview) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [invoice, preview]);

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
        <button
          onClick={() => window.print()}
          className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
        >
          Descarregar PDF / Imprimir
        </button>
      </div>
      <InvoiceDocument invoice={invoice} docKind={docKind} />
    </main>
  );
}
