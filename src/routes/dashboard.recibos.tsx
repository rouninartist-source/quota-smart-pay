import { createFileRoute, redirect } from "@tanstack/react-router";

/** Rota da versão antiga — reencaminha para a lista nova, já filtrada. */
export const Route = createFileRoute("/dashboard/recibos")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/documentos", search: { tipo: "recibo" } });
  },
  component: () => null,
});
