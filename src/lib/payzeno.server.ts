import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Payzeno — só no servidor. A chave da API movimenta dinheiro e a chave
// service_role do Supabase ignora o RLS; nenhuma das duas pode ir para o browser.
//
// O que está confirmado (pela integração do Pickup360, na mesma conta):
//   - base https://api.payzeno.io/v1, cabeçalho `Api-Key`;
//   - POST /checkout/sessions → { checkout_id, checkout_url, expires_at };
//   - GET  /checkout/sessions/{id}/status;
//   - pagamento directo (push para o telemóvel) NÃO está activo na conta, por
//     isso o cliente paga na página alojada (checkout_url).
// O que ainda é suposição, e por isso fica em variáveis de ambiente:
//   - o cabeçalho e o formato da assinatura do webhook;
//   - se `amount` vai em cêntimos ou em meticais. O primeiro pagamento real
//     deve ser o mais pequeno possível e conferido no painel da Payzeno.

export type PayzenoConfig = {
  apiKey: string;
  base: string;
  webhookSecret: string | undefined;
  signatureHeader: string;
  amountInMinorUnits: boolean;
  siteUrl: string;
};

export function payzenoConfig(): PayzenoConfig | null {
  const apiKey = process.env.PAYZENO_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    base: (process.env.PAYZENO_BASE ?? "https://api.payzeno.io/v1").replace(/\/$/, ""),
    webhookSecret: process.env.PAYZENO_WEBHOOK_SECRET,
    signatureHeader: (process.env.PAYZENO_SIGNATURE_HEADER ?? "payzeno-signature").toLowerCase(),
    amountInMinorUnits: (process.env.PAYZENO_AMOUNT_UNIT ?? "minor") === "minor",
    siteUrl: (process.env.VITE_SITE_URL ?? import.meta.env.VITE_SITE_URL ?? "https://quota.milsonuix.com").replace(/\/$/, ""),
  };
}

/** Cliente com service_role — ignora o RLS. Só para escrever pagamentos e activar planos. */
export function adminSupabase(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL ?? (import.meta.env.VITE_SUPABASE_URL as string | undefined);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** O estado da Payzeno, traduzido para os da tabela. Desconhecido → null (fica pendente). */
const TERMINAL: Record<string, "confirmado" | "rejeitado" | "expirado"> = {
  paid: "confirmado",
  success: "confirmado",
  successful: "confirmado",
  succeeded: "confirmado",
  completed: "confirmado",
  complete: "confirmado",
  failed: "rejeitado",
  failure: "rejeitado",
  declined: "rejeitado",
  cancelled: "rejeitado",
  canceled: "rejeitado",
  expired: "expirado",
  timeout: "expirado",
};

export function terminalStatus(raw: unknown) {
  const key = String(raw ?? "").toLowerCase().replace(/^(payment|checkout)[._]/, "");
  return TERMINAL[key] ?? null;
}

/** Hex HMAC-SHA256 do corpo cru, aceite com ou sem o prefixo `sha256=`. */
export function signatureMatches(raw: string, provided: string | null, secret: string | undefined) {
  if (!secret || !provided) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const given = provided.trim().replace(/^sha256=/i, "").toLowerCase();
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

type Json = Record<string, unknown>;

async function call(cfg: PayzenoConfig, path: string, init: RequestInit) {
  const res = await fetch(`${cfg.base}${path}`, {
    ...init,
    headers: { "Api-Key": cfg.apiKey, "Content-Type": "application/json", ...init.headers },
  });
  const text = await res.text();
  let body: Json = {};
  try {
    body = JSON.parse(text) as Json;
  } catch {
    // Uma página de erro em HTML — o texto é o que há de útil.
  }
  return { ok: res.ok, status: res.status, body, text };
}

export async function createCheckoutSession(
  cfg: PayzenoConfig,
  p: { paymentId: string; amountMt: number; description: string; method: "mpesa" | "emola"; customer: Json },
) {
  const r = await call(cfg, "/checkout/sessions", {
    method: "POST",
    headers: { "Idempotency-Key": `plan-${p.paymentId}` },
    body: JSON.stringify({
      amount: cfg.amountInMinorUnits ? Math.round(p.amountMt * 100) : p.amountMt,
      currency: "MZN",
      description: p.description,
      customer: p.customer,
      payment_methods: [p.method],
      success_url: `${cfg.siteUrl}/dashboard/planos/pagar?pagamento=${p.paymentId}`,
      cancel_url: `${cfg.siteUrl}/dashboard/planos/pagar?pagamento=${p.paymentId}`,
    }),
  });
  const data = (r.body.data ?? {}) as Json;
  const checkoutId = r.body.checkout_id ?? r.body.id ?? data.checkout_id ?? data.id;
  const checkoutUrl = r.body.checkout_url ?? r.body.url ?? data.checkout_url ?? data.url;
  return {
    ...r,
    checkoutId: checkoutId ? String(checkoutId) : null,
    checkoutUrl: checkoutUrl ? String(checkoutUrl) : null,
  };
}

export async function checkoutStatus(cfg: PayzenoConfig, checkoutId: string) {
  const r = await call(cfg, `/checkout/sessions/${encodeURIComponent(checkoutId)}/status`, { method: "GET" });
  const data = (r.body.data ?? r.body) as Json;
  const providerRef = data.reference ?? data.transaction_id ?? data.provider_ref;
  return {
    ...r,
    status: terminalStatus(data.status ?? data.payment_status),
    providerRef: providerRef ? String(providerRef) : null,
  };
}
