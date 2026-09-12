import { createFileRoute, redirect } from "@tanstack/react-router";

/** Rota da versão antiga — reencaminha para a lista nova, já filtrada. */
export const Route = createFileRoute("/dashboard/facturacao")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/documentos", search: { tipo: "factura" } });
  },
  component: () => null,
});
