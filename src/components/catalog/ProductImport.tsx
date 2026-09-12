import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { importProducts, type ProductInput } from "@/lib/catalog-store";
import { Modal } from "./Modal";

/** Lê CSV com ; ou , e aspas simples; devolve linhas como objectos pelo cabeçalho. */
function parseCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g) ?? []).length >= (firstLine.match(/,/g) ?? []).length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (q) {
      if (ch === '"' && clean[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  if (!header) return [];
  const keys = header.map((h) => h.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_"));
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const pick = (r: Record<string, string>, ...names: string[]) => {
  for (const n of names) if (r[n] !== undefined && r[n] !== "") return r[n];
  return "";
};
const num = (v: string) => Number(v.replace(/\s/g, "").replace(",", ".")) || 0;

function toInput(r: Record<string, string>): ProductInput | null {
  const name = pick(r, "nome", "name", "produto", "designacao");
  const sku = pick(r, "sku", "codigo", "code", "ref", "referencia");
  if (!name || !sku) return null;
  return {
    sku,
    name,
    category: pick(r, "categoria", "category"),
    price: num(pick(r, "preco", "price", "pvp", "preco_mzn")),
    cost: num(pick(r, "custo", "cost")),
    stock: num(pick(r, "stock", "quantidade", "qty")),
    minStock: num(pick(r, "stock_minimo", "min_stock", "minimo")),
    unit: pick(r, "unidade", "unit") || "un",
    vat: r.iva !== undefined || r.vat !== undefined ? num(pick(r, "iva", "vat")) : 16,
    active: !/^(0|nao|não|false|inactivo|descontinuado)$/i.test(pick(r, "activo", "active", "estado")),
  };
}

export function ProductImport({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ProductInput[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [busy, setBusy] = useState(false);

  async function onFile(f: File) {
    const parsed = parseCsv(await f.text());
    const inputs = parsed.map(toInput);
    setRows(inputs.filter((x): x is ProductInput => !!x));
    setSkipped(inputs.filter((x) => !x).length);
  }
  async function run() {
    setBusy(true);
    const n = await importProducts(rows);
    setBusy(false);
    if (n) toast.success(`${n} produto${n === 1 ? "" : "s"} importado${n === 1 ? "" : "s"}`);
    onClose();
  }
  const template = "sku;nome;categoria;preco;custo;unidade;iva\nQT-101;Papel A4 80g (resma);Consumíveis;480;320;un;16\n";

  return (
    <Modal title="Importar produtos (CSV)" onClose={onClose} wide>
      <div className="grid gap-3">
        <p className="text-[12px] text-muted-foreground">
          Colunas reconhecidas: <code className="rounded bg-muted px-1">sku</code> <code className="rounded bg-muted px-1">nome</code>{" "}
          <code className="rounded bg-muted px-1">categoria</code> <code className="rounded bg-muted px-1">preco</code>{" "}
          <code className="rounded bg-muted px-1">custo</code> <code className="rounded bg-muted px-1">unidade</code>{" "}
          <code className="rounded bg-muted px-1">iva</code>. Separador ; ou ,. Um SKU já existente é actualizado.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium hover:bg-muted">
            <Upload className="h-3.5 w-3.5" /> Escolher ficheiro
          </button>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent("﻿" + template)}`}
            download="modelo-produtos.csv"
            className="text-[11.5px] font-medium text-primary hover:underline"
          >
            Descarregar modelo
          </a>
        </div>
        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-border/70">
            <table className="w-full text-[11.5px]">
              <thead className="bg-surface text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
                <tr><th className="px-2 py-1.5 text-left">SKU</th><th className="px-2 py-1.5 text-left">Nome</th><th className="px-2 py-1.5 text-left">Categoria</th><th className="px-2 py-1.5 text-right">Preço</th><th className="px-2 py-1.5 text-left">Unidade</th></tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="px-2 py-1.5 tabular-nums">{r.sku}</td><td className="px-2 py-1.5">{r.name}</td><td className="px-2 py-1.5">{r.category}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{r.price}</td><td className="px-2 py-1.5">{r.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && <p className="px-2 py-1.5 text-[10.5px] text-muted-foreground">… e mais {rows.length - 50}.</p>}
          </div>
        )}
        {skipped > 0 && <p className="text-[11.5px] text-warning-foreground dark:text-warning">{skipped} linha{skipped === 1 ? "" : "s"} sem SKU ou nome — ignorada{skipped === 1 ? "" : "s"}.</p>}
        <div className="flex items-center gap-2 border-t border-border/70 pt-3">
          <button type="button" onClick={onClose} className="ml-auto rounded-md border border-border px-3 py-2 text-[12px] font-medium hover:bg-muted">Cancelar</button>
          <button type="button" onClick={run} disabled={busy || rows.length === 0} className="rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {busy ? "A importar…" : `Importar ${rows.length || ""}`.trim()}
          </button>
        </div>
      </div>
    </Modal>
  );
}
