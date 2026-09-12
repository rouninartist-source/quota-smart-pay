import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Check, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createOrg, switchOrg, useOrg } from "@/lib/org-store";
import { getPlan } from "@/lib/plans";
import { useSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas · Quota" },
      { name: "description", content: "Escolha com qual das suas empresas quer entrar, ou adicione uma nova." },
      { property: "og:title", content: "Empresas · Quota" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Empresas,
});

const inputCls =
  "mt-1.5 w-full rounded-md border border-border bg-surface px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:bg-card";

function Empresas() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const { org, orgs, ready } = useOrg();
  const plan = getPlan(org?.plan);
  const canAdd = orgs.length < plan.maxOrgs;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [nuit, setNuit] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && !session) {
    void navigate({ to: "/login", search: { next: "/empresas" } });
    return null;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Indique o nome da empresa.");
    if (nuit && nuit.replace(/\D/g, "").length !== 9) return toast.error("O NUIT deve ter 9 dígitos.");
    setBusy(true);
    const res = await createOrg({ name: name.trim(), nuit: nuit.trim() });
    setBusy(false);
    if (res.error) return toast.error("Não foi possível criar a empresa", { description: res.error });
    toast.success(`${name.trim()} criada`, { description: "A entrar na nova empresa…" });
    window.location.assign("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 md:px-14">
      <Link to="/" className="inline-flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary">
          <span className="font-display text-xs font-bold text-primary-foreground">Q</span>
        </div>
        <span className="font-display text-[15px] font-semibold tracking-tight">Quota</span>
      </Link>

      <div className="mx-auto mt-10 w-full max-w-2xl animate-fade-up">
        <h1 className="font-display text-[28px] font-semibold tracking-tight">As suas empresas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Plano <span className="font-medium text-foreground">{plan.name}</span> · {orgs.length} de {plan.maxOrgs} empresa{plan.maxOrgs === 1 ? "" : "s"}.
          Os dados de cada empresa ficam separados.
        </p>

        <ul className="mt-8 grid gap-3">
          {!ready && <li className="rounded-lg border border-border/70 bg-card p-5 text-sm text-muted-foreground">A carregar…</li>}
          {orgs.map((w) => {
            const active = org?.id === w.id;
            return (
              <li key={w.id}>
                <button
                  onClick={() => (active ? navigate({ to: "/dashboard" }) : void switchOrg(w.id))}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left transition hover:border-primary/50",
                    active ? "border-primary ring-[3px] ring-primary/12" : "border-border/70",
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    {w.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{w.name}</span>
                    <span className="block truncate text-[12px] text-muted-foreground">NUIT {w.nuit || "—"} · Plano {getPlan(w.plan).name}</span>
                  </span>
                  {active ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-primary"><Check className="h-3.5 w-3.5" /> Activa · entrar</span>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {adding ? (
          <form onSubmit={add} className="mt-4 rounded-lg border border-border/70 bg-card p-5">
            <p className="text-[14px] font-semibold">Nova empresa</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
              <label className="text-[13px] font-medium">Nome<input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Empresa, Lda" autoFocus /></label>
              <label className="text-[13px] font-medium">NUIT<input value={nuit} onChange={(e) => setNuit(e.target.value)} className={inputCls} placeholder="400000000" inputMode="numeric" /></label>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setAdding(false)} className="rounded-md border border-border px-3 py-2 text-[12px] font-medium hover:bg-muted">Cancelar</button>
              <button type="submit" disabled={busy} className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                <Building2 className="h-3.5 w-3.5" /> {busy ? "A criar…" : "Criar e entrar"}
              </button>
            </div>
          </form>
        ) : canAdd ? (
          <button onClick={() => setAdding(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3.5 py-2.5 text-[12.5px] font-semibold text-muted-foreground hover:border-primary/60 hover:text-primary">
            <Plus className="h-3.5 w-3.5" /> Adicionar empresa
          </button>
        ) : (
          <Link to="/dashboard/planos" className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2.5 text-[12.5px] font-semibold text-primary hover:bg-primary/5">
            <Sparkles className="h-3.5 w-3.5" /> Mais empresas? Faça upgrade para Multi-Empresas
          </Link>
        )}

        <p className="mt-8 text-center text-[12.5px] text-muted-foreground">
          <Link to="/dashboard" className="font-medium text-foreground hover:text-primary">Voltar ao painel</Link>
        </p>
      </div>
    </main>
  );
}
