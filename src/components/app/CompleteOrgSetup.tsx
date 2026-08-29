import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { createOrg } from "@/lib/org-store";
import { signOut } from "@/lib/auth";

/**
 * Ecrã para quem tem sessão mas ainda não tem empresa. Sem isto essa pessoa
 * ficava com um painel vazio e sem forma de sair do impasse.
 */
export function CompleteOrgSetup({ email }: { email?: string }) {
  const [name, setName] = useState("");
  const [nuit, setNuit] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Indique o nome da empresa.");
    setError(undefined);
    setBusy(true);
    const { error: err } = await createOrg({ name: name.trim(), nuit: nuit.trim() });
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-[400px]">
        <div className="rounded-lg border border-border/70 bg-card p-5 shadow-elegant">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4.5 w-4.5" />
          </span>
          <h1 className="mt-3 font-display text-[16px] font-semibold">Falta criar a sua empresa</h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            A conta {email ? <span className="font-medium text-foreground">{email}</span> : ""} ainda
            não está ligada a nenhuma empresa. Os documentos e clientes pertencem à empresa.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Nome da empresa
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="A minha empresa, Lda"
                className="h-9 rounded-md border border-border bg-surface px-3 text-[13px] outline-none transition focus:border-primary/60"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                NUIT (opcional)
              </span>
              <input
                value={nuit}
                onChange={(e) => setNuit(e.target.value)}
                placeholder="400000000"
                className="h-9 rounded-md border border-border bg-surface px-3 text-[13px] tabular-nums outline-none transition focus:border-primary/60"
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
            disabled={busy}
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar empresa e continuar
          </button>

          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-3 w-full text-[11.5px] text-muted-foreground transition hover:text-foreground"
          >
            Terminar sessão
          </button>
        </div>
      </form>
    </div>
  );
}
