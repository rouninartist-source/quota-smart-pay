/**
 * Frontend-only "multi-empresas" plan: the account holds up to 5 companies and
 * the user picks which one to enter after signing in.
 */
import { useEffect, useState } from "react";
import { saveCompany } from "@/lib/company-store";

export type Workspace = {
  id: string;
  name: string;
  nuit: string;
  sector: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  role: string;
  docs: number;
};

export const workspaces: Workspace[] = [
  {
    id: "quota-retail",
    name: "Quota Retail, Lda",
    nuit: "400 998 123",
    sector: "Comércio a retalho",
    city: "Maputo",
    address: "Av. 24 de Julho 1234, Maputo",
    email: "facturacao@quotaretail.co.mz",
    phone: "+258 84 000 0001",
    role: "Administrador",
    docs: 187,
  },
  {
    id: "maputo-construcoes",
    name: "Maputo Construções",
    nuit: "400 887 442",
    sector: "Construção civil",
    city: "Maputo",
    address: "Av. Acordos de Lusaka 789, Maputo",
    email: "geral@maputoconstrucoes.co.mz",
    phone: "+258 84 000 0002",
    role: "Gestor",
    docs: 64,
  },
  {
    id: "beira-logistics",
    name: "Beira Logistics",
    nuit: "400 661 904",
    sector: "Logística e transportes",
    city: "Beira",
    address: "Rua do Comércio 45, Beira",
    email: "ops@beiralogistics.co.mz",
    phone: "+258 84 000 0003",
    role: "Gestor",
    docs: 41,
  },
  {
    id: "farmacia-central",
    name: "Farmácia Central",
    nuit: "400 312 887",
    sector: "Saúde e farmácia",
    city: "Maputo",
    address: "Av. Julius Nyerere 56, Maputo",
    email: "balcao@farmaciacentral.co.mz",
    phone: "+258 84 000 0004",
    role: "Vendedor",
    docs: 28,
  },
  {
    id: "cafe-continental",
    name: "Café Continental",
    nuit: "400 778 654",
    sector: "Restauração",
    city: "Maputo",
    address: "Av. Karl Marx 200, Maputo",
    email: "hello@cafecontinental.co.mz",
    phone: "+258 84 000 0005",
    role: "Administrador",
    docs: 12,
  },
];

export const WORKSPACE_KEY = "quota.workspace.v1";

const listeners = new Set<() => void>();
let activeId: string | null = null;
let hydrated = false;

function emit() {
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    activeId = localStorage.getItem(WORKSPACE_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function getActiveWorkspace(): Workspace | null {
  return workspaces.find((w) => w.id === activeId) ?? null;
}

/** Select the company to invoice with, syncing the document emitter details. */
export function selectWorkspace(id: string) {
  const ws = workspaces.find((w) => w.id === id);
  if (!ws) return null;
  activeId = ws.id;
  try {
    localStorage.setItem(WORKSPACE_KEY, ws.id);
  } catch {
    /* ignore */
  }
  saveCompany({
    name: ws.name,
    nuit: ws.nuit,
    address: `${ws.address} · Moçambique`,
    email: ws.email,
    phone: ws.phone,
  });
  emit();
  return ws;
}

export function useActiveWorkspace() {
  const [value, setValue] = useState<Workspace | null>(getActiveWorkspace());
  useEffect(() => {
    const sync = () => setValue(getActiveWorkspace());
    listeners.add(sync);
    hydrate();
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return value;
}
