import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { updatePassword, useSession } from "@/lib/auth";

export const Route = createFileRoute("/nova-palavra-passe")({
  head: () => ({
    meta: [
      { title: "Nova palavra-passe · Quota" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NovaPalavraPasse,
});

/**
 * Destino da ligação de recuperação. O Supabase abre uma sessão de recuperação
 * a partir do fragmento do URL; só depois é possível definir a palavra-passe.
 */
function NovaPalavraPasse() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waited, setWaited] = useState(false);

  // A sessão de recuperação pode demorar um instante a ser lida do URL.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2500);
    return () => clearTimeout(t);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (pw.length < 8) return setError("A palavra-passe deve ter pelo menos 8 caracteres.");
    if (pw !== confirm) return setError("As palavras-passe não coincidem.");
    setBusy(true);
    setError(null);
    const { error: err } = await updatePassword(pw);
    setBusy(false);
    if (err) return setError(err);
    void navigate({ to: "/dashboard" });
  }

  const expired = !loading && !session && waited;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-up">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary">
            <span className="font-display text-xs font-bold text-primary-foreground">Q</span>
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">Quota</span>
        </Link>
        <h1 className="mt-10 font-display text-[28px] font-semibold tracking-tight">Nova palavra-passe</h1>

        {expired ? (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              A ligação expirou ou já foi usada. Peça uma nova.
            </p>
            <Link to="/recuperar" className="mt-6 inline-flex text-sm font-medium text-primary hover:underline">
              Recuperar acesso
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="pw" className="text-[13px] font-medium">Palavra-passe</label>
              <div className="relative mt-1.5">
                <input
                  id="pw"
                  type={show ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  autoComplete="new-password"
                  autoFocus
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-md border border-border bg-surface px-3.5 py-3 pr-11 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:bg-card"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm" className="text-[13px] font-medium">Confirmar</label>
              <input
                id="confirm"
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="Repita a palavra-passe"
                className="mt-1.5 w-full rounded-md border border-border bg-surface px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:bg-card"
              />
            </div>
            {error && <p role="alert" className="text-[12.5px] font-medium text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={busy || (!session && !loading)}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "A guardar…" : loading || !session ? "A validar a ligação…" : "Guardar e entrar"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
