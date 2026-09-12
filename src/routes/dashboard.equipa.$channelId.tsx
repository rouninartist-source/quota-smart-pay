import { createFileRoute, redirect } from "@tanstack/react-router";

/** Canais desactivados enquanto o chat está em preparação. */
export const Route = createFileRoute("/dashboard/equipa/$channelId")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/equipa" });
  },
  component: () => null,
});
