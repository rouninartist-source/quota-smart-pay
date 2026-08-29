/**
 * Rascunhos propostos pelo Quota AI.
 * Nada é emitido automaticamente: cada rascunho precisa de verificação humana.
 */
import { useEffect, useState } from "react";
import { addInvoice, nextInvoiceNumber, type InvoiceLine } from "@/lib/invoices-store";

export type DraftStatus = "pendente" | "aprovado" | "rejeitado";

export type AiInvoiceDraft = {
  id: string;
  createdAt: number;
  status: DraftStatus;
  threadId?: string;
  clientName: string;
  clientNuit?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  issued?: string;
  due?: string;
  notes?: string;
  lines: InvoiceLine[];
  invoiceId?: string;
  reviewNote?: string;
};

const KEY = "quota.aiDrafts.v1";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): AiInvoiceDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as AiInvoiceDraft[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(drafts: AiInvoiceDraft[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(drafts));
  } catch {
    /* ignore */
  }
}

function iso(offsetDays = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function listDrafts() {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getDraft(id: string) {
  return read().find((d) => d.id === id);
}

/** Cria (idempotente por id) um rascunho proposto pela AI. */
export function upsertDraft(
  id: string,
  input: Omit<AiInvoiceDraft, "id" | "createdAt" | "status">,
): AiInvoiceDraft {
  const all = read();
  const existing = all.find((d) => d.id === id);
  if (existing) return existing;
  const draft: AiInvoiceDraft = { ...input, id, createdAt: Date.now(), status: "pendente" };
  write([draft, ...all]);
  emit();
  return draft;
}

/** Verificação humana positiva: emite a factura como rascunho no sistema. */
export function approveDraft(id: string, reviewNote?: string) {
  const draft = getDraft(id);
  if (!draft || draft.status !== "pendente") return undefined;

  const invoice = addInvoice({
    number: nextInvoiceNumber(),
    issued: draft.issued || iso(0),
    due: draft.due || iso(14),
    status: "rascunho",
    notes: draft.notes,
    client: {
      name: draft.clientName,
      nuit: draft.clientNuit ?? "",
      email: draft.clientEmail ?? "",
      phone: draft.clientPhone ?? "",
      address: draft.clientAddress ?? "",
    },
    lines: draft.lines,
  });

  write(
    read().map((d) =>
      d.id === id ? { ...d, status: "aprovado", invoiceId: invoice.id, reviewNote } : d,
    ),
  );
  emit();
  return invoice;
}

export function rejectDraft(id: string, reviewNote?: string) {
  write(read().map((d) => (d.id === id ? { ...d, status: "rejeitado", reviewNote } : d)));
  emit();
}

export function useDrafts() {
  const [drafts, setDrafts] = useState<AiInvoiceDraft[]>([]);
  useEffect(() => {
    const refresh = () => setDrafts(listDrafts());
    refresh();
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, []);
  return drafts;
}

export function useDraft(id: string | undefined) {
  const drafts = useDrafts();
  return id ? drafts.find((d) => d.id === id) : undefined;
}
