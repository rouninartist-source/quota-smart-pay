import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Campo de valor com separadores automáticos (estilo moçambicano):
 * escreve-se 1500000 e aparece «1 500 000»; «,» ou «.» começa os centavos
 * («1 500,50»). O utilizador nunca escreve os separadores de milhares.
 */

const GROUP = " "; // espaço fino sem quebra, como no pt-MZ

/** Texto escrito → texto formatado (milhares agrupados, vírgula decimal). */
export function formatAmountText(raw: string, decimals = 2) {
  let s = raw.replace(/[^\d.,]/g, "");
  // Valor colado com separadores ("1.500.000", "1.500,00", "1,500.00"): com os dois tipos, o último é
  // o decimal; o mesmo separador repetido é de milhares. Um só separador (a escrever) começa os centavos.
  const dots = (s.match(/\./g) ?? []).length;
  const commas = (s.match(/,/g) ?? []).length;
  if (dots && commas) {
    const last = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));
    s = s.slice(0, last).replace(/[.,]/g, "") + "," + s.slice(last + 1);
  } else if (dots > 1) {
    s = s.replace(/\./g, ""); // "1.500.000": pontos de milhares
  }
  // Uma vírgula a mais (escrita depois dos centavos) é ignorada: fica a primeira.
  const sep = s.search(/[.,]/);
  let int = sep === -1 ? s : s.slice(0, sep);
  let dec = sep === -1 ? null : s.slice(sep + 1).replace(/[.,]/g, "").slice(0, decimals);
  int = int.replace(/^0+(?=\d)/, "");
  if (int === "" && dec !== null) int = "0";
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP);
  return decimals > 0 && dec !== null ? `${grouped},${dec}` : grouped;
}

/** Texto formatado → número (0 quando vazio). */
export function parseAmount(text: string) {
  const n = Number(text.replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** Número → texto para mostrar no campo (sem zeros decimais inúteis). */
export function amountToText(n: number | null | undefined, decimals = 2) {
  if (n === null || n === undefined || !Number.isFinite(n) || n === 0) return "";
  const fixed = n.toFixed(decimals).replace(/\.?0+$/, "");
  return formatAmountText(fixed.replace(".", ","), decimals);
}

/** Quantos dígitos (e vírgula) há antes da posição — para repor o cursor depois de formatar. */
const significantBefore = (s: string, pos: number) => s.slice(0, pos).replace(/[^\d,]/g, "").length;
function positionAfter(s: string, count: number) {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < s.length; i++) {
    if (/[\d,]/.test(s[i])) seen++;
    if (seen === count) return i + 1;
  }
  return s.length;
}

export function MoneyInput({
  value,
  onChange,
  decimals = 2,
  className,
  placeholder,
  autoFocus,
  id,
  "aria-label": ariaLabel,
}: {
  value: number | null | undefined;
  onChange: (n: number) => void;
  /** Casas decimais aceites (2 para valores, 3 para quantidades, 0 para inteiros). */
  decimals?: number;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => amountToText(value, decimals));
  const caret = useRef<number | null>(null);

  // O valor muda por fora (rascunho carregado, artigo do catálogo): mostra-o, sem estragar o que se está a escrever.
  useEffect(() => {
    if (parseAmount(text) !== (value ?? 0)) setText(amountToText(value, decimals));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals]);

  useLayoutEffect(() => {
    if (caret.current !== null && ref.current && document.activeElement === ref.current) {
      ref.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [text]);

  return (
    <input
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      value={text}
      className={cn("tabular-nums", className)}
      onChange={(e) => {
        const raw = e.target.value;
        const before = significantBefore(raw.replace(".", ","), e.target.selectionStart ?? raw.length);
        const next = formatAmountText(raw, decimals);
        caret.current = positionAfter(next, before);
        setText(next);
        onChange(parseAmount(next));
      }}
    />
  );
}
