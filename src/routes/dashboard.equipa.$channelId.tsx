import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Hash,
  Megaphone,
  MessageSquare,
  Plus,
  Search,
  SendHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  ME,
  createChannel,
  deleteChannel,
  formatTime,
  memberById,
  members,
  sendMessage,
  useChannel,
  useChannelMessages,
  useChannels,
  type Channel,
} from "@/lib/team-chat-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/equipa/$channelId")({
  head: () => ({
    meta: [
      { title: "Chat da equipa · Quota Studio" },
      {
        name: "description",
        content:
          "Chat interno da Quota: fale com a equipa, crie grupos de trabalho e mantenha um canal da empresa.",
      },
      { property: "og:title", content: "Chat da equipa · Quota Studio" },
      { property: "og:description", content: "Comunicação interna para a equipa do seu negócio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeamChatPage,
});

function channelIcon(kind: Channel["kind"]) {
  if (kind === "empresa") return Megaphone;
  if (kind === "directa") return MessageSquare;
  return Hash;
}

function TeamChatPage() {
  const { channelId } = Route.useParams();
  const navigate = useNavigate();
  const channels = useChannels();
  const channel = useChannel(channelId);
  const messages = useChannelMessages(channelId);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, channelId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [channelId]);

  const filtered = useMemo(
    () => channels.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [channels, query],
  );

  const groups = filtered.filter((c) => c.kind !== "directa");
  const directs = filtered.filter((c) => c.kind === "directa");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(channelId, draft);
    setDraft("");
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Espaço de trabalho
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Chat da equipa
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Converse com a equipa e crie grupos por área do negócio.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-[13px] font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Criar grupo
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Channel list */}
        <aside className="rounded-lg border border-border/60 bg-card p-3 shadow-card">
          <div className="flex h-9 items-center gap-2 rounded-md border border-border/60 bg-background px-3">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar canal…"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </div>

          <ChannelGroup label="Canais" items={groups} activeId={channelId} />
          <ChannelGroup label="Mensagens directas" items={directs} activeId={channelId} />
        </aside>

        {/* Conversation */}
        <section className="flex min-h-[560px] flex-col rounded-lg border border-border/60 bg-card shadow-card">
          <header className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] font-semibold">
                {channel?.name ?? "Canal indisponível"}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {channel ? `${channel.memberIds.length} membros` : "—"}
                {channel?.topic ? ` · ${channel.topic}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center sm:flex">
                {(channel?.memberIds ?? []).slice(0, 4).map((id, i) => (
                  <span
                    key={id}
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold",
                      i > 0 && "-ml-2",
                    )}
                  >
                    {memberById(id)?.initials}
                  </span>
                ))}
              </div>
              {channel && channel.kind === "grupo" && (
                <button
                  onClick={() => {
                    deleteChannel(channel.id);
                    navigate({
                      to: "/dashboard/equipa/$channelId",
                      params: { channelId: "ch-empresa" },
                    });
                  }}
                  aria-label="Apagar grupo"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
            {messages.length === 0 && (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Ainda sem mensagens. Comece a conversa abaixo.
              </p>
            )}
            {messages.map((m) => {
              const mine = m.authorId === ME;
              const author = memberById(m.authorId);
              return (
                <div key={m.id} className={cn("flex items-end gap-2.5", mine && "flex-row-reverse")}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold">
                    {author?.initials ?? "?"}
                  </span>
                  <div className={cn("max-w-[75%]", mine && "text-right")}>
                    <p className="mb-1 text-[11px] text-muted-foreground">
                      {mine ? "Você" : author?.name} · {formatTime(m.at)}
                    </p>
                    <p
                      className={cn(
                        "inline-block rounded-lg px-3.5 py-2.5 text-left text-[13px] leading-relaxed",
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "border border-border/60 bg-muted/50 text-foreground",
                      )}
                    >
                      {m.text}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-border/60 p-3">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Mensagem em ${channel?.name ?? "canal"}…`}
              className="h-11 flex-1 rounded-md border border-border/60 bg-background px-4 text-[13px] outline-none focus:border-primary/60"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Enviar mensagem"
              className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>

      {creating && <CreateGroupDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function ChannelGroup({
  label,
  items,
  activeId,
}: {
  label: string;
  items: Channel[];
  activeId: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/60">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((c) => {
          const Icon = channelIcon(c.kind);
          const active = c.id === activeId;
          return (
            <li key={c.id}>
              <Link
                to="/dashboard/equipa/$channelId"
                params={{ channelId: c.id }}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                <span className="truncate">{c.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CreateGroupDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    const channel = createChannel(name, selected, topic);
    onClose();
    navigate({ to: "/dashboard/equipa/$channelId", params: { channelId: channel.id } });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
      <form
        onSubmit={create}
        className="w-full max-w-md rounded-lg border border-border/60 bg-card p-6 shadow-elegant"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Criar grupo</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Um canal para a equipa ou para toda a empresa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-5 block text-xs font-medium text-muted-foreground">Nome do grupo</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Tesouraria"
          className="mt-1.5 h-10 w-full rounded-md border border-border/60 bg-background px-3 text-[13px] outline-none focus:border-primary/60"
        />

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Assunto</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Opcional"
          className="mt-1.5 h-10 w-full rounded-md border border-border/60 bg-background px-3 text-[13px] outline-none focus:border-primary/60"
        />

        <p className="mt-4 text-xs font-medium text-muted-foreground">Membros</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {members
            .filter((m) => m.id !== ME)
            .map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition",
                  selected.includes(m.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[9px] font-semibold text-foreground">
                  {m.initials}
                </span>
                {m.name}
              </button>
            ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-border/60 px-4 text-[13px] hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="h-9 rounded-md bg-primary px-4 text-[13px] font-medium text-primary-foreground disabled:opacity-40"
          >
            Criar grupo
          </button>
        </div>
      </form>
    </div>
  );
}
