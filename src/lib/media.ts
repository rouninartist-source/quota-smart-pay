/**
 * Imagens no Supabase Storage (bucket `media`) — nunca na base de dados.
 *
 * A imagem é reduzida no browser, enviada para a pasta da empresa (ou do
 * utilizador, no caso da foto de perfil) e só o URL público volta para ser
 * gravado na tabela. Ver supabase/migrations/20261024100000_media_storage.sql.
 */
import { supabase } from "./supabase";
import { getOrg } from "./org-store";

export type MediaFolder = "logo" | "products" | "lines" | "avatar";

const BUCKET = "media";

/** Tamanho máximo (lado maior, em px) de cada tipo de imagem. */
const MAX: Record<MediaFolder, number> = { logo: 600, products: 480, lines: 480, avatar: 160 };

export const isDataUrl = (v?: string | null): v is string => !!v && v.startsWith("data:");

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Reduz para o tamanho certo. Os logotipos ficam em PNG (podem ter fundo
 * transparente); o resto em JPEG, que é muito mais leve para fotografias.
 */
async function shrink(source: File | string, folder: MediaFolder): Promise<{ blob: Blob; ext: string }> {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX[folder] / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const png = folder === "logo";
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, png ? "image/png" : "image/jpeg", 0.85));
    if (!blob) throw new Error("não foi possível processar a imagem");
    return { blob, ext: png ? "png" : "jpg" };
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(url);
  }
}

async function pathFor(folder: MediaFolder, ext: string) {
  const sb = supabase!;
  const id = crypto.randomUUID();
  if (folder === "avatar") {
    const { data } = await sb.auth.getUser();
    if (!data.user) throw new Error("sessão terminada — entre de novo");
    return `users/${data.user.id}/avatar/${id}.${ext}`;
  }
  const org = getOrg();
  if (!org) throw new Error("sem empresa activa");
  return `orgs/${org.id}/${folder}/${id}.${ext}`;
}

/**
 * Envia uma imagem (ficheiro escolhido, ou data URL antiga) e devolve o URL
 * público. Lança erro com uma mensagem legível se falhar.
 */
export async function uploadImage(source: File | string, folder: MediaFolder): Promise<string> {
  const sb = supabase;
  if (!sb) throw new Error("Supabase não configurado");
  const { blob, ext } = await shrink(source, folder);
  const path = await pathFor(folder, ext);
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Apaga uma imagem do bucket, se for nossa. Silencioso: um ficheiro órfão não pode impedir a gravação. */
export async function removeImage(url?: string | null) {
  const sb = supabase;
  if (!sb || !url) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;
  await sb.storage.from(BUCKET).remove([decodeURIComponent(url.slice(i + marker.length).split("?")[0])]).catch(() => undefined);
}
