import { createFileRoute } from "@tanstack/react-router";
import { plans } from "@/lib/plans";
import { adminSupabase, createCheckoutSession, payzenoConfig } from "@/lib/payzeno.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/**
 * Inicia o pagamento de um plano: grava o pedido, pede à Payzeno uma sessão de
 * checkout e devolve o URL da página onde o cliente paga.
 *
 * O valor é calculado aqui a partir de `plans.ts` — nunca vem do browser.
 * O plano só se activa quando a Payzeno confirma (webhook ou /api/planos/estado).
 */
export const Route = createFileRoute("/api/planos/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cfg = payzenoConfig();
        const admin = adminSupabase();
        if (!cfg || !admin) return json({ error: "not_configured" }, 503);

        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return json({ error: "not_signed_in" }, 401);
        const { data: auth } = await admin.auth.getUser(token);
        const user = auth?.user;
        if (!user) return json({ error: "not_signed_in" }, 401);

        let body: { plan?: string; months?: number; method?: string; phone?: string; orgId?: string };
        try {
          body = await request.json();
        } catch {
          return json({ error: "bad_json" }, 400);
        }

        const plan = plans.find((p) => p.id === body.plan);
        const months = Number(body.months);
        const method = body.method;
        const phone = String(body.phone ?? "").replace(/\D/g, "").slice(-9);
        if (!plan) return json({ error: "bad_plan" }, 400);
        if (months !== 1 && months !== 3 && months !== 12) return json({ error: "bad_months" }, 400);
        if (method !== "mpesa" && method !== "emola") return json({ error: "bad_method" }, 400);
        if (phone.length !== 9) return json({ error: "bad_phone" }, 400);

        // Quem paga tem de ser dono ou admin da empresa; o plano fica na raiz.
        const { data: member } = await admin
          .from("org_members")
          .select("role, orgs(id, parent_org)")
          .eq("user_id", user.id)
          .eq("org_id", body.orgId ?? "")
          .maybeSingle();
        const org = member?.orgs as unknown as { id: string; parent_org: string | null } | null;
        if (!member || !org || !["owner", "admin"].includes(member.role)) return json({ error: "not_admin" }, 403);
        const root = org.parent_org ?? org.id;

        if (plan.id !== "multi") {
          const { count } = await admin.from("orgs").select("id", { count: "exact", head: true }).eq("parent_org", root);
          if ((count ?? 0) > 0) return json({ error: "has_child_orgs" }, 400);
        }

        const price = Math.round(plan.monthly * months * (months === 12 ? 0.9 : 1));
        // Modo de teste: PAYZENO_TEST_AMOUNT_MT=1 cobra 1 MT em qualquer plano, para testar o
        // fluxo completo com dinheiro real. O registo guarda o valor de facto cobrado.
        // Retirar a variável no Hostinger quando os testes acabarem.
        const testAmount = Number(process.env.PAYZENO_TEST_AMOUNT_MT ?? "");
        const amount = testAmount > 0 ? testAmount : price;
        const { data: row, error: insertError } = await admin
          .from("plan_payments")
          .insert({ org_id: root, created_by: user.id, plan: plan.id, months, amount, method, phone })
          .select("id")
          .single();
        if (insertError || !row) return json({ error: "insert_failed", detail: insertError?.message }, 500);

        const fullName = (user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined;
        const customer: Record<string, string> = { phone: `+258${phone}` };
        if (fullName) customer.name = fullName;
        if (user.email) customer.email = user.email;

        let session: Awaited<ReturnType<typeof createCheckoutSession>>;
        try {
          session = await createCheckoutSession(cfg, {
            paymentId: row.id,
            amountMt: amount,
            description: `Quota · plano ${plan.name} · ${months === 1 ? "1 mês" : `${months} meses`}${testAmount > 0 ? " · TESTE" : ""}`,
            method,
            customer,
          });
        } catch (error) {
          await admin.from("plan_payments").update({ status: "rejeitado", provider_raw: { step: "session", error: String(error) } }).eq("id", row.id);
          return json({ error: "provider_unreachable" }, 502);
        }

        if (!session.ok || !session.checkoutId || !session.checkoutUrl) {
          console.error("payzeno session failed", session.status, session.text.slice(0, 500));
          await admin
            .from("plan_payments")
            .update({ status: "rejeitado", provider_raw: { step: "session", status: session.status, body: session.text.slice(0, 2000) } })
            .eq("id", row.id);
          return json({ error: "provider_refused", detail: session.body }, 502);
        }

        await admin.from("plan_payments").update({ checkout_id: session.checkoutId, checkout_url: session.checkoutUrl }).eq("id", row.id);
        return json({ paymentId: row.id, checkoutUrl: session.checkoutUrl });
      },
    },
  },
});
