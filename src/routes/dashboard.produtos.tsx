import { createFileRoute } from "@tanstack/react-router";
import { Package, Tag, Layers, ImagePlus, Boxes } from "lucide-react";
import { PageShell } from "@/components/dashboard/PageShell";

export const Route = createFileRoute("/dashboard/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos · Quota Studio" },
      { name: "description", content: "Catálogo de produtos e serviços com preços, stock, fotos e categorias." },
      { property: "og:title", content: "Produtos · Quota Studio" },
      { property: "og:description", content: "Catálogo digital para facturação e cotações visuais." },
    ],
  }),
  component: Produtos,
});

function Produtos() {
  return (
    <PageShell
      eyebrow="Catálogo"
      title="Produtos & Serviços"
      description="Construa o seu catálogo digital para facturação e cotações visuais."
      Icon={Package}
      actions={[{ label: "Importar CSV" }, { label: "Novo produto", primary: true }]}
      metrics={[
        { label: "Produtos", value: "184" },
        { label: "Serviços", value: "24" },
        { label: "Stock baixo", value: "7", hint: "Reabastecer" },
        { label: "Categorias", value: "12" },
      ]}
      features={[
        { title: "Preços flexíveis", desc: "Preço base, preço por cliente e descontos por volume.", icon: Tag },
        { title: "Gestão de stock", desc: "Entradas, saídas e alertas de stock mínimo.", icon: Boxes },
        { title: "Fotos e variantes", desc: "Cores, tamanhos e imagens para cotações visuais.", icon: ImagePlus },
        { title: "Categorias", desc: "Organize por família, marca ou departamento.", icon: Layers },
      ]}
    />
  );
}
