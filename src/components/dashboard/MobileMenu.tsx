import { Link, useRouterState } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { navGroups, quickCreate } from "./nav-items";
import { cn } from "@/lib/utils";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-[288px] gap-0 overflow-y-auto p-0">
        <SheetHeader className="flex-row items-center gap-2.5 space-y-0 border-b border-border/60 px-4 py-3.5 text-left">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            Q
          </span>
          <div className="min-w-0">
            <SheetTitle className="truncate text-[13px] font-semibold">Quota Studio</SheetTitle>
            <p className="truncate text-[11px] text-muted-foreground">Plano Negócio</p>
          </div>
        </SheetHeader>

        <div className="px-3 py-3">
          <Link
            to={quickCreate[0].to}
            onClick={onClose}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Nova factura
          </Link>
        </div>

        <nav aria-label="Navegação" className="space-y-5 px-3 pb-8">
          {navGroups.map((g) => (
            <div key={g.label}>
              <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">
                {g.label}
              </p>
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
                  const Icon = it.icon;
                  return (
                    <li key={it.to}>
                      <Link
                        to={it.to}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} aria-hidden />
                        {it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
