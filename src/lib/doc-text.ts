/**
 * Texto impresso nos documentos, no idioma dos documentos (Definições →
 * Documentos), que é independente do idioma da interface.
 */
import type { DocumentKind, PaymentMethod } from "./invoices-store";

export type DocLang = "pt" | "en";

const pt = {
  kinds: { ft: "Factura", cot: "Cotação", cotv: "Cotação visual", pf: "Factura pró-forma", fr: "VD/Factura-recibo" } as Record<DocumentKind, string>,
  receipt: "Recibo",
  issuedBy: "Emitido por",
  client: "Cliente",
  receivedFrom: "Recebido de",
  issueDate: "Emissão",
  dueDate: "Vencimento",
  validUntil: "Válida até",
  date: "Data",
  description: "Descrição",
  image: "Imagem",
  qty: "Qtd",
  price: "Preço",
  vat: "IVA",
  total: "Total",
  subtotal: "Subtotal",
  discount: "Desconto",
  inWords: "Valor por extenso",
  paymentDetails: "Dados de pagamento",
  account: "Conta",
  holder: "Titular",
  notes: "Observações",
  document: "Documento",
  documentValue: "Valor do documento",
  amountPaid: "Valor pago",
  paymentMethod: "Forma de pagamento",
  reference: "Referência",
  totalReceived: "Total recebido",
  verify: "Verificar",
  footer: "Documento emitido por sistema informático — Quota.",
  vatExempt: "IVA: isento.",
  vatSimplified: "IVA: regime simplificado.",
  receiptStatement: (client: string, amount: string, method: string, plural: boolean) =>
    `Declaramos que recebemos de ${client} a quantia de ${amount}, por ${method}, para pagamento ${plural ? "dos documentos" : "do documento"} abaixo.`,
  methods: { mpesa: "M-Pesa", emola: "e-Mola", transferencia: "Transferência bancária", numerario: "Numerário", cheque: "Cheque" } as Record<PaymentMethod, string>,
};

const en: typeof pt = {
  kinds: { ft: "Invoice", cot: "Quotation", cotv: "Visual quotation", pf: "Pro forma invoice", fr: "Invoice-receipt" },
  receipt: "Receipt",
  issuedBy: "Issued by",
  client: "Client",
  receivedFrom: "Received from",
  issueDate: "Issue date",
  dueDate: "Due date",
  validUntil: "Valid until",
  date: "Date",
  description: "Description",
  image: "Image",
  qty: "Qty",
  price: "Price",
  vat: "VAT",
  total: "Total",
  subtotal: "Subtotal",
  discount: "Discount",
  inWords: "Amount in words",
  paymentDetails: "Payment details",
  account: "Account",
  holder: "Account holder",
  notes: "Notes",
  document: "Document",
  documentValue: "Document value",
  amountPaid: "Amount paid",
  paymentMethod: "Payment method",
  reference: "Reference",
  totalReceived: "Total received",
  verify: "Verify",
  footer: "Document issued by computer system — Quota.",
  vatExempt: "VAT: exempt.",
  vatSimplified: "VAT: simplified regime.",
  receiptStatement: (client, amount, method, plural) =>
    `We hereby confirm receipt from ${client} of ${amount}, by ${method}, in payment of the ${plural ? "documents" : "document"} below.`,
  methods: { mpesa: "M-Pesa", emola: "e-Mola", transferencia: "Bank transfer", numerario: "Cash", cheque: "Cheque" },
};

export const docText = (lang: DocLang = "pt") => (lang === "en" ? en : pt);

/* ---------------- valor por extenso ---------------- */

const PT_UNITS = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "catorze", "quinze", "dezasseis", "dezassete", "dezoito", "dezanove"];
const PT_TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const PT_HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

