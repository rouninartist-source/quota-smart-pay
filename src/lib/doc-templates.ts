/**
 * Frontend-only store: layout escolhido para os documentos + tickets de
 * pedidos de templates personalizados (pagos).
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "./supabase";

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

function fail(action: string, error: { message: string }) {
  console.error(`[templates] ${action}:`, error.message);
  toast.error(`Não foi possível ${action}`, { description: error.message });
}

/* ---------------- layout activo ---------------- */

let templateId: DocTemplateId = "classico";
let companyRowId: string | null = null;
let tplHydrated = false;

async function loadTemplate() {
  const sb = supabase;
  if (!sb) return;
  const { data, error } = await sb.from("company").select("id,doc_template").limit(1).maybeSingle();
  if (error || !data) return;
  companyRowId = data.id as string;
  const v = data.doc_template as DocTemplateId;
  if (docTemplates.some((t) => t.id === v)) {
    templateId = v;
    emit();
  }
}

export function getDocTemplate(): DocTemplateId {
  return templateId;
}

export async function setDocTemplate(id: DocTemplateId) {
  const sb = supabase;
  const previous = templateId;
  templateId = id;
  emit();
  if (!sb) return;
  if (!companyRowId) await loadTemplate();
  if (!companyRowId) return;
  const { error } = await sb.from("company").update({ doc_template: id }).eq("id", companyRowId);
  if (error) {
    templateId = previous;
    emit();
    fail("aplicar o layout", error);
  }
}

/** Layout activo dos documentos (client-only, evita mismatch de hidratação). */
export function useDocTemplate(): DocTemplateId {
  const [id, setId] = useState<DocTemplateId>("classico");

  useEffect(() => {
    const refresh = () => setId(getDocTemplate());
    listeners.add(refresh);
    if (!tplHydrated) {
      tplHydrated = true;
      void loadTemplate();
    }
    refresh();
    return () => {
      listeners.delete(refresh);
    };
  }, []);

  return id;
}

/* ---------------- tickets ---------------- */

type TicketRow = {
  id: string;
  ref: string;
  title: string;
  description: string;
  contact: string;
  documents: string[] | null;
  fee: number;
  status: TicketStatus;
  created_at: string;
  resolved_at: string | null;
};

const toTicket = (r: TicketRow): TemplateTicket => ({
  id: r.id,
  ref: r.ref,
  title: r.title,
  description: r.description,
  contact: r.contact,
  documents: r.documents ?? [],
  fee: Number(r.fee),
  status: r.status,
  createdAt: new Date(r.created_at).getTime(),
  resolvedAt: r.resolved_at ? new Date(r.resolved_at).getTime() : undefined,
});

let tickets: TemplateTicket[] = [];
let ticketsHydrated = false;

const TICKET_SELECT = "id,ref,title,description,contact,documents,fee,status,created_at,resolved_at";

async function loadTickets() {
  const sb = supabase;
  if (!sb) return;
  const { data, error } = await sb
    .from("template_tickets")
    .select(TICKET_SELECT)
    .order("created_at", { ascending: false });
  if (error) {
    ticketsHydrated = false;
    fail("carregar os pedidos", error);
    return;
  }
  tickets = ((data ?? []) as TicketRow[]).map(toTicket);
  emit();
}

export function listTickets(): TemplateTicket[] {
  return tickets;
}

export async function addTicket(
  input: Omit<TemplateTicket, "id" | "ref" | "status" | "createdAt" | "fee"> & { fee?: number },
): Promise<TemplateTicket | undefined> {
  const sb = supabase;
  if (!sb) return undefined;

  const { data: ref, error: refError } = await sb.rpc("next_ticket_ref");
  if (refError) {
    fail("obter a referência do pedido", refError);
    return undefined;
  }

  const { data, error } = await sb
    .from("template_tickets")
    .insert({
      ref: ref as string,
      title: input.title,
      description: input.description,
      contact: input.contact,
      documents: input.documents,
      fee: input.fee ?? CUSTOM_TEMPLATE_FEE,
    })
    .select(TICKET_SELECT)
    .single();

  if (error || !data) {
    fail("criar o pedido", error ?? { message: "sem resposta" });
    return undefined;
  }

  const ticket = toTicket(data as TicketRow);
  tickets = [ticket, ...tickets];
  emit();
  return ticket;
}

export async function setTicketStatus(id: string, status: TicketStatus) {
  const sb = supabase;
  if (!sb) return;
  const resolvedAt = status === "resolvido" ? new Date().toISOString() : null;
  const previous = tickets;
  tickets = tickets.map((t) =>
    t.id === id
      ? { ...t, status, resolvedAt: resolvedAt ? Date.parse(resolvedAt) : undefined }
      : t,
  );
  emit();
  const { error } = await sb
    .from("template_tickets")
    .update({ status, resolved_at: resolvedAt })
    .eq("id", id);
  if (error) {
    tickets = previous;
    emit();
    fail("mudar o estado do pedido", error);
  }
}

export async function deleteTicket(id: string) {
  const sb = supabase;
  if (!sb) return;
  const previous = tickets;
  tickets = tickets.filter((t) => t.id !== id);
  emit();
  const { error } = await sb.from("template_tickets").delete().eq("id", id);
  if (error) {
    tickets = previous;
    emit();
    fail("apagar o pedido", error);
  }
}

export function useTickets(): TemplateTicket[] {
  const [list, setList] = useState<TemplateTicket[]>(tickets);

  useEffect(() => {
    const refresh = () => setList(listTickets());
    listeners.add(refresh);
    if (!ticketsHydrated) {
      ticketsHydrated = true;
      void loadTickets();
    }
    refresh();
    return () => {
      listeners.delete(refresh);
    };
  }, []);

  return list;
}
