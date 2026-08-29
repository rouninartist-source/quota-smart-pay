import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Eye, Palette, Send, Sparkles, Ticket, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatMZN } from "@/lib/format";
import {
  CUSTOM_TEMPLATE_FEE,
  addTicket,
  deleteTicket,
  docTemplates,
  setDocTemplate,
  setTicketStatus,
  ticketStatusMeta,
  useDocTemplate,
  useTickets,
  type DocTemplate,
  type DocTemplateId,
} from "@/lib/doc-templates";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";
import { sampleInvoice } from "@/lib/sample-document";

export const Route = createFileRoute("/dashboard/design")({
  head: () => ({
    meta: [
      { title: "Design dos documentos · Quota" },
      {
        name: "description",
        content:
          "Escolha entre sete layouts de factura, cotação e recibo, ou peça um template personalizado à equipa Quota.",
      },
      { property: "og:title", content: "Design dos documentos · Quota" },
      {
        property: "og:description",
        content: "Três layouts prontos e pedidos de template personalizado com acompanhamento por ticket.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DesignPage,
});

const DOC_TYPES = ["Factura", "VD/Factura-recibo", "Cotação", "Recibo"];

function DesignPage() {
  const selected = useDocTemplate();
  const tickets = useTickets();

  const [preview, setPreview] = useState<DocTemplate | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    contact: "",
    documents: ["Factura"] as string[],
  });

  function toggleDoc(doc: string) {
    setForm((f) => ({
      ...f,
      documents: f.documents.includes(doc)
        ? f.documents.filter((d) => d !== doc)
        : [...f.documents, doc],
    }));
  }

  function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.contact.trim()) {
      toast.error("Preencha o título, a descrição e o contacto.");
      return;
    }
    const ticket = addTicket({
      title: form.title.trim(),
      description: form.description.trim(),
      contact: form.contact.trim(),
      documents: form.documents.length > 0 ? form.documents : ["Factura"],
    });
    setForm({ title: "", description: "", contact: "", documents: ["Factura"] });
    toast.success(`Pedido ${ticket.ref} criado`, {
      description: `A equipa Quota vai responder. Taxa de ${formatMZN(ticket.fee)} MZN após aprovação do orçamento.`,
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Design dos documentos</h1>
            <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
              Escolha um dos layouts abaixo — a pré-visualização mostra um documento real.
              Aplica-se de imediato às facturas, cotações, recibos e PDFs. Os dados de pagamento
              (banco com logo, M-Pesa e e-Mola com número e nome) e o selo de verificação definem-se
              em <Link to="/dashboard/definicoes" className="font-medium text-primary hover:underline">Definições</Link>.
            </p>
          </div>
        </div>
      </header>

      {/* Layouts — slider */}
      <LayoutSlider selected={selected} onPreview={setPreview} />


      {/* Pedido personalizado */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form
          onSubmit={submitTicket}
          className="rounded-lg border border-border/60 bg-card p-5 shadow-card"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display text-[15px] font-semibold">Quero um template personalizado</h2>
          </div>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Descreva o layout que precisa. A nossa equipa desenha e implementa o template no seu
            Quota. O pedido fica como ticket aberto até estar resolvido.
          </p>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="tk-title" className="block text-[13px] font-medium">
                Título do pedido
              </label>
              <input
                id="tk-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex.: Factura com cores da marca e assinatura digital"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tk-desc" className="block text-[13px] font-medium">
                O que precisa de diferente
              </label>
              <textarea
                id="tk-desc"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Cores, posição do logotipo, campos extra, idioma, rodapé bancário…"
                className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-[13px] font-medium">Documentos a personalizar</span>
              <div className="flex flex-wrap gap-2">
                {DOC_TYPES.map((d) => {
                  const on = form.documents.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDoc(d)}
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition",
                        on
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/70 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tk-contact" className="block text-[13px] font-medium">
                Contacto para resposta
              </label>
              <input
                id="tk-contact"
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                placeholder="email ou WhatsApp"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <p className="text-[12px] text-muted-foreground">
              Taxa de desenvolvimento:{" "}
              <span className="font-semibold text-foreground">{formatMZN(CUSTOM_TEMPLATE_FEE)} MZN</span>{" "}
              (paga após aprovação do orçamento)
            </p>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:opacity-90"
            >
              <Send className="h-3.5 w-3.5" /> Enviar pedido à equipa
            </button>
          </div>
        </form>

        {/* Tickets */}
        <aside className="rounded-lg border border-border/60 bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            <h2 className="font-display text-[15px] font-semibold">Os seus pedidos</h2>
          </div>
          {tickets.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Ainda não enviou pedidos. Os tickets abertos ficam aqui até serem resolvidos.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {tickets.map((t) => {
                const meta = ticketStatusMeta[t.status];
                return (
                  <li key={t.id} className="rounded-md border border-border/60 bg-background p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{t.title}</p>
                        <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                          {t.ref} · {new Date(t.createdAt).toLocaleDateString("pt-PT")} ·{" "}
                          {formatMZN(t.fee)} MZN
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                          meta.tone,
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[12px] text-muted-foreground">{t.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      {t.status !== "resolvido" && (
                        <>
                          {t.status === "aberto" && (
                            <button
                              onClick={() => setTicketStatus(t.id, "em_analise")}
                              className="rounded-md border border-border/70 px-2 py-1 text-[11px] font-medium hover:bg-muted"
                            >
                              Marcar em análise
                            </button>
                          )}
                          <button
                            onClick={() => setTicketStatus(t.id, "resolvido")}
                            className="rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90"
                          >
                            Resolvido
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteTicket(t.id)}
                        aria-label={`Apagar ${t.ref}`}
                        className="ml-auto grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </section>

      {/* Modal de visualização ampliada */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreview(null);
          }}
        >
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="font-display text-[16px] font-semibold">{preview.name}</h3>
                <p className="text-[12px] text-muted-foreground">Pré-visualização do layout em tamanho real</p>
              </div>
              <button
                onClick={() => setPreview(null)}
                aria-label="Fechar pré-visualização"
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
              <div className="mx-auto max-w-[580px]">
                <div className="overflow-hidden rounded-md border border-border/60 bg-white shadow-lg">
                  <TemplatePreview id={preview.id} large />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[13px] font-medium">{preview.tagline}</p>
                    <ul className="space-y-1">
                      {preview.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setDocTemplate(preview.id);
                      setPreview(null);
                      toast.success(`Layout ${preview.name} aplicado aos documentos`);
                    }}
                    disabled={selected === preview.id}
                    className={cn(
                      "h-9 rounded-md px-4 text-[13px] font-medium transition",
                      selected === preview.id
                        ? "cursor-default bg-primary/10 text-primary"
                        : "bg-primary text-primary-foreground hover:opacity-90",
                    )}
                  >
                    {selected === preview.id ? "Layout activo" : "Usar este layout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Pré-visualização real do documento no layout indicado. */
function TemplatePreview({ id, large }: { id: DocTemplateId; large?: boolean }) {
  const scale = large ? 0.72 : 0.34;
  return (
    <div
      className="relative w-full overflow-hidden rounded-md bg-white shadow-sm"
      style={{ height: large ? 1150 * scale : 900 * scale }}
    >
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{ width: 820 * scale }}
      >
        <div className="origin-top-left" style={{ width: 820, transform: `scale(${scale})` }}>
          <InvoiceDocument invoice={sampleInvoice} templateOverride={id} />
        </div>
      </div>
    </div>
  );
}
