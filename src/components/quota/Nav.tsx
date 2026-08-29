import { Link } from "@tanstack/react-router";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";

const links = [
  { label: "Produto", href: "#produto" },
  { label: "Soluções", href: "#solucoes" },
  { label: "Preços", href: "#pricing" },
  { label: "Recursos", href: "#recursos" },
];

export function Nav() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-6 pt-4">
        <div className="flex h-14 items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary">
              <span className="font-display text-xs font-bold text-primary-foreground">Q</span>
            </div>
            <span className="font-display text-[15px] font-semibold tracking-tight">Quota</span>
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggle}
              aria-label="Alternar tema"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/login"
              className="hidden rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex"
            >
              Entrar
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center rounded-lg bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground transition hover:opacity-90"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
