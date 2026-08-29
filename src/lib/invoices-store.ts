/**
 * Frontend-only factura store.
 * Seeds a demo client with a few facturas and persists to localStorage.
 */
import { useEffect, useState } from "react";

export type InvoiceStatus = "rascunho" | "enviada" | "paga" | "vencida" | "parcial";

export type InvoiceLine = {
  description: string;
  qty: number;
  price: number;
  vat: number; // percent
};

export type InvoiceClient = {
  name: string;
  nuit: string;
  email: string;
  phone: string;
  address: string;
};

export type PaymentMethod = "mpesa" | "emola" | "transferencia" | "numerario" | "cheque";

export type Payment = {
  id: string;
  date: string; // yyyy-mm-dd
  amount: number;
  method: PaymentMethod;
  reference?: string;
};

export type Invoice = {
  id: string;
  number: string;
  issued: string; // yyyy-mm-dd
  due: string; // yyyy-mm-dd
  status: InvoiceStatus;
  notes?: string;
  clientId?: string;
  client: InvoiceClient;
  lines: InvoiceLine[];
  payments?: Payment[];
  /** Número do recibo emitido a partir desta factura (se convertida). */
  receiptNumber?: string;
  receiptIssued?: string;
};


export const paymentMethodLabels: Record<PaymentMethod, string> = {
  mpesa: "M-Pesa",
  emola: "e-Mola",
  transferencia: "Transferência bancária",
  numerario: "Numerário",
  cheque: "Cheque",
};

export const STORAGE_KEY = "quota.invoices.v1";

export const demoClient: InvoiceClient = {
  name: "João Comercial, Lda",
  nuit: "400123456",
  email: "joao@comercial.co.mz",
  phone: "+258 84 210 4477",
  address: "Av. Julius Nyerere 812, Maputo",
};

function iso(offsetDays: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function seedInvoices(): Invoice[] {
  const year = new Date().getFullYear();
  return [
    {
      id: "inv-demo-1",
      number: `FT ${year}/00187`,
      issued: iso(-1),
      due: iso(14),
      status: "paga",
      clientId: "cli-demo-1",
      client: demoClient,
      notes: "Obrigado pela preferência.",
      lines: [
        { description: "Papel A4 80g (resma)", qty: 40, price: 480, vat: 16 },
        { description: "Toner HP 26A", qty: 6, price: 4200, vat: 16 },
      ],
      payments: [
        { id: "pay-demo-1", date: iso(-1), amount: 51504, method: "transferencia", reference: "BCI 88213" },
      ],
    },
    {
      id: "inv-demo-2",
      number: `FT ${year}/00186`,
      issued: iso(-8),
      due: iso(-1),
      status: "vencida",
      clientId: "cli-demo-2",
      client: {
        name: "Beira Logística, SA",
        nuit: "400556677",
        email: "compras@beiralog.co.mz",
        phone: "+258 82 330 1188",
        address: "Rua do Porto 45, Beira",
      },
      lines: [
        { description: "Monitor 27\" QHD", qty: 4, price: 24500, vat: 16 },
        { description: "Consultoria fiscal (horas)", qty: 8, price: 3500, vat: 16 },
      ],
      payments: [],
    },
    {
      id: "inv-demo-3",
      number: `FT ${year}/00185`,
      issued: iso(-15),
      due: iso(9),
      status: "enviada",
      clientId: "cli-demo-1",
      client: demoClient,
      lines: [{ description: "Manutenção mensal TI", qty: 1, price: 18500, vat: 16 }],
      payments: [],
    },
    {
      id: "inv-demo-4",
      number: `FT ${year}/00184`,
      issued: iso(-24),
      due: iso(-4),
      status: "parcial",
      clientId: "cli-demo-3",
      client: {
        name: "Farmácia Nampula",
        nuit: "400889900",
        email: "geral@farmacianampula.co.mz",
        phone: "+258 86 774 2200",
        address: "Av. Eduardo Mondlane 12, Nampula",
      },
      lines: [
        { description: "Implementação de rede", qty: 1, price: 42000, vat: 16 },
        { description: "Router Wi-Fi 6 AX3000", qty: 3, price: 7400, vat: 16 },
      ],
      payments: [{ id: "pay-demo-2", date: iso(-10), amount: 25000, method: "mpesa", reference: "MP 774102" }],
    },
  ];
}

/* ---------------- totals ---------------- */

export function lineNet(l: InvoiceLine) {
  return l.qty * l.price;
}

export function invoiceTotals(inv: Invoice) {
  const net = inv.lines.reduce((s, l) => s + lineNet(l), 0);
  const vat = inv.lines.reduce((s, l) => s + (lineNet(l) * l.vat) / 100, 0);
  return { net, vat, total: net + vat };
}

export function invoiceTotal(inv: Invoice) {
  return invoiceTotals(inv).total;
}

/** Sum of payments received for an invoice. */
export function invoicePaid(inv: Invoice) {
  return (inv.payments ?? []).reduce((s, p) => s + p.amount, 0);
}

/** Outstanding amount (never negative). */
export function invoiceBalance(inv: Invoice) {
  return Math.max(0, invoiceTotal(inv) - invoicePaid(inv));
}

/** Status implied by payments + due date. */
export function derivedStatus(inv: Invoice): InvoiceStatus {
  if (inv.status === "rascunho") return "rascunho";
  const paid = invoicePaid(inv);
  const total = invoiceTotal(inv);
  if (paid >= total - 0.01) return "paga";
  if (paid > 0) return "parcial";
  const overdue = new Date(inv.due).getTime() < Date.now();
  return overdue ? "vencida" : "enviada";
}

/* ---------------- store ---------------- */

let invoices: Invoice[] = seedInvoices();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch {
    /* ignore */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Invoice[];
      if (Array.isArray(parsed) && parsed.length) invoices = parsed;
    } else {
      persist();
    }
  } catch {
    /* ignore */
  }
  emit();
}

