/**
 * Store de clientes — agora sobre Postgres (Supabase) em vez de localStorage.
 *
 * A API exportada é a mesma de antes (`getClients`, `addClient`, `useClients`…),
 * por isso as rotas não mudam. O que muda por baixo: o cache em memória é
 * hidratado da base de dados e as escritas são optimistas com reversão em erro.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "./supabase";

export type Client = {
  id: string;
  name: string;
  nuit: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
};

type Row = {
  id: string;
  name: string;
  nuit: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

const toClient = (r: Row): Client => ({
  id: r.id,
  name: r.name,
  nuit: r.nuit ?? "",
  email: r.email ?? "",
  phone: r.phone ?? "",
  address: r.address ?? "",
  notes: r.notes ?? undefined,
});

/** Clientes de demonstração, inseridos só se a tabela estiver vazia. */
export function seedClients(): Omit<Client, "id">[] {
  return [
    {
      name: "João Comercial, Lda",
      nuit: "400123456",
      email: "joao@comercial.co.mz",
      phone: "+258 84 210 4477",
      address: "Av. Julius Nyerere 812, Maputo",
      notes: "Cliente recorrente — factura mensal de manutenção TI.",
    },
    {
      name: "Beira Logística, SA",
      nuit: "400556677",
      email: "compras@beiralog.co.mz",
      phone: "+258 82 330 1188",
      address: "Rua do Porto 45, Beira",
    },
    {
      name: "Farmácia Nampula",
      nuit: "400889900",
      email: "geral@farmacianampula.co.mz",
      phone: "+258 86 774 2200",
      address: "Av. Eduardo Mondlane 12, Nampula",
    },
  ];
}

let clients: Client[] = [];
let hydrated = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/**
 * Um erro de escrita nunca pode passar em silêncio: o utilizador tem de saber
 * que a alteração não ficou gravada.
 */
function fail(action: string, error: { message: string }) {
  console.error(`[clients] ${action}:`, error.message);
  toast.error(`Não foi possível ${action}`, { description: error.message });
}

async function load() {
  const sb = supabase;
  if (!sb) return;
  const { data, error } = await sb
    .from("clients")
    .select("id,name,nuit,email,phone,address,notes")
    .order("name");

  if (error) {
    hydrated = false; // permite nova tentativa
    fail("carregar os clientes", error);
    return;
  }

  let rows = (data ?? []) as Row[];

  if (rows.length === 0) {
    const { data: seeded, error: seedError } = await sb
      .from("clients")
      .insert(seedClients())
      .select("id,name,nuit,email,phone,address,notes");
    if (seedError) fail("criar os clientes de demonstração", seedError);
    else rows = (seeded ?? []) as Row[];
  }

  clients = rows.map(toClient);
  emit();
}

export function hydrateClients() {
  if (hydrated || typeof window === "undefined") return inflight ?? Promise.resolve();
  hydrated = true;
  inflight = load().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function getClients() {
  return clients;
}

export function getClient(id: string) {
  return clients.find((c) => c.id === id);
}

export async function addClient(input: Omit<Client, "id">) {
  const sb = supabase;
  if (!sb) return undefined;

  const { data, error } = await sb
    .from("clients")
    .insert({ ...input, notes: input.notes ?? null })
    .select("id,name,nuit,email,phone,address,notes")
    .single();

  if (error || !data) {
    fail("criar o cliente", error ?? { message: "sem resposta" });
    return undefined;
  }

  const client = toClient(data as Row);
  clients = [client, ...clients];
  emit();
  return client;
}

export async function updateClient(id: string, patch: Partial<Omit<Client, "id">>) {
  const sb = supabase;
  if (!sb) return;

  const previous = clients;
  clients = clients.map((c) => (c.id === id ? { ...c, ...patch } : c)); // optimista
  emit();

  const { error } = await sb.from("clients").update(patch).eq("id", id);
  if (error) {
    clients = previous; // reverte
    emit();
    fail("guardar o cliente", error);
  }
}

export async function deleteClient(id: string) {
  const sb = supabase;
  if (!sb) return;

  const previous = clients;
  clients = clients.filter((c) => c.id !== id);
  emit();

  const { error } = await sb.from("clients").delete().eq("id", id);
  if (error) {
    clients = previous;
    emit();
    fail("eliminar o cliente", error);
  }
}

export function useClients() {
  const [list, setList] = useState<Client[]>(clients);
  useEffect(() => {
    const sync = () => setList(getClients());
    listeners.add(sync);
    hydrateClients();
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return list;
}
