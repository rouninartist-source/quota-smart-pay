import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useReceipt, useReceiptsReady } from "@/lib/receipts-store";
import { ReceiptDocument } from "@/components/invoices/ReceiptDocument";

export const Route = createFileRoute("/recibos/$id/imprimir")({
  head: () => ({ meta: [{ title: "Recibo para impressão · Quota" }, { name: "robots", content: "noindex" }] }),
  component: PrintReceipt,
});

function PrintReceipt() {
  const { id } = Route.useParams();
  const receipt = useReceipt(id);
  const ready = useReceiptsReady();

  useEffect(() => {
    if (!receipt) return;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [receipt]);

  if (!receipt) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-100 p-8 text-center text-slate-600">
        <p className="text-sm">{ready ? "Recibo não encontrado." : "A carregar…"}</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-slate-100 p-4 md:p-10 print:bg-white print:p-0">
      <div className="mb-4 flex justify-center print:hidden">
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
          <Printer className="h-3.5 w-3.5" /> Imprimir
        </button>
      </div>
      <ReceiptDocument receipt={receipt} />
    </main>
  );
}
