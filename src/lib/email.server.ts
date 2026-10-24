/**
 * Envio de e-mail pela Resend — só no servidor (a chave não pode ir para o browser).
 *
 * Remetente: EMAIL_FROM (ex.: "Quota <noreply@quota.milsonuix.com>"). Não há
 * caixa de correio por trás do noreply; quem precisa de resposta vai no Reply-To.
 */

export type Email = { to: string; subject: string; html: string; text: string; replyTo?: string };

export async function sendEmail(mail: Email): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Quota <noreply@quota.milsonuix.com>";
  if (!key) return { ok: false, error: "RESEND_API_KEY não configurada" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !body.id) return { ok: false, error: body.message ?? `Resend ${res.status}` };
    return { ok: true, id: body.id };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Moldura dos e-mails do Quota — o mesmo aspecto dos modelos de autenticação (supabase/templates). */
export function emailLayout(o: { title: string; intro: string; cta?: { label: string; url: string }; note?: string; site: string }) {
  const cta = o.cta
    ? `<tr><td style="padding:20px 28px 8px;"><a href="${esc(o.cta.url)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;">${esc(o.cta.label)}</a></td></tr>`
    : "";
  const link = o.cta
    ? `<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;word-break:break-all;">Se o botão não abrir, copie esta ligação para o navegador:<br><a href="${esc(o.cta.url)}" style="color:#2563eb;">${esc(o.cta.url)}</a></p>`
    : "";
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e9f2;border-radius:14px;overflow:hidden;">
<tr><td style="background:#0b1220;padding:20px 28px;"><table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="width:30px;height:30px;background:#2563eb;border-radius:8px;text-align:center;color:#fff;font-weight:800;font-size:15px;line-height:30px;">Q</td>
<td style="padding-left:10px;color:#fff;font-weight:700;font-size:15px;letter-spacing:-.01em;">Quota</td></tr></table></td></tr>
<tr><td style="padding:32px 28px 8px;"><h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;letter-spacing:-.01em;">${esc(o.title)}</h1>
<p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">${o.intro}</p></td></tr>
${cta}
<tr><td style="padding:8px 28px 28px;">${o.note ? `<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#64748b;">${esc(o.note)}</p>` : ""}${link}</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e5e9f2;padding:14px 28px;font-size:11px;color:#94a3b8;">Quota · Cotações, facturas e recibos em Moçambique · <a href="${esc(o.site)}" style="color:#94a3b8;">${esc(o.site.replace(/^https?:\/\//, ""))}</a></td></tr>
</table></td></tr></table></body></html>`;
}

export { esc as escapeHtml };
