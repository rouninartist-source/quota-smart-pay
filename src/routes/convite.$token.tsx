import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, Check } from "lucide-react";
import { useSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/convite/$token")({
  head: () => ({ meta: [{ title: "Convite · Quota" }, { name: "robots", content: "noindex" }] }),
  component: Convite,
});

type Info = { org: string; role: string; email: string; valid: boolean };

/** Aceitar um convite: sem sessão, vai criar conta/entrar e volta aqui. */
function Convite() {
  const { token } = Route.useParams();
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [info, setInfo] = useState<Info | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase?.rpc("invite_info", { p_token: token }).then(({ data }) => setInfo((data as Info) ?? null));
  }, [token]);

  async function accept() {
    setBusy(true);
    const { error: err } = await supabase!.rpc("accept_invite", { p_token: token });
    setBusy(false);
    if (err) return setError(err.message);
    window.location.assign("/dashboard");
  }

  const next = `/convite/${token}`;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-up">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary">
            <span className="font-display text-xs font-bold text-primary-foreground">Q</span>
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">Quota</span>
        </Link>
        <div className="mt-10 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-6 w-6" />
        </div>
        {info === undefined ? (
          <p className="mt-4 text-sm text-muted-foreground">A verificar o convite…</p>
        ) : !info || !info.valid ? (
          <>
            <h1 className="mt-4 font-display text-[24px] font-semibold tracking-tight">Convite inválido</h1>
            <p className="mt-2 text-sm text-muted-foreground">Esta ligação já foi usada ou expirou. Peça um novo convite a quem o enviou.</p>
          </>
        ) : (
          <>
            <h1 className="mt-4 font-display text-[24px] font-semibold tracking-tight">Convite para {info.org}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Foi convidado(a) como <b className="text-foreground">{info.role === "admin" ? "administrador" : "membro"}</b> ({info.email}).
            </p>
            {!loading && !session ? (
              <div className="mt-6 grid gap-2">
                <Link to="/registo" className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
                  Criar a minha conta
                </Link>
                <Link to="/login" search={{ next }} className="flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted">
                  Já tenho conta — iniciar sessão
                </Link>
                <p className="text-[11.5px] text-muted-foreground">Depois de entrar, volte a abrir esta ligação para aceitar.</p>
              </div>
            ) : (
              <div className="mt-6">
                <button onClick={accept} disabled={busy || loading} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
                  <Check className="h-4 w-4" /> {busy ? "A entrar…" : `Aceitar e entrar em ${info.org}`}
                </button>
                {error && <p role="alert" className="mt-3 text-[12.5px] font-medium text-destructive">{error}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
