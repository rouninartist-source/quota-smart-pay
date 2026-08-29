import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  ["Preciso instalar algum programa?", "Não. A Quota funciona online, no navegador."],
  ["Posso emitir facturas pelo telemóvel?", "Sim. A Quota adapta-se ao ecrã do telemóvel e do tablet."],
  ["Posso enviar documentos pelo WhatsApp?", "Sim. Envie facturas, recibos e lembretes directamente para a conversa do cliente."],
  ["A Quota processa pagamentos?", "Não. A Quota imprime os seus dados de pagamento (banco, M-Pesa, e-Mola) no documento e permite registar o pagamento recebido para emitir o recibo."],
  ["Posso cancelar quando quiser?", "Sim, conforme as condições do plano."],
];

export function FAQ() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
          Perguntas frequentes
        </h2>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map(([q, a], i) => (
            <AccordionItem key={q} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-[14px] font-medium">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-[13px] leading-relaxed text-muted-foreground">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
