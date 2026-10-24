import { createFileRoute } from "@tanstack/react-router";
import { adminSupabase } from "@/lib/payzeno.server";
import { sendEmail } from "@/lib/email.server";
import { fmtDate, orgAdminEmails, reminderEmail, type ReminderKind } from "@/lib/plan-mail.server";
import { getPlan } from "@/lib/plans";

const DAY = 86_400_000;
const GRACE_DAYS = 5; // igual a GRACE_DAYS em src/lib/org-store.ts

/** Qual lembrete toca hoje a esta empresa (ou nenhum). */
function reminderFor(o: { trial_ends_at: string | null; paid_until: string | null }, now: number): { kind: ReminderKind; days: number; until: string } | null {
  if (o.trial_ends_at) {
    const days = Math.ceil((new Date(o.trial_ends_at).getTime() - now) / DAY);
    if (days === 3) return { kind: "trial-3", days, until: o.trial_ends_at };
    if (days === 1) return { kind: "trial-1", days, until: o.trial_ends_at };
    return null;
  }
  if (!o.paid_until) return null;
  const ms = new Date(o.paid_until).getTime() - now;
  if (ms > 0) {
    const days = Math.ceil(ms / DAY);
    if (days === 7) return { kind: "due-7", days, until: o.paid_until };
    if (days === 3) return { kind: "due-3", days, until: o.paid_until };
    if (days === 1) return { kind: "due-1", days, until: o.paid_until };
    return null;
  }
  const graceLeft = Math.ceil((ms + GRACE_DAYS * DAY) / DAY);
  if (graceLeft > 0) return { kind: "grace", days: graceLeft, until: o.paid_until }; // todos os dias da tolerância
  if (graceLeft === 0) return { kind: "expired", days: 0, until: o.paid_until }; // no dia em que bloqueia
  return null;
}

/**
 * Trabalho diário (pg_cron → aqui): lembretes de fim de trial, de fim de
 * período pago, e um por dia durante a tolerância. Protegido por CRON_SECRET.
 */
export const Route = createFileRoute("/api/cron/lembretes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET;
        if (!secret || request.headers.get("x-cron-secret") !== secret) return new Response("forbidden", { status: 403 });
        const admin = adminSupabase();
        if (!admin) return new Response("not configured", { status: 503 });

        const now = Date.now();
        const { data: orgs } = await admin.from("orgs").select("id,name,plan,trial_ends_at,paid_until").is("parent_org", null);
        let sent = 0;
        for (const o of orgs ?? []) {
          const r = reminderFor(o, now);
          if (!r) continue;
          // Um lembrete por empresa, tipo e dia — repetir o trabalho não duplica e-mails.
          const { error: dup } = await admin.from("plan_reminders").insert({ org_id: o.id, kind: r.kind });
          if (dup) continue;
          const mail = reminderEmail(r.kind, { org: o.name, plan: getPlan(o.plan).name, until: fmtDate(r.until), days: r.days });
          for (const to of await orgAdminEmails(admin, o.id)) {
            const res = await sendEmail({ to, ...mail });
            if (res.ok) sent++;
            else console.error("reminder failed", o.id, r.kind, res.error);
          }
        }
        return new Response(JSON.stringify({ ok: true, sent }), { headers: { "content-type": "application/json" } });
      },
    },
  },
});
