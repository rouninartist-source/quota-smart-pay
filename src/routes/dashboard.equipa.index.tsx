import { createFileRoute, Link } from "@tanstack/react-router";
import { MessagesSquare, Bot } from "lucide-react";

export const Route = createFileRoute("/dashboard/equipa/")({
  head: () => ({
    meta: [
      { title: "Chat da equipa · Quota Studio" },
      { name: "description", content: "Conversas internas da equipa — brevemente." },
    ],
  }),
  component: ChatSoon,
});

/** A funcionalidade fica desactivada até estar pronta — sem canais de demonstração. */
function ChatSoon() {
  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 pl-1 text-[12.5px] font-semibold">
            <MessagesSquare className="h-3.5 w-3.5 text-primary" /> Chat da equipa
          </span>
          <span className="inline-flex items-center gap-1.5 border-l border-border/60 pl-3 text-[11px] text-muted-foreground">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warning" />
            Coming soon
          </span>
        </div>
      </section>
      <section className="grid min-h-0 flex-1 place-items-center overflow-hidden rounded-lg border border-border/70 bg-card p-6 shadow-sm">
        <div className="max-w-[460px] text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <MessagesSquare className="h-6 w-6" />
          </span>
          <h1 className="mt-3 font-display text-[19px] font-semibold tracking-tight">Coming soon</h1>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[12.5px] leading-relaxed text-muted-foreground">
            O chat interno da equipa está em preparação. Entretanto, o assistente Quota AI já responde
            sobre facturas, clientes e cobranças.
          </p>
          <Link
            to="/dashboard/assistente"
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Bot className="h-3.5 w-3.5" /> Abrir Quota AI
          </Link>
        </div>
      </section>
    </div>
  );
}
