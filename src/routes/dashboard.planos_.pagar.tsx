import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Check, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { refreshOrg, rootOf, useOrg } from "@/lib/org-store";
import { plans, type PlanId } from "@/lib/plans";
import { supabase } from "@/lib/supabase";
import { Field, inputClass } from "@/components/catalog/Modal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/planos_/pagar")({
  validateSearch: (search: Record<string, unknown>): { plano?: PlanId; pagamento?: string } => ({
    ...(search.plano === "basic" || search.plano === "smart" || search.plano === "multi" ? { plano: search.plano } : {}),
    ...(typeof search.pagamento === "string" ? { pagamento: search.pagamento } : {}),
  }),
  head: () => ({ meta: [{ title: "Pagamento do plano · Quota Studio" }] }),
  component: PagarPage,
});

const METHODS = {
  mpesa: { name: "M-Pesa", operator: "Vodacom", color: "#e2001a" },
  emola: { name: "e-Mola", operator: "Movitel", color: "#f5a300" },
} as const;

const fmt = (n: number) => new Intl.NumberFormat("pt-PT").format(n);

const ERRORS: Record<string, string> = {
  not_configured: "Os pagamentos online ainda não estão configurados. Tente mais tarde ou fale connosco.",
  not_admin: "Só o dono ou um administrador da empresa pode pagar o plano.",
  has_child_orgs: "Tem empresas adicionais — só o plano Multi-Empresas as suporta.",
  bad_phone: "Indique um número de telemóvel com 9 dígitos.",
  provider_refused: "A Payzeno recusou o pedido. Tente novamente dentro de instantes.",
  provider_unreachable: "Não foi possível contactar a Payzeno. Verifique a ligação e tente novamente.",
};

async function authHeader(): Promise<Record<string, string>> {
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function PagarPage() {
  const { pagamento } = Route.useSearch();
  return pagamento ? <PaymentStatus id={pagamento} /> : <CheckoutForm />;
}

function CheckoutForm() {
  const { plano } = Route.useSearch();
  const { org, orgs } = useOrg();
  const root = rootOf(org, orgs);
  const plan = plans.find((p) => p.id === plano) ?? plans[1];
  const [months, setMonths] = useState<1 | 3 | 12>(1);
  const [method, setMethod] = useState<"mpesa" | "emola">("mpesa");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const discount = months === 12 ? 0.1 : 0;
  const amount = Math.round(plan.monthly * months * (1 - discount));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 9) return toast.error("Indique o número M-Pesa / e-Mola com que vai pagar.");
    setBusy(true);
    try {
      const res = await fetch("/api/planos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ plan: plan.id, months, method, phone, orgId: org?.id }),
      });
      const body = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !body.checkoutUrl) {
        setBusy(false);
        return toast.error("Não foi possível iniciar o pagamento", { description: ERRORS[body.error ?? ""] ?? body.error });
      }
      window.location.assign(body.checkoutUrl);
    } catch {
      setBusy(false);
      toast.error("Não foi possível iniciar o pagamento", { description: ERRORS.provider_unreachable });
    }
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
                  <span className="inline-flex h-7 items-center rounded-sm px-2 text-[11px] font-bold text-white" style={{ backgroundColor: METHODS[m].color }}>{METHODS[m].name}</span>
                  <span className="text-[12px] text-muted-foreground">{METHODS[m].operator}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">3 · Número que vai pagar</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Field label={`Número ${METHODS[method].name}`}><input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={method === "mpesa" ? "84 / 85 …" : "86 / 87 …"} inputMode="tel" /></Field>
            </div>
          </div>

          <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[12.5px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> A abrir o pagamento…</> : `Pagar ${fmt(amount)} MT com ${METHODS[method].name}`}
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
          <p className="inline-flex gap-2 px-1 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            O pagamento é feito na página segura da Payzeno. Confirmado o pagamento, o plano activa-se de imediato em {root?.name}.
          </p>
        </aside>
      </div>
    </div>
  );
}

type Status = { status: string; plan: PlanId; months: number; amount: number; checkoutUrl: string | null };

/** Regresso da Payzeno: consulta o estado até o pagamento terminar (até ~2 minutos). */
function PaymentStatus({ id }: { id: string }) {
  const navigate = useNavigate();
  const [state, setState] = useState<Status | null>(null);
  const [failed, setFailed] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let alive = true;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      tries++;
      try {
        const res = await fetch(`/api/planos/estado?id=${encodeURIComponent(id)}`, { headers: await authHeader() });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as Status;
        if (!alive) return;
        setState(body);
        if (body.status === "confirmado") {
          await refreshOrg();
          return;
        }
        if (body.status !== "pendente") return;
      } catch {
        if (!alive) return;
        if (tries === 1) return setFailed(true);
      }
      if (tries >= 40) return setGaveUp(true);
      timer = setTimeout(poll, 3000);
    }
    void poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id]);

  const plan = plans.find((p) => p.id === state?.plan);
  const status = failed ? "erro" : state?.status ?? "pendente";

  return (
    <div className="grid place-items-center py-16">
      <div className="max-w-md text-center">
        {status === "confirmado" ? (
          <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-success/10 text-success"><Check className="h-6 w-6" /></span>
            <h1 className="mt-4 font-display text-[20px] font-semibold">Plano {plan?.name} activo</h1>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Pagamento de <b className="text-foreground">{fmt(Number(state?.amount))} MT</b> confirmado ({state?.months === 1 ? "1 mês" : `${state?.months} meses`}). Obrigado!
            </p>
            <Link to="/dashboard" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2.5 text-[12.5px] font-semibold text-primary-foreground hover:opacity-90">Ir para a visão geral</Link>
          </>
        ) : status === "pendente" ? (
          <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><Loader2 className={cn("h-6 w-6", !gaveUp && "animate-spin")} /></span>
            <h1 className="mt-4 font-display text-[20px] font-semibold">{gaveUp ? "Ainda sem confirmação" : "A confirmar o pagamento…"}</h1>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {gaveUp
                ? "A Payzeno ainda não confirmou. Se já autorizou o pagamento, o plano activa-se assim que a confirmação chegar — pode sair desta página."
                : "Autorize o pagamento no telemóvel, se ainda não o fez. Esta página actualiza-se sozinha."}
            </p>
            <div className="mt-6 flex justify-center gap-2">
              {state?.checkoutUrl && <a href={state.checkoutUrl} className="inline-flex rounded-md border border-border bg-card px-4 py-2.5 text-[12.5px] font-medium hover:bg-muted">Voltar à página de pagamento</a>}
              <Link to="/dashboard/planos" className="inline-flex rounded-md bg-primary px-4 py-2.5 text-[12.5px] font-semibold text-primary-foreground hover:opacity-90">Voltar aos planos</Link>
            </div>
          </>
        ) : (
          <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive"><X className="h-6 w-6" /></span>
            <h1 className="mt-4 font-display text-[20px] font-semibold">
              {status === "expirado" ? "O pagamento expirou" : status === "erro" ? "Não foi possível ver o pagamento" : "O pagamento não foi concluído"}
            </h1>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {status === "erro" ? "Actualize a página dentro de instantes. Se já pagou, o plano activa-se assim que a Payzeno confirmar." : "Nenhum valor foi cobrado por este pedido. Pode tentar novamente."}
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard/planos/pagar", search: { plano: state?.plan } })}
              className="mt-6 inline-flex rounded-md bg-primary px-4 py-2.5 text-[12.5px] font-semibold text-primary-foreground hover:opacity-90"
            >
              Tentar novamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}
