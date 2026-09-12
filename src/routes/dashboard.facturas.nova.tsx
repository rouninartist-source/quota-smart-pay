import { createFileRoute, redirect } from "@tanstack/react-router";

/** Rota da versão antiga — reencaminha para a nova bancada, com o cliente. */
export const Route = createFileRoute("/dashboard/facturas/nova")({
  validateSearch: (search: Record<string, unknown>): { cliente?: string } =>
    typeof search.cliente === "string" ? { cliente: search.cliente } : {},
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/dashboard/documentos/novo", search: { tipo: "ft", cliente: search.cliente } });
  },
  component: () => null,
});
