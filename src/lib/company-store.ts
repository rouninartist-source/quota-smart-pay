/**
 * Perfil da empresa (dados do emitente que saem nas facturas e PDFs).
 *
 * Guardado numa única linha da tabela `company`, na coluna `settings` (JSONB):
 * o tipo tem estrutura aninhada e é sempre lido e gravado de uma vez.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "./supabase";
import type { BankAccount, WalletAccount } from "@/lib/payment-details";

export type Company = {
  name: string;
  nuit: string;
  address: string;
  email: string;
  phone: string;
  /** Data URL of the uploaded logo (optional). */
  logo?: string;
  paymentNote: string;
  /** Mostrar bloco "Dados de pagamento" no documento. */
  showPaymentDetails: boolean;
  /** @deprecated substituído por `banks`; mantido para ler definições antigas. */
  bank?: BankAccount;
  /** Contas bancárias impressas nos documentos (pode haver várias). */
  banks: BankAccount[];
  /** Carteiras móveis (M-Pesa / e-Mola) com número e nome de confirmação. */
  wallets: WalletAccount[];
  /** Que meios de pagamento aparecem nos documentos. */
  paymentMode: "both" | "bank" | "wallet";
  /** Número WhatsApp Business da empresa e modelo da mensagem de cobrança. */
  whatsapp?: { number: string; template: string; connectedAt: string };
};

/** Contas a imprimir, já filtradas pelo modo escolhido. */
export function companyBanks(c: Company): BankAccount[] {
  if (c.paymentMode === "wallet") return [];
  const list = c.banks?.length ? c.banks : c.bank ? [c.bank] : [];
  return list;
}
export function companyWallets(c: Company): WalletAccount[] {
  return c.paymentMode === "bank" ? [] : (c.wallets ?? []);
}

/** Substitui os campos {cliente} {numero} {valor} {vencimento} na mensagem. */
export function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}

export const DEFAULT_WHATSAPP_TEMPLATE =
  "Olá {cliente}, lembramos o documento {numero} no valor de {valor} MZN, com vencimento a {vencimento}. Obrigado!";

export const defaultCompany: Company = {
  name: "Quota Studio",
  nuit: "400987654",
  address: "Av. 24 de Julho 1234, Maputo · Moçambique",
  email: "facturacao@quota.co.mz",
  phone: "+258 84 000 0000",
  paymentNote: "Indique o número do documento na referência do pagamento.",
  showPaymentDetails: true,
  banks: [
    {
      bankId: "bci",
      accountName: "Quota Studio, Lda",
      account: "1234567890001",
      nib: "0008 0000 1234567890 157",
    },
  ],
  paymentMode: "both",
  wallets: [
    { provider: "mpesa", number: "84 000 0000", name: "QUOTA STUDIO LDA" },
    { provider: "emola", number: "86 000 0000", name: "QUOTA STUDIO LDA" },
  ],
};

let company: Company = { ...defaultCompany };
let rowId: string | null = null;
let hydrated = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function fail(action: string, error: { message: string }) {
  console.error(`[company] ${action}:`, error.message);
  toast.error(`Não foi possível ${action}`, { description: error.message });
}

/** Garante que existe a linha única e devolve o seu id. */
async function ensureRow() {
  const sb = supabase;
  if (!sb) return null;
  if (rowId) return rowId;

  const { data, error } = await sb.from("company").select("id,settings").limit(1).maybeSingle();
  if (error) {
    fail("carregar as definições", error);
    return null;
  }
  if (data) {
    rowId = data.id as string;
    const settings = (data.settings ?? {}) as Partial<Company>;
    if (Object.keys(settings).length) {
      company = { ...defaultCompany, ...settings };
      // Definições antigas só tinham uma conta (`bank`): passa a fazer parte da lista.
      if (!settings.banks && settings.bank) company.banks = [settings.bank];
      if (!settings.paymentMode) company.paymentMode = "both";
    }
    return rowId;
  }

  const created = await sb.from("company").insert({ settings: defaultCompany }).select("id").single();
  if (created.error) {
    fail("criar as definições", created.error);
    return null;
  }
  rowId = created.data.id as string;
  return rowId;
}

async function load() {
  await ensureRow();
  emit();
}

export function hydrateCompany() {
  if (hydrated || typeof window === "undefined") return inflight ?? Promise.resolve();
  hydrated = true;
  inflight = load().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function getCompany() {
  return company;
}

export async function saveCompany(patch: Partial<Company>) {
  const sb = supabase;
  const previous = company;
  company = { ...company, ...patch };
  emit();

  if (!sb) return company;
  const id = await ensureRow();
  if (!id) return company;

  const { error } = await sb.from("company").update({ settings: company }).eq("id", id);
  if (error) {
    company = previous;
    emit();
    fail("guardar as definições", error);
  }
  return company;
}

export async function resetCompany() {
  await saveCompany({ ...defaultCompany });
}

export function useCompany() {
  const [value, setValue] = useState<Company>(company);
  useEffect(() => {
    const sync = () => setValue(getCompany());
    listeners.add(sync);
    hydrateCompany();
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return value;
}
