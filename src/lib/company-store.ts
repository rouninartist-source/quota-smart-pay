/**
 * Frontend-only company profile (emitter details shown on invoices & PDFs).
 */
import { useEffect, useState } from "react";
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
  bank?: BankAccount;
  /** Carteiras móveis (M-Pesa / e-Mola) com número e nome de confirmação. */
  wallets: WalletAccount[];
};

export const COMPANY_KEY = "quota.company.v1";

export const defaultCompany: Company = {
  name: "Quota Studio",
  nuit: "400987654",
  address: "Av. 24 de Julho 1234, Maputo · Moçambique",
  email: "facturacao@quota.co.mz",
  phone: "+258 84 000 0000",
  paymentNote: "Indique o número do documento na referência do pagamento.",
  showPaymentDetails: true,
  bank: {
    bankId: "bci",
    accountName: "Quota Studio, Lda",
    account: "1234567890001",
    nib: "0008 0000 1234567890 157",
  },
  wallets: [
    { provider: "mpesa", number: "84 000 0000", name: "QUOTA STUDIO LDA" },
    { provider: "emola", number: "86 000 0000", name: "QUOTA STUDIO LDA" },
  ],
};

let company: Company = { ...defaultCompany };
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
  } catch {
    /* ignore */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(COMPANY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Company>;
      company = { ...defaultCompany, ...parsed };
    }
  } catch {
    /* ignore */
  }
  emit();
}

export function getCompany() {
  return company;
}

export function saveCompany(patch: Partial<Company>) {
  company = { ...company, ...patch };
  persist();
  emit();
  return company;
}

export function resetCompany() {
  company = { ...defaultCompany };
  persist();
  emit();
}

export function useCompany() {
  const [value, setValue] = useState<Company>(company);
  useEffect(() => {
    const sync = () => setValue(getCompany());
    listeners.add(sync);
    hydrate();
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return value;
}
