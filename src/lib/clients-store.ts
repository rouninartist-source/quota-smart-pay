/**
 * Frontend-only client (CRM) store with localStorage persistence.
 */
import { useEffect, useState } from "react";

export type Client = {
  id: string;
  name: string;
  nuit: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
};

export const CLIENTS_KEY = "quota.clients.v1";

export function seedClients(): Client[] {
  return [
    {
      id: "cli-demo-1",
      name: "João Comercial, Lda",
      nuit: "400123456",
      email: "joao@comercial.co.mz",
      phone: "+258 84 210 4477",
      address: "Av. Julius Nyerere 812, Maputo",
      notes: "Cliente recorrente — factura mensal de manutenção TI.",
    },
    {
      id: "cli-demo-2",
      name: "Beira Logística, SA",
      nuit: "400556677",
      email: "compras@beiralog.co.mz",
      phone: "+258 82 330 1188",
      address: "Rua do Porto 45, Beira",
    },
    {
      id: "cli-demo-3",
      name: "Farmácia Nampula",
      nuit: "400889900",
      email: "geral@farmacianampula.co.mz",
      phone: "+258 86 774 2200",
      address: "Av. Eduardo Mondlane 12, Nampula",
    },
  ];
}

let clients: Client[] = seedClients();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch {
    /* ignore */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Client[];
      if (Array.isArray(parsed)) clients = parsed;
    } else {
      persist();
    }
  } catch {
    /* ignore */
  }
  emit();
}

export function getClients() {
  return clients;
}

export function getClient(id: string) {
  return clients.find((c) => c.id === id);
}

export function addClient(input: Omit<Client, "id">) {
  const client: Client = { ...input, id: `cli-${Date.now()}` };
  clients = [client, ...clients];
  persist();
  emit();
  return client;
}

export function updateClient(id: string, patch: Partial<Omit<Client, "id">>) {
  clients = clients.map((c) => (c.id === id ? { ...c, ...patch } : c));
  persist();
  emit();
}

export function deleteClient(id: string) {
  clients = clients.filter((c) => c.id !== id);
  persist();
  emit();
}

export function useClients() {
  const [list, setList] = useState<Client[]>(clients);
  useEffect(() => {
    const sync = () => setList(getClients());
    listeners.add(sync);
    hydrate();
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return list;
}
