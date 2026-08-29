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

export async function signIn(email: string, password: string) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return { error: error?.message };
}

export async function signUp(email: string, password: string) {
  const sb = supabase;
  if (!sb) return { error: "Supabase não configurado." };
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) return { error: error.message };
  // Sem sessão devolvida significa que o Supabase exige confirmação por email.
  return { needsConfirmation: !data.session };
}

export async function signOut() {
  await supabase?.auth.signOut();
}
