import { createFileRoute } from "@tanstack/react-router";
import { adminSupabase, checkoutStatus, payzenoConfig } from "@/lib/payzeno.server";
import { sendPlanPaymentConfirmation } from "@/lib/plan-mail.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/**
 * Estado de um pagamento de plano. Se ainda está pendente, pergunta à Payzeno
 * e liquida a partir da resposta — assim o plano activa-se mesmo que o webhook
 * se perca ou chegue com o Hostinger a dormir.
 */
export const Route = createFileRoute("/api/planos/estado")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cfg = payzenoConfig();
        const admin = adminSupabase();
        if (!cfg || !admin) return json({ error: "not_configured" }, 503);

        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const { data: auth } = token ? await admin.auth.getUser(token) : { data: null };
        if (!auth?.user) return json({ error: "not_signed_in" }, 401);

        const id = new URL(request.url).searchParams.get("id") ?? "";
        const { data: row } = await admin
          .from("plan_payments")
          .select("id, org_id, plan, months, amount, status, checkout_id, checkout_url")
          .eq("id", id)
          .maybeSingle();
        if (!row) return json({ error: "not_found" }, 404);

        const { data: member } = await admin
          .from("org_members")
          .select("org_id")
          .eq("user_id", auth.user.id)
          .eq("org_id", row.org_id)
          .maybeSingle();
        if (!member) return json({ error: "not_found" }, 404);

        let status = row.status as string;
        if (status === "pendente" && row.checkout_id) {
          try {
            const r = await checkoutStatus(cfg, row.checkout_id);
            if (r.ok && r.status) {
              const { data: settled, error } = await admin.rpc("settle_plan_payment", {
                p_checkout_id: row.checkout_id,
                p_status: r.status,
                p_provider_ref: r.providerRef,
                p_raw: { via: "status", body: r.body },
              });
              if (error) console.error("settle_plan_payment failed", error);
              else if (settled) status = (settled as { status: string }).status;
              if (status === "confirmado") await sendPlanPaymentConfirmation(admin, row.id).catch((e) => console.error("confirmation email", e));
            } else if (!r.ok) {
              console.warn("payzeno status", r.status, r.text.slice(0, 300));
            }
          } catch (error) {
            console.warn("payzeno unreachable", error);
          }
        }

        return json({ id: row.id, plan: row.plan, months: row.months, amount: row.amount, status, checkoutUrl: row.checkout_url });
      },
    },
  },
});
