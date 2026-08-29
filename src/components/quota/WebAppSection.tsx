import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Banknote,
  MessageCircle,
  BarChart3,
  Settings,
  Search,
  Bell,
  Plus,
  ImagePlus,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

type Module = "dashboard" | "invoice" | "cotacao";

const stats = [
  { label: "Receita do mês", value: "3.41M", unit: "MZN", delta: "+8.2%", tone: "success" },
  { label: "Vendas hoje", value: "184 200", unit: "MZN", delta: "+12.4%", tone: "success" },
  { label: "Pendentes", value: "612 400", unit: "MZN", delta: "14 fact.", tone: "warning" },
  { label: "Em atraso", value: "82 100", unit: "MZN", delta: "3 clientes", tone: "destructive" },
];

const invoices = [
  { n: "FT 2026/00187", client: "João Comercial, Lda", amount: "84 500", status: "Pago", tone: "success" },
  { n: "FT 2026/00186", client: "Construções Beira", amount: "246 000", status: "Pendente", tone: "warning" },
  { n: "COT 2026/00042", client: "Auto Peças Matola", amount: "58 900", status: "Enviada", tone: "info" },
  { n: "FT 2026/00184", client: "Farmácia Central", amount: "12 200", status: "Em atraso", tone: "destructive" },
];

const cotItems = [
  { name: "Cadeira ergonómica", qty: 4, price: "8 900", total: "35 600", color: "from-amber-400 to-orange-500" },
  { name: "Mesa de reunião 2.4m", qty: 1, price: "42 000", total: "42 000", color: "from-emerald-400 to-teal-500" },
  { name: "Estante modular", qty: 2, price: "12 500", total: "25 000", color: "from-sky-400 to-indigo-500" },
];

const toneClass: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-primary/10 text-primary",
};

const nav: { id: Module | "other"; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "invoice", label: "Nova factura", icon: <FileText className="h-4 w-4" /> },
  { id: "cotacao", label: "Cotação visual", icon: <ImagePlus className="h-4 w-4" /> },
  { id: "other", label: "Clientes", icon: <Users className="h-4 w-4" /> },
  { id: "other", label: "Produtos", icon: <Package className="h-4 w-4" /> },
  { id: "other", label: "Cobranças", icon: <Banknote className="h-4 w-4" /> },
  { id: "other", label: "WhatsApp", icon: <MessageCircle className="h-4 w-4" /> },
  { id: "other", label: "Relatórios", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "other", label: "Definições", icon: <Settings className="h-4 w-4" /> },
];

