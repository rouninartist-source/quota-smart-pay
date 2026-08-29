import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, FileText, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatMZN } from "@/lib/format";
import { approveDraft, rejectDraft, upsertDraft, useDraft } from "@/lib/ai-drafts";
import type { InvoiceLine } from "@/lib/invoices-store";

export type DraftProposal = {
  clientName: string;
  clientNuit?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  issued?: string;
  due?: string;
  notes?: string;
  lines: InvoiceLine[];
};

/**
 * Rascunho proposto pelo Quota AI. Nada é emitido sem verificação humana:
 * a pessoa aprova (cria a factura em rascunho) ou rejeita.
 */
export function DraftInvoiceCard({
  draftId,
  proposal,
  threadId,
}: {
  draftId: string;
  proposal: DraftProposal;
  threadId?: string;
}) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const draft = useDraft(draftId);

  useEffect(() => {
    upsertDraft(draftId, { ...proposal, threadId });
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  const lines = draft?.lines ?? proposal.lines ?? [];

  const totals = useMemo(() => {
    const net = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const vat = lines.reduce((s, l) => s + l.qty * l.price * (l.vat / 100), 0);
    return { net, vat, total: net + vat };
  }, [lines]);

  if (!ready) return null;

  const status = draft?.status ?? "pendente";

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-primary/30 bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-primary/5 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-primary">
          <FileText className="h-4 w-4" /> Rascunho de factura proposto
        </div>
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
            status === "pendente" && "border-amber-500/40 bg-amber-500/10 text-amber-600",
            status === "aprovado" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
            status === "rejeitado" && "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {status === "pendente" ? "Aguarda verificação" : status}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <Meta label="Cliente" value={proposal.clientName} />
          <Meta label="Emissão" value={proposal.issued ?? "hoje"} />
          <Meta label="Vencimento" value={proposal.due ?? "+14 dias"} />
        </div>

        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border/60 text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="py-1.5 font-medium">Descrição</th>
              <th className="py-1.5 text-right font-medium">Qtd</th>
              <th className="py-1.5 text-right font-medium">Preço</th>
              <th className="py-1.5 text-right font-medium">IVA</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={`${l.description}-${i}`} className="border-b border-border/40">
                <td className="py-1.5 pr-2">{l.description}</td>
                <td className="py-1.5 text-right tabular-nums">{l.qty}</td>
                <td className="py-1.5 text-right tabular-nums">{formatMZN(l.price)}</td>
                <td className="py-1.5 text-right tabular-nums">{l.vat}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <span className="text-muted-foreground">
            Subtotal {formatMZN(totals.net)} · IVA {formatMZN(totals.vat)}
          </span>
          <span className="font-display text-[15px] font-semibold tabular-nums">
            {formatMZN(totals.total)} MZN
          </span>
        </div>

        {status === "pendente" ? (
          <>
            <p className="flex items-start gap-2 rounded-md bg-muted/60 p-2.5 text-[12px] text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              Verificação humana obrigatória: confirme os valores, o NUIT e as datas. Só depois de
              aprovar é que a factura entra no sistema (como rascunho editável).
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const invoice = approveDraft(draftId);
                  if (invoice) {
                    toast.success(`Factura ${invoice.number} criada em rascunho`);
                    void navigate({ to: "/dashboard/facturas/$id", params: { id: invoice.id } });
                  }
                }}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-[13px] font-medium text-primary-foreground hover:opacity-90"
              >
                <CheckCircle2 className="h-4 w-4" /> Está conforme — criar factura
              </button>
              <button
                onClick={() => {
                  rejectDraft(draftId, "Não conforme");
                  toast.message("Rascunho rejeitado");
                }}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3.5 text-[13px] font-medium hover:bg-muted"
              >
                <XCircle className="h-4 w-4" /> Não conforme
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            {status === "aprovado" ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verificado e emitido como
                rascunho de factura.
                {draft?.invoiceId && (
                  <button
                    onClick={() =>
                      void navigate({
                        to: "/dashboard/facturas/$id",
                        params: { id: draft.invoiceId! },
                      })
                    }
                    className="font-medium text-primary hover:underline"
                  >
                    Abrir factura
                  </button>
                )}
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-destructive" /> Rejeitado na verificação
                humana.
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-background px-2.5 py-1.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-[12.5px] font-medium">{value}</p>
    </div>
  );
}
