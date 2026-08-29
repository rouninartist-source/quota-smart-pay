/**
 * Frontend-only internal team chat store (demo, localStorage per browser).
 */
import { useCallback, useEffect, useState } from "react";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  initials: string;
};

export type ChannelKind = "empresa" | "grupo" | "directa";

export type ChatMessage = {
  id: string;
  channelId: string;
  authorId: string;
  text: string;
  at: number;
};

export type Channel = {
  id: string;
  name: string;
  kind: ChannelKind;
  topic?: string;
  memberIds: string[];
};

export const members: TeamMember[] = [
  { id: "u-me", name: "Milson Neto", role: "Gestor", initials: "MN" },
  { id: "u-ana", name: "Ana Chissano", role: "Facturação", initials: "AC" },
  { id: "u-rui", name: "Rui Macuácua", role: "Cobranças", initials: "RM" },
  { id: "u-lia", name: "Lia Tembe", role: "Contabilidade", initials: "LT" },
  { id: "u-dan", name: "Dani Mabote", role: "Vendas", initials: "DM" },
];

export const ME = "u-me";

const CH_KEY = "quota.team.channels.v1";
const MSG_KEY = "quota.team.messages.v1";

const allIds = members.map((m) => m.id);

function seedChannels(): Channel[] {
  return [
    {
      id: "ch-empresa",
      name: "Toda a empresa",
      kind: "empresa",
      topic: "Anúncios e assuntos gerais da equipa Quota",
      memberIds: allIds,
    },
    {
      id: "ch-cobrancas",
      name: "Cobranças",
      kind: "grupo",
      topic: "Seguimento de facturas pendentes e vencidas",
      memberIds: ["u-me", "u-rui", "u-lia"],
    },
    {
      id: "ch-vendas",
      name: "Vendas",
      kind: "grupo",
      topic: "Cotações, novos clientes e propostas",
      memberIds: ["u-me", "u-dan", "u-ana"],
    },
    { id: "ch-dm-ana", name: "Ana Chissano", kind: "directa", memberIds: ["u-me", "u-ana"] },
  ];
}

const T = 60_000;
function seedMessages(base: number): ChatMessage[] {
  const m = (channelId: string, authorId: string, text: string, minsAgo: number): ChatMessage => ({
    id: `seed-${channelId}-${minsAgo}-${authorId}`,
    channelId,
    authorId,
    text,
    at: base - minsAgo * T,
  });
  return [
    m("ch-empresa", "u-ana", "Bom dia equipa! Já emitimos 12 facturas esta manhã. 🚀", 240),
    m("ch-empresa", "u-lia", "Lembrete: fecho do IVA é na próxima sexta.", 180),
    m("ch-empresa", "u-me", "Obrigado Lia. Vamos ter os relatórios prontos até quinta.", 175),
    m("ch-cobrancas", "u-rui", "A Beira Logística prometeu pagar a FT 2026/00186 até amanhã.", 120),
    m("ch-cobrancas", "u-me", "Envia recibo por WhatsApp assim que entrar o M-Pesa.", 118),
    m("ch-vendas", "u-dan", "Nova cotação para a Farmácia Nampula: 84 500 MZN.", 90),
    m("ch-dm-ana", "u-ana", "Podes revisar a factura do João Comercial?", 45),
  ];
}

let channels: Channel[] = seedChannels();
let messages: ChatMessage[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CH_KEY, JSON.stringify(channels));
    localStorage.setItem(MSG_KEY, JSON.stringify(messages));
  } catch {
    /* ignore */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const rawCh = localStorage.getItem(CH_KEY);
    const rawMsg = localStorage.getItem(MSG_KEY);
    channels = rawCh ? (JSON.parse(rawCh) as Channel[]) : seedChannels();
    messages = rawMsg ? (JSON.parse(rawMsg) as ChatMessage[]) : seedMessages(Date.now());
    if (!rawCh || !rawMsg) persist();
  } catch {
    channels = seedChannels();
    messages = seedMessages(Date.now());
  }
  emit();
}

export function getChannels() {
  return channels;
}

export function getChannel(id: string) {
  return channels.find((c) => c.id === id);
}

export function getMessages(channelId: string) {
  return messages.filter((m) => m.channelId === channelId).sort((a, b) => a.at - b.at);
}

export function memberById(id: string) {
  return members.find((m) => m.id === id);
}

export function sendMessage(channelId: string, text: string, authorId = ME) {
  const trimmed = text.trim();
  if (!trimmed) return;
  messages = [
    ...messages,
    { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, channelId, authorId, text: trimmed, at: Date.now() },
  ];
  persist();
  emit();
}

export function createChannel(name: string, memberIds: string[], topic?: string, kind: ChannelKind = "grupo") {
  const channel: Channel = {
    id: `ch-${Date.now()}`,
    name: name.trim() || "Novo grupo",
    kind,
    topic: topic?.trim() || undefined,
    memberIds: Array.from(new Set([ME, ...memberIds])),
  };
  channels = [...channels, channel];
  persist();
  emit();
  return channel;
}

export function deleteChannel(id: string) {
  if (id === "ch-empresa") return;
  channels = channels.filter((c) => c.id !== id);
  messages = messages.filter((m) => m.channelId !== id);
  persist();
  emit();
}

function useStore<T>(select: () => T): T {
  const [value, setValue] = useState<T>(select);
  const refresh = useCallback(() => setValue(select()), [select]);
  useEffect(() => {
    hydrate();
    refresh();
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, [refresh]);
  return value;
}

export function useChannels() {
  return useStore(useCallback(() => getChannels(), []));
}

export function useChannelMessages(channelId: string) {
  return useStore(useCallback(() => getMessages(channelId), [channelId]));
}

export function useChannel(channelId: string) {
  return useStore(useCallback(() => getChannel(channelId), [channelId]));
}

export function formatTime(at: number) {
  return new Date(at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}
