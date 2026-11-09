import { createFileRoute } from "@tanstack/react-router";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { z } from "zod";

/**
 * Quota AI — conversa com o Claude (API da Anthropic, chave ANTHROPIC_API_KEY).
 *
 * O ecrã usa o `useChat` do AI SDK; aqui fala-se com o Claude pelo SDK oficial
 * e traduz-se o stream para o protocolo de mensagens que o ecrã já entende.
 * Cada pedido consome uma operação de Quota AI no Postgres (use_ai_credit) —
 * no servidor, para que ninguém gaste créditos da API chamando a rota directamente.
 */

const SYSTEM_PROMPT = `És o "Quota AI", assistente do software de facturação Quota, usado por PMEs em Moçambique.
Responde sempre em português de Moçambique, de forma directa e prática.
Sabes sobre: facturação e IVA (16%), cotações, recibos, clientes, cobranças, M-Pesa, e-Mola, transferências bancárias, NUIT e boas práticas de tesouraria.
Usa markdown curto (listas, negrito) e valores em MZN. Se faltar informação, pergunta antes de assumir.

Nunca emites documentos fiscais directamente. Quando o utilizador pedir para criar ou emitir uma factura — ou enviar um ficheiro, imagem ou texto com os dados de uma venda — usa a ferramenta "criarRascunhoFactura" para propor um RASCUNHO. O rascunho fica pendente de verificação humana: a pessoa confirma se está em conformidade antes de a factura existir no sistema. Antes de chamar a ferramenta, explica numa ou duas frases o que vais propor e lembra que precisa de aprovação humana.
Se faltarem dados obrigatórios (cliente, descrição, quantidade, preço), pergunta primeiro em vez de inventar.`;

const TOOL_NAME = "criarRascunhoFactura";

/** Validação do que o Claude propõe (o input chega em streaming e é validado aqui). */
const draftSchema = z.object({
  clientName: z.string().min(1),
  clientNuit: z.string().optional(),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  issued: z.string().optional(),
  due: z.string().optional(),
  notes: z.string().optional(),
  lines: z
    .array(z.object({ description: z.string().min(1), qty: z.number(), price: z.number(), vat: z.number() }))
    .min(1),
});

const tools: Anthropic.Beta.BetaToolUnion[] = [
  {
    name: TOOL_NAME,
    description:
      "Propõe um rascunho de factura para verificação humana. Não emite nada: apenas cria uma proposta que a pessoa aprova ou rejeita.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["clientName", "lines"],
      properties: {
        clientName: { type: "string", description: "Nome do cliente" },
        clientNuit: { type: "string", description: "NUIT do cliente (9 dígitos), se conhecido" },
        clientEmail: { type: "string" },
        clientPhone: { type: "string" },
        clientAddress: { type: "string" },
        issued: { type: "string", description: "Data de emissão, yyyy-mm-dd" },
        due: { type: "string", description: "Data de vencimento, yyyy-mm-dd" },
        notes: { type: "string" },
        lines: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["description", "qty", "price", "vat"],
            properties: {
              description: { type: "string" },
              qty: { type: "number" },
              price: { type: "number", description: "Preço unitário em MZN, sem IVA" },
              vat: { type: "number", description: "IVA em percentagem, normalmente 16" },
            },
          },
        },
      },
    },
  },
];

type Part = UIMessage["parts"][number];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

/** Ids de tool_use têm de ser [a-zA-Z0-9_-] (conversas antigas podem ter outros formatos). */
const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "tool";

function fileBlock(part: Extract<Part, { type: "file" }>): Anthropic.Beta.BetaContentBlockParam {
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(part.url);
  const name = part.filename ?? "ficheiro";
  if (m) {
    const [, mediaType, data] = m;
    if ((IMAGE_TYPES as readonly string[]).includes(mediaType))
      return { type: "image", source: { type: "base64", media_type: mediaType as (typeof IMAGE_TYPES)[number], data } };
    if (mediaType === "application/pdf") return { type: "document", source: { type: "base64", media_type: "application/pdf", data }, title: name };
    if (mediaType.startsWith("text/") || mediaType === "application/json" || mediaType === "text/csv")
      return { type: "text", text: `Conteúdo do ficheiro ${name}:\n${Buffer.from(data, "base64").toString("utf8").slice(0, 200_000)}` };
  } else if (/^https?:\/\//.test(part.url) && part.mediaType?.startsWith("image/")) {
    return { type: "image", source: { type: "url", url: part.url } };
  }
  return { type: "text", text: `[Anexo «${name}» (${part.mediaType ?? "tipo desconhecido"}) — formato não suportado; peça os dados por texto ou em PDF/imagem.]` };
}

/**
 * Conversa do ecrã (UIMessage) → mensagens do Claude. Uma proposta de rascunho
 * já mostrada fica como tool_use, com o tool_result correspondente no turno
 * seguinte do utilizador (a API exige o par).
 */
