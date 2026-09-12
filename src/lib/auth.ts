/**
 * Sessão do utilizador (Supabase Auth).
 *
 * A sessão vive no browser, por isso tudo aqui é client-only — no servidor
 * `loading` fica a `true` e o guarda não decide nada, para não haver diferença
 * entre o HTML do servidor e o do cliente.
 */
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = supabase;
    if (!sb) {
      setLoading(false);
      return;
    }

    let alive = true;

    sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

/** As mensagens do Supabase vêm em inglês — o utilizador lê em português. */
export function translateAuthError(message?: string) {
  if (!message) return undefined;
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou palavra-passe incorrectos.";
  if (m.includes("email not confirmed")) return "Confirme o e-mail antes de iniciar sessão — veja a caixa de entrada.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Este e-mail já tem conta. Inicie sessão ou recupere a palavra-passe.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiadas tentativas. Aguarde um minuto e tente de novo.";
  if (m.includes("password should be at least")) return "A palavra-passe deve ter pelo menos 6 caracteres.";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "Indique um e-mail válido.";
  if (m.includes("network") || m.includes("fetch")) return "Sem ligação. Verifique a internet e tente de novo.";
  if (m.includes("same password") || m.includes("different from the old")) return "A nova palavra-passe tem de ser diferente da actual.";
  return message;
}

export async function signIn(email: string, password: string) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return { error: translateAuthError(error?.message) };
}

export async function signUp(email: string, password: string, meta?: { full_name?: string; phone?: string }) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: meta } });
  if (error) return { error: translateAuthError(error.message) };
  // Um utilizador devolvido sem identidades é um e-mail já registado (o Supabase
  // não o diz para não revelar contas).
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "Este e-mail já tem conta. Inicie sessão ou recupere a palavra-passe." };
  }
  // Sem sessão devolvida significa que o Supabase exige confirmação por email.
  return { needsConfirmation: !data.session };
}

/** Envia o e-mail de recuperação; o link volta a /nova-palavra-passe. */
export async function requestPasswordReset(email: string) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/nova-palavra-passe` : undefined;
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
  return { error: translateAuthError(error?.message) };
}

export async function updatePassword(password: string) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const { error } = await sb.auth.updateUser({ password });
  return { error: translateAuthError(error?.message) };
}

export async function signOut() {
  await supabase?.auth.signOut();
}
