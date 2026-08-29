import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Eye, Send, Sparkles, Ticket, Trash2, X } from "lucide-react";

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
        content:
          "Sete layouts prontos e pedidos de template personalizado com acompanhamento por ticket.",
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

  /** O painel direito serve duas tarefas: ver o layout, ou pedir um à medida. */
  const [mode, setMode] = useState<"preview" | "custom">("preview");
  const [focused, setFocused] = useState<DocTemplateId>(selected);
  const [zoom, setZoom] = useState<DocTemplate | null>(null);

  const current = docTemplates.find((t) => t.id === focused) ?? docTemplates[0];
  const isActive = selected === current.id;

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

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.contact.trim()) {
      toast.error("Preencha o título, a descrição e o contacto.");
      return;
    }
    const ticket = await addTicket({
      title: form.title.trim(),
      description: form.description.trim(),
      contact: form.contact.trim(),
      documents: form.documents.length > 0 ? form.documents : ["Factura"],
    });
    if (!ticket) return;
    setForm({ title: "", description: "", contact: "", documents: ["Factura"] });
    toast.success(`Pedido ${ticket.ref} criado`, {
      description: `A equipa Quota vai responder. Taxa de ${formatMZN(ticket.fee)} MZN após aprovação do orçamento.`,
    });
  }

  const apply = (t: DocTemplate) => {
    setDocTemplate(t.id);
    toast.success(`Layout ${t.name} aplicado aos documentos`);
  };

  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      {/* ─── Barra de contexto ─── */}
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="pl-1 text-[12.5px] font-semibold">Design dos documentos</span>
          <span className="hidden border-l border-border/60 pl-3 text-[11px] text-muted-foreground sm:inline">
            {docTemplates.length} layouts · aplica-se a facturas, cotações, recibos e PDFs.{" "}
            <Link to="/dashboard/definicoes" className="font-medium text-primary hover:underline">
              Dados de pagamento
            </Link>{" "}
            em Definições.
          </span>
          <button
            onClick={() => setMode((m) => (m === "custom" ? "preview" : "custom"))}
            aria-pressed={mode === "custom"}
            className={cn(
              "ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-[12px] font-semibold transition",
              mode === "custom"
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" /> Template personalizado
            {tickets.length > 0 && (
              <span className="rounded bg-primary/15 px-1.5 py-px text-[9.5px] font-bold tabular-nums text-primary">
                {tickets.length}
              </span>
            )}
          </button>
        </div>
      </section>

      <div className="grid gap-3 md:min-h-0 md:flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ─── Galeria ─── */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              {docTemplates.map((t) => {
                const on = focused === t.id && mode === "preview";
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={on}
                    onClick={() => {
                      setFocused(t.id);
                      setMode("preview");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setFocused(t.id);
                        setMode("preview");
                      }
                    }}
                    className={cn(
                      "group relative flex cursor-pointer flex-col gap-1.5 rounded-lg border p-1.5 text-left transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on
                        ? "border-primary bg-primary/5 ring-[3px] ring-primary/15"
                        : "border-border/70 hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    {selected === t.id && (
                      <span className="absolute right-2.5 top-2.5 z-10 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-primary-foreground shadow-sm">
                        Activo
                      </span>
                    )}
                    <div inert className="pointer-events-none">
                      <TemplatePreview id={t.id} scale={0.155} />
                    </div>
                    <span className="min-w-0 px-0.5 pb-0.5">
                      <span className="block truncate text-[11.5px] font-semibold">{t.name}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {t.tagline}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="shrink-0 border-t border-border/70 bg-surface px-3.5 py-2 text-[11px] text-muted-foreground">
            {docTemplates.length} layouts prontos
          </div>
        </section>

        {/* ─── Painel direito ─── */}
        {mode === "preview" ? (
          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-surface shadow-sm">
            <div className="flex shrink-0 items-center gap-2.5 border-b border-border/70 bg-card px-4 py-2.5">
              <span className="min-w-0">
                <span className="font-display text-[13.5px] font-semibold">{current.name}</span>
                <span className="ml-1.5 text-[11px] text-muted-foreground">· {current.tagline}</span>
              </span>
              {isActive && (
                <span className="ml-auto shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Activo
                </span>
              )}
            </div>

            <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto overscroll-contain p-4">
              <div className="overflow-hidden rounded-md border border-border/60 bg-white shadow-elegant">
                <TemplatePreview id={current.id} scale={0.44} />
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border/70 bg-card px-3 py-2.5">
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {current.bullets.map((b) => (
                  <span
                    key={b}
                    className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setZoom(current)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium transition hover:bg-muted"
                >
                  <Eye className="h-3.5 w-3.5" /> Tamanho real
                </button>
                <button
                  onClick={() => apply(current)}
                  disabled={isActive}
                  className={cn(
                    "rounded-md px-3.5 py-2 text-[12px] font-semibold transition",
                    isActive
                      ? "cursor-default bg-primary/10 text-primary"
                      : "bg-primary text-primary-foreground hover:opacity-90",
                  )}
                >
                  {isActive ? "Layout activo" : "Usar este layout"}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
            <div className="flex shrink-0 items-center gap-2 border-b border-border/70 bg-surface px-4 py-2.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-display text-[13.5px] font-semibold">
                Quero um template personalizado
              </span>
              <button
                onClick={() => setMode("preview")}
                aria-label="Voltar aos layouts"
                className="ml-auto grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <form onSubmit={submitTicket} className="border-b border-border/70 p-4">
                <p className="text-[12px] text-muted-foreground">
                  Descreva o layout que precisa. A equipa desenha e implementa-o no seu Quota. O
                  pedido fica como ticket aberto até estar resolvido.
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Título do pedido
                    </span>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Ex.: Factura com cores da marca e assinatura digital"
                      className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-[12px] outline-none transition focus:border-primary/60"
                    />
                  </label>

                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      O que precisa de diferente
                    </span>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Cores, posição do logotipo, campos extra, idioma, rodapé bancário…"
                      className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-[12px] outline-none transition focus:border-primary/60"
                    />
                  </label>

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Documentos a personalizar
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {DOC_TYPES.map((d) => {
                        const on = form.documents.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleDoc(d)}
                            aria-pressed={on}
                            className={cn(
                              "rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition",
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

                  <label className="flex flex-col gap-1">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Contacto para resposta
                    </span>
                    <input
                      value={form.contact}
                      onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                      placeholder="email ou WhatsApp"
                      className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-[12px] outline-none transition focus:border-primary/60"
                    />
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
                  <p className="text-[11px] text-muted-foreground">
                    Taxa de desenvolvimento{" "}
                    <span className="font-semibold text-foreground">
                      {formatMZN(CUSTOM_TEMPLATE_FEE)} MZN
                    </span>{" "}
                    · paga após aprovação do orçamento
                  </p>
                  <button
                    type="submit"
                    className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    <Send className="h-3.5 w-3.5" /> Enviar pedido
                  </button>
                </div>
              </form>

              <div className="p-4">
                <div className="flex items-center gap-2">
                  <Ticket className="h-3.5 w-3.5 text-primary" />
                  <h2 className="font-display text-[12.5px] font-semibold">Os seus pedidos</h2>
                  {tickets.length > 0 && (
                    <span className="rounded bg-muted px-1.5 py-px text-[9.5px] font-bold tabular-nums text-muted-foreground">
                      {tickets.length}
                    </span>
                  )}
                </div>

                {tickets.length === 0 ? (
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    Ainda não enviou pedidos. Os tickets abertos ficam aqui até serem resolvidos.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {tickets.map((t) => {
                      const meta = ticketStatusMeta[t.status];
                      return (
                        <li key={t.id} className="rounded-md border border-border/60 bg-surface p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] font-semibold">{t.title}</p>
                              <p className="mt-0.5 text-[10.5px] tabular-nums text-muted-foreground">
                                {t.ref} · {new Date(t.createdAt).toLocaleDateString("pt-PT")} ·{" "}
                                {formatMZN(t.fee)} MZN
                              </p>
                            </div>
                            <span
                              className={cn(
                                "shrink-0 rounded-md border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]",
                                meta.tone,
                              )}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-[11.5px] text-muted-foreground">
                            {t.description}
                          </p>
                          <div className="mt-2.5 flex items-center gap-2">
                            {t.status !== "resolvido" && (
                              <>
                                {t.status === "aberto" && (
                                  <button
                                    onClick={() => setTicketStatus(t.id, "em_analise")}
                                    className="rounded-md border border-border/70 px-2 py-1 text-[10.5px] font-semibold transition hover:bg-muted"
                                  >
                                    Marcar em análise
                                  </button>
                                )}
                                <button
                                  onClick={() => setTicketStatus(t.id, "resolvido")}
                                  className="rounded-md bg-primary px-2 py-1 text-[10.5px] font-semibold text-primary-foreground transition hover:opacity-90"
                                >
                                  Resolvido
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => deleteTicket(t.id)}
                              aria-label={`Apagar ${t.ref}`}
                              className="ml-auto grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Tamanho real — aqui um overlay é o certo: o objectivo é ocupar o ecrã todo. */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setZoom(null);
          }}
        >
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5">
              <div className="min-w-0">
                <h3 className="font-display text-[15px] font-semibold">{zoom.name}</h3>
                <p className="text-[11.5px] text-muted-foreground">{zoom.description}</p>
              </div>
              <button
                onClick={() => setZoom(null)}
                aria-label="Fechar pré-visualização"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-6">
              <div className="mx-auto max-w-[580px] overflow-hidden rounded-md border border-border/60 bg-white shadow-lg">
                <TemplatePreview id={zoom.id} scale={0.72} />
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border/60 px-5 py-3">
              <ul className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
                {zoom.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                    <Check className="h-3 w-3 shrink-0 text-primary" /> {b}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  apply(zoom);
                  setZoom(null);
                }}
                disabled={selected === zoom.id}
                className={cn(
                  "ml-auto shrink-0 rounded-md px-4 py-2 text-[12.5px] font-semibold transition",
                  selected === zoom.id
                    ? "cursor-default bg-primary/10 text-primary"
                    : "bg-primary text-primary-foreground hover:opacity-90",
                )}
              >
                {selected === zoom.id ? "Layout activo" : "Usar este layout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Pré-visualização real do documento no layout indicado, escalada. */
function TemplatePreview({ id, scale }: { id: DocTemplateId; scale: number }) {
  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{ width: 820 * scale, height: 1120 * scale }}
    >
      <div className="origin-top-left" style={{ width: 820, transform: `scale(${scale})` }}>
        <InvoiceDocument invoice={sampleInvoice} templateOverride={id} />
      </div>
    </div>
  );
}
