import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function MidCTA() {
  return (
    <section className="px-6 pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-brand px-8 py-16 text-center md:py-20">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="relative">
          <h2 className="mx-auto max-w-xl text-balance font-display text-3xl font-semibold tracking-tight text-primary-foreground md:text-[40px] md:leading-[1.1]">
            Transforme o caos em facturação organizada.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-primary-foreground/75">
            Menos tempo em papelada, mais tempo a vender.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-card px-5 py-3 text-sm font-medium text-foreground transition hover:opacity-90"
            >
              Quero experimentar a Quota <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center rounded-xl border border-primary-foreground/25 px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary-foreground/10"
            >
              Ver preços
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
