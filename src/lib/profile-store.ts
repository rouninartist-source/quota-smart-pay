/**
 * Perfil do utilizador — vive nos `user_metadata` do Supabase Auth, por isso
 * não precisa de tabela: cada pessoa lê e escreve só os seus dados.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "./supabase";

export type Profile = {
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  signature: string;
  locale: string;
  timezone: string;
  dailyDigest: boolean;
  whatsappAlerts: boolean;
};

export const defaultProfile: Profile = {
  firstName: "",
  lastName: "",
  phone: "",
  role: "",
  signature: "",
  locale: "pt-MZ",
  timezone: "Africa/Maputo",
  dailyDigest: true,
  whatsappAlerts: true,
};

type Meta = Record<string, unknown>;

function fromMeta(m: Meta | undefined): Profile {
  const p = (m?.profile as Partial<Profile> | undefined) ?? {};
  // Contas antigas só têm `full_name` do registo.
  const full = typeof m?.full_name === "string" ? m.full_name : "";
  const [first = "", ...rest] = full.split(" ");
  return {
    ...defaultProfile,
    firstName: first,
    lastName: rest.join(" "),
    phone: typeof m?.phone === "string" ? m.phone : "",
    ...p,
  };
}

let profile: Profile = defaultProfile;
let email = "";
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function load() {
  const sb = supabase;
  if (!sb) return;
  const { data } = await sb.auth.getUser();
  if (data.user) {
    profile = fromMeta(data.user.user_metadata as Meta);
    email = data.user.email ?? "";
  }
  loaded = true;
  emit();
}

export function useProfile() {
  const [state, setState] = useState({ profile, email, loaded });
  useEffect(() => {
    const sync = () => setState({ profile, email, loaded });
    listeners.add(sync);
    if (!loaded) void load();
    else sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return state;
}

export const displayName = (p: Profile, fallback = "") =>
  [p.firstName, p.lastName].filter(Boolean).join(" ") || fallback;

export const initialsOf = (p: Profile, fallback = "Q") => {
  const n = displayName(p);
  return n
    ? n
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("")
    : fallback;
};

export async function saveProfile(next: Profile) {
  const sb = supabase;
  if (!sb) return false;
  const { error } = await sb.auth.updateUser({
    data: {
      profile: next,
      full_name: displayName(next),
      phone: next.phone,
    },
  });
  if (error) {
    toast.error("Não foi possível guardar o perfil", { description: error.message });
    return false;
  }
  profile = next;
  emit();
  return true;
}

export async function changePassword(password: string) {
  const sb = supabase;
  if (!sb) return false;
  const { error } = await sb.auth.updateUser({ password });
  if (error) {
    toast.error("Não foi possível alterar a palavra-passe", { description: error.message });
    return false;
  }
  return true;
}

/** Termina a sessão em todos os dispositivos (inclui este). */
export async function signOutEverywhere() {
  await supabase?.auth.signOut({ scope: "global" });
}
