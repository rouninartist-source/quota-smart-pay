import * as React from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, TableSkeleton } from "@/components/app/States";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  width?: string;
  /** Hide this column below the given breakpoint to keep tables readable. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
};

export type TableFilter<T> = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean;
};

export type BulkAction = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (ids: string[]) => void;
  destructive?: boolean;
};

const hideClass: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchKeys,
  searchPlaceholder = "Procurar…",
  filters = [],
  bulkActions = [],
  rowActions,
  onRowClick,
  loading,
  pageSize = 10,
  empty,
  toolbarExtra,
  mobileCard,
}: {
  data: T[];
  columns: Column<T>[];
  searchKeys: (row: T) => string;
  searchPlaceholder?: string;
  filters?: TableFilter<T>[];
  bulkActions?: BulkAction[];
  rowActions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  pageSize?: number;
  empty?: { title: string; description?: string; action?: React.ReactNode };
  toolbarExtra?: React.ReactNode;
  mobileCard?: (row: T) => React.ReactNode;
}) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState<Record<string, string>>({});
  const [sort, setSort] = React.useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const rows = React.useMemo(() => {
    let out = data;
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((r) => searchKeys(r).toLowerCase().includes(q));
    for (const f of filters) {
      const v = active[f.key];
      if (v && v !== "all") out = out.filter((r) => f.match(r, v));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          const cmp = typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), "pt");
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [data, query, active, sort, filters, columns, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => setPage(1), [query, active, sort]);

  const activeFilterCount = Object.values(active).filter((v) => v && v !== "all").length;
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));

  function toggleAll() {
    setSelected((prev) =>
      allOnPageSelected
        ? prev.filter((id) => !pageRows.some((r) => r.id === id))
        : [...new Set([...prev, ...pageRows.map((r) => r.id)])],
    );
  }

  function toggleRow(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function clearFilters() {
    setActive({});
    setQuery("");
    setSort(null);
  }

  function toggleSort(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? prev.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" },
    );
  }

  return (
    <div className="rounded-md border border-border/70 bg-card">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border/60 p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-border/70 bg-surface pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Limpar pesquisa"
              className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => {
            const value = active[f.key] ?? "all";
            const current = f.options.find((o) => o.value === value);
            return (
              <DropdownMenu key={f.key}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
                    <SlidersHorizontal className="h-3.5 w-3.5 opacity-70" />
                    {f.label}
                    {current && value !== "all" && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                        {current.label}
                      </span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs">{f.label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[{ value: "all", label: "Todos" }, ...f.options].map((o) => (
                    <DropdownMenuItem
                      key={o.value}
                      onSelect={() => setActive((p) => ({ ...p, [f.key]: o.value }))}
                      className="justify-between text-sm"
                    >
                      {o.label}
                      {value === o.value && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
          {(activeFilterCount > 0 || query || sort) && (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={clearFilters}>
              Limpar
            </Button>
          )}
          {toolbarExtra}
        </div>
      </div>

      {/* Bulk bar */}
      {selected.length > 0 && bulkActions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-primary/[0.04] px-3 py-2 animate-fade-up">
          <span className="text-xs font-medium">
            {selected.length} seleccionado{selected.length > 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {bulkActions.map((a) => (
              <Button
                key={a.label}
                size="sm"
                variant={a.destructive ? "ghost" : "outline"}
                className={cn("h-8 text-xs", a.destructive && "text-destructive hover:bg-destructive/10")}
                onClick={() => {
                  a.onClick(selected);
                  setSelected([]);
                }}
              >
                {a.icon && <a.icon className="h-3.5 w-3.5" />}
                {a.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setSelected([])}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <TableSkeleton cols={columns.length} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={empty?.title ?? "Sem resultados"}
          description={
            empty?.description ??
            "Ajuste a pesquisa ou os filtros para encontrar o que procura."
          }
          action={
            empty?.action ?? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className={cn("overflow-x-auto", mobileCard && "hidden md:block")}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left">
                  {bulkActions.length > 0 && (
                    <th scope="col" className="w-10 px-3 py-2.5">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Seleccionar todos"
                      />
                    </th>
                  )}
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      style={c.width ? { width: c.width } : undefined}
                      className={cn(
                        "px-3 py-2.5 text-xs font-medium text-muted-foreground",
                        c.align === "right" && "text-right",
                        c.hideBelow && hideClass[c.hideBelow],
                      )}
                    >
                      {c.sortValue ? (
                        <button
                          onClick={() => toggleSort(c.key)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            sort?.key === c.key && "text-foreground",
                          )}
                          aria-label={`Ordenar por ${c.header}`}
                        >
                          {c.header}
                          <ArrowUpDown className="h-3 w-3 opacity-60" aria-hidden />
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  ))}
                  {rowActions && <th scope="col" className="w-10 px-3 py-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {pageRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter") onRowClick(row);
                          }
                        : undefined
                    }
                    className={cn(
                      "transition-colors",
                      onRowClick &&
                        "cursor-pointer hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
                      selected.includes(row.id) && "bg-primary/[0.04]",
                    )}
                  >
                    {bulkActions.length > 0 && (
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.includes(row.id)}
                          onCheckedChange={() => toggleRow(row.id)}
                          aria-label={`Seleccionar linha`}
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-3 py-3 align-middle",
                          c.align === "right" && "text-right tabular-nums",
                          c.hideBelow && hideClass[c.hideBelow],
                        )}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          {mobileCard && (
            <ul className="divide-y divide-border/50 md:hidden">
              {pageRows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className="w-full px-4 py-3.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-muted/40"
                  >
                    {mobileCard(row)}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, rows.length)} de{" "}
              {rows.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Página anterior"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs tabular-nums text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Página seguinte"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
