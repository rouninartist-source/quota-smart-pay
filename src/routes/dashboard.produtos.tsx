import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Package, Plus, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { type Product } from "@/lib/mock-data";
import { useProducts } from "@/lib/catalog-store";
import { formatMZN } from "@/lib/format";
import { csvNumber, downloadCsv, stamp, toCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos · Quota Studio" },
      {
        name: "description",
        content: "Catálogo de produtos com preços, stock, margens e imagens para cotações visuais.",
      },
      { property: "og:title", content: "Produtos · Quota Studio" },
      { property: "og:description", content: "Catálogo digital para facturação e cotações visuais." },
    ],
  }),
  component: Produtos,
});

/** Placeholder de imagem até o catálogo ter fotos reais. */
const tileGradients = [
  "linear-gradient(135deg, oklch(0.62 0.19 263), oklch(0.78 0.14 230))",
  "linear-gradient(135deg, oklch(0.68 0.16 155), oklch(0.82 0.12 190))",
  "linear-gradient(135deg, oklch(0.70 0.17 60), oklch(0.82 0.13 95))",
  "linear-gradient(135deg, oklch(0.62 0.20 20), oklch(0.78 0.14 350))",
];

type StockState = { label: string; tone: string };

/** Stock e stock mínimo já vivem nos dados — o estado sai deles, não de um campo à parte. */
function stockState(p: Product): StockState {
  if (p.status === "descontinuado") return { label: "Descontinuado", tone: "bg-muted text-muted-foreground" };
  if (p.stock === 0) return { label: "Esgotado", tone: "bg-destructive/10 text-destructive" };
  if (p.stock < p.minStock)
    return { label: `${p.stock} ${p.unit}`, tone: "bg-warning/15 text-warning-foreground dark:text-warning" };
  return { label: `${p.stock} ${p.unit}`, tone: "bg-success/10 text-success" };
}

function Produtos() {
  const products = useProducts();
  const [category, setCategory] = useState("todos");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
    return [
      { key: "todos", label: "Todos", n: products.length },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, n]) => ({ key: label, label, n })),
    ];
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const okCat = category === "todos" || p.category === category;
      const okQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [products, category, query]);

  const totals = useMemo(() => {
    const value = visible.reduce((a, p) => a + p.price * p.stock, 0);
    const low = visible.filter((p) => p.stock > 0 && p.stock < p.minStock).length;
    const out = visible.filter((p) => p.stock === 0).length;
    return { value, low, out };
  }, [visible]);

  const exportCsv = () => {
    if (visible.length === 0) return;
    const csv = toCsv(
      ["SKU", "Produto", "Categoria", "Preço (MZN)", "Custo (MZN)", "Margem (%)", "Stock", "Stock mínimo", "Unidade", "IVA (%)"],
      visible.map((p) => [
        p.sku,
        p.name,
        p.category,
        csvNumber(p.price),
        csvNumber(p.cost),
        String(Math.round(((p.price - p.cost) / p.price) * 100)),
        String(p.stock),
        String(p.minStock),
        p.unit,
        String(p.vat),
      ]),
    );
    downloadCsv(`quota-produtos-${stamp()}.csv`, csv);
    toast.success(`${visible.length} produtos exportados`, {
      description: `quota-produtos-${stamp()}.csv`,
    });
  };

  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      {/* ─── Barra de contexto ─── */}
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filtrar por categoria"
            className="flex min-w-0 gap-0.5 overflow-x-auto rounded-lg border border-border/60 bg-surface p-0.5"
          >
            {categories.map((c) => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border border-border bg-card text-foreground shadow-sm"
                      : "border border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c.label}
                  <span
                    className={cn(
                      "rounded px-1.5 py-px text-[9.5px] font-bold tabular-nums",
                      active ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {c.n}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-[260px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar nome, SKU ou categoria"
              aria-label="Procurar produtos"
              className="h-8 w-full truncate rounded-lg border border-border bg-surface pl-8 pr-3 text-[12px] outline-none transition focus:border-primary/60"
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={visible.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium transition hover:bg-muted disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" /> Exportar
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Novo produto
            </button>
          </div>
        </div>
      </section>

      {/* ─── Grelha visual ─── */}
      <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm md:min-h-0 md:flex-1">
        {visible.length === 0 ? (
          <div className="grid flex-1 place-items-center gap-2 px-5 py-16 text-center">
            <Package className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum produto encontrado</p>
            <p className="text-xs text-muted-foreground">Ajuste a categoria ou a procura.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((p, i) => {
                const st = stockState(p);
                return (
                  <article
                    key={p.id}
                    className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border/70 bg-surface transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
                  >
                    <div
                      aria-hidden
                      className="grid h-[74px] place-items-center font-display text-xl font-bold text-primary-foreground"
                      style={{ background: tileGradients[i % tileGradients.length] }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-2.5">
                      <p className="line-clamp-2 text-[12px] font-semibold leading-tight">{p.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {p.sku} · {p.category}
                      </p>
                      <div className="mt-auto flex items-baseline justify-between gap-2 pt-1.5">
                        <span className="text-[13px] font-bold tabular-nums">
                          {formatMZN(p.price, { decimals: false })}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                            st.tone,
                          )}
                        >
                          {st.label}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/70 bg-surface px-4 py-2 text-[11px] text-muted-foreground">
          <span>
            {visible.length} produto{visible.length === 1 ? "" : "s"}
          </span>
          <span>
            Valor em stock{" "}
            <b className="font-bold tabular-nums text-foreground">
              {formatMZN(totals.value, { decimals: false })}
            </b>
          </span>
          {totals.low > 0 && (
            <span className="rounded-md bg-warning/15 px-2 py-0.5 font-semibold text-warning-foreground dark:text-warning">
              {totals.low} abaixo do mínimo
            </span>
          )}
          {totals.out > 0 && (
            <span className="rounded-md bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">
              {totals.out} esgotado{totals.out === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
