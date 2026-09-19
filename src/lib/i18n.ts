/**
 * Idioma da interface. O português é a fonte: `t("Guardar")` devolve a
 * tradução em inglês quando o idioma é EN, ou o próprio texto em PT.
 * A escolha vem das preferências do perfil e fica também neste dispositivo
 * (para as páginas antes do início de sessão).
 */
import { useEffect, useState } from "react";
import { en } from "./i18n.en";

export type Lang = "pt" | "en";
const KEY = "quota-lang";

let lang: Lang = "pt";
const listeners = new Set<() => void>();

export function readLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    return v === "en" ? "en" : "pt";
  } catch {
    return "pt";
  }
}
if (typeof window !== "undefined") lang = readLang();

export function getLang() {
  return lang;
}

export function setLang(next: Lang) {
  lang = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {}
  if (typeof document !== "undefined") document.documentElement.lang = next === "en" ? "en" : "pt-MZ";
  listeners.forEach((l) => l());
}

/** Locale do perfil ("pt-MZ", "pt-PT", "en") → idioma da interface. */
export const langFromLocale = (locale?: string): Lang => (locale?.startsWith("en") ? "en" : "pt");

export function t(text: string, vars?: Record<string, string | number>): string {
  let out = lang === "en" ? (en[text] ?? text) : text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
  return out;
}

/** Re-renderiza quando o idioma muda. */
export function useT() {
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick((n) => n + 1);
    listeners.add(l);
    // o servidor não sabe o idioma: alinha ao montar
    if (lang !== readLang()) setLang(readLang());
    return () => {
      listeners.delete(l);
    };
  }, []);
  return t;
}

export function useLang(): Lang {
  const [value, setValue] = useState<Lang>(lang);
  useEffect(() => {
    const l = () => setValue(lang);
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return value;
}
