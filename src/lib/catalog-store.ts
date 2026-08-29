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

function fail(action: string, error: { message: string }) {
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
