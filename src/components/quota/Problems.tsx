import { Clock, FileWarning, WalletMinimal } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Facturas feitas à mão, sempre a atrasar",
    desc: "Word, Excel e cálculos manuais que consomem horas todas as semanas.",
  },
  {
    icon: FileWarning,
    title: "Documentos sem numeração nem IVA correcto",
    desc: "Erros de numeração e NUIT que criam problemas com as Finanças.",
  },
  {
    icon: WalletMinimal,
    title: "Não sabe quanto falta receber",
    desc: "Valores pendentes espalhados por cadernos e ficheiros.",
  },
];

export function Problems() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Problema
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
            Facturar não devia ser assim.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-2xl border border-destructive/20 bg-card p-6"
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-destructive/10">
                  <Icon className="h-4 w-4 text-destructive" />
                </div>
                <h3 className="mt-5 font-display text-[15px] font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
