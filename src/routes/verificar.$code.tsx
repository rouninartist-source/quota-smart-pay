import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { formatDate, formatMZN } from "@/lib/format";
import { documentKinds, type DocumentKind } from "@/lib/invoices-store";

export const Route = createFileRoute("/verificar/$code")({
  validateSearch: (search: Record<string, unknown>): { o?: string; n?: string } => ({
    ...(typeof search.o === "string" ? { o: search.o } : {}),
    ...(typeof search.n === "string" ? { n: search.n } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Verificar documento · Quota" },
      { name: "description", content: "Confirme se um documento (factura, recibo ou cotação) foi realmente emitido pelo sistema Quota." },
      { property: "og:title", content: "Verificar documento · Quota" },
      { property: "og:description", content: "Verificação pública de autenticidade de documentos Quota." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyPage,
});

type Result =
  | { valid: false }
  | {
      valid: true;
      type: "documento" | "recibo";
      kind?: DocumentKind;
      number: string;
      issued: string;
      total: number;
      cancelled?: boolean;
      client: string;
      refs?: string[];
      issuer: { name: string; nuit: string };
    };

/** Página aberta pelo QR do documento — pública, sem sessão. */
function VerifyPage() {
  const { code } = Route.useParams();
  const { o, n } = Route.useSearch();
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!o || !n) return setResult({ valid: false });
    const q = new URLSearchParams({ o, n, c: code });
    fetch(`/api/verificar?${q.toString()}`)
      .then((r) => r.json() as Promise<Result>)
      .then(setResult)
      .catch(() => setResult({ valid: false }));
  }, [code, o, n]);

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

        {!result ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> A verificar…
          </p>
        ) : result.valid ? (
          <>
            <div
              className={
                result.cancelled
                  ? "mt-6 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
                  : "mt-6 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success"
              }
            >
              {result.cancelled ? <ShieldAlert className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
              {result.cancelled ? "Documento emitido pelo sistema Quota, mas ANULADO" : "Documento válido, emitido pelo sistema Quota"}
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <Info label="Documento" value={`${result.type === "recibo" ? "Recibo" : (result.kind && documentKinds[result.kind]?.label) || "Documento"} ${result.number}`} />
              <Info label="Data" value={formatDate(result.issued)} />
              <Info label="Emitente" value={result.issuer.name || "—"} />
              <Info label="NUIT emitente" value={result.issuer.nuit || "—"} />
              <Info label="Cliente" value={result.client || "—"} />
              <Info label={result.type === "recibo" ? "Valor recebido" : "Total"} value={`${formatMZN(result.total)} MZN`} />
              {result.refs && result.refs.length > 0 && <Info label="Referente a" value={result.refs.join(", ")} />}
            </dl>
            <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              Confirme que os dados acima coincidem com o documento que tem na mão. Se o total ou o cliente forem diferentes, o documento foi alterado.
            </p>
          </>
        ) : (
          <>
            <div className="mt-6 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              <ShieldAlert className="h-4 w-4" /> Documento não encontrado
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Este código não corresponde a nenhum documento emitido no Quota. Leia o QR impresso no rodapé do documento.
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
