const stats = [
  { label: "Vendas hoje", value: "184 200 MZN", delta: "+12.4%", tone: "success" },
  { label: "Receita do mês", value: "3.41M MZN", delta: "+8.2%", tone: "success" },
  { label: "Pagamentos pendentes", value: "612 400 MZN", delta: "14 facturas", tone: "warning" },
  { label: "Em atraso", value: "82 100 MZN", delta: "3 clientes", tone: "destructive" },
];

const invoices = [
  { n: "FT 2026/00187", client: "João Comercial, Lda", amount: "84 500", status: "Pago", tone: "success" },
  { n: "FT 2026/00186", client: "Construções Beira", amount: "246 000", status: "Pendente", tone: "warning" },
  { n: "FT 2026/00185", client: "Maputo Logística", amount: "39 750", status: "Pago", tone: "success" },
  { n: "FT 2026/00184", client: "Farmácia Central", amount: "12 200", status: "Em atraso", tone: "destructive" },
];

const toneClass: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface/50 px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
        <div className="rounded-md bg-background/80 px-3 py-1 text-xs text-muted-foreground">
          app.quota.co.mz / dashboard
        </div>
        <div className="w-12" />
      </div>

      <div className="grid grid-cols-12 gap-0">
        {/* Sidebar */}
        <aside className="col-span-2 hidden border-r border-border bg-surface/30 p-4 md:block">
          <div className="flex items-center gap-2 px-2 pb-4">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-primary text-xs font-bold text-primary-foreground">Q</div>
            <span className="text-sm font-semibold">Quota Retail</span>
          </div>
          <nav className="space-y-1 text-sm">
            {[
              ["Dashboard", true],
              ["Facturas", false],
              ["Clientes", false],
              ["Produtos", false],
              ["Cobranças", false],
              ["Relatórios", false],
              ["Assistente AI", false],
            ].map(([label, active]) => (
              <div key={label as string}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 transition ${
                  active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-primary" : "bg-border"}`} />
                {label as string}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="col-span-12 p-6 md:col-span-10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Bom dia, Helena 👋</h3>
              <p className="text-xs text-muted-foreground">Aqui está o resumo da sua empresa hoje</p>
            </div>
            <button className="rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-elegant">
              + Nova factura
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1.5 text-lg font-semibold tracking-tight">{s.value}</p>
                <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClass[s.tone]}`}>
                  {s.delta}
                </span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Receita · últimos 30 dias</p>
              <p className="text-xs text-muted-foreground">MZN</p>
            </div>
            <svg viewBox="0 0 600 140" className="h-32 w-full">
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.52 0.23 263)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="oklch(0.78 0.14 230)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 110 C 60 80, 100 95, 160 70 S 280 30, 340 55 S 460 100, 520 50 L 600 35 L 600 140 L 0 140 Z" fill="url(#g1)" />
              <path d="M0 110 C 60 80, 100 95, 160 70 S 280 30, 340 55 S 460 100, 520 50 L 600 35"
                fill="none" stroke="oklch(0.52 0.23 263)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Invoice list */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="text-sm font-medium">Facturas recentes</p>
              <p className="text-xs text-muted-foreground">Ver todas</p>
            </div>
            <div className="divide-y divide-border text-sm">
              {invoices.map((i) => (
                <div key={i.n} className="grid grid-cols-12 items-center gap-2 px-5 py-3">
                  <div className="col-span-4 font-medium">{i.n}</div>
                  <div className="col-span-4 truncate text-muted-foreground">{i.client}</div>
                  <div className="col-span-2 text-right tabular-nums">{i.amount} MZN</div>
                  <div className="col-span-2 text-right">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClass[i.tone]}`}>
                      {i.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
