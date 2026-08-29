import { Check, Minus } from "lucide-react";

const columns = ["Quota", "Folhas de cálculo", "Software tradicional"];

const rows: [string, boolean[]][] = [
  ["Facturas, recibos e cotações num só lugar", [true, false, true]],
  ["Envio directo por WhatsApp", [true, false, false]],
  ["Dados de pagamento e logos dos bancos", [true, false, false]],
  ["IVA, NUIT e numeração sequencial", [true, false, true]],
  ["Sem instalação, funciona no telemóvel", [true, false, false]],
  ["Relatórios de pendentes e atrasos", [true, false, true]],
  ["Preço em MZN acessível a PMEs", [true, true, false]],
];

export function Comparison() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Comparação
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
            Simplicidade que entrega resultados.
          </h2>
        </div>

        <div className="mt-12 overflow-x-auto rounded-2xl border border-border/70 bg-card">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border/70">
                <th className="px-6 py-4 font-medium text-muted-foreground">Funcionalidade</th>
                {columns.map((c, i) => (
                  <th
                    key={c}
                    className={`px-6 py-4 text-center font-display font-semibold ${
                      i === 0 ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, values]) => (
                <tr key={label} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3.5">{label}</td>
                  {values.map((v, i) => (
                    <td key={i} className="px-6 py-3.5">
                      <div className="flex justify-center">
                        {v ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
