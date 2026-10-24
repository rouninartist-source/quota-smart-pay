import { createFileRoute } from "@tanstack/react-router";
import { adminSupabase } from "@/lib/payzeno.server";
import { verificationCode } from "@/lib/verify";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

type Line = { qty: number; price: number; vat: number };

/** Total igual a `invoiceTotals` (src/lib/invoices-store.ts). */
function totalOf(lines: Line[], discount: number) {
  const f = 1 - (discount ?? 0) / 100;
  return lines.reduce((a, l) => a + Number(l.qty) * Number(l.price) * f * (1 + Number(l.vat) / 100), 0);
}

/**
 * Verificação pública de um documento a partir do QR: ?o=<empresa>&n=<número>&c=<código>.
 * Sem sessão. Devolve só o que permite confirmar o documento — emitente,
 * número, data, total e nome do cliente — e nunca linhas, contactos ou notas.
 */
export const Route = createFileRoute("/api/verificar")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = adminSupabase();
        if (!admin) return json({ error: "not_configured" }, 503);

        const q = new URL(request.url).searchParams;
        const org = q.get("o") ?? "";
        const number = q.get("n") ?? "";
        const code = (q.get("c") ?? "").toUpperCase();
        if (!/^[0-9a-f-]{36}$/i.test(org) || !number || number.length > 40) return json({ valid: false });
        if (verificationCode(number).toUpperCase() !== code) return json({ valid: false });

        const { data: co } = await admin.from("company").select("settings").eq("org_id", org).limit(1).maybeSingle();
        const settings = (co?.settings ?? {}) as { name?: string; nuit?: string };
        const issuer = { name: settings.name ?? "", nuit: settings.nuit ?? "" };

        const { data: inv } = await admin
          .from("invoices")
          .select("number,kind,issued,status,discount,client_snapshot,invoice_lines(qty,price,vat)")
          .eq("org_id", org)
          .eq("number", number)
          .maybeSingle();
        if (inv) {
          return json({
            valid: true,
            type: "documento",
            kind: inv.kind,
            number: inv.number,
            issued: inv.issued,
            cancelled: inv.status === "cancelada",
            total: Math.round(totalOf((inv.invoice_lines ?? []) as Line[], Number(inv.discount)) * 100) / 100,
            client: (inv.client_snapshot as { name?: string } | null)?.name ?? "",
            issuer,
          });
        }

        const { data: rec } = await admin
          .from("receipts")
          .select("number,issued,total,client_snapshot,items")
          .eq("org_id", org)
          .eq("number", number)
          .maybeSingle();
        if (rec) {
          return json({
            valid: true,
            type: "recibo",
            number: rec.number,
            issued: rec.issued,
            total: Number(rec.total),
            client: (rec.client_snapshot as { name?: string } | null)?.name ?? "",
            refs: ((rec.items ?? []) as { number: string }[]).map((i) => i.number),
            issuer,
          });
        }

        // Recibos antigos, por pagamento numa factura.
        const { data: pay } = await admin
          .from("payments")
          .select("receipt_number,receipt_issued,amount,invoices(number,client_snapshot)")
          .eq("org_id", org)
          .eq("receipt_number", number)
          .limit(1)
          .maybeSingle();
        if (pay) {
          const invRef = pay.invoices as unknown as { number: string; client_snapshot: { name?: string } | null } | null;
          return json({
            valid: true,
            type: "recibo",
            number: pay.receipt_number,
            issued: pay.receipt_issued,
            total: Number(pay.amount),
            client: invRef?.client_snapshot?.name ?? "",
            refs: invRef ? [invRef.number] : [],
            issuer,
          });
        }

        return json({ valid: false });
      },
    },
  },
});
