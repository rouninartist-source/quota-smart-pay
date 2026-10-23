import { createFileRoute } from "@tanstack/react-router";
import { adminSupabase, payzenoConfig, signatureMatches, terminalStatus } from "@/lib/payzeno.server";

/**
 * A Payzeno avisa que um pagamento terminou.
 *
 * Esta rota não tem sessão de utilizador: a assinatura é a única prova de quem
 * chama. Sem segredo configurado, ou com assinatura errada, recusa tudo sem
 * ler o corpo — um webhook não assinado que activa planos é um plano grátis
 * para quem souber o URL.
 *
 * Respostas: 5xx quando a falha é nossa (a Payzeno volta a tentar, e
 * `settle_plan_payment` activa uma só vez); 200 para o que não se resolve com
 * nova tentativa (evento intermédio, checkout que não é nosso).
 */
export const Route = createFileRoute("/webhooks/payzeno")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cfg = payzenoConfig();
        const admin = adminSupabase();
        if (!cfg?.webhookSecret || !admin) {
          console.error("payzeno webhook not configured — refusing");
          return new Response("not configured", { status: 500 });
        }

        // Ler uma vez, como texto: a assinatura é sobre os bytes.
        const raw = await request.text();
        if (!signatureMatches(raw, request.headers.get(cfg.signatureHeader), cfg.webhookSecret)) {
          // Os nomes dos cabeçalhos (não os valores) ajudam a confirmar o formato real.
          console.warn("payzeno webhook: bad signature; headers:", [...request.headers.keys()].join(", "));
          return new Response("bad signature", { status: 401 });
        }

        let body: Record<string, unknown>;
        try {
          body = JSON.parse(raw);
        } catch {
          return new Response("bad json", { status: 400 });
        }

        const data = (body.data ?? body) as Record<string, unknown>;
        const checkoutId = (data.checkout_id ?? data.checkoutId ?? data.id) as string | undefined;
        if (!checkoutId) {
          console.error("payzeno webhook without checkout id", raw.slice(0, 400));
          return new Response("ok (no checkout id)", { status: 200 });
        }

        const status = terminalStatus(data.status ?? body.event ?? body.type);
        if (!status) return new Response("ok (not terminal)", { status: 200 });

        const providerRef = (data.reference ?? data.transaction_id ?? data.provider_ref) as string | undefined;
        const { error } = await admin.rpc("settle_plan_payment", {
          p_checkout_id: String(checkoutId),
          p_status: status,
          p_provider_ref: providerRef ?? null,
          p_raw: { via: "webhook", body },
        });
        if (error) {
          console.error("settle_plan_payment failed", error);
          return new Response("settle failed", { status: 500 });
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
