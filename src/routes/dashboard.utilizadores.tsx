import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, UserPlus, Copy, MessageCircle, Mail, Trash2, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";
import { rootOf, useOrg } from "@/lib/org-store";
import { planUserLimit, getPlan } from "@/lib/plans";
import { createInvite, inviteLink, removeMember, revokeInvite, roleLabel, setMemberRole, useMembers, type Invite } from "@/lib/members-store";
import { Field, inputClass } from "@/components/catalog/Modal";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/utilizadores")({
  head: () => ({
    meta: [
      { title: "Utilizadores · Quota Studio" },
      { name: "description", content: "Convide a equipa, atribua papéis e gira quem acede à empresa." },
    ],
  }),
  component: UtilizadoresPage,
});

function UtilizadoresPage() {
  const { session } = useSession();
  const { org, orgs } = useOrg();
  const root = rootOf(org, orgs);
  const limit = planUserLimit(root?.plan);
  const { members, invites, loaded } = useMembers();
  const me = members.find((m) => m.userId === session?.user.id);
  const canManage = me?.role === "owner" || me?.role === "admin";
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Invite["role"]>("membro");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<Invite | null>(null);
  const pending = invites.filter((i) => !i.acceptedAt);
  const full = members.length >= limit;

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.error("Indique um e-mail válido.");
    if (full) return toast.error(`O plano ${getPlan(root?.plan).name} permite ${limit} utilizadores por empresa.`);
    setBusy(true);
    const res = await createInvite(email, role);
    setBusy(false);
    if (res.error) return toast.error("Não foi possível criar o convite", { description: res.error });
    const inv: Invite = { id: "", email: email.trim(), role, token: res.token!, createdAt: new Date().toISOString(), acceptedAt: null };
    setLast(inv);
    setEmail("");
    toast.success("Convite criado", { description: "Partilhe a ligação — a pessoa cria a sua própria palavra-passe." });
  }

  const inviteMessage = (inv: Invite) =>
    `Olá! Foi convidado(a) para a empresa ${org?.name} no Quota como ${roleLabel[inv.role].toLowerCase()}. Abra a ligação, crie a sua conta (ou inicie sessão) e fica logo com acesso:\n${inviteLink(inv.token)}`;
  const copy = async (inv: Invite) => {
    await navigator.clipboard?.writeText(inviteLink(inv.token));
    toast.success("Ligação copiada");
  };
  const viaWhatsApp = (inv: Invite) => window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage(inv))}`, "_blank", "noreferrer");
  const viaEmail = (inv: Invite) => {
    window.location.href = `mailto:${inv.email}?subject=${encodeURIComponent(`Convite para ${org?.name} no Quota`)}&body=${encodeURIComponent(inviteMessage(inv))}`;
  };

  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 pl-1 text-[12.5px] font-semibold">
            <Users className="h-3.5 w-3.5 text-primary" /> Utilizadores
          </span>
          <span className="border-l border-border/60 pl-3 text-[11px] text-muted-foreground">
            {org?.name} · {members.length} de {limit} no plano {getPlan(root?.plan).name}
          </span>
          {full && (
            <Link to="/dashboard/planos" className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium text-primary hover:bg-muted">
              <Sparkles className="h-3.5 w-3.5" /> Mais utilizadores? Upgrade
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-3 md:min-h-0 md:flex-1 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-h-0 overflow-y-auto rounded-lg border border-border/70 bg-card shadow-sm">
          <table className="w-full text-[12.5px]">
            <thead className="bg-surface text-[9.5px] uppercase tracking-[0.13em] text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Utilizador</th>
                <th className="px-4 py-2.5 text-left font-semibold">Papel</th>
                <th className="px-4 py-2.5 text-left font-semibold">Desde</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {!loaded && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">A carregar…</td></tr>}
              {members.map((m) => (
                <tr key={m.userId}>
                  <td className="px-4 py-3">
                    <span className="block font-medium">{m.name || m.email}{m.userId === session?.user.id && <span className="ml-1.5 text-[10.5px] text-muted-foreground">(eu)</span>}</span>
                    {m.name && <span className="block text-[11px] text-muted-foreground">{m.email}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {canManage && m.role !== "owner" ? (
                      <select
                        value={m.role}
                        onChange={async (e) => {
                          const r = await setMemberRole(m.userId, e.target.value as "admin" | "membro");
                          if (r.error) toast.error(r.error); else toast.success("Papel actualizado");
                        }}
                        className="h-8 rounded-md border border-border bg-background px-2 text-[12px]"
                      >
                        <option value="admin">Administrador</option>
                        <option value="membro">Membro</option>
                      </select>
                    ) : (
                      <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", m.role === "owner" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{roleLabel[m.role]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatDate(m.joinedAt.slice(0, 10))}</td>
                  <td className="px-4 py-3 text-right">
                    {canManage && m.role !== "owner" && m.userId !== session?.user.id && (
                      <button
                        onClick={async () => {
                          const r = await removeMember(m.userId);
                          if (r.error) toast.error(r.error); else toast.success("Utilizador removido");
                        }}
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-destructive hover:underline"
                      >
                        <Trash2 className="h-3 w-3" /> Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {pending.map((i) => (
                <tr key={i.id} className="bg-surface/60">
                  <td className="px-4 py-3">
                    <span className="block font-medium">{i.email}</span>
                    <span className="block text-[11px] text-warning-foreground dark:text-warning">Convite pendente · {formatDate(i.createdAt.slice(0, 10))}</span>
                  </td>
                  <td className="px-4 py-3"><span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{roleLabel[i.role]}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">—</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn title="Copiar ligação" onClick={() => copy(i)}><Copy className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn title="Enviar por WhatsApp" onClick={() => viaWhatsApp(i)}><MessageCircle className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn title="Enviar por e-mail" onClick={() => viaEmail(i)}><Mail className="h-3.5 w-3.5" /></IconBtn>
                      {canManage && (
                        <IconBtn title="Anular convite" destructive onClick={async () => { const r = await revokeInvite(i.id); if (r.error) toast.error(r.error); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="grid content-start gap-3">
          <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-[12.5px] font-semibold">Convidar utilizador</p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              A pessoa recebe uma ligação, cria a sua conta com a sua própria palavra-passe (ou inicia sessão) e entra na empresa com o papel escolhido.
            </p>
            {canManage ? (
              <form onSubmit={invite} className="mt-3 grid gap-3">
                <Field label="E-mail"><input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colega@empresa.co.mz" /></Field>
                <Field label="Papel">
                  <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as Invite["role"])}>
                    <option value="membro">Membro — emite e consulta documentos</option>
                    <option value="admin">Administrador — também gere utilizadores e definições</option>
                  </select>
                </Field>
                <button type="submit" disabled={busy || full} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  <UserPlus className="h-3.5 w-3.5" /> {busy ? "A criar…" : "Criar convite"}
                </button>
              </form>
            ) : (
              <p className="mt-3 text-[12px] text-muted-foreground">Só o dono ou um administrador pode convidar.</p>
            )}
          </section>

          {last && (
            <section className="rounded-lg border border-success/30 bg-success/5 p-4">
              <p className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-success"><Check className="h-3.5 w-3.5" /> Convite para {last.email}</p>
              <p className="mt-1 break-all text-[11px] text-muted-foreground">{inviteLink(last.token)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <SmallBtn onClick={() => copy(last)}><Copy className="h-3 w-3" /> Copiar</SmallBtn>
                <SmallBtn onClick={() => viaWhatsApp(last)}><MessageCircle className="h-3 w-3" /> WhatsApp</SmallBtn>
                <SmallBtn onClick={() => viaEmail(last)}><Mail className="h-3 w-3" /> E-mail</SmallBtn>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title, destructive }: { children: React.ReactNode; onClick: () => void; title: string; destructive?: boolean }) {
  return (
    <button onClick={onClick} title={title} aria-label={title} className={cn("grid h-7 w-7 place-items-center rounded-md border border-border bg-card hover:bg-muted", destructive && "text-destructive")}>
      {children}
    </button>
  );
}
function SmallBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-semibold hover:bg-muted">
      {children}
    </button>
  );
}
