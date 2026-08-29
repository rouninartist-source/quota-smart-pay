import { Link, useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { mobileTabs } from "./nav-items";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Navegação rápida"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
        {mobileTabs.slice(0, 2).map((t) => (
          <Tab key={t.to} to={t.to} label={t.label} Icon={t.icon} active={t.exact ? pathname === t.to : pathname.startsWith(t.to)} />
        ))}
        <Link
          to="/dashboard/documentos"
          aria-label="Emitir documento"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition-transform active:scale-95"
        >
          <Plus className="h-5 w-5" aria-hidden />
        </Link>
        {mobileTabs.slice(2).map((t) => (
          <Tab key={t.to} to={t.to} label={t.label} Icon={t.icon} active={pathname.startsWith(t.to)} />
        ))}
      </div>
    </nav>
  );
}

function Tab({
  to,
  label,
  Icon,
  active,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      {label}
    </Link>
  );
}
