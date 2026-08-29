import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/equipa/")({
  beforeLoad: () => {
    throw redirect({
      to: "/dashboard/equipa/$channelId",
      params: { channelId: "ch-empresa" },
    });
  },
});
