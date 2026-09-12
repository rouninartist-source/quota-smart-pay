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

export type Org = {
  id: string;
  name: string;
  nuit: string;
  plan: PlanId;
  /** Fim do período experimental; `null` quando já há plano escolhido (pago). */
  trialEndsAt: string | null;
  planRequested: PlanId | null;
  /** Empresa-mãe (só nas empresas adicionais do plano Multi-Empresas). */
  parentOrg: string | null;
  aiUses: number;
};

/** Estado do trial da conta (a raiz manda). */
export function trialState(org: Org | null, now = Date.now()) {
  if (!org || !org.trialEndsAt) return { active: false, expired: false, daysLeft: 0 };
  const ms = new Date(org.trialEndsAt).getTime() - now;
  return { active: ms > 0, expired: ms <= 0, daysLeft: Math.max(0, Math.ceil(ms / 86_400_000)) };
}

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
    sb.from("orgs").select("id,name,nuit,plan,trial_ends_at,plan_requested,parent_org,ai_uses").order("name"),
    sb.rpc("current_org_id"),
  ]);
  type Row = { id: string; name: string; nuit: string; plan?: string; trial_ends_at?: string | null; plan_requested?: string | null; parent_org?: string | null; ai_uses?: number };
  const list = ((full.data ?? []) as Row[]).map<Org>((o) => ({
    id: o.id,
    name: o.name,
    nuit: o.nuit,
    plan: (o.plan ?? "basic") as PlanId,
    trialEndsAt: o.trial_ends_at ?? null,
    planRequested: (o.plan_requested ?? null) as PlanId | null,
    parentOrg: o.parent_org ?? null,
    aiUses: o.ai_uses ?? 0,
  }));
  orgs = list;
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

export async function createOrg(input: { name: string; nuit?: string; sector?: string; ivaRegime?: string; plan?: PlanId }) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const { data, error } = await sb.rpc("create_org", {
    p_name: input.name,
    p_nuit: input.nuit ?? "",
    p_sector: input.sector ?? "",
    p_iva_regime: input.ivaRegime ?? "normal",
    p_plan: input.plan ?? null,
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

/** Escolher plano — aplica-se à conta (raiz + empresas filhas) e termina o trial. */
export async function setOrgPlan(plan: PlanId) {
  const sb = supabase;
  if (!sb || !org) return { error: "Sem empresa activa." };
  const { error } = await sb.rpc("set_org_plan", { p_plan: plan });
  if (error) return { error: error.message };
  await refreshOrg();
  return {};
}

/** A empresa-raiz da conta (dona do plano) para a empresa activa. */
export function rootOf(o: Org | null, all: Org[] = orgs) {
  if (!o) return null;
  return o.parentOrg ? (all.find((x) => x.id === o.parentOrg) ?? o) : o;
}

/** Consome um crédito de IA; no trial há 3. */
export async function useAiCredit(): Promise<{ allowed: boolean; uses: number; limit: number | null }> {
  const sb = supabase;
  if (!sb) return { allowed: true, uses: 0, limit: null };
  const { data, error } = await sb.rpc("use_ai_credit");
  if (error) return { allowed: true, uses: 0, limit: null };
  void refreshOrg();
  return data as { allowed: boolean; uses: number; limit: number | null };
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
