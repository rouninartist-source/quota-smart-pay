/**
 * Passagem única das imagens antigas (data URLs nas tabelas e nos
 * user_metadata) para o Storage.
 *
 * Corre no browser, uma vez por sessão, com a sessão do próprio utilizador:
 * o RLS limita-a à empresa activa e à conta de quem entrou, por isso cada
 * empresa fica limpa quando alguém dela entra — sem chave de serviço.
 * Uma imagem que falhe fica como estava e volta a ser tentada na sessão seguinte.
 */
import { supabase } from "./supabase";
import { getCompany, hydrateCompany, saveCompany } from "./company-store";
import { isDataUrl, uploadImage, type MediaFolder } from "./media";

let started = false;

async function moveRows(table: "products" | "invoice_lines", folder: MediaFolder) {
  const sb = supabase!;
  const { data } = await sb.from(table).select("id,image_url").like("image_url", "data:%").limit(200);
  for (const row of (data ?? []) as { id: string; image_url: string }[]) {
    try {
      const url = await uploadImage(row.image_url, folder);
      await sb.from(table).update({ image_url: url }).eq("id", row.id);
    } catch (err) {
      console.warn(`[media] ${table} ${row.id}:`, (err as Error).message);
    }
  }
}

async function moveAvatar() {
  const sb = supabase!;
  const { data } = await sb.auth.getUser();
  const meta = (data.user?.user_metadata ?? {}) as { profile?: Record<string, unknown> };
  const avatar = meta.profile?.avatar as string | undefined;
  if (!isDataUrl(avatar)) return;
  const url = await uploadImage(avatar, "avatar");
  await sb.auth.updateUser({ data: { profile: { ...meta.profile, avatar: url } } });
}

async function moveLogo() {
  await hydrateCompany();
  const logo = getCompany().logo;
  if (!isDataUrl(logo)) return;
  await saveCompany({ logo: await uploadImage(logo, "logo") });
}

/** Chamar depois de haver sessão e empresa activa. */
export function migrateInlineImages() {
  if (started || !supabase || typeof window === "undefined") return;
  started = true;
  void (async () => {
    for (const step of [moveAvatar, moveLogo, () => moveRows("products", "products"), () => moveRows("invoice_lines", "lines")]) {
      try {
        await step();
      } catch (err) {
        console.warn("[media] migração:", (err as Error).message);
      }
    }
  })();
}
