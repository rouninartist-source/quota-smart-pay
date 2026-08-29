/**
 * Empresa (tenant) do utilizador com sessão iniciada.
 *
 * Existe porque uma conta pode ter sessão e **não** pertencer a nenhuma empresa:
 * acontece a quem for criado pelo dashboard do Supabase em vez do `/registo`, ou
 * se o registo falhar a meio. Sem isto, essa pessoa via um painel vazio sem
 * explicação e qualquer emissão falhava com "sem empresa associada".
 */
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type Org = { id: string; name: string; nuit: string };

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
  const { data, error } = await sb.from("orgs").select("id,name,nuit").limit(1).maybeSingle();
  if (!error && data) org = data as Org;
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

export async function createOrg(input: {
  name: string;
  nuit?: string;
  sector?: string;
  ivaRegime?: string;
}) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };

  const { error } = await sb.rpc("create_org", {
    p_name: input.name,
    p_nuit: input.nuit ?? "",
    p_sector: input.sector ?? "",
    p_iva_regime: input.ivaRegime ?? "normal",
  });
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
  const [ready, setReady] = useState(checked);

  useEffect(() => {
    const sync = () => {
      setValue(getOrg());
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

  return { org: value, ready };
}
