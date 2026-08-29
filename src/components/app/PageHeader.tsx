import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; to?: string };

export function PageHeader({
  title,
  description,
  Icon,
  crumbs,
  actions,
  className,
  children,
}: {
  title: string;
  description?: string;
  Icon?: LucideIcon;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("space-y-4", className)}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Navegação hierárquica">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {crumbs.map((c, i) => (
              <li key={c.label} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />}
                {c.to ? (
                  <Link
                    to={c.to}
                    className="rounded px-1 py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="px-1 py-0.5 font-medium text-foreground">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border/70 bg-surface text-muted-foreground">
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-display text-[22px] font-semibold tracking-tight sm:text-2xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {children}
    </header>
  );
}
