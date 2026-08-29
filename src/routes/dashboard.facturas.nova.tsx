import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Field, FieldRow, FormSection } from "@/components/app/FormSection";
import { formatMZN } from "@/lib/format";
import { useClients } from "@/lib/clients-store";
import {
  addInvoice,
  demoClient,
  nextInvoiceNumber,
  type InvoiceLine,
  type InvoiceStatus,
} from "@/lib/invoices-store";

export const Route = createFileRoute("/dashboard/facturas/nova")({
  validateSearch: (search: Record<string, unknown>): { cliente?: string } =>
    typeof search.cliente === "string" ? { cliente: search.cliente } : {},
  head: () => ({
    meta: [
      { title: "Nova factura · Quota Studio" },
      { name: "description", content: "Crie uma factura com número automático, data de vencimento, linhas de artigos e IVA calculado." },
      { property: "og:title", content: "Nova factura · Quota Studio" },
      { property: "og:description", content: "Emita uma factura em segundos e descarregue o PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovaFactura,
});

function iso(offsetDays: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function NovaFactura() {
  const navigate = useNavigate();
  const { cliente } = Route.useSearch();
  const clients = useClients();
  // O número fiscal é atribuído pela base de dados ao gravar — abrir e
  // abandonar o formulário não pode consumir um número.
  const number = "";
  const [clientId, setClientId] = useState<string>(cliente ?? "cli-demo-1");
  const [client, setClient] = useState({ ...demoClient });
  const [issued, setIssued] = useState(iso(0));
  const [due, setDue] = useState(iso(30));
  const [status, setStatus] = useState<InvoiceStatus>("rascunho");
  const [notes, setNotes] = useState("Obrigado pela preferência.");
  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: "", qty: 1, price: 0, vat: 16 },
  ]);
  const [error, setError] = useState<string>();

  function pickClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (c) {
      setClient({ name: c.name, nuit: c.nuit, email: c.email, phone: c.phone, address: c.address });
    } else {
      setClient({ name: "", nuit: "", email: "", phone: "", address: "" });
    }
  }

  // Keep the snapshot in sync once the client store hydrates from localStorage.
  useEffect(() => {
    const c = clients.find((x) => x.id === clientId);
    if (c) setClient({ name: c.name, nuit: c.nuit, email: c.email, phone: c.phone, address: c.address });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients]);


  const totals = useMemo(() => {
    const net = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const vat = lines.reduce((s, l) => s + (l.qty * l.price * l.vat) / 100, 0);
    return { net, vat, total: net + vat };
  }, [lines]);

  function setLine(i: number, patch: Partial<InvoiceLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const valid = lines.filter((l) => l.description.trim() && l.qty > 0);
    if (!client.name.trim()) return setError("Indique o nome do cliente.");
    if (!valid.length) return setError("Adicione ao menos uma linha com descrição e quantidade.");
    setError(undefined);
    const created = await addInvoice({
      number,
      issued,
      due,
      status,
      notes,
      clientId: clientId || undefined,
      client,
      lines: valid,
      payments: [],
    });
    if (created) navigate({ to: "/dashboard/facturas/$id", params: { id: created.id } });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/dashboard/facturas"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Facturas
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Nova factura</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Número <span className="font-medium tabular-nums text-foreground">{number}</span> atribuído automaticamente.
          </p>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 self-start rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Emitir factura
        </button>
      </div>

      <div className="divide-y divide-border/60">
        <FormSection title="Cliente" description="Escolha um cliente da sua base ou preencha manualmente.">
          <Field
            label="Cliente"
            htmlFor="cl-pick"
            hint="Os campos abaixo são preenchidos a partir da ficha escolhida."
          >
            <select id="cl-pick" className={inputClass} value={clientId} onChange={(e) => pickClient(e.target.value)}>
              <option value="">Cliente pontual (sem ficha)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <FieldRow>
            <Field label="Nome" htmlFor="cl-name">
              <input id="cl-name" className={inputClass} value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
            </Field>
            <Field label="NUIT" htmlFor="cl-nuit">
              <input id="cl-nuit" className={inputClass} value={client.nuit} onChange={(e) => setClient({ ...client, nuit: e.target.value })} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Email" htmlFor="cl-email">
              <input id="cl-email" type="email" className={inputClass} value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
            </Field>
            <Field label="Telefone" htmlFor="cl-phone">
              <input id="cl-phone" className={inputClass} value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
            </Field>
          </FieldRow>
          <Field label="Endereço" htmlFor="cl-addr">
            <input id="cl-addr" className={inputClass} value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} />
          </Field>
        </FormSection>

        <FormSection title="Datas e estado" description="Vencimento define quando a factura entra em atraso.">
          <FieldRow>
            <Field label="Data de emissão" htmlFor="issued">
              <input id="issued" type="date" className={inputClass} value={issued} onChange={(e) => setIssued(e.target.value)} />
            </Field>
            <Field label="Data de vencimento" htmlFor="due">
              <input id="due" type="date" className={inputClass} value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </FieldRow>
          <Field label="Estado inicial" htmlFor="status">
            <select id="status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
              <option value="rascunho">Rascunho</option>
              <option value="enviada">Enviada</option>
              <option value="paga">Paga</option>
            </select>
          </Field>
        </FormSection>

        <FormSection title="Linhas" description="Artigos e serviços facturados, com IVA por linha.">
          <div className="space-y-3">
            {lines.map((l, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-border/70 bg-card p-3 sm:grid-cols-[minmax(0,1fr)_70px_110px_80px_36px] sm:items-end">
                <Field label="Descrição" htmlFor={`ln-d-${i}`}>
                  <input id={`ln-d-${i}`} className={inputClass} value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} placeholder="Ex.: Consultoria fiscal" />
                </Field>
                <Field label="Qtd" htmlFor={`ln-q-${i}`}>
                  <input id={`ln-q-${i}`} type="number" min={1} className={inputClass} value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} />
                </Field>
                <Field label="Preço" htmlFor={`ln-p-${i}`}>
                  <input id={`ln-p-${i}`} type="number" min={0} step="0.01" className={inputClass} value={l.price} onChange={(e) => setLine(i, { price: Number(e.target.value) })} />
                </Field>
                <Field label="IVA %" htmlFor={`ln-v-${i}`}>
                  <input id={`ln-v-${i}`} type="number" min={0} max={100} className={inputClass} value={l.vat} onChange={(e) => setLine(i, { vat: Number(e.target.value) })} />
                </Field>
                <button
                  type="button"
                  aria-label="Remover linha"
                  onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                  className="mb-1 grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, { description: "", qty: 1, price: 0, vat: 16 }])}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar linha
            </button>
          </div>

          <dl className="ml-auto w-full max-w-[280px] space-y-2 rounded-lg border border-border/70 bg-muted/40 p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatMZN(totals.net)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">IVA</dt>
              <dd className="tabular-nums">{formatMZN(totals.vat)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMZN(totals.total)} MZN</dd>
            </div>
          </dl>
        </FormSection>

        <FormSection title="Notas" description="Aparecem no rodapé do PDF.">
          <Field label="Observações" htmlFor="notes">
            <textarea id="notes" rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </FormSection>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
