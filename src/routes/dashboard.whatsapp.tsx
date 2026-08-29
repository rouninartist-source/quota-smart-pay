import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Send, Users, Bell, FileText, Link2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp · Quota Studio" },
      {
        name: "description",
        content: "Ligue o WhatsApp Business para enviar facturas, lembretes e cobranças aos clientes.",
      },
      { property: "og:title", content: "WhatsApp · Quota Studio" },
      {
        property: "og:description",
        content: "Facturas, lembretes e conversas com clientes dentro do WhatsApp Business.",
      },
    ],
  }),
  component: WhatsAppPage,
});

/**
 * A conta ainda não liga a lado nenhum: não há store nem integração. Por isso a
 * página não inventa métricas — diz o que vai fazer e como se liga.
 */
const CAPABILITIES = [
  {
    icon: FileText,
    title: "Enviar documentos",
    desc: "A factura ou cotação segue em PDF directamente para a conversa do cliente.",
  },
  {
    icon: Bell,
    title: "Lembretes de cobrança",
    desc: "Mensagem automática com o valor em dívida e a data de vencimento.",
  },
  {
    icon: Users,
    title: "Difusões",
    desc: "Avisos e campanhas para listas de clientes, sem grupos.",
  },
  {
    icon: Send,
    title: "Respostas rápidas",
    desc: "Modelos aprovados para as perguntas que se repetem todos os dias.",
  },
];

function WhatsAppPage() {
  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      {/* ─── Barra de contexto ─── */}
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 pl-1 text-[12.5px] font-semibold">
            <MessageCircle className="h-3.5 w-3.5 text-success" /> WhatsApp
          </span>
          <span className="inline-flex items-center gap-1.5 border-l border-border/60 pl-3 text-[11px] text-muted-foreground">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warning" />
            Conta não ligada
          </span>
          <button className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition hover:opacity-90">
            <Link2 className="h-3.5 w-3.5" /> Ligar conta
          </button>
        </div>
      </section>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm md:min-h-0 md:flex-1">
        <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto overscroll-contain p-6">
          <div className="w-full max-w-[620px] text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-success/10 text-success">
              <MessageCircle className="h-6 w-6" />
            </span>
            <h1 className="mt-3 font-display text-[19px] font-semibold tracking-tight">
              Ligue o seu WhatsApp Business
            </h1>
            <p className="mx-auto mt-1.5 max-w-[46ch] text-[12.5px] leading-relaxed text-muted-foreground">
              Depois de ligar, envia facturas e lembretes ao cliente sem sair do Quota. Precisa de
              um número registado no WhatsApp Business.
            </p>

            <div className="mt-5 grid gap-2.5 text-left sm:grid-cols-2">
              {CAPABILITIES.map((c) => (
                <div
                  key={c.title}
                  className="flex gap-2.5 rounded-lg border border-border/70 bg-surface p-3"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-card text-muted-foreground shadow-sm">
                    <c.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-semibold">{c.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                      {c.desc}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-5 text-[11.5px] text-muted-foreground">
              Entretanto, o botão <span className="font-medium text-foreground">Cobrar</span> em{" "}
              <Link to="/dashboard/documentos" className="font-medium text-primary hover:underline">
                Documentos
              </Link>{" "}
              já abre o WhatsApp com a mensagem pronta.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
