import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth";

export const Route = createFileRoute("/recuperar")({
  head: () => ({
    meta: [
      { title: "Recuperar palavra-passe · Quota" },
      { name: "description", content: "Receba por e-mail uma ligação para definir uma nova palavra-passe." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Recuperar,
});

function Recuperar() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Indique um e-mail válido.");
    setBusy(true);
    setError(null);
    const { error: err } = await requestPasswordReset(email.trim());
    setBusy(false);
    if (err) return setError(err);
    setSent(true);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-up">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary">
            <span className="font-display text-xs font-bold text-primary-foreground">Q</span>
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">Quota</span>
        </Link>

        {sent ? (
          <div className="mt-10">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Check className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-display text-[24px] font-semibold tracking-tight">Verifique o e-mail</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Se existir uma conta para <span className="font-medium text-foreground">{email.trim()}</span>, enviámos
              uma ligação para definir uma nova palavra-passe. Válida por uma hora.
            </p>
            <Link to="/login" className="mt-6 inline-flex text-sm font-medium text-primary hover:underline">
              Voltar ao início de sessão
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mt-10 font-display text-[28px] font-semibold tracking-tight">Recuperar acesso</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Indique o e-mail da conta. Enviamos uma ligação para definir uma nova palavra-passe.
            </p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="text-[13px] font-medium">E-mail</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  placeholder="nome@empresa.co.mz"
                  className="mt-1.5 w-full rounded-md border border-border bg-surface px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:bg-card"
                />
              </div>
              {error && <p role="alert" className="text-[12.5px] font-medium text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "A enviar…" : "Enviar ligação"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-8 text-center text-[13px] text-muted-foreground">
              Lembrou-se?{" "}
              <Link to="/login" className="font-medium text-foreground hover:text-primary">Iniciar sessão</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
