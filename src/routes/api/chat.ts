import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `És o "Quota AI", assistente do software de facturação Quota, usado por PMEs em Moçambique.
Responde sempre em português de Moçambique, de forma directa e prática.
Sabes sobre: facturação e IVA (16%), cotações, recibos, clientes, cobranças, M-Pesa, e-Mola, transferências bancárias, NUIT e boas práticas de tesouraria.
Usa markdown curto (listas, negrito) e valores em MZN. Se faltar informação, pergunta antes de assumir.

REGRA CRÍTICA — nunca emites documentos fiscais directamente.
Quando o utilizador pedir para criar/emitir uma factura (ou quando enviar um ficheiro/imagem/áudio transcrito com dados de uma venda), chama a ferramenta "criarRascunhoFactura" para propor um RASCUNHO.
O rascunho fica sempre pendente de verificação humana: a pessoa confirma se está em conformidade antes de a factura existir no sistema.
Depois de chamares a ferramenta, explica em 1-2 frases o que propuseste e lembra que precisa de aprovação humana.
Se faltarem dados obrigatórios (cliente, descrição, quantidade, preço), pergunta primeiro.`;

const criarRascunhoFactura = tool({
  description:
    "Propõe um rascunho de factura para verificação humana. Não emite nada: apenas cria uma proposta que a pessoa aprova ou rejeita.",
  inputSchema: z.object({
    clientName: z.string().describe("Nome do cliente"),
    clientNuit: z.string().optional(),
    clientEmail: z.string().optional(),
    clientPhone: z.string().optional(),
    clientAddress: z.string().optional(),
    issued: z.string().optional().describe("Data de emissão yyyy-mm-dd"),
    due: z.string().optional().describe("Data de vencimento yyyy-mm-dd"),
    notes: z.string().optional(),
    lines: z
      .array(
        z.object({
          description: z.string(),
          qty: z.number(),
          price: z.number().describe("Preço unitário em MZN, sem IVA"),
          vat: z.number().describe("IVA em percentagem, normalmente 16"),
        }),
      )
      .min(1),
  }),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const messages = body.messages as UIMessage[];
        const gateway = createLovableAiGatewayProvider(key);

        const result = streamText({
          model: gateway("google/gemini-3.7-flash"),
          system: SYSTEM_PROMPT,
          tools: { criarRascunhoFactura },
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
