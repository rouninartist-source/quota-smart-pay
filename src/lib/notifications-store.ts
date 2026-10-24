/**
 * Notificações derivadas dos documentos — não há tabela: cada aviso nasce do
 * estado actual das facturas (vencidas, pagas, cotações a expirar, rascunhos).
 * O "lido" fica no browser, por aviso.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import { getPlan } from "./plans";
import { formatDate, formatMZN } from "./format";
import {
  derivedStatus,
  invoiceBalance,
  isQuoteKind,
  paymentMethodLabels,
  useInvoices,
  type Invoice,
} from "./invoices-store";

export type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  at: number;
  kind: "pagamento" | "documento";
  /** Documento a abrir; vazio nos avisos de pagamento do plano (abrem os Planos). */
  invoiceId: string;
  /** Aviso de pagamento do plano do Quota (Payzeno), não de um documento. */
  plan?: boolean;
  read: boolean;
};

/* Pagamentos do plano (Payzeno) dos últimos 30 dias — lidos uma vez e quando a lista é aberta. */
type PlanPayment = { id: string; plan: string; amount: number; method: string; status: string; created_at: string; confirmed_at: string | null };
let planPayments: PlanPayment[] = [];
let planLoading: Promise<void> | null = null;

export function loadPlanPayments() {
  if (planLoading || typeof window === "undefined" || !supabase) return planLoading ?? Promise.resolve();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  planLoading = (async () => {
    const { data } = await supabase!
      .from("plan_payments")
      .select("id,plan,amount,method,status,created_at,confirmed_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    planPayments = (data ?? []) as PlanPayment[];
    listeners.forEach((l) => l());
  })().finally(() => {
    planLoading = null;
  });
  return planLoading;
}

function planNotifications(now: number): Omit<Notification, "read">[] {
  const wallet = (m: string) => (m === "emola" ? "e-Mola" : "M-Pesa");
  return planPayments.map((p) => {
    const at = new Date(p.confirmed_at ?? p.created_at).getTime();
    const name = getPlan(p.plan).name;
    const amount = `${formatMZN(Number(p.amount))} MZN via ${wallet(p.method)}`;
    const text =
      p.status === "confirmado"
        ? { title: `Plano ${name} activado`, body: `Pagamento de ${amount} confirmado. Obrigado!` }
        : p.status === "pendente"
          ? { title: "Pagamento do plano por confirmar", body: `${name} · ${amount}. Abra os planos para ver o estado ou cancelar.` }
          : { title: p.status === "expirado" ? "Pagamento do plano expirou" : "Pagamento do plano não concluído", body: `${name} · ${amount}. Nenhum valor foi cobrado.` };
    // O id inclui o estado: quando o pedido muda (pendente → confirmado), aparece como aviso novo.
    return { id: `plan-${p.id}-${p.status}`, ...text, time: ago(now - at), at, kind: "pagamento" as const, invoiceId: "", plan: true };
  });
}

const KEY = "quota-notifications-read";
const dayMs = 86_400_000;

function readSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}
let read = typeof window === "undefined" ? new Set<string>() : readSet();
const listeners = new Set<() => void>();

export function markRead(ids: string[]) {
  ids.forEach((i) => read.add(i));
  try {
    localStorage.setItem(KEY, JSON.stringify([...read]));
  } catch {}
  listeners.forEach((l) => l());
}

const ago = (ms: number) => {
  const d = Math.round(ms / dayMs);
  if (d <= 0) return "hoje";
  if (d === 1) return "ontem";
  return `há ${d} dias`;
};
const ahead = (ms: number) => {
  const d = Math.round(ms / dayMs);
  return d <= 0 ? "hoje" : d === 1 ? "amanhã" : `em ${d} dias`;
};

export function buildNotifications(invoices: Invoice[], now = Date.now()): Omit<Notification, "read">[] {
  const out: Omit<Notification, "read">[] = [];
  for (const inv of invoices) {
    const due = new Date(inv.due + "T12:00:00").getTime();
    const status = derivedStatus(inv);
    if (isQuoteKind(inv.kind)) {
      if (inv.status !== "cancelada" && due - now < 3 * dayMs && due - now > -7 * dayMs) {
        out.push({
          id: `q-${inv.id}`,
          title: due < now ? "Cotação expirou" : "Cotação a expirar",
          body: `${inv.number} · ${inv.client.name} · ${formatMZN(inv.lines.reduce((a, l) => a + l.qty * l.price, 0))} MZN · validade ${formatDate(inv.due)}.`,
          time: due < now ? ago(now - due) : ahead(due - now),
          at: due,
          kind: "documento",
          invoiceId: inv.id,
        });
      }
      continue;
    }
    if (status === "vencida") {
      out.push({
        id: `v-${inv.id}`,
        title: "Factura vencida",
        body: `${inv.number} · ${inv.client.name} · ${formatMZN(invoiceBalance(inv))} MZN em dívida desde ${formatDate(inv.due)}.`,
        time: ago(now - due),
        at: due,
        kind: "documento",
        invoiceId: inv.id,
      });
    }
    if (inv.status === "rascunho" && now - new Date(inv.issued + "T12:00:00").getTime() > 2 * dayMs) {
      out.push({
        id: `r-${inv.id}`,
        title: "Rascunho por emitir",
        body: `${inv.number} · ${inv.client.name} ainda não foi enviada.`,
        time: ago(now - new Date(inv.issued + "T12:00:00").getTime()),
        at: new Date(inv.issued + "T12:00:00").getTime(),
        kind: "documento",
        invoiceId: inv.id,
      });
    }
    for (const p of inv.payments ?? []) {
      const at = new Date(p.date + "T12:00:00").getTime();
      if (now - at <= 14 * dayMs) {
        out.push({
          id: `p-${p.id}`,
          title: "Pagamento recebido",
          body: `${inv.client.name} pagou ${formatMZN(p.amount)} MZN (${paymentMethodLabels[p.method]}) — ${inv.number}.`,
          time: ago(now - at),
          at,
          kind: "pagamento",
          invoiceId: inv.id,
        });
      }
    }
  }
  return out.sort((a, b) => b.at - a.at);
}

export function useNotifications(): Notification[] {
  const invoices = useInvoices();
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick((n) => n + 1);
    listeners.add(l);
    read = readSet();
    void loadPlanPayments();
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  const now = Date.now();
  return useMemo(
    () =>
      [...buildNotifications(invoices, now), ...planNotifications(now)]
        .sort((a, b) => b.at - a.at)
        .map((n) => ({ ...n, read: read.has(n.id) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoices, read.size, planPayments],
  );
}
