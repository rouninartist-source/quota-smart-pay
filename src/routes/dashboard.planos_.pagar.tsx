import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Check, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { rootOf, useOrg } from "@/lib/org-store";
import { plans, type PlanId } from "@/lib/plans";
import { supabase } from "@/lib/supabase";
import { Field, inputClass } from "@/components/catalog/Modal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/planos_/pagar")({
  validateSearch: (search: Record<string, unknown>): { plano?: PlanId } =>
    search.plano === "basic" || search.plano === "smart" || search.plano === "multi" ? { plano: search.plano } : {},
  head: () => ({ meta: [{ title: "Pagamento do plano · Quota Studio" }] }),
  component: PagarPage,
});

/** Contas Quota que recebem os pagamentos dos planos. */
const RECEIVERS = {
  mpesa: { name: "M-Pesa", number: "84 000 0000", holder: "QUOTA STUDIO LDA", color: "#e2001a" },
  emola: { name: "e-Mola", number: "86 000 0000", holder: "QUOTA STUDIO LDA", color: "#f5a300" },
} as const;

const fmt = (n: number) => new Intl.NumberFormat("pt-PT").format(n);

function PagarPage() {
  const { plano } = Route.useSearch();
  const navigate = useNavigate();
  const { org, orgs } = useOrg();
  const root = rootOf(org, orgs);
  const plan = plans.find((p) => p.id === plano) ?? plans[1];
  const [months, setMonths] = useState<1 | 3 | 12>(1);
  const [method, setMethod] = useState<"mpesa" | "emola">("mpesa");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const discount = months === 12 ? 0.1 : 0;
  const amount = Math.round(plan.monthly * months * (1 - discount));
  const receiver = RECEIVERS[method];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 9) return toast.error("Indique o número de onde fez o pagamento.");
    if (reference.trim().length < 4) return toast.error("Indique a referência/ID da transacção que recebeu por SMS.");
    setBusy(true);
    const { error } = await supabase!.from("plan_payments").insert({ plan: plan.id, months, amount, method, phone: phone.trim(), reference: reference.trim() });
    setBusy(false);
    if (error) return toast.error("Não foi possível registar o pagamento", { description: error.message });
    setDone(true);
  }

  if (done) {
    return (
      <div className="grid place-items-center py-16">
        <div className="max-w-md text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-success/10 text-success"><Check className="h-6 w-6" /></span>
          <h1 className="mt-4 font-display text-[20px] font-semibold">Pagamento registado</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Recebemos o seu pedido do plano <b className="text-foreground">{plan.name}</b> ({fmt(amount)} MT via {receiver.name}, ref. {reference}).
            A equipa Quota confirma o pagamento e activa o plano em <b className="text-foreground">{root?.name}</b> — normalmente no mesmo dia útil.
          </p>
          <Link to="/dashboard/planos" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2.5 text-[12.5px] font-semibold text-primary-foreground hover:opacity-90">Voltar aos planos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/dashboard/planos" aria-label="Voltar aos planos" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronLeft className="h-4 w-4" /></Link>
          <span className="text-[12.5px] font-semibold">Activar o plano {plan.name}</span>
          <span className="border-l border-border/60 pl-3 text-[11px] text-muted-foreground">{root?.name}</span>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={submit} className="grid gap-5 rounded-lg border border-border/70 bg-card p-5 shadow-sm">
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">1 · Período</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([1, 3, 12] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMonths(m)} className={cn("rounded-lg border p-3 text-left transition", months === m ? "border-primary bg-primary/5" : "border-border/70 bg-surface hover:border-border")}>
                  <span className="block text-[12.5px] font-semibold">{m === 1 ? "Mensal" : m === 3 ? "Trimestral" : "Anual"}</span>
                  <span className="block text-[11px] text-muted-foreground">{fmt(Math.round(plan.monthly * m * (1 - (m === 12 ? 0.1 : 0))))} MT{m === 12 ? " · −10%" : ""}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">2 · Método de pagamento</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["mpesa", "emola"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)} className={cn("flex items-center gap-3 rounded-lg border p-3 text-left transition", method === m ? "border-primary bg-primary/5" : "border-border/70 bg-surface hover:border-border")}>
                  <span className="inline-flex h-7 items-center rounded-sm px-2 text-[11px] font-bold text-white" style={{ backgroundColor: RECEIVERS[m].color }}>{RECEIVERS[m].name}</span>
                  <span className="text-[12px] text-muted-foreground">{m === "mpesa" ? "Vodacom" : "Movitel"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-surface p-4">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">3 · Faça a transferência</p>
            <ol className="mt-2 grid gap-1.5 text-[12.5px]">
              <li className="flex items-center gap-2"><Smartphone className="h-3.5 w-3.5 text-muted-foreground" /> No {receiver.name}, envie <b className="tabular-nums">{fmt(amount)} MT</b> para <b className="tabular-nums">{receiver.number}</b> ({receiver.holder}).</li>
              <li className="pl-5">Na referência escreva <b>{root?.nuit || root?.name}</b>.</li>
              <li className="pl-5">Guarde o SMS de confirmação — precisa do ID da transacção.</li>
            </ol>
          </div>

          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">4 · Confirme o pagamento</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Field label="Número de onde pagou"><input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="84 / 86 …" inputMode="tel" /></Field>
              <Field label="ID / referência da transacção"><input className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex.: PKL3H7XQ9" /></Field>
            </div>
          </div>

          <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[12.5px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {busy ? "A registar…" : `Já paguei ${fmt(amount)} MT`}
          </button>
        </form>

        <aside className="grid content-start gap-3">
          <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Resumo</p>
            <p className="mt-2 font-display text-[17px] font-semibold">{plan.name}</p>
            <p className="text-[11.5px] text-muted-foreground">{plan.tagline}</p>
            <dl className="mt-3 grid gap-1.5 text-[12px]">
              <div className="flex justify-between"><dt className="text-muted-foreground">Período</dt><dd>{months === 1 ? "1 mês" : `${months} meses`}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Mensalidade</dt><dd className="tabular-nums">{fmt(plan.monthly)} MT</dd></div>
              {discount > 0 && <div className="flex justify-between text-success"><dt>Desconto anual</dt><dd>−10%</dd></div>}
              <div className="flex justify-between border-t border-border/60 pt-1.5 text-[13px] font-semibold"><dt>Total</dt><dd className="tabular-nums">{fmt(amount)} MT</dd></div>
            </dl>
          </section>
          <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
            O plano activa-se após a confirmação da equipa Quota. O período experimental termina nessa altura; até lá continua a usar o Basic.
          </p>
        </aside>
      </div>
    </div>
  );
}
