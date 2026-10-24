/** Membros e convites da empresa activa. */
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type Member = { userId: string; email: string; name: string; role: "owner" | "admin" | "membro"; joinedAt: string };
export type Invite = { id: string; email: string; role: "admin" | "membro"; token: string; createdAt: string; acceptedAt: string | null };

let members: Member[] = [];
let invites: Invite[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function loadMembers() {
  const sb = supabase;
  if (!sb) return;
  const [m, i] = await Promise.all([
    sb.rpc("org_members_list"),
    sb.from("org_invites").select("id,email,role,token,created_at,accepted_at").order("created_at", { ascending: false }),
  ]);
  members = ((m.data ?? []) as { user_id: string; email: string; name: string; role: Member["role"]; joined_at: string }[]).map((r) => ({
    userId: r.user_id,
    email: r.email,
    name: r.name,
    role: r.role,
    joinedAt: r.joined_at,
  }));
  invites = ((i.data ?? []) as { id: string; email: string; role: Invite["role"]; token: string; created_at: string; accepted_at: string | null }[]).map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    token: r.token,
    createdAt: r.created_at,
    acceptedAt: r.accepted_at,
  }));
  loaded = true;
  emit();
}

export function useMembers() {
  const [state, setState] = useState({ members, invites, loaded });
  useEffect(() => {
    const sync = () => setState({ members, invites, loaded });
    listeners.add(sync);
    void loadMembers();
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return state;
}

/** Empresas onde o utilizador pode convidar (dono/admin) — no plano Multi-Empresas há várias. */
export async function adminOrgs(): Promise<{ id: string; name: string }[]> {
  const sb = supabase;
  if (!sb) return [];
  const { data } = await sb.rpc("my_admin_orgs");
  return (data ?? []) as { id: string; name: string }[];
}

export async function createInvite(email: string, role: Invite["role"], orgId?: string) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const { data, error } = await sb
    .from("org_invites")
    .insert({ email: email.trim().toLowerCase(), role, ...(orgId ? { org_id: orgId } : {}) })
    .select("token")
    .single();
  if (error) return { error: error.message };
  await loadMembers();
  return { token: data.token as string };
}

export async function revokeInvite(id: string) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const { error } = await sb.from("org_invites").delete().eq("id", id);
  if (error) return { error: error.message };
  await loadMembers();
  return {};
}

export async function removeMember(userId: string) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const { error } = await sb.rpc("remove_member", { p_user: userId });
  if (error) return { error: error.message };
  await loadMembers();
  return {};
}

export async function setMemberRole(userId: string, role: "admin" | "membro") {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const { error } = await sb.rpc("set_member_role", { p_user: userId, p_role: role });
  if (error) return { error: error.message };
  await loadMembers();
  return {};
}

/** Envia (ou reenvia) o convite por e-mail, pelo servidor (Resend). */
export async function sendInviteEmail(token: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = supabase;
  if (!sb) return { ok: false, error: "Supabase não configurado." };
  const { data } = await sb.auth.getSession();
  try {
    const res = await fetch("/api/convites/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: JSON.stringify({ token }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
    if (!res.ok) {
      const reasons: Record<string, string> = {
        not_admin: "Só o dono ou um administrador pode enviar convites.",
        already_accepted: "Este convite já foi aceite.",
        not_configured: "O envio de e-mail ainda não está configurado.",
      };
      return { ok: false, error: reasons[body.error ?? ""] ?? body.detail ?? body.error ?? "Falha no envio." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Sem ligação ao servidor." };
  }
}

export const inviteLink = (token: string) =>
  typeof window !== "undefined" ? `${window.location.origin}/convite/${token}` : `/convite/${token}`;

export const roleLabel: Record<Member["role"], string> = { owner: "Dono", admin: "Administrador", membro: "Membro" };
