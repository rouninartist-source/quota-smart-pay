import { Briefcase, Building2, Store, UserRound } from "lucide-react";

const items = [
  {
    icon: Briefcase,
    title: "Prestadores de serviços",
    desc: "Emita cotações e facturas, registe pagamentos recebidos e mantenha tudo organizado.",
  },
  {
    icon: Building2,
    title: "PMEs",
    desc: "Tenha facturação, cobranças, clientes e relatórios num só lugar.",
  },
  {
    icon: Store,
    title: "Comércio",
    desc: "Controle vendas, produtos, documentos e recebimentos.",
  },
  {
    icon: UserRound,
    title: "Profissionais independentes",
    desc: "Crie documentos profissionais e cobre os seus clientes sem complicações.",
  },
];

export function BusinessTypes() {
  return (
    <section id="solucoes" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Soluções
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
            Uma plataforma. Todas as operações.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.title}
                className="rounded-2xl border border-border/70 bg-card p-6 transition hover:-translate-y-1 hover:shadow-elegant"
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <h3 className="mt-5 font-display text-[15px] font-semibold">
                  {it.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {it.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
