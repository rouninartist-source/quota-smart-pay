/**
 * Demo dataset for the Quota product surface.
 * Pure presentation data — no persistence.
 */

export type Client = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  nuit: string;
  city: string;
  segment: "Empresa" | "Particular" | "Estado" | "ONG";
  status: "activo" | "inactivo" | "risco";
  balance: number;
  revenue: number;
  lastActivity: string;
  vip?: boolean;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  vat: number;
  status: "activo" | "esgotado" | "descontinuado";
};

export type Service = {
  id: string;
  code: string;
  name: string;
  category: string;
  rate: number;
  billing: "Hora" | "Projecto" | "Mensal";
  duration: string;
  margin: number;
  status: "activo" | "pausado";
};

export type DocStatus =
  | "rascunho"
  | "enviada"
  | "paga"
  | "vencida"
  | "parcial"
  | "cancelada"
  | "aceite"
  | "expirada";

export type Invoice = {
  id: string;
  number: string;
  client: string;
  issued: string;
  due: string;
  total: number;
  paid: number;
  status: DocStatus;
  items: number;
};

export type Quotation = {
  id: string;
  number: string;
  client: string;
  issued: string;
  valid: string;
  total: number;
  status: DocStatus;
  probability: number;
};

export type Receipt = {
  id: string;
  number: string;
  client: string;
  date: string;
  amount: number;
  method: "M-Pesa" | "e-Mola" | "Transferência" | "Numerário" | "Cartão";
  invoice: string;
};

export type Expense = {
  id: string;
  reference: string;
  supplier: string;
  category: string;
  date: string;
  amount: number;
  vat: number;
  status: "paga" | "pendente" | "aprovacao";
  method: string;
};

export type Payment = {
  id: string;
  reference: string;
  client: string;
  date: string;
  amount: number;
  method: "M-Pesa" | "e-Mola" | "Transferência" | "Numerário" | "Cartão";
  status: "confirmado" | "pendente" | "falhado" | "reembolsado";
  document: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: "pagamento" | "documento" | "sistema" | "cliente";
  read: boolean;
};

const names = [
  "João Comercial, Lda",
  "Mozal Serviços",
  "Farmácia Nyeleti",
  "Construções Zambeze",
  "Hotel Cardoso",
  "Escola Girassol",
  "Transportes Maputo Sul",
  "Clínica Sommerschield",
  "Padaria Matola Rio",
  "Agro Chimoio",
  "Tech Beira",
  "ONG Kuwuka",
  "Ministério das Obras",
  "Café Continental",
  "Boutique Xitende",
  "Auto Peças Nampula",
  "Gráfica Índico",
  "Pescas Inhambane",
  "Seguros Emose Sul",
  "Marisqueira Costa do Sol",
];

const cities = ["Maputo", "Matola", "Beira", "Nampula", "Tete", "Quelimane", "Xai-Xai", "Pemba"];
const segments: Client["segment"][] = ["Empresa", "Particular", "Estado", "ONG"];

