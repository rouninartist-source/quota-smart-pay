import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signIn, signUp, useSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar · Quota Studio" },
      { name: "description", content: "Aceda à sua conta Quota." },
    ],
  }),
  component: EntrarPage,
});

function EntrarPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      setError("Indique o email e uma palavra-passe com pelo menos 6 caracteres.");
      return;
    }
    setError(undefined);
    setBusy(true);

    const result =
      mode === "entrar" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);

    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === "criar" && "needsConfirmation" in result && result.needsConfirmation) {
      toast.success("Conta criada", {
        description: "Confirme o email antes de entrar.",
      });
      setMode("entrar");
      return;
    }
    void navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-[15px] font-bold text-primary-foreground">
            Q
          </span>
          <span>
            <span className="block font-display text-[15px] font-semibold">Quota Studio</span>
            <span className="block text-[11px] text-muted-foreground">Facturação para PMEs</span>
          </span>
        </div>

        <form
          onSubmit={submit}
          className="rounded-lg border border-border/70 bg-card p-5 shadow-elegant"
        >
          <h1 className="font-display text-[16px] font-semibold">
            {mode === "entrar" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {mode === "entrar"
              ? "Aceda com o email e a palavra-passe da sua conta."
              : "A primeira conta pode ser criada aqui."}
          </p>

          {!isSupabaseConfigured && (
            <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2 text-[11.5px] text-destructive">
              Supabase não configurado — preencha o <code>.env</code>.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 rounded-md border border-border bg-surface px-3 text-[13px] outline-none transition focus:border-primary/60"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Palavra-passe
              </span>
              <input
                type="password"
                value={password}
                autoComplete={mode === "entrar" ? "current-password" : "new-password"}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 rounded-md border border-border bg-surface px-3 text-[13px] outline-none transition focus:border-primary/60"
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-[11.5px] font-medium text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !isSupabaseConfigured}
            className={cn(
              "mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-semibold text-primary-foreground transition",
              "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {mode === "entrar" ? "Entrar" : "Criar conta"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "entrar" ? "criar" : "entrar");
              setError(undefined);
            }}
            className="mt-3 w-full text-[11.5px] text-muted-foreground transition hover:text-foreground"
          >
            {mode === "entrar" ? "Não tem conta? Criar" : "Já tem conta? Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
