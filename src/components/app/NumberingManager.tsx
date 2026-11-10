import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { MoneyInput } from "@/components/app/MoneyInput";
import { cn } from "@/lib/utils";

type Kind = "cot" | "ft" | "pf" | "fr" | "rec";
type Row = { kind: Kind; next_number: number; used_max: number };

const SERIES: { kind: Kind; label: string; prefix: string; pad: number }[] = [
  { kind: "cot", label: "Cotações", prefix: "COT", pad: 3 },
  { kind: "ft", label: "Facturas", prefix: "FT", pad: 5 },
  { kind: "pf", label: "Pró-formas", prefix: "PF", pad: 3 },
  { kind: "fr", label: "VD / Factura-recibo", prefix: "FR", pad: 5 },
  { kind: "rec", label: "Recibos", prefix: "REC", pad: 3 },
];

const year = () => new Date().getFullYear();
const format = (prefix: string, pad: number, n: number) => `${prefix} ${year()}/${String(n).padStart(pad, "0")}`;

/**
 * Definições → Numeração: o próximo número de cada série. Serve a quem vem de
 * outro sistema e quer continuar a sua numeração (ex.: a próxima cotação é a
 * COT 2026/151). Nunca deixa repetir um número já usado este ano.
 */
export function NumberingManager({ inputClass }: { inputClass: string }) {
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Kind | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  async function load() {
    if (!supabase) return setLoading(false);
    const { data, error } = await supabase.rpc("document_counters");
    setLoading(false);
    if (error) {
      setUnavailable(true);
      return;
    }
    const map: Record<string, Row> = {};
    for (const r of (data ?? []) as Row[]) map[r.kind] = { ...r, next_number: Number(r.next_number), used_max: Number(r.used_max) };
    setRows(map);
    setDraft(Object.fromEntries(Object.values(map).map((r) => [r.kind, Math.max(r.next_number, r.used_max + 1)])));
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(kind: Kind) {
    if (!supabase) return;
    const next = Math.floor(draft[kind] ?? 0);
    setSaving(kind);
    const { error } = await supabase.rpc("set_document_counter", { p_kind: kind, p_next: next });
    setSaving(null);
    if (error) return toast.error("Não foi possível alterar a numeração", { description: error.message });
    const s = SERIES.find((x) => x.kind === kind)!;
    toast.success("Numeração actualizada", { description: `Próximo documento: ${format(s.prefix, s.pad, next)}` });
    void load();
  }

  if (loading) return <p className="inline-flex items-center gap-2 text-[12px] text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />A carregar…</p>;
  if (unavailable)
    return <p className="text-[12px] text-muted-foreground">A numeração personalizada ainda não está disponível nesta instalação (falta aplicar a actualização da base de dados).</p>;

  return (
    <ul className="divide-y divide-border/60 rounded-md border border-border/70">
      {SERIES.map((s) => {
        const row = rows[s.kind];
        const current = row ? Math.max(row.next_number, row.used_max + 1) : 1;
        const value = draft[s.kind] ?? current;
        const changed = value !== current;
        const tooLow = row ? value <= row.used_max : false;
        return (
          <li key={s.kind} className="grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold">{s.label}</p>
              <p className={cn("text-[11px] tabular-nums", tooLow ? "text-destructive" : "text-muted-foreground")}>
                {tooLow
                  ? `Já existe ${format(s.prefix, s.pad, row!.used_max)} — use um número maior.`
                  : `Próximo: ${format(s.prefix, s.pad, value || 1)}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] tabular-nums text-muted-foreground">{s.prefix} {year()}/</span>
              <MoneyInput
                decimals={0}
                aria-label={`Próximo número — ${s.label}`}
                className={cn(inputClass, "h-8 w-28 text-right")}
                value={value}
                onChange={(n) => setDraft((d) => ({ ...d, [s.kind]: n }))}
              />
              <button
                type="button"
                onClick={() => save(s.kind)}
                disabled={!changed || tooLow || value < 1 || saving !== null}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12px] font-semibold hover:bg-muted disabled:opacity-40"
              >
                {saving === s.kind ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Aplicar
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
