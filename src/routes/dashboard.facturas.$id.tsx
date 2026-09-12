import { createFileRoute, redirect } from "@tanstack/react-router";

/** Rota da versão antiga — reencaminha para a página nova do documento. */
export const Route = createFileRoute("/dashboard/facturas/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/dashboard/documentos/$id", params: { id: params.id } });
  },
  component: () => null,
});
