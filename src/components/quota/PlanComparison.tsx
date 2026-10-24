import { Fragment } from "react";
import { Check, Minus } from "lucide-react";
import { comparison, plans, type Cell } from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * Tabela "Compare os planos" — usada na página pública de preços e nos
 * planos da app. Lê tudo de src/lib/plans.ts.
 */
export function PlanComparison({ current, className }: { current?: string; className?: string }) {
  const cols = [...plans.map((p) => ({ id: p.id as string, name: p.name, price: `${new Intl.NumberFormat("pt-PT").format(p.monthly)} MT/mês` })), { id: "empresarial", name: "Empresarial", price: "Sob consulta" }];

  const render = (v: Cell) =>
    v === true ? (
      <Check className="mx-auto h-4 w-4 text-success" aria-label="Incluído" />
    ) : v === false ? (
      <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Não incluído" />
    ) : (
      <span className="text-[12.5px] font-medium">{v}</span>
    );

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border/70 bg-card", className)}>
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border/70">
            <th className="w-[34%] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Compare os planos</th>
            {cols.map((c) => (
              <th key={c.id} className={cn("px-3 py-3 text-center", current === c.id && "bg-primary/5")}>
                <span className="block text-[13px] font-semibold">{c.name}</span>
                <span className="block text-[11px] font-normal text-muted-foreground">{c.price}</span>
                {current === c.id && <span className="mt-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">O seu plano</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.map((g) => (
            <Fragment key={g.group}>
              <tr className="bg-muted/40">
                <td colSpan={cols.length + 1} className="px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {g.group}
                </td>
              </tr>
              {g.rows.map((r) => (
                <tr key={r.label} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5 text-[13px]">
                    {r.label}
                    {r.hint && <span className="block text-[11px] text-muted-foreground">{r.hint}</span>}
                  </td>
                  {r.values.map((v, i) => (
                    <td key={i} className={cn("px-3 py-2.5 text-center", current === cols[i].id && "bg-primary/5")}>
                      {render(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
