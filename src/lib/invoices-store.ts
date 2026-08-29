/**
 * Store de facturas — sobre Postgres (Supabase).
 *
 * Os ajudantes de cálculo (`invoiceTotal`, `derivedStatus`, …) continuam puros e
 * iguais; o que mudou é a origem dos dados e as escritas, que agora são
 * assíncronas e passam pela base de dados.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "./supabase";

export type InvoiceStatus =
  | "rascunho"
  | "enviada"
  | "paga"
  | "vencida"
  | "parcial"
  | "cancelada";

export type InvoiceLine = {
  description: string;
  qty: number;
  price: number;
  vat: number; // percent
  note?: string;
  img?: string;
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
  issued: string;
  due: string;
  status: InvoiceStatus;
  notes?: string;
  clientId?: string;
  client: InvoiceClient;
  lines: InvoiceLine[];
  payments?: Payment[];
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

const today = () => new Date().toISOString().slice(0, 10);

/* ---------------- totals (puros, inalterados) ---------------- */

export function lineNet(l: InvoiceLine) {
  return l.qty * l.price;
}

export function invoiceTotals(inv: Invoice) {
  const net = inv.lines.reduce((a, l) => a + lineNet(l), 0);
  const vat = inv.lines.reduce((a, l) => a + (lineNet(l) * l.vat) / 100, 0);
  return { net, vat, total: net + vat };
}

export function invoiceTotal(inv: Invoice) {
  return invoiceTotals(inv).total;
}

export function invoicePaid(inv: Invoice) {
  return (inv.payments ?? []).reduce((a, p) => a + p.amount, 0);
}

export function invoiceBalance(inv: Invoice) {
  return Math.max(0, invoiceTotal(inv) - invoicePaid(inv));
}

export function derivedStatus(inv: Invoice): InvoiceStatus {
  if (inv.status === "rascunho" || inv.status === "cancelada") return inv.status;
  const paid = invoicePaid(inv);
  const total = invoiceTotal(inv);
  if (paid >= total - 0.01) return "paga";
  if (paid > 0) return "parcial";
  const overdue = new Date(inv.due).getTime() < Date.now();
  return overdue ? "vencida" : "enviada";
}

/* ---------------- mapeamento ---------------- */

type LineRow = {
  id: string;
  position: number;
  description: string;
  note: string | null;
  qty: number;
  price: number;
  vat: number;
  image_url: string | null;
};
type PaymentRow = {
  id: string;
  paid_on: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
};
type InvoiceRow = {
  id: string;
  number: string;
  issued: string;
  due: string;
  status: InvoiceStatus;
  notes: string | null;
  client_id: string | null;
  client_snapshot: InvoiceClient;
  receipt_number: string | null;
  receipt_issued: string | null;
  invoice_lines: LineRow[] | null;
  payments: PaymentRow[] | null;
};

const SELECT =
  "id,number,issued,due,status,notes,client_id,client_snapshot,receipt_number,receipt_issued," +
  "invoice_lines(id,position,description,note,qty,price,vat,image_url)," +
  "payments(id,paid_on,amount,method,reference)";

