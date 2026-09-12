import { createFileRoute, redirect } from "@tanstack/react-router";

/** Rota da versão antiga — reencaminha para a nova. */
export const Route = createFileRoute("/dashboard/facturas/")({
  beforeLoad: () => {
    throw redirect(({ to: "/dashboard/documentos", search: { tipo: "factura" } }));
  },
  component: () => null,
});
