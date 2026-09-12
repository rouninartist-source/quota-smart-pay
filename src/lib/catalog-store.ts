/**
 * Catálogo — produtos e serviços vindos do Postgres.
 *
 * Substitui as listas estáticas de `mock-data.ts` nas páginas do Catálogo. Os
 * tipos mantêm-se compatíveis com o que as rotas já esperavam.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "./supabase";
import type { Product, Service } from "./mock-data";

function fail(action: string, error: { message: string; code?: string }) {
  console.error(`[catalog] ${action}:`, error.message);
  toast.error(`Não foi possível ${action}`, { description: error.message });
}

/* ---------------- produtos ---------------- */

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  unit: string;
  vat: number;
  active: boolean;
};

/** O estado deriva do stock, não de um campo à parte que possa divergir. */
function productStatus(r: ProductRow): Product["status"] {
  if (!r.active) return "descontinuado";
  return Number(r.stock) === 0 ? "esgotado" : "activo";
}

const toProduct = (r: ProductRow): Product => ({
  id: r.id,
  sku: r.sku,
  name: r.name,
  category: r.category,
  price: Number(r.price),
  cost: Number(r.cost),
  stock: Number(r.stock),
  minStock: Number(r.min_stock),
  unit: r.unit,
  vat: Number(r.vat),
  status: productStatus(r),
});

let products: Product[] = [];
let productsHydrated = false;
const productListeners = new Set<() => void>();

async function loadProducts() {
  const sb = supabase;
  if (!sb) return;
  const { data, error } = await sb
    .from("products")
    .select("id,sku,name,category,price,cost,stock,min_stock,unit,vat,active")
    .order("sku");
  if (error) {
    productsHydrated = false;
    return fail("carregar os produtos", error);
  }
  products = (data as ProductRow[]).map(toProduct);
  productListeners.forEach((l) => l());
}

export function useProducts(): Product[] {
  const [list, setList] = useState<Product[]>(products);
  useEffect(() => {
    const sync = () => setList(products);
    productListeners.add(sync);
    if (!productsHydrated) {
      productsHydrated = true;
      void loadProducts();
    }
    sync();
    return () => {
      productListeners.delete(sync);
    };
  }, []);
  return list;
}

/* ---------------- serviços ---------------- */

type ServiceRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  rate: number;
  billing: Service["billing"];
  duration: string;
  margin: number;
  active: boolean;
};

const toService = (r: ServiceRow): Service => ({
  id: r.id,
  code: r.code,
  name: r.name,
  category: r.category,
  rate: Number(r.rate),
  billing: r.billing,
  duration: r.duration,
  margin: Number(r.margin),
  status: r.active ? "activo" : "pausado",
});

let services: Service[] = [];
let servicesHydrated = false;
const serviceListeners = new Set<() => void>();

async function loadServices() {
  const sb = supabase;
  if (!sb) return;
  const { data, error } = await sb
    .from("services")
    .select("id,code,name,category,rate,billing,duration,margin,active")
    .order("code");
  if (error) {
    servicesHydrated = false;
    return fail("carregar os serviços", error);
  }
  services = (data as ServiceRow[]).map(toService);
  serviceListeners.forEach((l) => l());
}

export function useServices(): Service[] {
  const [list, setList] = useState<Service[]>(services);
  useEffect(() => {
    const sync = () => setList(services);
    serviceListeners.add(sync);
    if (!servicesHydrated) {
      servicesHydrated = true;
      void loadServices();
    }
    sync();
    return () => {
      serviceListeners.delete(sync);
    };
  }, []);
  return list;
}

/* ---------------- escrita ---------------- */

export type ProductInput = {
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  vat: number;
  active: boolean;
};

const productRow = (p: Partial<ProductInput>) => ({
  ...(p.sku !== undefined && { sku: p.sku.trim() }),
  ...(p.name !== undefined && { name: p.name.trim() }),
  ...(p.category !== undefined && { category: p.category.trim() }),
  ...(p.price !== undefined && { price: p.price }),
  ...(p.cost !== undefined && { cost: p.cost }),
  ...(p.stock !== undefined && { stock: p.stock }),
  ...(p.minStock !== undefined && { min_stock: p.minStock }),
  ...(p.unit !== undefined && { unit: p.unit.trim() || "un" }),
  ...(p.vat !== undefined && { vat: p.vat }),
  ...(p.active !== undefined && { active: p.active }),
});

