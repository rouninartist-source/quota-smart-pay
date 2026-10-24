import { Link } from "@tanstack/react-router";
import { Check, ChevronRight } from "lucide-react";
import { companyBanks, companyWallets, useCompany } from "@/lib/company-store";
import { planState, rootOf, useOrg } from "@/lib/org-store";
import { useProfile } from "@/lib/profile-store";
import { cn } from "@/lib/utils";

type Item = { id: string; label: string; hint: string; done: boolean; to: string; search?: Record<string, string> };

/**
 * O que falta para a conta estar completa — os dados que saem em cada
 * documento (NUIT, morada, contactos, logotipo, dados de pagamento), o nome
 * de quem emite e o plano. Desaparece quando está tudo preenchido.
 */
export function SetupChecklist() {
  const company = useCompany();
  const { profile, loaded } = useProfile();
  const { org, orgs } = useOrg();
  const plan = planState(rootOf(org, orgs));

  const nuitOk = /^\d{9}$/.test(company.nuit.replace(/\s/g, ""));
  const payOk = !company.showPaymentDetails || companyBanks(company).some((b) => b.account) || companyWallets(company).some((w) => w.number);

  const items: Item[] = [
    { id: "nome", label: "Nome da empresa", hint: "O nome legal que sai nos documentos", done: company.name.trim().length > 1, to: "/dashboard/definicoes", search: { sec: "empresa" } },
    { id: "nuit", label: "NUIT da empresa", hint: "9 dígitos — obrigatório nas facturas", done: nuitOk, to: "/dashboard/definicoes", search: { sec: "empresa" } },
    { id: "morada", label: "Morada", hint: "Sai no cabeçalho de cada documento", done: company.address.trim().length > 3, to: "/dashboard/definicoes", search: { sec: "empresa" } },
    { id: "contactos", label: "E-mail e telefone da empresa", hint: "Para os clientes o contactarem", done: !!company.email.trim() && !!company.phone.trim(), to: "/dashboard/definicoes", search: { sec: "empresa" } },
    { id: "logo", label: "Logotipo", hint: "Aparece no topo dos documentos", done: !!company.logo, to: "/dashboard/definicoes", search: { sec: "logotipo" } },
    { id: "pagamento", label: "Dados de pagamento", hint: "Conta bancária, M-Pesa ou e-Mola onde o cliente paga", done: payOk, to: "/dashboard/definicoes", search: { sec: "pagamento" } },
    { id: "perfil", label: "O seu nome", hint: "Quem emite e quem convida a equipa", done: !loaded || !!profile.firstName?.trim(), to: "/dashboard/perfil" },
    { id: "plano", label: "Plano activo", hint: plan.phase === "trial" ? `Trial — faltam ${plan.daysLeft} dias` : "Para continuar a emitir documentos", done: !plan.blocked && plan.phase !== "trial", to: "/dashboard/planos" },
  ];

  const done = items.filter((i) => i.done).length;
  if (done === items.length) return null;

  return (
    <section className="shrink-0 rounded-lg border border-border/70 bg-card p-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <p className="font-display text-[13px] font-semibold">Complete a configuração</p>
        <span className="text-[11px] text-muted-foreground">
          {done} de {items.length}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
      </div>
      <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
        {items
          .filter((i) => !i.done)
          .map((i) => (
            <li key={i.id}>
              <Link
                to={i.to}
                search={i.search as never}
                className="group flex items-center gap-2 rounded-md border border-border/70 bg-surface px-2.5 py-2 transition hover:border-primary/40 hover:bg-primary/5"
              >
                <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full border", i.done ? "border-success bg-success text-white" : "border-border")}>
                  {i.done && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold">{i.label}</span>
                  <span className="block truncate text-[10.5px] text-muted-foreground">{i.hint}</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            </li>
          ))}
      </ul>
    </section>
  );
}
