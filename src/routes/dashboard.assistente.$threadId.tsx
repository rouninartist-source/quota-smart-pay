import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Mic,
  MicOff,
  MessageSquarePlus,
  Paperclip,
  Trash2,
  X,
} from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { DraftInvoiceCard, type DraftProposal } from "@/components/ai-elements/DraftInvoiceCard";
import { toast } from "sonner";
import mark from "@/assets/quota-ai-mark.png";
import {
  createThread,
  deleteThread,
  getThread,
  listThreads,
  saveThread,
  useThreads,
} from "@/lib/agent-threads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/assistente/$threadId")({
  head: () => ({
    meta: [
      { title: "Quota AI · Assistente de facturação" },
      {
        name: "description",
        content:
          "Quota AI: anexe ficheiros, dite por voz e obtenha rascunhos de factura com verificação humana.",
      },
      { property: "og:title", content: "Quota AI · Assistente de facturação" },
      {
        property: "og:description",
        content: "Converse, anexe documentos e valide rascunhos de factura propostos pela AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantThread,
});

const SUGGESTIONS = [
  "Cria um rascunho de factura para a Padaria Central: 3 bolos a 850 MZN",
  "Escreve uma mensagem de cobrança educada para WhatsApp",
  "Como calculo o IVA de 16% numa factura?",
  "Lê este comprovativo e propõe a factura",
];

type Attachment = { id: string; name: string; mediaType: string; url: string };

function AssistantThread() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const threads = useThreads();

  const initialMessages = useMemo<UIMessage[]>(
    () => getThread(threadId)?.messages ?? [],
    [threadId],
  );

  return (
    <ChatWindow
      key={threadId}
      threadId={threadId}
      initialMessages={initialMessages}
      threads={threads}
      onNewThread={() => {
        const t = createThread();
        navigate({ to: "/dashboard/assistente/$threadId", params: { threadId: t.id } });
      }}
      onDelete={(id) => {
        deleteThread(id);
        const rest = listThreads();
        const next = rest[0] ?? createThread();
        navigate({ to: "/dashboard/assistente/$threadId", params: { threadId: next.id } });
      }}
    />
  );
}

function ChatWindow({
  threadId,
  initialMessages,
  threads,
  onNewThread,
  onDelete,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  threads: ReturnType<typeof useThreads>;
  onNewThread: () => void;
  onDelete: (id: string) => void;
}) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const { listening, supported, toggle } = useVoiceInput((text) =>
    setInput((prev) => (prev ? `${prev.trim()} ${text}` : text)),
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (error) =>
      toast.error("Não foi possível responder", {
        description: error.message || "Tente novamente dentro de alguns instantes.",
      }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (messages.length > 0) saveThread(threadId, messages);
  }, [messages, threadId]);

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy, threadId]);

  async function pickFiles(list: FileList | null) {
    if (!list?.length) return;
    const next: Attachment[] = [];
    for (const file of Array.from(list).slice(0, 4)) {
      if (file.size > 6 * 1024 * 1024) {
        toast.error(`${file.name} é maior que 6 MB`);
        continue;
      }
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      next.push({
        id: `${file.name}-${Date.now()}-${next.length}`,
        name: file.name,
        mediaType: file.type || "application/octet-stream",
        url,
      });
    }
    setAttachments((a) => [...a, ...next]);
  }

  function send(text: string) {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || busy) return;
    void sendMessage({
      text: trimmed || "Analisa o ficheiro em anexo e propõe o documento adequado.",
      files: attachments.map((a) => ({
        type: "file" as const,
        url: a.url,
        mediaType: a.mediaType,
        filename: a.name,
      })),
    });
    setInput("");
    setAttachments([]);
  }

  return (
    <div className="grid gap-3 md:h-full md:min-h-0 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Threads */}
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-card p-3 shadow-sm">
        <button
          onClick={onNewThread}
          className="flex h-9 w-full shrink-0 items-center gap-2 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:opacity-90"
        >
          <MessageSquarePlus className="h-4 w-4" /> Nova conversa
        </button>
        <p className="shrink-0 px-2 pb-1.5 pt-4 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/60">
          Conversas
        </p>
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain">
          {threads.map((t) => {
            const active = t.id === threadId;
            return (
              <li
                key={t.id}
                className={cn(
                  "group flex items-center gap-1 rounded-md pr-1 transition-colors",
                  active ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <Link
                  to="/dashboard/assistente/$threadId"
                  params={{ threadId: t.id }}
                  className={cn(
                    "min-w-0 flex-1 truncate px-2 py-2 text-[13px]",
                    active ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {t.title}
                </Link>
                <button
                  onClick={() => onDelete(t.id)}
                  aria-label={`Apagar ${t.title}`}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Chat */}
      <section className="flex min-h-[440px] flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm md:min-h-0">
        <header className="flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-3">
          <img src={mark} alt="Quota AI" width={512} height={512} className="h-9 w-9 rounded-md" />
          <div>
            <p className="font-display text-[15px] font-semibold">Quota AI</p>
            <p className="text-xs text-muted-foreground">
              Anexos, voz e rascunhos de factura com verificação humana
            </p>
          </div>
        </header>

        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="mx-auto w-full max-w-3xl">
            {messages.length === 0 ? (
              <div className="py-10">
                <ConversationEmptyState
                  icon={
                    <img
                      src={mark}
                      alt=""
                      loading="lazy"
                      width={512}
                      height={512}
                      className="h-14 w-14 rounded-lg"
                    />
                  }
                  title="Em que posso ajudar hoje?"
                  description="Peça um rascunho de factura, anexe um comprovativo ou dite por voz."
                />
                <div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-md border border-border/60 bg-background px-4 py-3 text-left text-[13px] text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const text = m.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("")
                  .trim();
                const files = m.parts.filter(
                  (p): p is Extract<typeof p, { type: "file" }> => p.type === "file",
                );
                const drafts = m.parts.filter(
                  (p) => p.type === "tool-criarRascunhoFactura",
                ) as Array<{ toolCallId: string; input?: unknown }>;

                if (!text && files.length === 0 && drafts.length === 0) return null;

                return (
                  <div key={m.id} className="space-y-2">
                    {(text || files.length > 0) && (
                      <Message from={m.role}>
                        <MessageContent
                          className={
                            m.role === "user"
                              ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground"
                              : undefined
                          }
                        >
                          {files.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-2">
                              {files.map((f, i) =>
                                f.mediaType?.startsWith("image/") ? (
                                  <img
                                    key={i}
                                    src={f.url}
                                    alt={f.filename ?? "anexo"}
                                    className="h-24 w-24 rounded-md object-cover"
                                  />
                                ) : (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-current/20 bg-background/10 px-2 py-1 text-[11px]"
                                  >
                                    <Paperclip className="h-3 w-3" />
                                    {f.filename ?? "ficheiro"}
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                          {text ? (
                            m.role === "assistant" ? (
                              <MessageResponse>{text}</MessageResponse>
                            ) : (
                              <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                                {text}
                              </p>
                            )
                          ) : null}
                        </MessageContent>
                      </Message>
                    )}

                    {drafts.map((d) =>
                      d.input ? (
                        <DraftInvoiceCard
                          key={d.toolCallId}
                          draftId={d.toolCallId}
                          threadId={threadId}
                          proposal={d.input as DraftProposal}
                        />
                      ) : null,
                    )}
                  </div>
                );
              })
            )}
            {status === "submitted" && (
              <div className="px-2 py-3">
                <Shimmer>A pensar…</Shimmer>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Composer */}
        <div className="border-t border-border/60 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring"
          >
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 border-b border-border/60 p-2">
                {attachments.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted px-2 py-1 text-[11px]"
                  >
                    <Paperclip className="h-3 w-3" />
                    <span className="max-w-[140px] truncate">{a.name}</span>
                    <button
                      type="button"
                      aria-label={`Remover ${a.name}`}
                      onClick={() => setAttachments((list) => list.filter((x) => x.id !== a.id))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={2}
              placeholder={
                listening ? "A ouvir… fale agora" : "Pergunte ao Quota AI ou dite por voz…"
              }
              className="w-full resize-none bg-transparent px-3 py-2.5 text-[13px] outline-none placeholder:text-muted-foreground"
            />

            <div className="flex items-center justify-between gap-2 px-2 pb-2">
              <div className="flex items-center gap-1">
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    void pickFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Anexar ficheiro ou imagem"
                  className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  disabled={!supported}
                  aria-label={listening ? "Parar ditado" : "Ditar por voz"}
                  title={supported ? "Ditar por voz" : "O seu navegador não suporta ditado"}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-md transition",
                    listening
                      ? "bg-destructive/10 text-destructive"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !supported && "opacity-40",
                  )}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                {listening && (
                  <span className="text-[11px] font-medium text-destructive">A transcrever…</span>
                )}
              </div>

              <button
                type="submit"
                disabled={busy || (!input.trim() && attachments.length === 0)}
                aria-label="Enviar"
                className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </form>
          <p className="mt-2 px-1 text-[11px] text-muted-foreground">
            O Quota AI nunca emite documentos sozinho: propõe rascunhos que precisam da sua
            verificação.
          </p>
        </div>
      </section>
    </div>
  );
}

/** Reconhecimento de voz do navegador (Web Speech API), com transcrição em pt-MZ. */
type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: unknown) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function useVoiceInput(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as
      | (new () => RecognitionLike)
      | undefined;
    if (!Ctor) return;
    setSupported(true);
    const rec = new Ctor();
    rec.lang = "pt-PT";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event: unknown) => {
      const results = (event as { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }).results;
      if (!results) return;
      let text = "";
      for (let i = 0; i < results.length; i++) {
        text += results[i]?.[0]?.transcript ?? "";
      }
      if (text.trim()) onText(text.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() {
    const rec = recRef.current;
    if (!rec) {
      toast.error("O seu navegador não suporta ditado por voz");
      return;
    }
    if (listening) {
      rec.stop();
      setListening(false);
      return;
    }
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  return { listening, supported, toggle };
}
