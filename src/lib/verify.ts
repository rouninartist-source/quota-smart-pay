/**
 * Verificação pública de documentos (código QR no rodapé).
 *
 * O QR leva a /verificar/<código>?o=<empresa>&n=<número>. A página pede a
 * /api/verificar, que confirma no servidor que aquele número existe naquela
 * empresa e que o código bate certo — sem precisar de sessão.
 */

/** Código curto determinístico a partir do número do documento. */
export function verificationCode(reference: string) {
  let hash = 0;
  for (let i = 0; i < reference.length; i++) hash = (hash * 31 + reference.charCodeAt(i)) % 1_000_000_007;
  return `QT-${hash.toString(36).toUpperCase().padStart(6, "0").slice(0, 6)}`;
}

const site = () =>
  ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://quota.milsonuix.com").replace(/\/$/, "");

export function verificationUrl(reference: string, orgId?: string) {
  const params = new URLSearchParams({ n: reference });
  if (orgId) params.set("o", orgId);
  return `${site()}/verificar/${verificationCode(reference)}?${params.toString()}`;
}
