import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { createThread, listThreads } from "@/lib/agent-threads";

export const Route = createFileRoute("/dashboard/assistente/")({
  component: AssistantEntry,
});

function AssistantEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    const existing = listThreads();
    const thread = existing[0] ?? createThread();
    navigate({
      to: "/dashboard/assistente/$threadId",
      params: { threadId: thread.id },
      replace: true,
    });
  }, [navigate]);

  return (
    <p className="py-24 text-center text-sm text-muted-foreground">A abrir o Quota AI…</p>
  );
}
