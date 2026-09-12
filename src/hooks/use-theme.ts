import { useEffect, useState } from "react";

/**
 * Aparência: "system" segue o sistema; "dark" é o escuro de contraste alto;
 * "dim" é o escuro suave (cinza, menos saturado). Guardado por dispositivo.
 */
export type ThemeMode = "system" | "light" | "dark" | "dim";
export const themeModes: { id: ThemeMode; label: string; hint: string }[] = [
  { id: "system", label: "Sistema", hint: "Segue o modo do dispositivo" },
  { id: "light", label: "Claro", hint: "Fundo branco" },
  { id: "dark", label: "Escuro", hint: "Azul-escuro, contraste alto" },
  { id: "dim", label: "Escuro suave", hint: "Cinza, menos brilho" },
];

const KEY = "quota-theme";

export function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" || v === "dim" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

export function applyMode(mode: ThemeMode) {
  const systemDark = typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || mode === "dim" || (mode === "system" && systemDark);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.classList.toggle("dim", mode === "dim");
  root.style.colorScheme = dark ? "dark" : "light";
}

/** Corre antes da pintura (inline no <head>) para não piscar. */
export const themeBootScript = `(function(){try{var m=localStorage.getItem(${JSON.stringify(KEY)});if(m!=="light"&&m!=="dark"&&m!=="dim")m="system";var d=m==="dark"||m==="dim"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.classList.toggle("dim",m==="dim");r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const m = readMode();
    setModeState(m);
    applyMode(m);
    setDark(document.documentElement.classList.contains("dark"));
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readMode() === "system") {
        applyMode("system");
        setDark(document.documentElement.classList.contains("dark"));
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    applyMode(next);
    setDark(document.documentElement.classList.contains("dark"));
  };

  /** Atalho da barra: alterna claro/escuro (mantém "suave" se era o escolhido). */
  const toggle = () => setMode(dark ? "light" : mode === "dim" ? "dim" : "dark");

  return { mode, setMode, theme: (dark ? "dark" : "light") as "dark" | "light", toggle };
}
