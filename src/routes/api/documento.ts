import { createFileRoute } from "@tanstack/react-router";
import { adminSupabase } from "@/lib/payzeno.server";
import { SELECT, toInvoice, type InvoiceRow } from "@/lib/invoices-store";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/**
 * Documento para a ligação partilhada (WhatsApp / e-mail): quem a recebe não
 * tem sessão no Quota. A ligação leva o id do documento — um UUID aleatório,
 * que não se adivinha — e devolve só esse documento, os dados da empresa que
 * saem impressos nele e o layout. Como "qualquer pessoa com a ligação" num
 * documento partilhado: nada mais da empresa fica acessível.
 */
export const Route = createFileRoute("/api/documento")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = adminSupabase();
        if (!admin) return json({ error: "not_configured" }, 503);

        const id = new URL(request.url).searchParams.get("id") ?? "";
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return json({ error: "not_found" }, 404);

        const { data: row } = await admin.from("invoices").select(SELECT).eq("id", id).maybeSingle();
        // Rascunhos não se partilham: ainda não são documentos.
        if (!row || (row as unknown as InvoiceRow).status === "rascunho") return json({ error: "not_found" }, 404);
        const invoice = toInvoice(row as unknown as InvoiceRow);

        const { data: co } = await admin
          .from("company")
          .select("settings,doc_template")
          .eq("org_id", invoice.orgId ?? "")
          .limit(1)
          .maybeSingle();

        return json({ invoice, company: co?.settings ?? {}, template: co?.doc_template ?? "classico" });
      },
    },
  },
});
