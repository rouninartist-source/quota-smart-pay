/**
 * Empresas (tenants) do utilizador com sessão iniciada.
 *
 * Uma conta pode ter várias empresas (plano Multi-Empresas). A empresa activa
 * é decidida pelo Postgres (`current_org_id()`), por isso trocar = pedir ao
 * servidor e recarregar a app, para nenhum cache ficar com dados da anterior.
 */
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { PlanId } from "./plans";

export type Org = { id: string; name: string; nuit: string; plan: PlanId };

let orgs: Org[] = [];
let org: Org | null = null;
let checked = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

async function load() {
  const sb = supabase;
  if (!sb) return;
  const [full, { data: current }] = await Promise.all([
    sb.from("orgs").select("id,name,nuit,plan").order("name"),
    sb.rpc("current_org_id"),
  ]);
  // Base de dados ainda sem a migração dos planos: lê sem a coluna.
  const list: Partial<Org>[] = full.error
    ? ((await sb.from("orgs").select("id,name,nuit").order("name")).data ?? [])
    : (full.data ?? []);
  orgs = list.map((o) => ({ ...(o as Org), plan: (o.plan ?? "basic") as PlanId }));
  org = orgs.find((o) => o.id === current) ?? orgs[0] ?? null;
  emit();
}

/** Força uma nova leitura — usado depois de criar a empresa. */
export async function refreshOrg() {
  checked = true;
  await load();
}

export function getOrg() {
  return org;
}

export async function createOrg(input: { name: string; nuit?: string; sector?: string; ivaRegime?: string }) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const { data, error } = await sb.rpc("create_org", {
    p_name: input.name,
    p_nuit: input.nuit ?? "",
    p_sector: input.sector ?? "",
    p_iva_regime: input.ivaRegime ?? "normal",
  });
  if (error) return { error: error.message };
  await refreshOrg();
  return { id: data as string };
}

/** Troca de empresa: o servidor guarda a escolha e a app recarrega limpa. */
export async function switchOrg(id: string) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const { error } = await sb.rpc("set_current_org", { p_org: id });
  if (error) return { error: error.message };
  window.location.assign("/dashboard");
  return {};
}

export async function setOrgPlan(plan: PlanId) {
  const sb = supabase;
  if (!sb || !org) return { error: "Sem empresa activa." };
  const { error } = await sb.from("orgs").update({ plan }).eq("id", org.id);
  if (error) return { error: error.message };
  await refreshOrg();
  return {};
}

/**
 * `ready` distingue "ainda não sei" de "sei que não tem empresa" — sem isso o
 * ecrã de configuração piscava antes da resposta chegar.
 */
export function useOrg() {
  const [value, setValue] = useState<Org | null>(org);
  const [all, setAll] = useState<Org[]>(orgs);
  const [ready, setReady] = useState(checked);

  useEffect(() => {
    const sync = () => {
      setValue(getOrg());
      setAll(orgs);
      setReady(true);
    };
    listeners.add(sync);
    if (!checked) {
      checked = true;
      inflight = load().finally(() => {
        inflight = null;
      });
    } else if (!inflight) {
      sync();
    }
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return { org: value, orgs: all, ready };
}
