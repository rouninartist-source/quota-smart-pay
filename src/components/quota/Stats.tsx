const stats = [
  ["+1 200", "empresas registadas"],
  ["+85 000", "documentos emitidos"],
  ["3 min", "para emitir a 1ª factura"],
  ["99,9%", "disponibilidade da plataforma"],
];

export function Stats() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-3xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([value, label]) => (
          <div key={label} className="bg-card p-8 text-center">
            <p className="font-display text-3xl font-semibold tracking-tight text-primary md:text-4xl">
              {value}
            </p>
            <p className="mt-2 text-[13px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
