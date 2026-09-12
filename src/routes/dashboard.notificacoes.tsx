import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, CreditCard, FileText, ArrowRight } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/States";
import { Button } from "@/components/ui/button";
import { markRead, useNotifications } from "@/lib/notifications-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações · Quota Studio" },
      { name: "description", content: "Centro de notificações: pagamentos, documentos, clientes e alertas do sistema." },
      { property: "og:title", content: "Notificações · Quota Studio" },
      { property: "og:description", content: "Centro de notificações: pagamentos, documentos, clientes e alertas do sistema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificacoesPage,
});

const kindIcon = { pagamento: CreditCard, documento: FileText } as const;
const tabs = [
  { key: "todas", label: "Todas" },
  { key: "nao-lidas", label: "Por ler" },
  { key: "pagamento", label: "Pagamentos" },
  { key: "documento", label: "Documentos" },
];

function NotificacoesPage() {
  const items = useNotifications();
  const navigate = useNavigate();
  const [tab, setTab] = useState("todas");

  const filtered = items.filter((n) =>
    tab === "todas" ? true : tab === "nao-lidas" ? !n.read : n.kind === tab,
  );
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificações"
        description={unread ? `${unread} notificações por ler` : "Está tudo em dia."}
        Icon={Bell}
        crumbs={[{ label: "Espaço de trabalho" }, { label: "Notificações" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            disabled={unread === 0}
            onClick={() => markRead(items.map((n) => n.id))}
          >
            <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
          </Button>
        }
      />

      <div role="tablist" aria-label="Filtrar notificações" className="flex flex-wrap gap-1 border-b border-border/60">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px min-h-11 border-b-2 px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-border/70 bg-card">
          <EmptyState Icon={Bell} title="Nada por aqui" description="Não existem notificações nesta categoria." />
        </div>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-md border border-border/70 bg-card">
          {filtered.map((n) => {
            const Icon = kindIcon[n.kind];
            return (
              <li key={n.id}>
                <button
                  onClick={() => {
                    markRead([n.id]);
                    navigate({ to: "/dashboard/documentos/$id", params: { id: n.invoiceId } });
                  }}
                  title="Abrir o documento"
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-muted/40"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{n.title}</span>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="Por ler" />}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">{n.body}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
