import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Send, Users, Bot, CheckCheck } from "lucide-react";
import { PageShell } from "@/components/dashboard/PageShell";

export const Route = createFileRoute("/dashboard/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp · Quota Studio" },
      { name: "description", content: "Envie facturas, lembretes e converse com clientes directamente no WhatsApp Business." },
      { property: "og:title", content: "WhatsApp · Quota Studio" },
      { property: "og:description", content: "Facturação e cobrança WhatsApp-first, integradas com o seu negócio." },
    ],
  }),
  component: WhatsApp,
});

function WhatsApp() {
  return (
    <PageShell
      eyebrow="Comunicação"
      title="WhatsApp"
      description="Facturas, lembretes e conversas com clientes — tudo dentro do WhatsApp Business."
      Icon={MessageCircle}
      actions={[{ label: "Ligar conta" }, { label: "Nova mensagem", primary: true }]}
      metrics={[
        { label: "Enviadas hoje", value: "48" },
        { label: "Taxa de leitura", value: "94%" },
        { label: "Conversas activas", value: "27" },
        { label: "Tempo médio", value: "3 min", hint: "Resposta" },
      ]}
      features={[
        { title: "Envio 1-clique", desc: "Envie qualquer factura ou cotação directamente à conversa.", icon: Send },
        { title: "Difusões", desc: "Comunique promoções ou novidades a listas de clientes.", icon: Users },
        { title: "Respostas rápidas", desc: "Automatize saudações, catálogo e confirmações.", icon: Bot },
        { title: "Recibos automáticos", desc: "Pagamento confirmado, recibo entregue no chat.", icon: CheckCheck },
      ]}
    />
  );
}
