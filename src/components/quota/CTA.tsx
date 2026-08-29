import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CTA() {
  return (
    <section className="px-6 pb-28">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border/70 bg-surface px-8 py-16 text-center md:py-20">
        <h2 className="mx-auto max-w-xl text-balance font-display text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
          Pronto para simplificar a sua facturação?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
          Crie a sua conta gratuitamente e comece a gerir o seu negócio hoje.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Começar grátis <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium transition hover:bg-muted"
          >
            Ver preços
          </a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          14 dias grátis · Sem cartão · Sem compromisso
        </p>
      </div>
    </section>
  );
}