function toInvoice(r: InvoiceRow): Invoice {
  return {
    id: r.id,
    number: r.number,
    issued: r.issued,
    due: r.due,
    status: r.status,
    notes: r.notes ?? undefined,
    clientId: r.client_id ?? undefined,
    client: r.client_snapshot ?? demoClient,
    lines: (r.invoice_lines ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((l) => ({
        description: l.description,
        qty: Number(l.qty),
        price: Number(l.price),
        vat: Number(l.vat),
        note: l.note ?? undefined,
        img: l.image_url ?? undefined,
      })),
    payments: (r.payments ?? []).map((p) => ({
      id: p.id,
      date: p.paid_on,
      amount: Number(p.amount),
      method: p.method,
      reference: p.reference ?? undefined,
    })),
    receiptNumber: r.receipt_number ?? undefined,
    receiptIssued: r.receipt_issued ?? undefined,
  };
}

const lineRows = (invoiceId: string, lines: InvoiceLine[]) =>
  lines.map((l, i) => ({
    invoice_id: invoiceId,
    position: i,
    description: l.description,
    note: l.note ?? null,
    qty: l.qty,
    price: l.price,
    vat: l.vat,
    image_url: l.img ?? null,
  }));

/* ---------------- store ---------------- */

let invoices: Invoice[] = [];
let hydrated = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function fail(action: string, error: { message: string }) {
  console.error(`[invoices] ${action}:`, error.message);
  toast.error(`Não foi possível ${action}`, { description: error.message });
}

async function refreshList() {
  const sb = supabase;
  if (!sb) return;
  const { data } = await sb.from("invoices").select(SELECT).order("issued", { ascending: false });
  invoices = ((data ?? []) as unknown as InvoiceRow[]).map(toInvoice);
  emit();
}

/** Recarrega uma factura da base de dados e substitui-a no cache. */
async function refresh(id: string) {
  const sb = supabase;
  if (!sb) return;
  const { data, error } = await sb.from("invoices").select(SELECT).eq("id", id).single();
  if (error || !data) return;
  const next = toInvoice(data as unknown as InvoiceRow);
  invoices = invoices.map((i) => (i.id === id ? next : i));
  emit();
}

async function load() {
  const sb = supabase;
  if (!sb) return;
  const { data, error } = await sb
    .from("invoices")
    .select(SELECT)
    .order("issued", { ascending: false });

  if (error) {
    hydrated = false;
    fail("carregar as facturas", error);
    return;
  }

  const rows = (data ?? []) as unknown as InvoiceRow[];
  invoices = rows.map(toInvoice);
  emit();

  if (rows.length === 0) {
    await seedDemoInvoices();
    await refreshList();
  }
}

export function hydrateInvoices() {
  if (hydrated || typeof window === "undefined") return inflight ?? Promise.resolve();
  hydrated = true;
  inflight = load().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function getInvoices() {
  return invoices;
}

export function getInvoice(id: string) {
  return invoices.find((i) => i.id === id);
}

/**
 * Número atribuído pela base de dados (sequência atómica). Dois dispositivos a
 * emitir ao mesmo tempo nunca recebem o mesmo número.
 */
export async function nextInvoiceNumber(kind: "ft" | "rec" | "cot" = "ft") {
  const sb = supabase;
  if (!sb) return "";
  const { data, error } = await sb.rpc("next_document_number", { p_kind: kind });
  if (error) {
    fail("obter o número do documento", error);
    return "";
  }
  return data as string;
}

export const nextReceiptNumber = () => nextInvoiceNumber("rec");

/**
 * O número é atribuído **aqui**, no momento de gravar — não quando o formulário
 * abre. Abrir e abandonar um rascunho não pode consumir um número fiscal.
 */
export async function addInvoice(
  input: Omit<Invoice, "id" | "number"> & { number?: string },
) {
  const sb = supabase;
  if (!sb) return undefined;

  const number = input.number?.trim() || (await nextInvoiceNumber("ft"));
  if (!number) return undefined;

  const { data, error } = await sb
    .from("invoices")
    .insert({
      number,
      issued: input.issued,
      due: input.due,
      status: input.status,
      notes: input.notes ?? null,
      client_id: input.clientId ?? null,
      client_snapshot: input.client,
    })
    .select("id")
    .single();

  if (error || !data) {
    fail("criar a factura", error ?? { message: "sem resposta" });
    return undefined;
  }

  const id = data.id as string;

  if (input.lines.length) {
    const { error: lineError } = await sb.from("invoice_lines").insert(lineRows(id, input.lines));
    if (lineError) fail("gravar as linhas", lineError);
  }
  if (input.payments?.length) {
    const { error: payError } = await sb.from("payments").insert(
      input.payments.map((p) => ({
        invoice_id: id,
        paid_on: p.date,
        amount: p.amount,
        method: p.method,
        reference: p.reference ?? null,
      })),
    );
    if (payError) fail("gravar os pagamentos", payError);
  }

  await refreshList();
  return getInvoice(id);
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const sb = supabase;
  if (!sb) return;
  const previous = invoices;
  invoices = invoices.map((i) => (i.id === id ? { ...i, status } : i));
  emit();
  const { error } = await sb.from("invoices").update({ status }).eq("id", id);
  if (error) {
    invoices = previous;
    emit();
    fail("mudar o estado", error);
  }
}

/** Regista um pagamento e re-deriva o estado da factura. */
export async function addPayment(id: string, input: Omit<Payment, "id">) {
  const sb = supabase;
  if (!sb) return;

  const { error } = await sb.from("payments").insert({
    invoice_id: id,
    paid_on: input.date,
    amount: input.amount,
    method: input.method,
    reference: input.reference ?? null,
  });
  if (error) return fail("registar o pagamento", error);

  await refresh(id);

  const inv = getInvoice(id);
  if (!inv) return;
  const base: Invoice = { ...inv, status: inv.status === "rascunho" ? "enviada" : inv.status };
  const next = derivedStatus(base);
  if (next !== inv.status) await updateInvoiceStatus(id, next);
}

export async function removePayment(id: string, paymentId: string) {
  const sb = supabase;
  if (!sb) return;
  const { error } = await sb.from("payments").delete().eq("id", paymentId);
  if (error) return fail("remover o pagamento", error);

  await refresh(id);
  const inv = getInvoice(id);
  if (!inv) return;
  const next = derivedStatus(inv);
  if (next !== inv.status) await updateInvoiceStatus(id, next);
}

/** Mantém o retrato do cliente na factura em sintonia com a ficha do CRM. */
export async function syncInvoiceClient(clientId: string, client: InvoiceClient) {
  const sb = supabase;
  if (!sb) return;
  const { error } = await sb
    .from("invoices")
    .update({ client_snapshot: client })
    .eq("client_id", clientId);
  if (error) return fail("actualizar os dados do cliente nas facturas", error);
  await refreshList();
}

/** Converte uma factura em recibo: liquida o que falta e atribui número de recibo. */
export async function issueReceipt(
  id: string,
  method: PaymentMethod = "numerario",
  reference?: string,
) {
  const sb = supabase;
  if (!sb) return undefined;
  const target = getInvoice(id);
  if (!target) return undefined;

  const receiptNumber = target.receiptNumber ?? (await nextInvoiceNumber("rec"));
  if (!receiptNumber) return undefined;

  const missing = invoiceBalance(target);
  if (missing > 0.01) {
    await addPayment(id, { date: today(), amount: missing, method, reference });
  }

  const { error } = await sb
    .from("invoices")
    .update({ receipt_number: receiptNumber, receipt_issued: today() })
    .eq("id", id);
  if (error) {
    fail("emitir o recibo", error);
    return undefined;
  }

  await refresh(id);
  return receiptNumber;
}

/**
 * Liquida o saldo em aberto registando um pagamento — nunca escrevendo o estado
 * directamente. `invoiceBalance` deriva dos pagamentos, por isso marcar "paga"
 * sem pagamento deixaria o saldo por receber a mentir no painel.
 */
export async function settleInvoice(
  id: string,
  method: PaymentMethod = "numerario",
  reference?: string,
) {
  const inv = getInvoice(id);
  if (!inv) return;
  const balance = invoiceBalance(inv);
  if (balance <= 0.01) return;
  await addPayment(id, { date: today(), amount: balance, method, reference });
}

/** Anula sem apagar — o rasto fiscal do documento tem de permanecer. */
export async function cancelInvoice(id: string) {
  await updateInvoiceStatus(id, "cancelada");
}

/** Clona para um novo rascunho com data de hoje, número novo e sem pagamentos. */
export async function duplicateInvoice(id: string) {
  const inv = getInvoice(id);
  if (!inv) return undefined;
  return addInvoice({
    issued: today(),
    due: iso(15),
    status: "rascunho",
    notes: inv.notes,
    clientId: inv.clientId,
    client: inv.client,
    lines: inv.lines,
    payments: [],
  });
}

/* ---------------- seed de demonstração ---------------- */

async function seedDemoInvoices() {
  const sb = supabase;
  if (!sb) return;

  const { data: clientRows } = await sb.from("clients").select("id,name,nuit,email,phone,address");
  const byName = new Map((clientRows ?? []).map((c) => [c.name as string, c]));

  const demos: Array<{
    issued: string;
    due: string;
    status: InvoiceStatus;
    clientName: string;
    notes?: string;
    lines: InvoiceLine[];
    payments: Omit<Payment, "id">[];
  }> = [
    {
      issued: iso(-1),
      due: iso(14),
      status: "paga",
      clientName: "João Comercial, Lda",
      notes: "Obrigado pela preferência.",
      lines: [
        { description: "Papel A4 80g (resma)", qty: 40, price: 480, vat: 16 },
        { description: "Toner HP 26A", qty: 6, price: 4200, vat: 16 },
      ],
      payments: [{ date: iso(-1), amount: 51504, method: "transferencia", reference: "BCI 88213" }],
    },
    {
      issued: iso(-8),
      due: iso(-1),
      status: "vencida",
      clientName: "Beira Logística, SA",
      lines: [
        { description: 'Monitor 27" QHD', qty: 4, price: 24500, vat: 16 },
        { description: "Consultoria fiscal (horas)", qty: 8, price: 3500, vat: 16 },
      ],
      payments: [],
    },
    {
      issued: iso(-15),
      due: iso(9),
      status: "enviada",
      clientName: "João Comercial, Lda",
      lines: [{ description: "Manutenção mensal TI", qty: 1, price: 18500, vat: 16 }],
      payments: [],
    },
    {
      issued: iso(-24),
      due: iso(-4),
      status: "parcial",
      clientName: "Farmácia Nampula",
      lines: [
        { description: "Implementação de rede", qty: 1, price: 42000, vat: 16 },
        { description: "Router Wi-Fi 6 AX3000", qty: 3, price: 7400, vat: 16 },
      ],
      payments: [{ date: iso(-10), amount: 25000, method: "mpesa", reference: "MP 774102" }],
    },
  ];

  for (const d of demos) {
    const c = byName.get(d.clientName);
    await addInvoice({
      issued: d.issued,
      due: d.due,
      status: d.status,
      notes: d.notes,
      clientId: (c?.id as string) ?? undefined,
      client: c
        ? {
            name: c.name as string,
            nuit: (c.nuit as string) ?? "",
            email: (c.email as string) ?? "",
            phone: (c.phone as string) ?? "",
            address: (c.address as string) ?? "",
          }
        : demoClient,
      lines: d.lines,
      payments: d.payments.map((p, i) => ({ ...p, id: `seed-${i}` })),
    });
  }
}

/* ---------------- hooks ---------------- */

export function useInvoices() {
  const [list, setList] = useState<Invoice[]>(invoices);
  useEffect(() => {
    const sync = () => setList(getInvoices());
    listeners.add(sync);
    hydrateInvoices();
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

export const statusMeta: Record<
  InvoiceStatus,
  { label: string; tone: "success" | "warning" | "destructive" | "info" | "muted" }
> = {
  paga: { label: "Paga", tone: "success" },
  enviada: { label: "Enviada", tone: "info" },
  parcial: { label: "Parcial", tone: "warning" },
  vencida: { label: "Vencida", tone: "destructive" },
  rascunho: { label: "Rascunho", tone: "muted" },
  cancelada: { label: "Anulada", tone: "muted" },
};

export const statusToneClass: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground dark:text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
};
