import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ChevronRight,
  FileText,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMZN, formatDate, initials } from "@/lib/format";
import {
  invoiceBalance,
  invoicePaid,
  invoiceTotal,
  paymentMethodLabels,
  statusMeta,
  useInvoices,
} from "@/lib/invoices-store";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Visão geral · Quota Studio" },
      {
        name: "description",
        content:
          "Resumo diário do seu negócio: saldo a receber, receita, facturas emitidas e movimentos recentes.",
      },
      { property: "og:title", content: "Visão geral · Quota Studio" },
      { property: "og:description", content: "Resumo diário do seu negócio no Quota." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardOverview,
});

const toneClass: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground dark:text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
};

/** Tendência de facturação dos últimos 8 meses (ainda sem histórico no store). */
const trend = [96, 128, 112, 168, 152, 214, 196, 262];

/* ---------- building blocks ---------- */

/** Sparkline de área desenhada à mão — mais nítida que um gráfico completo a este tamanho. */
function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const w = 116;
  const h = 46;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (w - 6) + 3;
    const y = h - 5 - ((p - min) / span) * (h - 12);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-[46px] w-[116px] shrink-0", className)}
      role="img"
      aria-label={`Tendência dos últimos ${points.length} meses`}
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${last[0].toFixed(1)} ${h} L3 ${h} Z`} fill="url(#sparkFill)" />
      <path
        d={line}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={3} fill="var(--color-primary)" />
    </svg>
  );
}

function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col rounded-lg border border-border/60 bg-card shadow-card",
        className,
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2.5 pt-3.5">
        <h3 className="text-[12.5px] font-semibold tracking-tight">{title}</h3>
        {action}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">{children}</div>
    </section>
  );
}

function KpiCell({
  label,
  value,
  hint,
  hintTone,
  badge,
  wide,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  hintTone?: "success" | "destructive" | "muted";
  badge?: React.ReactNode;
  wide?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-w-0 border-border/60 px-4 py-3.5 md:border-l md:first:border-l-0",
        wide && "bg-linear-to-b from-primary/4 to-transparent",
      )}
    >
      <div className="flex items-center gap-2">
        <p className="text-[10.5px] font-medium text-muted-foreground">{label}</p>
        {badge}
      </div>
      <div className={cn("flex items-end justify-between gap-3", wide && "mt-0.5")}>
        <div className="min-w-0">
          <p
            className={cn(
              "mt-1 font-display font-semibold tabular-nums tracking-tight",
              wide ? "text-[30px] leading-none" : "text-xl leading-none",
            )}
          >
            {value}
          </p>
          {hint && (
            <p
              className={cn(
                "mt-1.5 text-[10.5px] tabular-nums",
                hintTone === "success" && "text-success",
                hintTone === "destructive" && "text-destructive",
                (!hintTone || hintTone === "muted") && "text-muted-foreground",
              )}
            >
              {hint}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function DockTile({
  Icon,
  label,
  hint,
  to,
}: {
  Icon: typeof Plus;
  label: string;
  hint: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-surface px-3 py-2.5 transition hover:border-primary/40 hover:bg-primary/5"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-background text-primary shadow-card">
        <Icon className="h-[15px] w-[15px]" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold leading-tight">{label}</span>
        <span className="block truncate text-[10.5px] text-muted-foreground">{hint}</span>
      </span>
    </Link>
  );
}

/* ---------- page ---------- */

function DashboardOverview() {
  const invoices = useInvoices();

  const total = invoices.reduce((s, i) => s + invoiceTotal(i), 0);
  const received = invoices.reduce((s, i) => s + invoicePaid(i), 0);
  const pending = invoices.reduce((s, i) => s + invoiceBalance(i), 0);
  const paidRate = total > 0 ? Math.round((received / total) * 100) : 0;

  const paidCount = invoices.filter((i) => i.status === "paga").length;
  const overdue = invoices.filter((i) => i.status === "vencida");
  const overdueAmount = overdue.reduce((s, i) => s + invoiceBalance(i), 0);

  const clientNames = new Set(invoices.map((i) => i.clientId ?? i.client.name));
  const clientsWithBalance = new Set(
    invoices.filter((i) => invoiceBalance(i) > 0).map((i) => i.clientId ?? i.client.name),
  );

  const docs = invoices.slice(0, 8).map((inv) => {
    const meta = statusMeta[inv.status];
    return {
      id: inv.id,
      n: inv.number,
      client: inv.client.name,
      amount: invoiceTotal(inv),
      balance: invoiceBalance(inv),
      status: meta.label,
      tone: meta.tone,
      date: formatDate(inv.issued),
    };
  });

  const movements = invoices
    .flatMap((inv) =>
      (inv.payments ?? []).map((p) => ({
        id: `${inv.id}-${p.id}`,
        name: inv.client.name,
        note: `${paymentMethodLabels[p.method]} · ${inv.number}`,
        amount: p.amount,
        inbound: true,
      })),
    )
    .slice(0, 6);

  const fallbackMovements = docs
    .filter((d) => d.balance > 0)
    .slice(0, 5)
    .map((d) => ({
      id: d.id,
      name: d.client,
      note: `Pendente · ${d.n}`,
      amount: d.balance,
      inbound: false,
    }));

  const feed = movements.length > 0 ? movements : fallbackMovements;

  return (
    <div className="flex min-h-0 flex-col gap-3.5 md:h-full">
      {/* ══ KPI rail — absorve o herói, as sparklines e a distribuição ══ */}
      <section className="grid shrink-0 grid-cols-2 overflow-hidden rounded-lg border border-border/60 bg-card shadow-card md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <KpiCell
          wide
          label="Saldo a receber"
          value={formatMZN(pending, { decimals: false })}
          hint={`Facturado ${formatMZN(total, { decimals: false })} · ${invoices.length} documentos`}
          badge={
            <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
              <ArrowUpRight className="h-3 w-3" /> {paidRate}% liquidado
            </span>
          }
        >
          <Sparkline points={trend} className="hidden sm:block" />
        </KpiCell>

        <KpiCell
          label="Facturas emitidas"
          value={String(invoices.length)}
          hint={`${paidCount} ${paidCount === 1 ? "paga" : "pagas"}`}
        />

        <KpiCell
          label="Clientes activos"
          value={String(clientNames.size)}
          hint={`${clientsWithBalance.size} com saldo em aberto`}
        />

        <KpiCell
          label="Em atraso"
          value={formatMZN(overdueAmount, { decimals: false })}
          hint={
            overdue.length === 0
              ? "nada vencido"
              : `${overdue.length} ${overdue.length === 1 ? "factura vencida" : "facturas vencidas"}`
          }
          hintTone={overdue.length === 0 ? "muted" : "destructive"}
        />
      </section>

      {/* ══ zona de trabalho ══ */}
      <div className="grid min-h-0 flex-1 gap-3.5 md:grid-cols-[1.62fr_1fr]">
        <Panel
          title="Documentos recentes"
          action={
            <Link
              to="/dashboard/facturas"
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Ver todos
            </Link>
          }
        >
          {docs.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-muted-foreground">
              Ainda sem documentos. Emita a primeira factura.
            </p>
          ) : (
            docs.map((d) => (
              <Link
                key={d.id}
                to="/dashboard/facturas/$id"
                params={{ id: d.id }}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted/60"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[10.5px] font-semibold text-primary">
                  {initials(d.client)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold">{d.client}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {d.n} · {d.date}
                  </span>
                </span>
                <span
                  className={cn(
                    "hidden rounded-md px-2 py-0.5 text-[10px] font-bold sm:inline-block",
                    toneClass[d.tone],
                  )}
                >
                  {d.status}
                </span>
                <span className="w-24 text-right text-[12.5px] font-bold tabular-nums">
                  {formatMZN(d.amount, { decimals: false })}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              </Link>
            ))
          )}
        </Panel>

        <div className="flex min-h-0 flex-col gap-3.5">
          <Panel
            title="Movimentos"
            className="flex-1"
            action={
              <Link
                to="/dashboard/facturas"
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Ver
              </Link>
            }
          >
            {feed.length === 0 ? (
              <p className="py-8 text-center text-[12.5px] text-muted-foreground">
                Sem movimentos registados.
              </p>
            ) : (
              feed.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-[10.5px] font-semibold text-muted-foreground">
                    {initials(m.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold">{m.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {m.note}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[12.5px] font-bold tabular-nums",
                      m.inbound ? "text-success" : "text-muted-foreground",
                    )}
                  >
                    {m.inbound ? "+" : ""}
                    {formatMZN(m.amount, { decimals: false })}
                  </span>
                </div>
              ))
            )}
          </Panel>

          <section className="shrink-0 rounded-lg border border-primary/20 bg-gradient-mesh p-3.5">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <Sparkles className="h-3 w-3" /> Quota AI
            </span>
            <p className="mt-2 text-[12.5px] font-semibold">Cobrança automática por WhatsApp</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {overdue.length > 0
                ? `${overdue.length} ${overdue.length === 1 ? "factura vencida pronta" : "facturas vencidas prontas"} a lembrar.`
                : "Active lembretes e reduza o tempo médio de pagamento."}
            </p>
            <Link
              to="/dashboard/whatsapp"
              className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-md bg-whatsapp/10 px-3 text-[11.5px] font-semibold text-whatsapp ring-1 ring-inset ring-whatsapp/25 transition hover:bg-whatsapp/20"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Activar lembretes
            </Link>
          </section>
        </div>
      </div>

      {/* ══ dock de acções ══ */}
      <div className="grid shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-4">
        <DockTile Icon={Plus} label="Nova factura" hint="Emitir com IVA" to="/dashboard/facturas/nova" />
        <DockTile Icon={Users} label="Novo cliente" hint="CRM" to="/dashboard/clientes" />
        <DockTile Icon={FileText} label="Cotação" hint="Orçamento" to="/dashboard/cotacoes" />
        <DockTile Icon={MessageCircle} label="Cobrar" hint="WhatsApp" to="/dashboard/whatsapp" />
      </div>
    </div>
  );
}
