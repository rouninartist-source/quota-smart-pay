import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { menuTree, generalItems } from "./nav-items";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  onOpenSearch?: () => void;
};

export function useActiveMatcher() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
}

export function Sidebar({ collapsed, onToggle, onOpenSearch }: Props) {
  const isActive = useActiveMatcher();
  const currentSearch = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });
  const matches = (item: { to: string; exact?: boolean; search?: Record<string, string> }) => {
    if (!isActive(item.to, item.exact)) return false;
    if (!item.search) return true;
    return Object.entries(item.search).every(([k, v]) => currentSearch?.[k] === v);
  };
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});


  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border/60 bg-surface/70 transition-[width] duration-200 ease-out md:flex",
          collapsed ? "w-[68px]" : "w-[248px]",
        )}
      >
        <div className={cn("flex h-14 items-center gap-2.5 px-3", collapsed && "justify-center")}>
          <Link
            to="/"
            aria-label="Quota — página inicial"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            Q
          </Link>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-tight">Quota Studio</p>
              <p className="truncate text-[11px] text-muted-foreground">Plano Negócio</p>
            </div>
          )}
        </div>

        <div className="px-3 pb-2 pt-1">
          <button
            onClick={onOpenSearch}
            aria-label="Pesquisar"
            className={cn(
              "flex h-9 w-full items-center gap-2 rounded-md border border-border/60 bg-background px-3 text-[12px] text-muted-foreground transition hover:border-border hover:bg-muted/50",
              collapsed && "justify-center px-0",
            )}
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed && (
              <>
                <span>Procurar…</span>
                <kbd className="ml-auto rounded border border-border/70 px-1.5 py-0.5 font-sans text-[10px]">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>


        <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-2">
          {!collapsed && (
            <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/60">
              Menu
            </p>
          )}
          <ul className="space-y-0.5">
            {menuTree.map((node) => {
              const Icon = node.icon;
              const childActive = node.children?.some((c) => matches(c)) ?? false;
              const active = isActive(node.to, node.exact);
              const open = !collapsed && (openGroups[node.label] ?? childActive);

              if (node.children && !collapsed) {
                return (
                  <li key={node.label}>
                    <button
                      type="button"
                      onClick={() => setOpenGroups((prev) => ({ ...prev, [node.label]: !open }))}
                      aria-expanded={open}
                      className={cn(
                        "flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        open || childActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      <Icon
                        className={cn("h-4 w-4 shrink-0", childActive && "text-primary")}
                        aria-hidden
                      />
                      <span className="truncate">{node.label}</span>
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          "ml-auto h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                          open ? "rotate-180" : "rotate-0",
                        )}
                      />
                    </button>

                    {open && (
                      <ul className="relative ml-4 mt-1 space-y-0.5 border-l border-border/70 pl-3">
                        {node.children.map((c) => {
                          const cActive = matches(c);
                          const CIcon = c.icon;
                          return (
                            <li key={c.to} className="relative">
                              <span
                                aria-hidden
                                className={cn(
                                  "absolute -left-[17px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full",
                                  cActive ? "bg-primary" : "bg-border",
                                )}
                              />
                              <Link
                                to={c.to}
                                search={(c.search ?? {}) as never}
                                aria-current={cActive ? "page" : undefined}
                                className={cn(
                                  "flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] transition-colors",
                                  cActive
                                    ? "bg-muted font-medium text-foreground"
                                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                                )}
                              >
                                <CIcon
                                  className={cn("h-4 w-4 shrink-0", cActive && "text-primary")}
                                  aria-hidden
                                />
                                <span className="truncate">{c.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              const link = (
                <Link
                  to={node.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    node.primary
                      ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
                      : active || (collapsed && childActive)
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      node.primary ? "text-primary-foreground" : (active || childActive) && "text-primary",
                    )}
                    aria-hidden
                  />
                  {!collapsed && <span className="truncate">{node.label}</span>}
                </Link>
              );

              return (
                <li key={node.label}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{node.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-3 py-3">
          {!collapsed && (
            <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/60">
              Geral
            </p>
          )}
          <ul className="space-y-0.5">
            {generalItems.map((it) => {
              const active = isActive(it.to, it.exact);
              const Icon = it.icon;
              return (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} aria-hidden />
                    {!collapsed && <span className="truncate">{it.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>


        <div className="border-t border-border/60 p-2">
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expandir navegação" : "Reduzir navegação"}
            className={cn(
              "flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" aria-hidden />
                <span>Reduzir</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
