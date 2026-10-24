/**
 * E-mails do plano do Quota: confirmação de pagamento e lembretes de fim de
 * período. Só no servidor (usa a chave de serviço e a Resend).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { emailLayout, escapeHtml, sendEmail } from "./email.server";
import { getPlan } from "./plans";

const site = () => (process.env.VITE_SITE_URL ?? "https://quota.milsonuix.com").replace(/\/$/, "");
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Africa/Maputo" }).format(new Date(iso));
const fmtMt = (n: number) => new Intl.NumberFormat("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/** E-mails dos donos e administradores da empresa (quem gere o plano). */
export async function orgAdminEmails(admin: SupabaseClient, orgId: string) {
  const { data } = await admin.from("org_members").select("user_id,role").eq("org_id", orgId).in("role", ["owner", "admin"]);
  const emails: string[] = [];
  for (const m of data ?? []) {
    const { data: u } = await admin.auth.admin.getUserById(m.user_id as string);
    if (u?.user?.email) emails.push(u.user.email);
  }
  return [...new Set(emails)];
}

/**
 * Confirmação de pagamento do plano — envia uma só vez por pagamento
 * (o `receipt_emailed_at` é marcado antes de enviar, de forma condicional).
 */
export async function sendPlanPaymentConfirmation(admin: SupabaseClient, paymentId: string) {
  const { data: claimed } = await admin
    .from("plan_payments")
    .update({ receipt_emailed_at: new Date().toISOString() })
    .eq("id", paymentId)
    .eq("status", "confirmado")
    .is("receipt_emailed_at", null)
    .select("id,org_id,plan,months,amount,method,created_by,checkout_id,provider_ref,confirmed_at")
    .maybeSingle();
  if (!claimed) return; // já enviado, ou ainda não confirmado

  const { data: org } = await admin.from("orgs").select("name,paid_until").eq("id", claimed.org_id).maybeSingle();
  const plan = getPlan(claimed.plan);
  const recipients = new Set<string>(await orgAdminEmails(admin, claimed.org_id));
  const { data: payer } = await admin.auth.admin.getUserById(claimed.created_by as string);
  if (payer?.user?.email) recipients.add(payer.user.email);

  const until = org?.paid_until ? fmtDate(org.paid_until) : "—";
  const amount = `${fmtMt(Number(claimed.amount))} MZN`;
  const wallet = claimed.method === "emola" ? "e-Mola" : "M-Pesa";
  const ref = claimed.provider_ref || claimed.checkout_id || claimed.id;
  const rows = [
    ["Empresa", org?.name ?? "—"],
    ["Plano", `${plan.name} · ${claimed.months === 1 ? "1 mês" : `${claimed.months} meses`}`],
    ["Valor pago", `${amount} (${wallet})`],
    ["Activo até", until],
    ["Referência", String(ref)],
  ]
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">${k}</td><td style="padding:6px 0;text-align:right;font-weight:600;font-size:13px;">${escapeHtml(v)}</td></tr>`)
    .join("");

  for (const to of recipients) {
    await sendEmail({
      to,
      subject: `Pagamento confirmado · plano ${plan.name} activo até ${until}`,
      html: emailLayout({
        site: site(),
        title: "Pagamento confirmado",
        intro: `Recebemos o seu pagamento. O plano <strong>${escapeHtml(plan.name)}</strong> de <strong>${escapeHtml(org?.name ?? "")}</strong> está activo até <strong>${until}</strong>.<table role="presentation" width="100%" style="margin-top:16px;border-top:1px solid #e5e9f2;">${rows}</table>`,
        cta: { label: "Ver o plano", url: `${site()}/dashboard/planos` },
        note: "Guarde este e-mail como comprovativo do pagamento.",
      }),
      text: `Pagamento confirmado. Plano ${plan.name} (${org?.name ?? ""}) activo até ${until}. Valor: ${amount} (${wallet}). Referência: ${ref}.`,
    });
  }
}

export type ReminderKind = "trial-3" | "trial-1" | "due-7" | "due-3" | "due-1" | "grace" | "expired";

/** Texto de cada lembrete. `days` = dias até ao fim (ou de tolerância que restam). */
export function reminderEmail(kind: ReminderKind, o: { org: string; plan: string; until: string; days: number }) {
  const url = `${site()}/dashboard/planos`;
  const map: Record<ReminderKind, { subject: string; title: string; intro: string }> = {
    "trial-3": { subject: `O período experimental termina em 3 dias`, title: "O trial está a terminar", intro: `O período experimental de <strong>${escapeHtml(o.org)}</strong> termina a <strong>${o.until}</strong>. Escolha um plano para continuar a emitir documentos sem interrupção.` },
    "trial-1": { subject: `O período experimental termina amanhã`, title: "O trial termina amanhã", intro: `O período experimental de <strong>${escapeHtml(o.org)}</strong> termina amanhã (<strong>${o.until}</strong>). Escolha um plano hoje para não perder a emissão de documentos.` },
    "due-7": { subject: `O plano ${o.plan} termina em 7 dias`, title: "Renovação do plano", intro: `O plano <strong>${escapeHtml(o.plan)}</strong> de <strong>${escapeHtml(o.org)}</strong> está pago até <strong>${o.until}</strong>. Renove com antecedência por M-Pesa ou e-Mola.` },
    "due-3": { subject: `O plano ${o.plan} termina em 3 dias`, title: "O plano termina em 3 dias", intro: `O plano <strong>${escapeHtml(o.plan)}</strong> de <strong>${escapeHtml(o.org)}</strong> termina a <strong>${o.until}</strong>.` },
    "due-1": { subject: `O plano ${o.plan} termina amanhã`, title: "O plano termina amanhã", intro: `O plano <strong>${escapeHtml(o.plan)}</strong> de <strong>${escapeHtml(o.org)}</strong> termina amanhã (<strong>${o.until}</strong>).` },
    grace: { subject: `Plano terminado — ${o.days} dia${o.days === 1 ? "" : "s"} de tolerância`, title: "O plano terminou", intro: `O plano <strong>${escapeHtml(o.plan)}</strong> de <strong>${escapeHtml(o.org)}</strong> terminou a <strong>${o.until}</strong>. Pode continuar a emitir documentos durante mais <strong>${o.days} dia${o.days === 1 ? "" : "s"}</strong>; depois disso a emissão fica bloqueada até renovar.` },
    expired: { subject: `O plano ${o.plan} expirou`, title: "O plano expirou", intro: `O período de tolerância de <strong>${escapeHtml(o.org)}</strong> terminou e a emissão de documentos foi bloqueada. Os seus dados continuam guardados — renove para voltar a emitir.` },
  };
  const m = map[kind];
  return {
    subject: m.subject,
    html: emailLayout({ site: site(), title: m.title, intro: m.intro, cta: { label: kind.startsWith("trial") ? "Escolher plano" : "Renovar o plano", url } }),
    text: `${m.title}. ${m.intro.replace(/<[^>]+>/g, "")}\n${url}`,
  };
}

export { fmtDate };
