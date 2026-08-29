export function VerifySection() {
  return (
    <section id="verify" className="py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <p className="text-xs text-muted-foreground">verify.quota.co.mz</p>
                <p className="mt-1 font-mono text-sm">/document/FT2026-00187</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Válido
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <Info label="Empresa" value="Quota Retail, Lda" />
              <Info label="NUIT" value="400 123 456" />
              <Info label="Documento" value="Factura FT 2026/00187" />
              <Info label="Data" value="27 Maio 2026" />
              <Info label="Valor" value="84 500,00 MZN" />
              <Info label="Hash" value="a1b2…f9e0" mono />
            </div>
            <div className="mt-5 flex items-center gap-4 rounded-2xl bg-surface p-4">
              <div className="grid h-20 w-20 place-items-center rounded-lg bg-foreground">
                <div className="grid h-14 w-14 grid-cols-5 gap-0.5">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <span key={i} className={`rounded-[1px] ${Math.random() > 0.5 ? "bg-background" : "bg-foreground"}`} />
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                QR Code verificado · Autenticidade fiscal confirmada · Assinatura digital válida.
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Verificação de documentos</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Cada factura é <span className="text-gradient-brand">verificável publicamente</span>
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Cada documento Quota traz um selo de verificação, QR Code e hash de
            segurança. Os seus clientes confirmam a autenticidade em segundos —
            sem fricção, sem dúvidas.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Selo “✓ Verificado pela Quota” no PDF",
              "Link público e QR Code em cada documento",
              "Hash de segurança e assinatura digital",
              "Página de verificação clara: válido ou inválido",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-1 grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-[11px] text-primary">✓</span>
                <span className="text-muted-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}