function iso(daysFromNow: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export const clients: Client[] = names.map((name, i) => ({
  id: `cli-${i + 1}`,
  name,
  contact: [
    "Helena Macuácua",
    "Carlos Mabjaia",
    "Ana Sitoe",
    "Dinis Nhaca",
    "Sofia Cumbe",
    "Tomás Bila",
  ][i % 6],
  email: `${name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "")}@mail.co.mz`,
  phone: `+258 8${(i % 5) + 2} ${100 + i} ${2000 + i * 7}`,
  nuit: `4000${(100000 + i * 137).toString().slice(0, 6)}`,
  city: cities[i % cities.length],
  segment: segments[i % segments.length],
  status: i % 9 === 0 ? "risco" : i % 7 === 0 ? "inactivo" : "activo",
  balance: i % 3 === 0 ? 0 : Math.round(((i * 8123) % 240000) / 50) * 50,
  revenue: 40000 + ((i * 53311) % 900000),
  lastActivity: iso(-(i * 3 + 1)),
  vip: i % 6 === 0,
}));

export const products: Product[] = [
  ["QT-001", "Papel A4 80g (resma)", "Consumíveis", 480, 320, 240, 50, "un", 16],
  ["QT-002", "Toner HP 26A", "Consumíveis", 4200, 3100, 12, 15, "un", 16],
  ["QT-003", "Cadeira ergonómica Zeta", "Mobiliário", 12500, 8600, 8, 4, "un", 16],
  ["QT-004", "Secretária 140cm", "Mobiliário", 18900, 12000, 3, 5, "un", 16],
  ["QT-005", "Router Wi-Fi 6 AX3000", "Tecnologia", 7400, 5200, 26, 10, "un", 16],
  ["QT-006", "Portátil Ultra 14\"", "Tecnologia", 68000, 52000, 5, 3, "un", 16],
  ["QT-007", "Tinteiro Epson 664", "Consumíveis", 890, 560, 0, 20, "un", 16],
  ["QT-008", "Monitor 27\" QHD", "Tecnologia", 24500, 17800, 14, 6, "un", 16],
  ["QT-009", "Água mineral 5L (cx)", "Alimentar", 620, 410, 180, 40, "cx", 5],
  ["QT-010", "Café torrado 1kg", "Alimentar", 1450, 980, 62, 25, "kg", 5],
  ["QT-011", "Disco SSD 1TB", "Tecnologia", 9800, 7100, 19, 8, "un", 16],
  ["QT-012", "Arquivador metálico", "Mobiliário", 15600, 10400, 0, 2, "un", 16],
].map(([sku, name, category, price, cost, stock, minStock, unit, vat], i) => ({
  id: `prd-${i + 1}`,
  sku: sku as string,
  name: name as string,
  category: category as string,
  price: price as number,
  cost: cost as number,
  stock: stock as number,
  minStock: minStock as number,
  unit: unit as string,
  vat: vat as number,
  status: (stock as number) === 0 ? "esgotado" : i === 11 ? "descontinuado" : "activo",
}));

export const services: Service[] = [
  ["SV-01", "Consultoria fiscal", "Consultoria", 3500, "Hora", "1h", 68],
  ["SV-02", "Implementação de rede", "Tecnologia", 42000, "Projecto", "3-5 dias", 54],
  ["SV-03", "Manutenção mensal TI", "Tecnologia", 18500, "Mensal", "Contínuo", 61],
  ["SV-04", "Design de marca", "Criativo", 65000, "Projecto", "2 semanas", 72],
  ["SV-05", "Formação em facturação", "Formação", 2800, "Hora", "2h", 80],
  ["SV-06", "Auditoria interna", "Consultoria", 95000, "Projecto", "1 mês", 49],
  ["SV-07", "Suporte WhatsApp Business", "Tecnologia", 7500, "Mensal", "Contínuo", 66],
  ["SV-08", "Gestão de cobranças", "Financeiro", 12000, "Mensal", "Contínuo", 58],
].map(([code, name, category, rate, billing, duration, margin], i) => ({
  id: `svc-${i + 1}`,
  code: code as string,
  name: name as string,
  category: category as string,
  rate: rate as number,
  billing: billing as Service["billing"],
  duration: duration as string,
  margin: margin as number,
  status: i === 5 ? "pausado" : "activo",
}));

const invoiceStatuses: DocStatus[] = ["paga", "enviada", "vencida", "rascunho", "parcial", "paga", "enviada", "paga"];

export const invoices: Invoice[] = Array.from({ length: 24 }, (_, i) => {
  const total = 12000 + ((i * 47311) % 480000);
  const status = invoiceStatuses[i % invoiceStatuses.length];
  const paid = status === "paga" ? total : status === "parcial" ? Math.round(total * 0.4) : 0;
  return {
    id: `inv-${i + 1}`,
    number: `FT ${new Date().getFullYear()}/${(1042 + i).toString()}`,
    client: clients[i % clients.length].name,
    issued: iso(-(i * 2 + 1)),
    due: iso(30 - i * 2),
    total,
    paid,
    status,
    items: (i % 6) + 1,
  };
});

export const quotations: Quotation[] = Array.from({ length: 14 }, (_, i) => {
  const st: DocStatus[] = ["enviada", "aceite", "rascunho", "expirada", "enviada", "aceite"];
  return {
    id: `qt-${i + 1}`,
    number: `COT ${new Date().getFullYear()}/${(318 + i).toString()}`,
    client: clients[(i * 3) % clients.length].name,
    issued: iso(-(i * 3 + 2)),
    valid: iso(20 - i * 3),
    total: 25000 + ((i * 91237) % 720000),
    status: st[i % st.length],
    probability: [80, 95, 30, 10, 60, 90][i % 6],
  };
});

const methods: Receipt["method"][] = ["M-Pesa", "e-Mola", "Transferência", "Numerário", "Cartão"];

export const receipts: Receipt[] = Array.from({ length: 18 }, (_, i) => ({
  id: `rec-${i + 1}`,
  number: `REC ${new Date().getFullYear()}/${(720 + i).toString()}`,
  client: clients[(i * 5) % clients.length].name,
  date: iso(-(i * 2)),
  amount: 8000 + ((i * 33119) % 260000),
  method: methods[i % methods.length],
  invoice: `FT ${new Date().getFullYear()}/${(1042 + i).toString()}`,
}));

export const expenses: Expense[] = [
  ["Renda do escritório", "Imobiliária Polana", "Instalações", 85000, 0, "paga", "Transferência"],
  ["Electricidade EDM", "EDM", "Utilidades", 12400, 1984, "paga", "M-Pesa"],
  ["Internet TVCabo", "TVCabo", "Utilidades", 7800, 1248, "pendente", "Débito directo"],
  ["Combustível frota", "Petromoc", "Logística", 23600, 3776, "paga", "Cartão"],
  ["Licenças software", "Cloud Partner", "Tecnologia", 41500, 6640, "aprovacao", "Cartão"],
  ["Material de escritório", "Gráfica Índico", "Consumíveis", 9350, 1496, "paga", "Numerário"],
  ["Publicidade digital", "Meta Ads", "Marketing", 18000, 2880, "pendente", "Cartão"],
  ["Seguro de saúde", "Emose", "Recursos Humanos", 56000, 0, "paga", "Transferência"],
  ["Manutenção viaturas", "Auto Peças Nampula", "Logística", 14200, 2272, "aprovacao", "Transferência"],
  ["Serviços de limpeza", "CleanPro", "Instalações", 11000, 1760, "paga", "M-Pesa"],
].map(([reference, supplier, category, amount, vat, status, method], i) => ({
  id: `exp-${i + 1}`,
  reference: reference as string,
  supplier: supplier as string,
  category: category as string,
  date: iso(-(i * 4 + 1)),
  amount: amount as number,
  vat: vat as number,
  status: status as Expense["status"],
  method: method as string,
}));

export const payments: Payment[] = Array.from({ length: 20 }, (_, i) => {
  const st: Payment["status"][] = ["confirmado", "confirmado", "pendente", "confirmado", "falhado", "reembolsado"];
  return {
    id: `pay-${i + 1}`,
    reference: `PG-${(90210 + i * 13).toString()}`,
    client: clients[(i * 7) % clients.length].name,
    date: iso(-i),
    amount: 5000 + ((i * 61237) % 310000),
    method: methods[i % methods.length],
    status: st[i % st.length],
    document: `FT ${new Date().getFullYear()}/${(1042 + i).toString()}`,
  };
});

export const notifications: AppNotification[] = [
  { id: "n1", title: "Pagamento recebido", body: "João Comercial, Lda pagou 84 500 MZN via M-Pesa.", time: "há 4 min", kind: "pagamento", read: false },
  { id: "n2", title: "Factura vencida", body: "FT 2026/1048 venceu há 3 dias. Enviar lembrete?", time: "há 1 h", kind: "documento", read: false },
  { id: "n3", title: "Cotação aceite", body: "Hotel Cardoso aceitou COT 2026/321 (312 000 MZN).", time: "há 3 h", kind: "documento", read: false },
  { id: "n4", title: "Novo cliente", body: "Marisqueira Costa do Sol foi adicionada por Ana Sitoe.", time: "ontem", kind: "cliente", read: true },
  { id: "n5", title: "Stock baixo", body: "Toner HP 26A abaixo do mínimo (12 de 15).", time: "ontem", kind: "sistema", read: true },
  { id: "n6", title: "Backup concluído", body: "Cópia de segurança diária concluída com sucesso.", time: "há 2 dias", kind: "sistema", read: true },
];

export const revenueSeries = [
  { month: "Jan", receita: 420, despesa: 260 },
  { month: "Fev", receita: 510, despesa: 290 },
  { month: "Mar", receita: 480, despesa: 310 },
  { month: "Abr", receita: 620, despesa: 330 },
  { month: "Mai", receita: 710, despesa: 360 },
  { month: "Jun", receita: 680, despesa: 340 },
  { month: "Jul", receita: 820, despesa: 400 },
];

export const methodSplit = [
  { name: "M-Pesa", value: 46 },
  { name: "Transferência", value: 27 },
  { name: "e-Mola", value: 14 },
  { name: "Numerário", value: 8 },
  { name: "Cartão", value: 5 },
];
