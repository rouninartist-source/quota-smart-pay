import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileText, FileCheck2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/mock-data";
import { addProduct, deleteProduct, nextSku, updateProduct, useProducts, type ProductInput } from "@/lib/catalog-store";
import { Field, Modal, inputClass } from "./Modal";

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

export function ProductEditor({ product, onClose }: { product?: Product; onClose: () => void }) {
  const [d, setD] = useState<ProductInput>({
    sku: product?.sku ?? nextSku(),
    name: product?.name ?? "",
    category: product?.category ?? "",
    price: product?.price ?? 0,
    cost: product?.cost ?? 0,
    stock: product?.stock ?? 0,
    minStock: product?.minStock ?? 0,
    unit: product?.unit ?? "un",
    vat: product?.vat ?? 16,
    active: product ? product.status !== "descontinuado" : true,
  });
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [newCategory, setNewCategory] = useState(false);
  const navigate = useNavigate();
  const all = useProducts();
  const categories = Array.from(new Set(all.map((p) => p.category).filter(Boolean))).sort();
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setD((x) => ({ ...x, [k]: v }));
  const createDoc = (tipo: "cot" | "ft") => {
    onClose();
    navigate({ to: "/dashboard/documentos/novo", search: { tipo, item: `p:${product!.id}` } });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.name.trim()) return toast.error("Indique o nome do produto.");
    if (!d.sku.trim()) return toast.error("Indique o SKU.");
    setBusy(true);
    const ok = product ? await updateProduct(product.id, d) : await addProduct(d);
    setBusy(false);
    if (ok) {
      toast.success(product ? "Produto guardado" : "Produto criado", { description: `${d.sku} · ${d.name}` });
      onClose();
    }
  }
  async function remove() {
    if (!product) return;
    setBusy(true);
    if (await deleteProduct(product.id)) {
      toast.success("Produto removido", { description: product.name });
      onClose();
    }
    setBusy(false);
  }

  return (
    <Modal title={product ? "Editar produto" : "Novo produto"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <Field label="SKU"><input className={inputClass} value={d.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
          <Field label="Nome"><input className={inputClass} value={d.name} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria">
            {newCategory || categories.length === 0 ? (
              <input className={inputClass} value={d.category} onChange={(e) => set("category", e.target.value)} placeholder="Nova categoria" autoFocus={newCategory} />
            ) : (
              <select
                className={inputClass}
                value={d.category}
                onChange={(e) => (e.target.value === "__nova" ? (setNewCategory(true), set("category", "")) : set("category", e.target.value))}
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__nova">+ Nova categoria…</option>
              </select>
            )}
          </Field>
          <Field label="Unidade"><input className={inputClass} value={d.unit} onChange={(e) => set("unit", e.target.value)} placeholder="un, cx, kg" /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Preço (MZN)"><input className={inputClass} type="number" step="0.01" value={d.price} onChange={(e) => set("price", num(e.target.value))} /></Field>
          <Field label="Custo (MZN)"><input className={inputClass} type="number" step="0.01" value={d.cost} onChange={(e) => set("cost", num(e.target.value))} /></Field>
          <Field label="IVA %">
            <select className={inputClass} value={d.vat} onChange={(e) => set("vat", num(e.target.value))}>
              <option value={16}>16</option><option value={5}>5</option><option value={0}>0</option>
            </select>
          </Field>
        </div>
        <Field label="Estado">
          <select className={inputClass} value={d.active ? "1" : "0"} onChange={(e) => set("active", e.target.value === "1")}>
            <option value="1">Activo</option><option value="0">Descontinuado</option>
          </select>
        </Field>
        {product && (
          <div className="flex flex-wrap gap-2 rounded-md border border-border/70 bg-surface p-3">
            <span className="w-full text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Usar este produto</span>
            <button type="button" onClick={() => createDoc("cot")} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-semibold hover:bg-muted">
              <FileText className="h-3 w-3" /> Criar cotação
            </button>
            <button type="button" onClick={() => createDoc("ft")} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-semibold hover:bg-muted">
              <FileCheck2 className="h-3 w-3" /> Criar factura
            </button>
          </div>
        )}
        <div className="mt-1 flex items-center gap-2 border-t border-border/70 pt-3">
          {product && !confirm && (
            <button type="button" onClick={() => setConfirm(true)} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-2.5 py-1.5 text-[11.5px] font-semibold text-destructive hover:bg-destructive/8">
              <Trash2 className="h-3 w-3" /> Remover
            </button>
          )}
          {confirm && (
            <button type="button" onClick={remove} disabled={busy} className="rounded-md bg-destructive px-2.5 py-1.5 text-[11.5px] font-semibold text-destructive-foreground">
              Confirmar remoção
            </button>
          )}
          <button type="button" onClick={onClose} className="ml-auto rounded-md border border-border px-3 py-2 text-[12px] font-medium hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={busy} className="rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {busy ? "A guardar…" : product ? "Guardar" : "Criar produto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
