import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { verificationCode } from "@/components/invoices/QuotaSeal";
import { formatDate, formatMZN } from "@/lib/format";
import { useCompany } from "@/lib/company-store";
import { invoiceBalance, invoiceTotal, useInvoices } from "@/lib/invoices-store";

export const Route = createFileRoute("/verificar/$code")({
  head: () => ({
    meta: [
      { title: "Verificar documento · Quota" },
      {
        name: "description",
        content: "Confirme se um documento (factura, recibo ou cotação) foi realmente emitido pelo sistema Quota.",
      },
      { property: "og:title", content: "Verificar documento · Quota" },
      { property: "og:description", content: "Verificação pública de autenticidade de documentos Quota." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { code } = Route.useParams();
  const invoices = useInvoices();
  const company = useCompany();

  const match = invoices
    .flatMap((inv) => {
      const refs = [inv.number, ...(inv.receiptNumber ? [inv.receiptNumber] : [])];
      return refs.map((reference) => ({ inv, reference }));
    })
    .find((r) => verificationCode(r.reference).toUpperCase() === code.toUpperCase());

  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-6 py-16">
      <div className="w-full max-w-lg rounded-lg border border-border/60 bg-card p-8 shadow-card">
        <Link to="/" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Quota
        </Link>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Verificação de documento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Código <span className="font-mono font-medium text-foreground">{code}</span>
        </p>

        {match ? (
          <>
            <div className="mt-6 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
              <BadgeCheck className="h-4 w-4" /> Documento válido e emitido pelo sistema Quota
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <Info label="Documento" value={match.reference} />
              <Info label="Emitente" value={company.name} />
              <Info label="Cliente" value={match.inv.client.name} />
              <Info label="NUIT cliente" value={match.inv.client.nuit} />
              <Info label="Emissão" value={formatDate(match.inv.issued)} />
              <Info label="Total" value={`${formatMZN(invoiceTotal(match.inv))} MZN`} />
              <Info
                label="Estado"
                value={invoiceBalance(match.inv) <= 0.01 ? "Pago" : `Saldo ${formatMZN(invoiceBalance(match.inv))} MZN`}
              />
              <Info label="Sistema" value="Quota · facturação" />
            </dl>
            <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              Este documento foi criado por um sistema Quota. O código de verificação é gerado a partir
              do número do documento e não pode ser alterado sem invalidar o selo.
            </p>
          </>
        ) : (
          <>
            <div className="mt-6 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              <ShieldAlert className="h-4 w-4" /> Nenhum documento encontrado com este código
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Confirme o código impresso no selo do documento. Documentos emitidos noutro dispositivo
              só podem ser verificados nesse dispositivo enquanto o Quota funciona em modo local.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