function toClaude(messages: UIMessage[]): Anthropic.Beta.BetaMessageParam[] {
  const out: Anthropic.Beta.BetaMessageParam[] = [];
  let pendingResults: string[] = [];

  for (const m of messages) {
    if (m.role === "user") {
      const content: Anthropic.Beta.BetaContentBlockParam[] = pendingResults.map((id) => ({
        type: "tool_result",
        tool_use_id: id,
        content: "Rascunho apresentado ao utilizador para verificação humana.",
      }));
      pendingResults = [];
      for (const p of m.parts) {
        if (p.type === "text" && p.text.trim()) content.push({ type: "text", text: p.text });
        else if (p.type === "file") content.push(fileBlock(p));
      }
      if (content.length) out.push({ role: "user", content });
    } else if (m.role === "assistant") {
      const content: Anthropic.Beta.BetaContentBlockParam[] = [];
      for (const p of m.parts) {
        if (p.type === "text" && p.text.trim()) content.push({ type: "text", text: p.text });
        else if (p.type === `tool-${TOOL_NAME}` && "input" in p && p.input && typeof p.input === "object") {
          const id = safeId((p as { toolCallId: string }).toolCallId);
          content.push({ type: "tool_use", id, name: TOOL_NAME, input: p.input as Record<string, unknown> });
          pendingResults.push(id);
        }
      }
      if (content.length) out.push({ role: "assistant", content });
    }
  }
  // Uma proposta no último turno do assistente ainda precisa do seu resultado.
  if (pendingResults.length)
    out.push({ role: "user", content: pendingResults.map((id) => ({ type: "tool_result", tool_use_id: id, content: "Rascunho apresentado ao utilizador para verificação humana." })) });
  return out;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Consome uma operação de Quota AI como o próprio utilizador (o Postgres aplica o limite do plano). */
async function useCredit(token: string) {
  const url = process.env.VITE_SUPABASE_URL ?? (import.meta.env.VITE_SUPABASE_URL as string | undefined);
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined);
  if (!url || !key) return { error: "not_configured" as const };
  const sb = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data, error } = await sb.rpc("use_ai_credit");
  if (error) return { error: /JWT|auth/i.test(error.message) ? ("not_signed_in" as const) : ("credit_failed" as const) };
  return { credit: data as { allowed: boolean; uses: number; limit: number | null; trial?: boolean } };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) return json({ error: "not_configured", message: "O Quota AI ainda não está configurado (ANTHROPIC_API_KEY)." }, 503);

        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return json({ error: "not_signed_in", message: "Inicie sessão para usar o Quota AI." }, 401);

        const body = (await request.json().catch(() => ({}))) as { messages?: unknown };
        if (!Array.isArray(body.messages)) return json({ error: "bad_request", message: "Pedido inválido." }, 400);
        const uiMessages = body.messages as UIMessage[];

        const { credit, error } = await useCredit(token);
        if (error) return json({ error, message: error === "not_signed_in" ? "Sessão expirada — entre de novo." : "Não foi possível verificar os créditos de IA." }, error === "not_signed_in" ? 401 : 500);
        if (!credit.allowed)
          return json(
            {
              error: "ai_limit",
              trial: !!credit.trial,
              limit: credit.limit,
              message: credit.trial
                ? `Limite do período experimental: ${credit.limit} operações de Quota AI.`
                : `Atingiu as ${credit.limit} operações de Quota AI deste mês.`,
            },
            429,
          );

        const client = new Anthropic({ apiKey });
        const model = process.env.CLAUDE_MODEL || "claude-opus-5-5";

        const stream = createUIMessageStream({
          originalMessages: uiMessages,
          onError: (err) => {
            console.error("quota ai", err);
            if (err instanceof Anthropic.RateLimitError) return "O Quota AI está com muitos pedidos. Tente dentro de um minuto.";
            if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return "O Quota AI não está disponível de momento (configuração da API).";
            if (err instanceof Anthropic.BadRequestError) return "Não foi possível processar este pedido (anexo grande demais ou formato não suportado?).";
            return "O Quota AI não conseguiu responder. Tente novamente.";
          },
          execute: async ({ writer }) => {
            writer.write({ type: "start" });
            // Contador para o ecrã mostrar "N de M operações".
            writer.write({ type: "data-credit", data: { uses: credit.uses, limit: credit.limit, trial: !!credit.trial }, transient: true });

            const response = client.beta.messages.stream({
              model,
              max_tokens: 16000,
              system: SYSTEM_PROMPT,
              messages: toClaude(uiMessages),
              tools,
              output_config: { effort: "medium" },
              // Recusas de segurança passam para o modelo de recurso em vez de deixar a conversa sem resposta.
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
            });

            let textId: string | null = null;
            let n = 0;
            for await (const event of response) {
              if (event.type === "content_block_start" && event.content_block.type === "text") {
                textId = `t${n++}`;
                writer.write({ type: "text-start", id: textId });
              } else if (event.type === "content_block_delta" && event.delta.type === "text_delta" && textId) {
                writer.write({ type: "text-delta", id: textId, delta: event.delta.text });
              } else if (event.type === "content_block_stop" && textId) {
                writer.write({ type: "text-end", id: textId });
                textId = null;
              }
            }
            const final = await response.finalMessage();

            if (final.stop_reason === "refusal") {
              const id = `t${n++}`;
              writer.write({ type: "text-start", id });
              writer.write({ type: "text-delta", id, delta: "Não posso ajudar com este pedido. Reformule ou peça algo relacionado com facturação." });
              writer.write({ type: "text-end", id });
            }

            for (const block of final.content) {
              if (block.type !== "tool_use" || block.name !== TOOL_NAME) continue;
              // Só depois de terminado (max_tokens pode cortar o input a meio).
              const parsed = final.stop_reason === "max_tokens" ? null : draftSchema.safeParse(block.input);
              if (parsed?.success) {
                writer.write({ type: "tool-input-available", toolCallId: block.id, toolName: TOOL_NAME, input: parsed.data });
                writer.write({ type: "tool-output-available", toolCallId: block.id, output: { status: "pendente_verificacao" } });
              } else {
                writer.write({ type: "tool-input-error", toolCallId: block.id, toolName: TOOL_NAME, input: block.input, errorText: "Proposta de rascunho incompleta. Peça de novo com os dados da venda." });
              }
            }
            writer.write({ type: "finish" });
          },
        });

        return createUIMessageStreamResponse({ stream });
      },
    },
  },
});
