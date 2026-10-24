import { createFileRoute } from "@tanstack/react-router";
import { adminSupabase } from "@/lib/payzeno.server";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const ROLE: Record<string, string> = { admin: "administrador(a)", membro: "membro" };

/**
 * Envia (ou reenvia) por e-mail o convite para uma empresa.
 * Só o dono ou um administrador da empresa do convite o pode fazer.
 */
export const Route = createFileRoute("/api/convites/enviar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = adminSupabase();
        if (!admin) return json({ error: "not_configured" }, 503);

        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const { data: auth } = token ? await admin.auth.getUser(token) : { data: null };
        const user = auth?.user;
        if (!user) return json({ error: "not_signed_in" }, 401);

        const body = (await request.json().catch(() => ({}))) as { token?: string };
        const { data: inv } = await admin
          .from("org_invites")
          .select("email,role,token,org_id,accepted_at,orgs(name)")
          .eq("token", body.token ?? "")
          .maybeSingle();
        if (!inv) return json({ error: "not_found" }, 404);
        if (inv.accepted_at) return json({ error: "already_accepted" }, 400);

        const { data: member } = await admin
          .from("org_members")
          .select("role")
          .eq("org_id", inv.org_id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!member || !["owner", "admin"].includes(member.role)) return json({ error: "not_admin" }, 403);

        const site = (process.env.VITE_SITE_URL ?? "https://quota.milsonuix.com").replace(/\/$/, "");
        const url = `${site}/convite/${inv.token}`;
        const orgName = (inv.orgs as unknown as { name: string } | null)?.name ?? "a empresa";
        const meta = (user.user_metadata ?? {}) as { full_name?: string; profile?: { firstName?: string; lastName?: string } };
        const inviter =
          [meta.profile?.firstName, meta.profile?.lastName].filter(Boolean).join(" ") || meta.full_name || user.email || "Um colega";
        const role = ROLE[inv.role] ?? "membro";

        const result = await sendEmail({
          to: inv.email,
          replyTo: user.email ?? undefined,
          subject: `${inviter} convidou-o(a) para ${orgName} no Quota`,
          html: emailLayout({
            site,
            title: `Convite para ${orgName}`,
            intro: `<strong>${escapeHtml(inviter)}</strong> convidou-o(a) para a empresa <strong>${escapeHtml(orgName)}</strong> no Quota, como ${role}. Aceite o convite, crie a sua palavra-passe (ou entre com a conta que já tem) e fica logo com acesso.`,
            cta: { label: "Aceitar convite", url },
            note: "Se não esperava este convite, ignore este e-mail. Para responder, basta responder a esta mensagem.",
          }),
          text: `${inviter} convidou-o(a) para ${orgName} no Quota, como ${role}.\n\nAceite o convite: ${url}\n\nSe não esperava este convite, ignore este e-mail.`,
        });
        if (!result.ok) {
          console.error("invite email failed", result.error);
          return json({ error: "send_failed", detail: result.error }, 502);
        }
        return json({ ok: true, to: inv.email });
      },
    },
  },
});