export function WebAppSection() {
  const [active, setActive] = useState<Module>("dashboard");

  return (
    <section id="webapp" className="relative overflow-hidden border-t border-border bg-surface/30 py-24">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="container relative mx-auto px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Versão desktop
          </span>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            A mesma Quota, agora <span className="text-gradient-brand">no seu computador</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Toda a experiência da app móvel — facturação, cotações visuais, cobranças e WhatsApp — num ambiente desktop pensado para equipas que passam o dia ao computador.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
          {/* Browser chrome */}
          <div className="flex items-center justify-between border-b border-border bg-surface/60 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-destructive/70" />
              <span className="h-3 w-3 rounded-full bg-warning/70" />
              <span className="h-3 w-3 rounded-full bg-success/70" />
            </div>
            <div className="flex items-center gap-2 rounded-md bg-background/80 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              app.quota.co.mz / {active === "dashboard" ? "dashboard" : active === "invoice" ? "facturas/nova" : "cotacoes/nova"}
            </div>
            <Link to="/app" className="text-[11px] text-primary hover:underline">Abrir app →</Link>
          </div>

          <div className="grid grid-cols-12">
            {/* Sidebar */}
            <aside className="col-span-3 hidden border-r border-border bg-surface/40 p-4 lg:block">
              <div className="flex items-center gap-2 px-2 pb-5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-sm font-bold text-primary-foreground shadow-glow">Q</div>
                <div>
                  <p className="text-sm font-semibold">Quota Retail</p>
                  <p className="text-[10px] text-muted-foreground">Plano Multi-empresas</p>
                </div>
              </div>
              <nav className="space-y-0.5 text-sm">
                {nav.map((n, i) => {
                  const isActive = n.id !== "other" && n.id === active;
                  const clickable = n.id !== "other";
                  return (
                    <button
                      key={i}
                      onClick={() => clickable && setActive(n.id as Module)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition ${
                        isActive
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      {n.icon}
                      <span className="text-[13px]">{n.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Content */}
            <div className="col-span-12 lg:col-span-9">
              {/* Top bar */}
              <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-3">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                  <span>Procurar facturas, clientes, produtos…</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">2</span>
                  </button>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card pl-2 pr-3 py-1">
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-[11px] font-bold text-primary-foreground">H</div>
                    <div className="hidden text-left md:block">
                      <p className="text-[11px] font-medium leading-none">Helena Macuácua</p>
                      <p className="text-[10px] text-muted-foreground">Administrador</p>
                    </div>
                  </div>
                </div>
              </div>

              {active === "dashboard" && <DesktopDashboard />}
              {active === "invoice" && <DesktopInvoice />}
              {active === "cotacao" && <DesktopCotacao />}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="rounded-full border border-border bg-card px-3 py-1">⌘K para procurar tudo</span>
          <span className="rounded-full border border-border bg-card px-3 py-1">Atalhos de teclado</span>
          <span className="rounded-full border border-border bg-card px-3 py-1">Multi-empresa sem logout</span>
          <span className="rounded-full border border-border bg-card px-3 py-1">Mesma conta no mobile</span>
        </div>
      </div>
    </section>
  );
}

function DesktopDashboard() {
  return (
    <div className="space-y-5 p-6">
      <div>
        <p className="text-xs text-muted-foreground">Bom dia, Helena</p>
        <h3 className="text-2xl font-semibold tracking-tight">Visão geral · Maio 2026</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {s.value} <span className="text-xs font-normal text-muted-foreground">{s.unit}</span>
            </p>
            <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClass[s.tone]}`}>
              <ArrowUpRight className="h-3 w-3" /> {s.delta}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Receita · últimos 6 meses</p>
            <span className="text-[10px] text-muted-foreground">MZN</span>
          </div>
          <div className="mt-4 flex h-40 items-end gap-3">
            {[55, 72, 48, 86, 64, 92].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="w-full rounded-t-md bg-gradient-primary" style={{ height: `${h}%` }} />
                <span className="text-[10px] text-muted-foreground">{["Dez", "Jan", "Fev", "Mar", "Abr", "Mai"][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> Assistente Quota
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            3 clientes com facturas em atraso. Quer enviar lembretes por WhatsApp em lote?
          </p>
          <button className="mt-3 inline-flex items-center gap-1 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            Enviar lembretes <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="text-sm font-semibold">Documentos recentes</p>
          <span className="text-[11px] text-primary">Ver todos</span>
        </div>
        <div className="divide-y divide-border">
          {invoices.map((inv) => (
            <div key={inv.n} className="grid grid-cols-12 items-center px-4 py-2.5 text-sm">
              <div className="col-span-4 flex items-center gap-2">
                {inv.tone === "success" ? <CheckCircle2 className="h-4 w-4 text-success" /> :
                 inv.tone === "warning" ? <Clock className="h-4 w-4 text-warning-foreground" /> :
                 inv.tone === "info" ? <FileText className="h-4 w-4 text-primary" /> :
                 <AlertCircle className="h-4 w-4 text-destructive" />}
                <span className="font-medium">{inv.n}</span>
              </div>
              <div className="col-span-5 truncate text-muted-foreground">{inv.client}</div>
              <div className="col-span-2 text-right tabular-nums">{inv.amount} MZN</div>
              <div className="col-span-1 text-right">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClass[inv.tone]}`}>{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DesktopInvoice() {
  return (
    <div className="grid gap-5 p-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div>
          <p className="text-xs text-muted-foreground">FT 2026/00188</p>
          <h3 className="text-2xl font-semibold tracking-tight">Nova factura</h3>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Cliente" value="João Comercial, Lda" hint="NUIT 400 123 456" />
          <Field label="Data" value="27 Maio 2026" />
          <Field label="Forma de pagamento" value="M-Pesa · 84 ••• 321" />
          <Field label="Vencimento" value="30 dias" />
        </div>

        <div className="rounded-xl border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-semibold">Artigos</p>
            <button className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>
          {[
            { n: "Cimento 50kg", qty: 25, price: "850", total: "21 250" },
            { n: "Tijolo cerâmico", qty: 1500, price: "18", total: "27 000" },
            { n: "Mão de obra", qty: 1, price: "160 225", total: "160 225" },
          ].map((it, i) => (
            <div key={it.n} className={`grid grid-cols-12 items-center px-4 py-2.5 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
              <span className="col-span-6">{it.n}</span>
              <span className="col-span-2 text-right tabular-nums text-muted-foreground">{it.qty}</span>
              <span className="col-span-2 text-right tabular-nums text-muted-foreground">{it.price}</span>
              <span className="col-span-2 text-right font-semibold tabular-nums">{it.total}</span>
            </div>
          ))}
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl border border-border bg-background p-4 text-sm">
          <Row label="Subtotal" value="208 475 MZN" />
          <Row label="IVA (17%)" value="35 440 MZN" />
          <div className="my-2 h-px bg-border" />
          <Row label="Total" value="243 915 MZN" strong />
        </div>
        <button className="w-full rounded-xl border border-border bg-card py-2.5 text-sm font-medium">Guardar rascunho</button>
        <button className="w-full rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
          Emitir e enviar por WhatsApp
        </button>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
          <Sparkles className="mr-1 inline h-3 w-3" /> A AI sugere preços com base no histórico do cliente.
        </div>
      </aside>
    </div>
  );
}

function DesktopCotacao() {
  return (
    <div className="grid gap-5 p-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">COT 2026/00043</p>
            <h3 className="text-2xl font-semibold tracking-tight">Cotação visual</h3>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium">
            <Eye className="h-3.5 w-3.5" /> Pré-visualizar
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Cliente" value="Construções Beira" hint="NUIT 400 998 221" />
          <Field label="Validade" value="30 dias" />
        </div>

        <div className="rounded-xl border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-semibold">Artigos com foto</p>
            <button className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>
          {cotItems.map((it, i) => (
            <div key={it.name} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
              <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${it.color} text-white shadow-elegant`}>
                <ImagePlus className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.name}</p>
                <p className="text-[11px] text-muted-foreground">{it.qty} × {it.price} MZN</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{it.total} MZN</p>
            </div>
          ))}
        </div>
      </div>

      <aside className="lg:col-span-2">
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-elegant">
          <div className="bg-gradient-brand p-4 text-primary-foreground">
            <p className="text-[10px] uppercase tracking-wider opacity-80">Pré-visualização</p>
            <p className="text-base font-semibold">Cotação COT 2026/00043</p>
            <p className="text-[10px] opacity-80">Construções Beira · válida 30 dias</p>
          </div>
          <div className="space-y-2 p-3">
            {cotItems.map((it) => (
              <div key={it.name} className="flex items-center gap-2 rounded-lg border border-border p-2">
                <div className={`h-10 w-10 shrink-0 rounded-md bg-gradient-to-br ${it.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{it.name}</p>
                  <p className="text-[10px] text-muted-foreground">{it.qty} un · {it.price} MZN</p>
                </div>
                <p className="text-xs font-semibold tabular-nums">{it.total}</p>
              </div>
            ))}
            <div className="border-t border-border pt-2 text-xs">
              <Row label="Total" value="102 600 MZN" strong />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "text-base font-semibold" : "text-sm text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}