/** 1–999 em português. */
function ptTriplet(n: number): string {
  if (n === 100) return "cem";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(PT_HUNDREDS[h]);
  if (rest) {
    if (rest < 20) parts.push(PT_UNITS[rest]);
    else {
      const t = Math.floor(rest / 10);
      const u = rest % 10;
      parts.push(u ? `${PT_TENS[t]} e ${PT_UNITS[u]}` : PT_TENS[t]);
    }
  }
  return parts.join(" e ");
}

/** Inteiro em português (pt-MZ): "mil e duzentos", "dois milhões trezentos mil e cinquenta". */
function ptInteger(n: number): string {
  if (n === 0) return "zero";
  const scales: [number, string, string][] = [
    [1e12, "bilião", "biliões"],
    [1e9, "mil milhões", "mil milhões"],
    [1e6, "milhão", "milhões"],
    [1e3, "mil", "mil"],
  ];
  const groups: { value: number; words: string }[] = [];
  let left = n;
  for (const [size, one, many] of scales) {
    const q = Math.floor(left / size);
    left %= size;
    if (!q) continue;
    if (size === 1e3) groups.push({ value: q * size, words: q === 1 ? "mil" : `${ptTriplet(q)} mil` });
    else if (size === 1e9) groups.push({ value: q * size, words: `${q === 1 ? "mil" : `${ptTriplet(q)} mil`} milhões` });
    else groups.push({ value: q * size, words: `${q === 1 ? "um" : ptTriplet(q)} ${q === 1 ? one : many}` });
  }
  if (left) groups.push({ value: left, words: ptTriplet(left) });
  // "e" antes do último grupo quando ele é menor que 100 ou centena redonda; espaço nos outros casos.
  return groups
    .map((g, i) => {
      if (i === 0) return g.words;
      const last = i === groups.length - 1;
      const joinE = last && (g.value < 100 || g.value % 100 === 0) && g.value < 1000;
      return `${joinE ? " e " : " "}${g.words}`;
    })
    .join("");
}

const EN_UNITS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function enTriplet(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${EN_UNITS[h]} hundred`);
  if (rest) {
    const words = rest < 20 ? EN_UNITS[rest] : `${EN_TENS[Math.floor(rest / 10)]}${rest % 10 ? `-${EN_UNITS[rest % 10]}` : ""}`;
    parts.push(h ? `and ${words}` : words);
  }
  return parts.join(" ");
}

function enInteger(n: number): string {
  if (n === 0) return "zero";
  const scales: [number, string][] = [[1e12, "trillion"], [1e9, "billion"], [1e6, "million"], [1e3, "thousand"]];
  const parts: string[] = [];
  let left = n;
  for (const [size, name] of scales) {
    const q = Math.floor(left / size);
    left %= size;
    if (q) parts.push(`${enTriplet(q)} ${name}`);
  }
  // "one thousand and fifty": "and" before a last group under 100.
  if (left) parts.push(parts.length && left < 100 ? `and ${enTriplet(left)}` : enTriplet(left));
  return parts.join(" ");
}

/**
 * Valor por extenso em meticais e centavos.
 * Ex.: 74 472,50 → "setenta e quatro mil quatrocentos e setenta e dois meticais e cinquenta centavos".
 */
export function amountInWords(value: number, lang: DocLang = "pt"): string {
  const cents = Math.round(Math.abs(value) * 100);
  const whole = Math.floor(cents / 100);
  const frac = cents % 100;
  if (lang === "en") {
    const main = `${enInteger(whole)} ${whole === 1 ? "metical" : "meticais"}`;
    return frac ? `${main} and ${enInteger(frac)} ${frac === 1 ? "centavo" : "centavos"}` : main;
  }
  const words = ptInteger(whole);
  // "um milhão de meticais", mas "um milhão e cem meticais".
  const de = whole >= 1e6 && whole % 1e6 === 0 ? " de" : "";
  const main = `${words}${de} ${whole === 1 ? "metical" : "meticais"}`;
  return frac ? `${main} e ${ptInteger(frac)} ${frac === 1 ? "centavo" : "centavos"}` : main;
}