export function getInvoices() {
  return invoices;
}

export function getInvoice(id: string) {
  return invoices.find((i) => i.id === id);
}

export function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const max = invoices.reduce((m, i) => {
    const n = Number(i.number.split("/")[1]);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `FT ${year}/${String(max + 1).padStart(5, "0")}`;
}

export function addInvoice(input: Omit<Invoice, "id">) {
  const invoice: Invoice = { ...input, id: `inv-${Date.now()}` };
  invoices = [invoice, ...invoices];
  persist();
  emit();
  return invoice;
}

export function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  invoices = invoices.map((i) => (i.id === id ? { ...i, status } : i));
  persist();
  emit();
}

/** Register a received payment and re-derive the invoice status. */
export function addPayment(id: string, input: Omit<Payment, "id">) {
  invoices = invoices.map((i) => {
    if (i.id !== id) return i;
    const next: Invoice = {
      ...i,
      status: i.status === "rascunho" ? "enviada" : i.status,
      payments: [...(i.payments ?? []), { ...input, id: `pay-${Date.now()}` }],
    };
    return { ...next, status: derivedStatus(next) };
  });
  persist();
  emit();
}

export function removePayment(id: string, paymentId: string) {
  invoices = invoices.map((i) => {
    if (i.id !== id) return i;
    const next: Invoice = { ...i, payments: (i.payments ?? []).filter((p) => p.id !== paymentId) };
    return { ...next, status: derivedStatus(next) };
  });
  persist();
  emit();
}

/** Keep an invoice's snapshot client data in sync with the CRM record. */
export function syncInvoiceClient(clientId: string, client: InvoiceClient) {
  invoices = invoices.map((i) => (i.clientId === clientId ? { ...i, client } : i));
  persist();
  emit();
}

/** Próximo número de recibo (RC ano/nnnnn). */
export function nextReceiptNumber() {
  const year = new Date().getFullYear();
  const max = invoices.reduce((m, i) => {
    const n = Number(i.receiptNumber?.split("/")[1]);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `RC ${year}/${String(max + 1).padStart(5, "0")}`;
}

/**
 * Converte uma factura em recibo num clique: liquida o saldo em falta com o
 * método indicado e atribui um número de recibo.
 */
export function issueReceipt(id: string, method: PaymentMethod = "numerario", reference?: string) {
  const target = invoices.find((i) => i.id === id);
  if (!target) return undefined;
  const receiptNumber = target.receiptNumber ?? nextReceiptNumber();
  const date = new Date().toISOString().slice(0, 10);
  const missing = invoiceBalance(target);
  const payments = [...(target.payments ?? [])];
  if (missing > 0.01) {
    payments.push({ id: `pay-${Date.now()}`, date, amount: missing, method, reference });
  }
  const next: Invoice = { ...target, payments, receiptNumber, receiptIssued: date };
  invoices = invoices.map((i) => (i.id === id ? { ...next, status: derivedStatus(next) } : i));
  persist();
  emit();
  return receiptNumber;
}


export function resetInvoices() {
  invoices = seedInvoices();
  persist();
  emit();
}

/** Subscribe-based hook, SSR-safe (starts from the seed data). */
export function useInvoices() {
  const [list, setList] = useState<Invoice[]>(invoices);
  useEffect(() => {
    const sync = () => setList(getInvoices());
    listeners.add(sync);
    hydrate();
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return list;
}

export function useInvoice(id: string) {
  const list = useInvoices();
  return list.find((i) => i.id === id);
}

/* ---------------- presentation helpers ---------------- */

export const statusMeta: Record<InvoiceStatus, { label: string; tone: "success" | "warning" | "destructive" | "info" | "muted" }> = {
  paga: { label: "Paga", tone: "success" },
  enviada: { label: "Enviada", tone: "info" },
  parcial: { label: "Parcial", tone: "warning" },
  vencida: { label: "Vencida", tone: "destructive" },
  rascunho: { label: "Rascunho", tone: "muted" },
};

export const statusToneClass: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
};
