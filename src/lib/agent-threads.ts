/**
 * Frontend-only AI agent thread store (localStorage, per browser).
 */
import { useCallback, useEffect, useState } from "react";
import type { UIMessage } from "ai";

export type AgentThread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

const KEY = "quota.agent.threads.v1";

function read(): AgentThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AgentThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(threads: AgentThread[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(threads));
  } catch {
    /* ignore */
  }
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function newThreadId() {
  return `t-${Math.random().toString(36).slice(2, 10)}`;
}

export function listThreads(): AgentThread[] {
  return read().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createThread(title = "Nova conversa"): AgentThread {
  const thread: AgentThread = { id: newThreadId(), title, updatedAt: Date.now(), messages: [] };
  write([thread, ...read()]);
  emit();
  return thread;
}

export function getThread(id: string): AgentThread | undefined {
  return read().find((t) => t.id === id);
}

export function saveThread(id: string, messages: UIMessage[]) {
  const threads = read();
  const existing = threads.find((t) => t.id === id);
  const title = deriveTitle(messages) ?? existing?.title ?? "Nova conversa";
  const next: AgentThread = { id, title, updatedAt: Date.now(), messages };
  write(existing ? threads.map((t) => (t.id === id ? next : t)) : [next, ...threads]);
  emit();
}

export function deleteThread(id: string) {
  write(read().filter((t) => t.id !== id));
  emit();
}

export function renameThread(id: string, title: string) {
  write(read().map((t) => (t.id === id ? { ...t, title } : t)));
  emit();
}

function messageText(m: UIMessage) {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
}

function deriveTitle(messages: UIMessage[]) {
  const first = messages.find((m) => m.role === "user");
  if (!first) return undefined;
  const text = messageText(first);
  if (!text) return undefined;
  return text.length > 44 ? `${text.slice(0, 44)}…` : text;
}

/** Reactive list of threads (client-only). */
export function useThreads() {
  const [threads, setThreads] = useState<AgentThread[]>([]);
  const refresh = useCallback(() => setThreads(listThreads()), []);

  useEffect(() => {
    refresh();
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, [refresh]);

  return threads;
}
