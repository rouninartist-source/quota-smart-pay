import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { InvoiceDocument, type DocKind } from "@/components/invoices/InvoiceDocument";
import { useInvoice } from "@/lib/invoices-store";

const searchSchema = z.object({
  tipo: z.enum(["factura", "recibo", "cotacao"]).optional(),
  /** Pré-visualização A4 sem abrir a caixa de impressão. */
  preview: z.coerce.boolean().optional(),
});

export const Route = createFileRoute("/facturas/$id/imprimir")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Documento para impressão · Quota Studio" },
      { name: "description", content: "Versão A4 para impressão e PDF do documento emitido no Quota Studio." },
      { property: "og:title", content: "Documento para impressão · Quota Studio" },
      { property: "og:description", content: "Pré-visualize em A4 e guarde o documento em PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
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
