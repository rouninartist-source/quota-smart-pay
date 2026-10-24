import { createFileRoute } from "@tanstack/react-router";
import { adminSupabase } from "@/lib/payzeno.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/**
 * O cliente desiste de um pagamento de plano ainda pendente (fechou o checkout,
 * enganou-se no método…). Marca-o como rejeitado para deixar de aparecer.
 *
 * Seguro mesmo que o dinheiro chegue depois: `settle_plan_payment` deixa o
 * "confirmado" ganhar a qualquer estado, por isso um pagamento real activa o plano.
 */
export const Route = createFileRoute("/api/planos/cancelar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = adminSupabase();
        if (!admin) return json({ error: "not_configured" }, 503);

        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const { data: auth } = token ? await admin.auth.getUser(token) : { data: null };
        if (!auth?.user) return json({ error: "not_signed_in" }, 401);

        const { id } = (await request.json().catch(() => ({}))) as { id?: string };
        const { data: row } = await admin.from("plan_payments").select("id,org_id,status").eq("id", id ?? "").maybeSingle();
        if (!row) return json({ error: "not_found" }, 404);

        const { data: member } = await admin
          .from("org_members")
          .select("role")
          .eq("org_id", row.org_id)
          .eq("user_id", auth.user.id)
          .maybeSingle();
        if (!member || !["owner", "admin"].includes(member.role)) return json({ error: "not_admin" }, 403);

        if (row.status === "pendente") {
          await admin.from("plan_payments").update({ status: "rejeitado" }).eq("id", row.id).eq("status", "pendente");
        }
        return json({ ok: true });
      },
    },
  },
});
