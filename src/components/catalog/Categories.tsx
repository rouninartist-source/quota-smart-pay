import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { saveCompany, useCompany, type Company } from "@/lib/company-store";
import { updateProduct, updateService, useProducts, useServices } from "@/lib/catalog-store";
import { cn } from "@/lib/utils";

export type CategoryKind = "products" | "services";

/** Sugestões para um catálogo novo — depois a empresa gere a sua lista em Definições → Categorias. */
const DEFAULTS: Record<CategoryKind, string[]> = {
  products: ["Consumíveis", "Tecnologia", "Mobiliário", "Alimentar", "Vestuário", "Construção", "Outros"],
  services: ["Consultoria", "Tecnologia", "Manutenção", "Formação", "Design", "Transporte", "Outros"],
};

const sortPt = (xs: string[]) => [...xs].sort((a, b) => a.localeCompare(b, "pt"));

/** Lista gerida (ou, enquanto não houver, as sugestões + as categorias já usadas no catálogo). */
export function useCategories(kind: CategoryKind) {
  const company = useCompany();
  const products = useProducts();
  const services = useServices();
  const managed = company.categories?.[kind];
  if (managed) return managed;
  const used = (kind === "products" ? products : services).map((x) => x.category).filter(Boolean);
  return sortPt(Array.from(new Set([...DEFAULTS[kind], ...used])));
}

async function saveList(company: Company, kind: CategoryKind, list: string[]) {
  await saveCompany({
    categories: { ...company.categories, [kind]: sortPt(Array.from(new Set(list.map((s) => s.trim()).filter(Boolean)))) },
  });
}

/** Selector de categoria: escolhe-se da lista; «+ Nova categoria» acrescenta-a à lista da empresa. */
export function CategorySelect({
  kind,
  value,
  onChange,
  className,
}: {
  kind: CategoryKind;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const company = useCompany();
  const list = useCategories(kind);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  // Uma categoria antiga que já não está na lista continua visível no artigo que a usa.
  const options = value && !list.includes(value) ? [value, ...list] : list;

  async function add() {
    const v = name.trim();
    if (!v) return setAdding(false);
    if (!list.includes(v)) await saveList(company, kind, [...list, v]);
    onChange(v);
    setName("");
    setAdding(false);
  }

  if (adding)
    return (
      <div className="flex gap-1.5">
        <input
          className={cn(className, "min-w-0 flex-1")}
          value={name}
          autoFocus
          placeholder="Nova categoria"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
            if (e.key === "Escape") setAdding(false);
          }}
        />
        <button type="button" onClick={add} aria-label="Adicionar" className="shrink-0 rounded-md border border-border px-2 hover:bg-muted">
          <Check className="h-3.5 w-3.5" />
        </button>
      </div>
    );

  return (
    <select
      className={className}
      value={value}
      onChange={(e) => (e.target.value === "__nova" ? setAdding(true) : onChange(e.target.value))}
    >
      <option value="">{t("Sem categoria")}</option>
      {options.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
      <option value="__nova">+ Nova categoria…</option>
    </select>
  );
}

/** Gestor em Definições: acrescentar, renomear (os artigos acompanham) e remover. */
export function CategoryManager({ kind, inputClass }: { kind: CategoryKind; inputClass: string }) {
  const company = useCompany();
  const list = useCategories(kind);
  const products = useProducts();
  const services = useServices();
  const items = kind === "products" ? products : services;
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const countOf = (c: string) => items.filter((x) => x.category === c).length;

  async function add() {
    const v = newName.trim();
    if (!v) return;
    if (list.includes(v)) return toast.error("Essa categoria já existe.");
    await saveList(company, kind, [...list, v]);
    setNewName("");
  }

  async function rename(from: string) {
    const to = editName.trim();
    setEditing(null);
    if (!to || to === from) return;
    await saveList(company, kind, list.map((c) => (c === from ? to : c)));
    const affected = items.filter((x) => x.category === from);
    for (const x of affected) {
      if (kind === "products") await updateProduct(x.id, { category: to });
      else await updateService(x.id, { category: to });
    }
    toast.success("Categoria renomeada", { description: affected.length ? `${affected.length} artigo(s) actualizado(s)` : undefined });
  }

  async function remove(c: string) {
    const n = countOf(c);
    if (n && !window.confirm(`${n} artigo(s) usam «${c}». Ficam sem categoria. Continuar?`)) return;
    await saveList(company, kind, list.filter((x) => x !== c));
    for (const x of items.filter((x) => x.category === c)) {
      if (kind === "products") await updateProduct(x.id, { category: "" });
      else await updateService(x.id, { category: "" });
    }
  }

  return (
    <div className="grid gap-2">
      <ul className="divide-y divide-border/60 rounded-md border border-border/70">
        {list.length === 0 && <li className="px-3 py-2 text-[12px] text-muted-foreground">Sem categorias.</li>}
        {list.map((c) => (
          <li key={c} className="flex items-center gap-2 px-3 py-1.5 text-[12.5px]">
            {editing === c ? (
              <input
                className={cn(inputClass, "h-8 min-w-0 flex-1")}
                value={editName}
                autoFocus
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    rename(c);
                  }
                  if (e.key === "Escape") setEditing(null);
                }}
              />
            ) : (
              <span className="min-w-0 flex-1 truncate">
                {c} <span className="text-[11px] text-muted-foreground">· {countOf(c)}</span>
              </span>
            )}
            {editing === c ? (
              <>
                <button type="button" onClick={() => rename(c)} aria-label="Guardar" className="rounded p-1.5 hover:bg-muted"><Check className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setEditing(null)} aria-label="Cancelar" className="rounded p-1.5 hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => (setEditing(c), setEditName(c))} aria-label={`Renomear ${c}`} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => remove(c)} aria-label={`Remover ${c}`} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className={cn(inputClass, "min-w-0 flex-1")}
          value={newName}
          placeholder="Nova categoria"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" onClick={add} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-[12px] font-semibold hover:bg-muted">
          <Plus className="h-3.5 w-3.5" />Adicionar
        </button>
      </div>
    </div>
  );
}