/** Próximo SKU livre no padrão QT-001 — quem importa pode trazer os seus. */
export function nextSku() {
  const nums = products.map((p) => Number((p.sku.match(/(\d+)\s*$/) ?? [])[1])).filter((n) => Number.isFinite(n));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return `QT-${String(n).padStart(3, "0")}`;
}

export async function addProduct(input: ProductInput) {
  const sb = supabase;
  if (!sb) return false;
  const { error } = await sb.from("products").insert(productRow(input));
  if (error) {
    fail(error.code === "23505" ? `criar o produto — o SKU ${input.sku} já existe` : "criar o produto", error);
    return false;
  }
  await loadProducts();
  return true;
}

export async function updateProduct(id: string, patch: Partial<ProductInput>) {
  const sb = supabase;
  if (!sb) return false;
  const { error } = await sb.from("products").update(productRow(patch)).eq("id", id);
  if (error) {
    fail("guardar o produto", error);
    return false;
  }
  await loadProducts();
  return true;
}

export async function deleteProduct(id: string) {
  const sb = supabase;
  if (!sb) return false;
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) {
    fail("remover o produto", error);
    return false;
  }
  await loadProducts();
  return true;
}

/**
 * Importação em massa: o SKU decide se é criação ou actualização.
 * Devolve quantos entraram; os erros de linha vão para o toast.
 */
export async function importProducts(rows: ProductInput[]) {
  const sb = supabase;
  if (!sb) return 0;
  const bySku = new Map(products.map((p) => [p.sku.toLowerCase(), p.id]));
  const inserts: ReturnType<typeof productRow>[] = [];
  const updates: { id: string; row: ReturnType<typeof productRow> }[] = [];
  for (const r of rows) {
    const id = bySku.get(r.sku.trim().toLowerCase());
    if (id) updates.push({ id, row: productRow(r) });
    else inserts.push(productRow(r));
  }
  let ok = 0;
  if (inserts.length) {
    const { error } = await sb.from("products").insert(inserts);
    if (error) fail("importar produtos novos", error);
    else ok += inserts.length;
  }
  for (const u of updates) {
    const { error } = await sb.from("products").update(u.row).eq("id", u.id);
    if (error) fail(`actualizar o produto ${u.row.sku ?? ""}`, error);
    else ok += 1;
  }
  await loadProducts();
  return ok;
}

export type ServiceInput = {
  code: string;
  name: string;
  category: string;
  rate: number;
  billing: Service["billing"];
  duration: string;
  margin: number;
  active: boolean;
};

const serviceRow = (s: Partial<ServiceInput>) => ({
  ...(s.code !== undefined && { code: s.code.trim() }),
  ...(s.name !== undefined && { name: s.name.trim() }),
  ...(s.category !== undefined && { category: s.category.trim() }),
  ...(s.rate !== undefined && { rate: s.rate }),
  ...(s.billing !== undefined && { billing: s.billing }),
  ...(s.duration !== undefined && { duration: s.duration.trim() }),
  ...(s.margin !== undefined && { margin: s.margin }),
  ...(s.active !== undefined && { active: s.active }),
});

export function nextServiceCode() {
  const nums = services.map((s) => Number((s.code.match(/(\d+)\s*$/) ?? [])[1])).filter((n) => Number.isFinite(n));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return `SV-${String(n).padStart(2, "0")}`;
}

export async function addService(input: ServiceInput) {
  const sb = supabase;
  if (!sb) return false;
  const { error } = await sb.from("services").insert(serviceRow(input));
  if (error) {
    fail(error.code === "23505" ? `criar o serviço — o código ${input.code} já existe` : "criar o serviço", error);
    return false;
  }
  await loadServices();
  return true;
}

export async function updateService(id: string, patch: Partial<ServiceInput>) {
  const sb = supabase;
  if (!sb) return false;
  const { error } = await sb.from("services").update(serviceRow(patch)).eq("id", id);
  if (error) {
    fail("guardar o serviço", error);
    return false;
  }
  await loadServices();
  return true;
}

export async function deleteService(id: string) {
  const sb = supabase;
  if (!sb) return false;
  const { error } = await sb.from("services").delete().eq("id", id);
  if (error) {
    fail("remover o serviço", error);
    return false;
  }
  await loadServices();
  return true;
}
