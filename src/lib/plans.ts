/** Planos comerciais — os mesmos da página de preços. */
export type PlanId = "basic" | "smart" | "multi";

export type Plan = {
  id: PlanId;
  name: string;
  monthly: number;
  tagline: string;
  maxOrgs: number;
  users: string;
  ai: boolean;
};

export const plans: Plan[] = [
  { id: "basic", name: "Basic", monthly: 600, tagline: "Para quem começa a facturar", maxOrgs: 1, users: "2 ou 3 utilizadores", ai: false },
  { id: "smart", name: "Smart", monthly: 900, tagline: "Para PMEs em crescimento", maxOrgs: 1, users: "3 utilizadores", ai: true },
  { id: "multi", name: "Multi-Empresas", monthly: 1500, tagline: "Para grupos com várias empresas", maxOrgs: 3, users: "5 utilizadores", ai: true },
];

export const getPlan = (id?: string) => plans.find((p) => p.id === id) ?? plans[0];

/** Utilizadores por empresa em cada plano. */
export const planUserLimit = (id?: string) => (id === "multi" ? 5 : 3);

export const TRIAL_DAYS = 14;
export const TRIAL_AI_LIMIT = 3;
