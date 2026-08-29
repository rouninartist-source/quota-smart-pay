import type { Invoice } from "@/lib/invoices-store";

/** Documento de exemplo usado nas pré-visualizações de layout. */
export const sampleInvoice: Invoice = {
  id: "sample",
  number: "FT 2026/00042",
  issued: "2026-08-10",
  due: "2026-08-24",
  status: "enviada",
  notes: "Obrigado pela preferência.",
  client: {
    name: "João Comercial, Lda",
    nuit: "400123456",
    email: "joao@comercial.co.mz",
    phone: "+258 84 210 4477",
    address: "Av. Julius Nyerere 812, Maputo",
  },
  lines: [
    { description: "Consultoria de gestão (mensal)", qty: 1, price: 42000, vat: 16 },
    { description: "Papel A4 80g (resma)", qty: 12, price: 480, vat: 16 },
    { description: "Instalação e formação", qty: 3, price: 2500, vat: 16 },
  ],
};
