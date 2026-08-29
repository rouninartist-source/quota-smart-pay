import { Link } from "@tanstack/react-router";
import { signOut, useSession } from "@/lib/auth";
import { Bell, Check, ChevronDown, Menu, Moon, Plus, Search, Sparkles, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { notifications } from "@/lib/mock-data";
import { quickCreate } from "./nav-items";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { selectWorkspace, useActiveWorkspace, workspaces } from "@/lib/workspaces";

type Props = {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
};

export function Topbar({ onOpenMobileMenu, onOpenSearch }: Props) {
  const { session } = useSession();
  const { theme, toggle } = useTheme();
  const unread = notifications.filter((n) => !n.read).length;
  const activeWorkspace = useActiveWorkspace();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur-xl md:px-6">
      <button
        onClick={onOpenMobileMenu}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        aria-label="Abrir menu de navegação"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      <button
        onClick={onOpenSearch}
        className="group flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border/70 bg-surface px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-sm md:hidden"
        aria-label="Pesquisar em toda a aplicação"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">Procurar…</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-border/70 bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="hidden h-9 min-w-0 items-center gap-2 rounded-md border border-border/70 bg-surface px-3 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
            aria-label="Trocar de empresa"
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-primary/10 text-[10px] font-semibold text-primary">
              {(activeWorkspace?.name ?? workspaces[0].name).charAt(0)}
            </span>
            <span className="max-w-[160px] truncate font-medium">
              {activeWorkspace?.name ?? workspaces[0].name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Plano Multi-empresas · {workspaces.length} empresas
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((w) => {
            const isActive = (activeWorkspace?.id ?? workspaces[0].id) === w.id;
            return (
              <DropdownMenuItem
                key={w.id}
                onSelect={() => selectWorkspace(w.id)}
                className="gap-2.5"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-primary/10 text-[10px] font-semibold text-primary">
                  {w.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{w.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    NUIT {w.nuit} · {w.role}
                  </span>
                </span>
                {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/empresas" className="text-[13px]">
              Ver todas as empresas
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto flex items-center gap-1">
        <Button asChild variant="outline" size="sm" className="hidden h-9 rounded-lg border-primary/30 text-primary hover:bg-primary/10 hover:text-primary sm:inline-flex">
          <Link to="/dashboard/assistente" title="Fale com o agente Quota AI — tem acesso a tudo no sistema">
            <Sparkles className="h-4 w-4" /> Quota AI
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="hidden h-9 rounded-lg sm:inline-flex">
              <Plus className="h-4 w-4" /> Criar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            {quickCreate.map((a) => (
              <DropdownMenuItem key={a.label} asChild>
                <Link to={a.to} className="gap-2.5">
                  <a.icon className="h-4 w-4 text-muted-foreground" />
                  {a.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Notificações${unread ? `, ${unread} por ler` : ""}`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-3 py-2.5">
              <p className="text-sm font-semibold">Notificações</p>
              <span className="text-xs text-muted-foreground">{unread} por ler</span>
            </div>
            <DropdownMenuSeparator className="m-0" />
            <ul className="max-h-80 overflow-y-auto">
              {notifications.slice(0, 5).map((n) => (
                <li key={n.id}>
                  <Link
                    to="/dashboard/notificacoes"
                    className="flex gap-2.5 px-3 py-2.5 transition-colors hover:bg-muted/60"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : "bg-primary",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium">{n.title}</span>
                      <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground/80">{n.time}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuItem asChild className="justify-center text-sm">
              <Link to="/dashboard/notificacoes">Ver todas</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema escuro"}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Menu da conta"
            >
              {(session?.user.email ?? "?").slice(0, 2).toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-semibold">Sessão iniciada</p>
              <p className="truncate text-xs text-muted-foreground">
                {session?.user.email ?? "—"}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/perfil">Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/definicoes">Definições</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/notificacoes">Notificações</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                void signOut();
              }}
              className="text-destructive"
            >
              Terminar sessão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
