import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  MessageCircle,
  Plus,
  Receipt,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatMZN, formatDate, initials } from "@/lib/format";
import {
  invoiceBalance,
  invoicePaid,
  invoiceTotal,
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
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
};

const balanceSeries = [
  { d: "Jan", v: 96 },
  { d: "Fev", v: 128 },
  { d: "Mar", v: 112 },
  { d: "Abr", v: 168 },
  { d: "Mai", v: 152 },
  { d: "Jun", v: 214 },
  { d: "Jul", v: 196 },
  { d: "Ago", v: 262 },
];

const monthsSeries = [
  { d: "Jan", v: 42 },
  { d: "Fev", v: 55 },
  { d: "Mar", v: 38 },
  { d: "Abr", v: 74 },
  { d: "Mai", v: 61 },
  { d: "Jun", v: 88 },
  { d: "Jul", v: 71 },
  { d: "Ago", v: 118 },
  { d: "Set", v: 64 },
  { d: "Out", v: 49 },
];

const sparks = [
  { label: "Facturas emitidas", badge: "Mês +12%", tone: "bg-primary/10 text-primary", bars: [4, 7, 5, 9, 6, 11, 8, 12, 7, 10, 6, 9] },
  { label: "Clientes activos", badge: "Novos +4", tone: "bg-success/10 text-success", bars: [3, 5, 4, 6, 8, 5, 9, 7, 10, 6, 8, 11] },
  { label: "Cobranças WhatsApp", badge: "Taxa 82%", tone: "bg-whatsapp/10 text-whatsapp", bars: [6, 4, 8, 5, 9, 7, 11, 6, 8, 10, 7, 12] },
];

/* ---------- building blocks ---------- */

function Panel({
  title,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border border-border/60 bg-card p-5 shadow-card", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted">
      {children}
      <ChevronDown className="h-3 w-3" />
    </button>
  );
}

function ActionTile({
  Icon,
  label,
  to,
}: {
  Icon: typeof Wallet;
  label: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-lg border border-border/60 bg-surface px-2 py-3 text-center transition hover:border-primary/40 hover:bg-primary/5"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-background text-primary shadow-card">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </Link>
  );
}

