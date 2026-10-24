/**
 * Planos comerciais — fonte única para a página de preços, a página de planos
 * da app, a tabela de comparação e os limites (utilizadores, IA, e-mails).
 *
 * Os limites de utilizadores e de IA são também aplicados no Postgres
 * (plan_user_limit, use_ai_credit) — se mudar aqui, mude lá também.
 */
export type PlanId = "basic" | "smart" | "multi";

export type Plan = {
  id: PlanId;
  name: string;
  monthly: number;
  tagline: string;
  maxOrgs: number;
  /** Utilizadores por empresa. */
  maxUsers: number;
  /** Operações de Quota AI por mês (o trial tem TRIAL_AI_LIMIT no total). */
  aiPerMonth: number;
  /** Documentos enviados por e-mail a partir do Quota, por mês. */
  emailsPerMonth: number;
  /** Lembretes automáticos de facturas vencidas, moeda estrangeira, chat da equipa. */
  overdueReminders: boolean;
  multiCurrency: boolean;
  teamChat: boolean;
  support: string;
  highlights: string[];
  popular?: boolean;
  /** @deprecated use maxUsers */
  users: string;
  /** @deprecated use aiPerMonth */
  ai: boolean;
};

export const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    monthly: 600,
    tagline: "Para quem começa a facturar",
    maxOrgs: 1,
    maxUsers: 2,
    aiPerMonth: 20,
    emailsPerMonth: 100,
    overdueReminders: false,
    multiCurrency: false,
    teamChat: false,
    support: "E-mail (48 h)",
    highlights: ["Documentos ilimitados", "QR de verificação e 3 layouts", "100 envios por e-mail / mês", "Cobrança por WhatsApp", "20 operações de Quota AI / mês"],
    users: "2 utilizadores",
    ai: true,
  },
  {
    id: "smart",
    name: "Smart",
    monthly: 900,
    tagline: "Para PMEs em crescimento",
    maxOrgs: 1,
    maxUsers: 5,
    aiPerMonth: 300,
    emailsPerMonth: 500,
    overdueReminders: true,
    multiCurrency: true,
    teamChat: true,
    support: "WhatsApp (24 h)",
    highlights: ["Tudo do Basic", "500 envios por e-mail / mês", "Lembretes automáticos de facturas vencidas", "Facturação em USD, EUR, ZAR", "300 operações de Quota AI / mês", "Chat da equipa"],
    popular: true,
    users: "5 utilizadores",
    ai: true,
  },
  {
    id: "multi",
    name: "Multi-Empresas",
    monthly: 1500,
    tagline: "Para grupos com várias empresas",
    maxOrgs: 3,
    maxUsers: 10,
    aiPerMonth: 1000,
    emailsPerMonth: 2000,
    overdueReminders: true,
    multiCurrency: true,
    teamChat: true,
    support: "WhatsApp prioritário + configuração inicial",
    highlights: ["Tudo do Smart", "3 empresas numa só conta", "2 000 envios por e-mail / mês", "1 000 operações de Quota AI / mês", "Relatórios consolidados"],
    users: "10 utilizadores",
    ai: true,
  },
];

export const getPlan = (id?: string) => plans.find((p) => p.id === id) ?? plans[0];

/** Utilizadores por empresa em cada plano (igual a public.plan_user_limit). */
export const planUserLimit = (id?: string) => getPlan(id).maxUsers;

export const TRIAL_DAYS = 14;
export const TRIAL_AI_LIMIT = 3;

/** Ciclos de pagamento — os mesmos da página de pagamento (desconto só no anual). */
export const billingCycles = [
  { months: 1 as const, label: "Mensal", discount: 0 },
  { months: 3 as const, label: "Trimestral", discount: 0 },
  { months: 12 as const, label: "Anual", discount: 0.1 },
];

export const cyclePrice = (plan: Plan, months: number) =>
  Math.round(plan.monthly * months * (1 - (billingCycles.find((c) => c.months === months)?.discount ?? 0)));

/** Valor de uma célula na tabela: ✓, —, ou texto/número. */
export type Cell = boolean | string;

/**
 * Tabela de comparação, por grupos. Colunas: Basic, Smart, Multi-Empresas, Empresarial.
 */
export const comparison: { group: string; rows: { label: string; hint?: string; values: [Cell, Cell, Cell, Cell] }[] }[] = [
  {
    group: "Documentos",
    rows: [
      { label: "Facturas, cotações, VD, pró-formas e recibos", values: ["Ilimitados", "Ilimitados", "Ilimitados", "Ilimitados"] },
      { label: "Recibos de várias facturas", values: [true, true, true, true] },
      { label: "QR de verificação pública", values: [true, true, true, true] },
      { label: "Valor por extenso, PT/EN", values: [true, true, true, true] },
      { label: "Layouts", values: ["3", "3", "3", "3 + personalizado"] },
      { label: "Facturação em moeda estrangeira", hint: "USD, EUR, ZAR com câmbio no documento", values: [false, true, true, true] },
    ],
  },
  {
    group: "Equipa e empresas",
    rows: [
      { label: "Empresas", values: ["1", "1", "3", "À medida"] },
      { label: "Utilizadores por empresa", values: ["2", "5", "10", "À medida"] },
      { label: "Papéis (dono, administrador, membro)", values: [true, true, true, true] },
      { label: "Chat da equipa", values: [false, true, true, true] },
    ],
  },
  {
    group: "Cobranças",
    rows: [
      { label: "Envio de documentos por e-mail", values: ["100 / mês", "500 / mês", "2 000 / mês", "À medida"] },
      { label: "Cobrança por WhatsApp", values: [true, true, true, true] },
      { label: "Lembretes automáticos de facturas vencidas", values: [false, true, true, true] },
      { label: "Dados bancários, M-Pesa e e-Mola no documento", values: [true, true, true, true] },
    ],
  },
  {
    group: "Quota AI e relatórios",
    rows: [
      { label: "Operações de Quota AI", values: ["20 / mês", "300 / mês", "1 000 / mês", "À medida"] },
      { label: "Exportação CSV", values: [true, true, true, true] },
      { label: "Relatórios", values: ["Básicos", "Completos", "Consolidados", "Integrações e API"] },
    ],
  },
  {
    group: "Suporte",
    rows: [
      { label: "Canal de suporte", values: ["E-mail (48 h)", "WhatsApp (24 h)", "WhatsApp prioritário", "Gestor dedicado"] },
      { label: "Configuração inicial acompanhada", values: [false, false, true, true] },
    ],
  },
];
