import { Apple, Play } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary font-display text-xs font-bold text-primary-foreground">
              Q
            </div>
            <span className="font-display font-semibold">Quota</span>
            <span className="ml-2 text-xs text-muted-foreground">
              © 2026 · Maputo, Moçambique
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <a
              href="#"
              aria-label="Descarregar na Google Play"
              className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 transition hover:bg-muted"
            >
              <Play className="h-5 w-5 text-primary" />
              <span className="text-left leading-tight">
                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                  Disponível no
                </span>
                <span className="block text-[13px] font-medium">Google Play</span>
              </span>
            </a>
            <a
              href="#"
              aria-label="Descarregar na App Store"
              className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 transition hover:bg-muted"
            >
              <Apple className="h-5 w-5 text-primary" />
              <span className="text-left leading-tight">
                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                  Descarregar na
                </span>
                <span className="block text-[13px] font-medium">App Store</span>
              </span>
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 border-t border-border/70 pt-6 text-sm text-muted-foreground">
          <a href="#produto" className="hover:text-foreground">Produto</a>
          <a href="#solucoes" className="hover:text-foreground">Soluções</a>
          <a href="#pricing" className="hover:text-foreground">Preços</a>
          <a href="#" className="hover:text-foreground">Privacidade</a>
          <a href="#" className="hover:text-foreground">Termos</a>
          <a href="#" className="hover:text-foreground">Estado do sistema</a>
        </div>
      </div>
    </footer>
  );
}
