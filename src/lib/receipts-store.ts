/**
 * Recibos de cliente — um recibo para uma ou várias facturas.
 *
 * O recibo é um documento fechado: guarda o retrato do cliente e de cada
 * factura no momento em que foi emitido. Os pagamentos de cada factura são
 * criados pela função `issue_client_receipt`, numa só transacção.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "./supabase";
import { emptyClient, reloadInvoices, type DocumentKind, type InvoiceClient, type PaymentMethod } from "./invoices-store";

export type ReceiptItem = {
  invoiceId: string;
  number: string;
  kind: DocumentKind;
  issued: string;
  invoiceTotal: number;
  amount: number;
  balanceAfter: number;
};

export type Receipt = {
  id: string;
  orgId?: string;
  number: string;
  issued: string;
  clientId?: string;
  client: InvoiceClient;
  method: PaymentMethod;
  reference?: string;
  total: number;
  items: ReceiptItem[];
  notes?: string;
};

type ItemRow = {
  invoice_id: string;
  number: string;
  kind: DocumentKind;
  issued: string;
  invoice_total: number;
  amount: number;
  balance_after: number;
};

type Row = {
  id: string;
  org_id?: string | null;
  number: string;
  issued: string;
  client_id: string | null;
  client_snapshot: InvoiceClient | null;
  method: PaymentMethod;
  reference: string | null;
  total: number;
  items: ItemRow[] | null;
  notes: string | null;
};

const SELECT = "id,org_id,number,issued,client_id,client_snapshot,method,reference,total,items,notes";

const toReceipt = (r: Row): Receipt => ({
  id: r.id,
  orgId: r.org_id ?? undefined,
  number: r.number,
  issued: r.issued,
  clientId: r.client_id ?? undefined,
  client: { ...emptyClient, ...(r.client_snapshot ?? {}) },
  method: r.method,
  reference: r.reference ?? undefined,
  total: Number(r.total),
  items: (r.items ?? []).map((i) => ({
    invoiceId: i.invoice_id,
    number: i.number,
    kind: i.kind,
    issued: i.issued,
    invoiceTotal: Number(i.invoice_total),
    amount: Number(i.amount),
    balanceAfter: Number(i.balance_after),
  })),
  notes: r.notes ?? undefined,
});

let receipts: Receipt[] = [];
let hydrated = false;
let loadedOnce = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function fail(action: string, error: { message: string }) {
  console.error(`[receipts] ${action}:`, error.message);
  toast.error(`Não foi possível ${action}`, { description: error.message });
}

async function load() {
  const sb = supabase;
  if (!sb) return;
  const { data, error } = await sb.from("receipts").select(SELECT).order("created_at", { ascending: false });
  if (error) {
    hydrated = false;
    fail("carregar os recibos", error);
    return;
  }
  receipts = ((data ?? []) as Row[]).map(toReceipt);
  loadedOnce = true;
  emit();
}

export function hydrateReceipts() {
  if (hydrated || typeof window === "undefined") return inflight ?? Promise.resolve();
  hydrated = true;
  inflight = load().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function getReceipt(id: string) {
  return receipts.find((r) => r.id === id);
}

export function useReceipts() {
  const [list, setList] = useState<Receipt[]>(receipts);
  useEffect(() => {
    const sync = () => setList(receipts);
    listeners.add(sync);
    hydrateReceipts();
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return list;
}

export function useReceipt(id: string) {
  return useReceipts().find((r) => r.id === id);
}

export function useReceiptsReady() {
  const [ready, setReady] = useState(loadedOnce);
  useEffect(() => {
    const sync = () => setReady(loadedOnce);
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return ready;
}

/** Emite o recibo e recarrega as facturas (saldos e estados mudaram). */
export async function issueClientReceipt(input: {
  clientId?: string;
  client: InvoiceClient;
  items: { invoiceId: string; amount: number }[];
  method: PaymentMethod;
  reference?: string;
  date: string;
  notes?: string;
}) {
  const sb = supabase;
  if (!sb) return undefined;
  const { data, error } = await sb.rpc("issue_client_receipt", {
    p_client_id: input.clientId ?? null,
    p_client: input.client,
    p_items: input.items.map((i) => ({ invoice_id: i.invoiceId, amount: Math.round(i.amount * 100) / 100 })),
    p_method: input.method,
    p_reference: input.reference ?? null,
    p_date: input.date,
    p_notes: input.notes ?? null,
  });
  if (error || !data) {
    fail("emitir o recibo", error ?? { message: "sem resposta" });
    return undefined;
  }
  const receipt = toReceipt(data as Row);
  receipts = [receipt, ...receipts.filter((r) => r.id !== receipt.id)];
  emit();
  await reloadInvoices();
  return receipt;
}