function SparkCard({
  label,
  badge,
  tone,
  bars,
}: {
  label: string;
  badge: string;
  tone: string;
  bars: number[];
}) {
  const max = Math.max(...bars);
  const value = bars.reduce((a, b) => a + b, 0);
  return (
    <div className="rounded-lg border border-border/60 bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", tone)}>{badge}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        <div className="flex h-9 items-end gap-[3px]">
          {bars.map((b, i) => (
            <span
              key={i}
              className={cn("w-[5px] rounded-sm", i === bars.length - 1 ? "bg-primary" : "bg-primary/25")}
              style={{ height: `${(b / max) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

function DashboardOverview() {
  const invoices = useInvoices();

  const total = invoices.reduce((s, i) => s + invoiceTotal(i), 0);
  const received = invoices.reduce((s, i) => s + invoicePaid(i), 0);
  const pending = invoices.reduce((s, i) => s + invoiceBalance(i), 0);
  const paidRate = total > 0 ? Math.round((received / total) * 100) : 0;

  const docs = invoices.slice(0, 6).map((inv) => {
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
        note: `${p.method} · ${inv.number}`,
        amount: p.amount,
        inbound: true,
      })),
    )
    .slice(0, 5);

  const fallbackMovements = docs.slice(0, 4).map((d) => ({
    id: d.id,
    name: d.client,
    note: `Pendente · ${d.n}`,
    amount: d.balance,
    inbound: false,
  }));

  const feed = movements.length > 0 ? movements : fallbackMovements;

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Visão geral</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            O pulso financeiro do seu negócio, em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip>Este ano</Chip>
          <Link
            to="/dashboard/facturas/nova"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3.5 text-[12px] font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Nova factura
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 lg:gap-5">
        {/* ===== main column ===== */}
        <div className="col-span-12 space-y-4 lg:col-span-8 lg:space-y-5">
          {/* balance hero card */}
          <section className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-card">
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_1.1fr] md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[12px] text-muted-foreground">Saldo a receber</p>
                  <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                    <ArrowUpRight className="h-3 w-3" /> {paidRate}% liquidado
                  </span>
                </div>
                <p className="mt-2 font-display text-[34px] font-semibold leading-none tabular-nums md:text-[40px]">
                  {formatMZN(pending, { decimals: false })}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="tabular-nums">
                    Facturado {formatMZN(total, { decimals: false })}
                  </span>
                  <Copy className="h-3 w-3" />
                </div>

              </div>

              <div className="h-[140px] md:h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceSeries} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                    <defs>
                      <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="d"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-card)",
                        fontSize: 12,
                      }}
                      formatter={(v) => [`${v} k MZN`, "Receita"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="var(--color-primary)"
                      strokeWidth={2.5}
                      fill="url(#balFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* monthly volume */}
          <Panel
            title="Facturação por mês"
            action={<Chip>2026</Chip>}
          >
            <div className="h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthsSeries} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
                  <XAxis
                    dataKey="d"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)", opacity: 0.35 }}
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="v" radius={[10, 10, 10, 10]} barSize={26}>
                    {monthsSeries.map((row, i) => (
                      <Cell
                        key={row.d}
                        fill={i === 7 ? "var(--color-primary)" : "var(--color-muted)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* distribution overview */}
          <Panel title="Distribuição de cobrança">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="tabular-nums">{formatMZN(received, { decimals: false })} recebido</span>
              <span className="tabular-nums">{formatMZN(pending, { decimals: false })} pendente</span>
            </div>
            <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-muted">
              <span className="bg-primary" style={{ width: `${paidRate}%` }} />
              <span className="bg-primary/30" style={{ width: `${100 - paidRate}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
              <span>Recebido: <b className="text-foreground">{paidRate}%</b></span>
              <span>Pendente: <b className="text-foreground">{100 - paidRate}%</b></span>
              <span>Documentos: <b className="text-foreground">{invoices.length}</b></span>
            </div>
          </Panel>

          {/* documents list */}
          <Panel
            title="Documentos recentes"
            action={
              <Link to="/dashboard/facturas" className="text-[11px] font-medium text-primary hover:underline">
                Ver todos
              </Link>
            }
            bodyClassName="space-y-1"
          >
            {docs.length === 0 && (
              <p className="py-6 text-center text-[13px] text-muted-foreground">
                Ainda sem documentos. Emita a primeira factura.
              </p>
            )}
            {docs.map((d) => (
              <Link
                key={d.id}
                to="/dashboard/facturas/$id"
                params={{ id: d.id }}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-muted/60"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {initials(d.client)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{d.client}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {d.n} · {d.date}
                  </span>
                </span>
                <span className={cn("hidden rounded-md px-2 py-0.5 text-[10px] font-semibold sm:inline-block", toneClass[d.tone])}>
                  {d.status}
                </span>
                <span className="w-28 text-right text-[13px] font-semibold tabular-nums">
                  {formatMZN(d.amount, { decimals: false })}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              </Link>
            ))}
          </Panel>
        </div>

        {/* ===== right rail ===== */}
        <div className="col-span-12 space-y-4 lg:col-span-4 lg:space-y-5">
          <Panel title="Acções rápidas" bodyClassName="grid grid-cols-3 gap-2">
            <ActionTile Icon={Plus} label="Factura" to="/dashboard/facturas/nova" />
            <ActionTile Icon={Users} label="Cliente" to="/dashboard/clientes" />
            <ActionTile Icon={FileText} label="Cotação" to="/dashboard/cotacoes" />
          </Panel>

          <div className="space-y-4 lg:space-y-5">
            {sparks.map((s) => (
              <SparkCard key={s.label} {...s} />
            ))}
          </div>

          <Panel
            title="Movimentos"
            action={
              <Link to="/dashboard/facturas" className="text-[11px] font-medium text-primary hover:underline">
                Ver
              </Link>
            }
            bodyClassName="space-y-1"
          >

            {feed.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg px-1.5 py-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-[11px] font-semibold text-muted-foreground">
                  {initials(m.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{m.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{m.note}</span>
                </span>
                <span
                  className={cn(
                    "text-[12px] font-semibold tabular-nums",
                    m.inbound ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {m.inbound ? "+" : ""}
                  {formatMZN(m.amount, { decimals: false })}
                </span>
              </div>
            ))}
          </Panel>

          <section className="rounded-lg border border-primary/20 bg-gradient-mesh p-5">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
              <Sparkles className="h-3 w-3" /> Quota AI
            </span>
            <p className="mt-3 text-[13px] font-semibold">Cobrança automática por WhatsApp</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Active lembretes e reduza o tempo médio de pagamento.
            </p>
            <Link
              to="/dashboard/whatsapp"
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[12px] font-medium text-primary-foreground transition hover:opacity-90"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Configurar
            </Link>
          </section>

          <Panel title="Atalhos" bodyClassName="space-y-1">
            {[
              { to: "/dashboard/cotacoes", label: "Cotações", Icon: FileText },
              { to: "/dashboard/recibos", label: "Recibos", Icon: Receipt },
              { to: "/dashboard/definicoes", label: "Dados da empresa", Icon: Wallet },

            ].map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-[13px] transition hover:bg-muted/60"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <r.Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 truncate font-medium">{r.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
              </Link>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
