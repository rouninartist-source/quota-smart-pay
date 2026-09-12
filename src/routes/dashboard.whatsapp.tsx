import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Send, Bell, FileText, Link2, Check, Unplug } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_WHATSAPP_TEMPLATE, fillTemplate, saveCompany, useCompany } from "@/lib/company-store";
import { Field, inputClass } from "@/components/catalog/Modal";

export const Route = createFileRoute("/dashboard/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp · Quota Studio" },
      { name: "description", content: "Ligue o número WhatsApp Business da empresa e defina a mensagem de cobrança." },
      { property: "og:title", content: "WhatsApp · Quota Studio" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: WhatsAppPage,
});

/**
 * Sem API do WhatsApp Business (exige conta Meta e custos mensais), a ligação
 * é o que a app usa hoje: o número da empresa e o modelo da cobrança, que o
 * botão Cobrar abre já preenchido na conversa com o cliente.
 */
function WhatsAppPage() {
  const company = useCompany();
  const [number, setNumber] = useState("");
  const [template, setTemplate] = useState(DEFAULT_WHATSAPP_TEMPLATE);
  const [busy, setBusy] = useState(false);
  const connected = !!company.whatsapp?.number;

  useEffect(() => {
    setNumber(company.whatsapp?.number ?? company.phone ?? "");
    setTemplate(company.whatsapp?.template ?? DEFAULT_WHATSAPP_TEMPLATE);
  }, [company.whatsapp, company.phone]);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    const digits = number.replace(/\D/g, "");
    if (digits.length < 9) return toast.error("Indique o número com indicativo, ex.: +258 84 000 0000.");
    if (!template.includes("{numero}")) return toast.error("A mensagem tem de incluir {numero}.");
    setBusy(true);
    await saveCompany({ whatsapp: { number: number.trim(), template: template.trim(), connectedAt: new Date().toISOString() } });
    setBusy(false);
    toast.success("WhatsApp ligado", { description: "O botão Cobrar usa este número e esta mensagem." });
  }
  async function disconnect() {
    await saveCompany({ whatsapp: undefined });
    toast.success("WhatsApp desligado");
  }
  function test() {
    const digits = number.replace(/\D/g, "");
    const msg = fillTemplate(template, { cliente: "Cliente Exemplo", numero: "FT 2026/00001", valor: "12 500,00", vencimento: "30/09/2026" });
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, "_blank", "noreferrer");
  }

  const preview = fillTemplate(template, { cliente: "Cliente Exemplo", numero: "FT 2026/00001", valor: "12 500,00", vencimento: "30/09/2026" });

  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 pl-1 text-[12.5px] font-semibold">
            <MessageCircle className="h-3.5 w-3.5 text-success" /> WhatsApp
          </span>
          <span className="inline-flex items-center gap-1.5 border-l border-border/60 pl-3 text-[11px] text-muted-foreground">
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-success" : "bg-warning"}`} />
            {connected ? `Ligado · ${company.whatsapp!.number}` : "Conta não ligada"}
          </span>
          {connected && (
            <button onClick={disconnect} className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium hover:bg-muted">
              <Unplug className="h-3.5 w-3.5" /> Desligar
            </button>
          )}
        </div>
      </section>

      <div className="grid gap-3 md:min-h-0 md:flex-1 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-h-0 overflow-y-auto rounded-lg border border-border/70 bg-card p-5 shadow-sm">
          <form onSubmit={connect} className="mx-auto grid max-w-[620px] gap-4">
            <div>
              <h1 className="font-display text-[19px] font-semibold tracking-tight">Ligar o WhatsApp Business</h1>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                Registe o número da empresa e a mensagem de cobrança. Cada <b>Cobrar</b> em Documentos abre a conversa com o cliente já com a mensagem e a ligação ao PDF.
              </p>
            </div>
            <Field label="Número WhatsApp Business da empresa" hint="Com indicativo. É o número que aparece ao cliente quando responde.">
              <input className={inputClass} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+258 84 000 0000" inputMode="tel" />
            </Field>
            <Field label="Mensagem de cobrança" hint="Campos disponíveis: {cliente} {numero} {valor} {vencimento}">
              <textarea className={`${inputClass} h-auto py-2`} rows={4} value={template} onChange={(e) => setTemplate(e.target.value)} />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                {connected ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />} {busy ? "A guardar…" : connected ? "Guardar alterações" : "Ligar conta"}
              </button>
              <button type="button" onClick={test} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium hover:bg-muted">
                <Send className="h-3.5 w-3.5" /> Testar no meu número
              </button>
            </div>
            <div className="rounded-md border border-border/70 bg-surface p-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Pré-visualização</p>
              <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed">{preview}</p>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Envio automático (sem abrir o WhatsApp) requer a API oficial do WhatsApp Business — conta Meta verificada e custo por mensagem. Quando a empresa a tiver, liga-se aqui.
            </p>
          </form>
        </section>

        <aside className="grid gap-2.5 content-start">
          {[
            { icon: FileText, title: "Enviar documentos", desc: "Factura ou cotação com a ligação ao PDF, via Enviar → WhatsApp." },
            { icon: Bell, title: "Cobrar", desc: "Lembrete com o valor em dívida e a data de vencimento, com a mensagem acima." },
            { icon: MessageCircle, title: "Recibo", desc: "Depois de liquidar, o recibo segue pelo mesmo caminho." },
          ].map((c) => (
            <div key={c.title} className="flex gap-2.5 rounded-lg border border-border/70 bg-card p-3 shadow-sm">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-success/10 text-success">
                <c.icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[12px] font-semibold">{c.title}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">{c.desc}</span>
              </span>
            </div>
          ))}
          <p className="px-1 text-[11px] text-muted-foreground">
            Ver os documentos em{" "}
            <Link to="/dashboard/documentos" className="font-medium text-primary hover:underline">Documentos</Link>.
          </p>
        </aside>
      </div>
    </div>
  );
}
