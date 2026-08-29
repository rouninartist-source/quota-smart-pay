/**
 * Frontend-only store: layout escolhido para os documentos + tickets de
 * pedidos de templates personalizados (pagos).
 */
import { useEffect, useState } from "react";

export type DocTemplateId =
  | "classico"
  | "moderno"
  | "minimal"
  | "corporativo"
  | "elegante"
  | "basic-claro"
  | "basic-escuro";

export type DocTemplate = {
  id: DocTemplateId;
  name: string;
  tagline: string;
  description: string;
  bullets: string[];
};

export const docTemplates: DocTemplate[] = [
  {
    id: "classico",
    name: "Clássico",
    tagline: "Formal e fiscal",
    description:
      "Cabeçalho tradicional com logotipo à esquerda e dados fiscais bem visíveis. Ideal para contabilistas e concursos públicos.",
    bullets: ["Logotipo + NUIT em destaque", "Tabela com linhas finas", "Rodapé fiscal completo"],
  },
  {
    id: "moderno",
    name: "Moderno",
    tagline: "Faixa de marca",
    description:
      "Faixa escura no topo com o nome da empresa e o número do documento. Transmite marca forte em propostas e cotações.",
    bullets: ["Faixa de cor no topo", "Totais em bloco destacado", "Cabeçalho de tabela sombreado"],
  },
  {
    id: "minimal",
    name: "Minimal",
    tagline: "Limpo e leve",
    description:
      "Muito espaço branco, tipografia leve e apenas o essencial. Perfeito para serviços criativos e consultoria.",
    bullets: ["Sem molduras pesadas", "Tipografia discreta", "Foco no valor a pagar"],
  },
  {
    id: "corporativo",
    name: "Corporativo",
    tagline: "Barra lateral",
    description:
      "Barra lateral escura com o número do documento e o total a pagar. Boa para empresas com muitos documentos por mês.",
    bullets: ["Barra lateral de marca", "Total sempre visível", "Tabela com fundo alternado"],
  },
  {
    id: "basic-claro",
    name: "Basic Claro",
    tagline: "Bloco claro",
    description:
      "Cabeçalho em bloco cinza suave com o número, datas e o cliente. Rodapé em três colunas com instruções de pagamento (banco, M-Pesa e e-Mola) e notas.",
    bullets: ["Bloco de cabeçalho arredondado", "Totais em caixa destacada", "Rodapé com logos de pagamento"],
  },
  {
    id: "basic-escuro",
    name: "Basic Escuro",
    tagline: "Bloco escuro",
    description:
      "Mesma estrutura do Basic Claro, mas com o bloco de topo escuro e o nome da empresa em destaque. Ideal para marcas com identidade forte.",
    bullets: ["Cabeçalho escuro de marca", "Cliente e datas no topo", "Rodapé com dados bancários e carteiras"],
  },
  {
    id: "elegante",
    name: "Elegante",
    tagline: "Serifado premium",
    description:
      "Cabeçalho centrado, tipografia serifada e linhas duplas. Indicado para consultoria, arquitectura e serviços premium.",
    bullets: ["Cabeçalho centrado", "Linhas duplas discretas", "Totais em caixa suave"],
  },
];


const TEMPLATE_KEY = "quota.docTemplate.v1";
const TICKETS_KEY = "quota.templateTickets.v1";

/** Taxa fixa de desenvolvimento de um template personalizado. */
export const CUSTOM_TEMPLATE_FEE = 4500;

export type TicketStatus = "aberto" | "em_analise" | "resolvido";

export type TemplateTicket = {
  id: string;
  ref: string;
  title: string;
  description: string;
  contact: string;
  documents: string[];
  fee: number;
  status: TicketStatus;
  createdAt: number;
  resolvedAt?: number;
};

export const ticketStatusMeta: Record<TicketStatus, { label: string; tone: string }> = {
  aberto: { label: "Aberto", tone: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  em_analise: { label: "Em análise", tone: "bg-primary/10 text-primary border-primary/20" },
  resolvido: { label: "Resolvido", tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function getDocTemplate(): DocTemplateId {
  const v = readJson<DocTemplateId>(TEMPLATE_KEY, "classico");
  return docTemplates.some((t) => t.id === v) ? v : "classico";
}

export function setDocTemplate(id: DocTemplateId) {
  writeJson(TEMPLATE_KEY, id);
  emit();
}

/** Layout activo dos documentos (client-only, evita mismatch de hidratação). */
export function useDocTemplate(): DocTemplateId {
  const [id, setId] = useState<DocTemplateId>("classico");

  useEffect(() => {
    const refresh = () => setId(getDocTemplate());
    refresh();
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, []);

  return id;
}

export function listTickets(): TemplateTicket[] {
  return readJson<TemplateTicket[]>(TICKETS_KEY, []).sort((a, b) => b.createdAt - a.createdAt);
}

export function addTicket(
  input: Omit<TemplateTicket, "id" | "ref" | "status" | "createdAt" | "fee"> & { fee?: number },
): TemplateTicket {
  const all = readJson<TemplateTicket[]>(TICKETS_KEY, []);
  const ticket: TemplateTicket = {
    ...input,
    fee: input.fee ?? CUSTOM_TEMPLATE_FEE,
    id: `tk-${Date.now()}`,
    ref: `TPL-${String(all.length + 1).padStart(4, "0")}`,
    status: "aberto",
    createdAt: Date.now(),
  };
  writeJson(TICKETS_KEY, [ticket, ...all]);
  emit();
  return ticket;
}

export function setTicketStatus(id: string, status: TicketStatus) {
  writeJson(
    TICKETS_KEY,
    readJson<TemplateTicket[]>(TICKETS_KEY, []).map((t) =>
      t.id === id
        ? { ...t, status, resolvedAt: status === "resolvido" ? Date.now() : undefined }
        : t,
    ),
  );
  emit();
}

export function deleteTicket(id: string) {
  writeJson(
    TICKETS_KEY,
    readJson<TemplateTicket[]>(TICKETS_KEY, []).filter((t) => t.id !== id),
  );
  emit();
}

export function useTickets(): TemplateTicket[] {
  const [tickets, setTickets] = useState<TemplateTicket[]>([]);

  useEffect(() => {
    const refresh = () => setTickets(listTickets());
    refresh();
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, []);

  return tickets;
}
