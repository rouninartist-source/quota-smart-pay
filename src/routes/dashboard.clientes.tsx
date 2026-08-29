import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Plus, Pencil, Trash2, Search, X, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { KpiCard } from "@/components/dashboard/cards";
import { Field, FieldRow } from "@/components/app/FormSection";
import { formatMZN } from "@/lib/format";
import {
  addClient,
  deleteClient,
  updateClient,
  useClients,
  type Client,
} from "@/lib/clients-store";
import { invoiceTotal, syncInvoiceClient, useInvoices } from "@/lib/invoices-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes · Quota Studio" },
      {
        name: "description",
        content: "Crie, edite e remova clientes com NUIT, contactos e morada para usar directamente nas suas facturas.",
      },
      { property: "og:title", content: "Clientes · Quota Studio" },
      { property: "og:description", content: "CRM leve para PMEs — clientes, contactos e histórico num só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Clientes,
});

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

type Draft = Omit<Client, "id">;

const emptyDraft: Draft = { name: "", nuit: "", email: "", phone: "", address: "", notes: "" };

function Clientes() {
  const clients = useClients();
  const invoices = useInvoices();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Client | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState<string>();

  const stats = useMemo(() => {
    const byClient = new Map<string, number>();
    invoices.forEach((i) => {
      if (!i.clientId) return;
      byClient.set(i.clientId, (byClient.get(i.clientId) ?? 0) + invoiceTotal(i));
    });
    const top = [...byClient.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      byClient,
      faturado: [...byClient.values()].reduce((s, v) => s + v, 0),
      top: top ? { name: clients.find((c) => c.id === top[0])?.name ?? "—", value: top[1] } : undefined,
    };
  }, [invoices, clients]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nuit.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q),
    );
  }, [clients, query]);

  function openNew() {
    setDraft(emptyDraft);
    setEditing("new");
    setError(undefined);
  }

  function openEdit(c: Client) {
    const { id: _id, ...rest } = c;
    setDraft({ notes: "", ...rest });
    setEditing(c);
    setError(undefined);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return setError("Indique o nome do cliente.");
    if (editing === "new") {
      addClient(draft);
    } else if (editing) {
      updateClient(editing.id, draft);
      syncInvoiceClient(editing.id, {
        name: draft.name,
        nuit: draft.nuit,
        email: draft.email,
        phone: draft.phone,
        address: draft.address,
      });
    }
    setEditing(null);
    setError(undefined);
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">CRM</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-[36px]">Clientes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie e edite fichas de cliente para usar directamente nas facturas.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 self-start rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Novo cliente
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-4">
          <KpiCard label="Clientes" value={String(clients.length)} meta={<>fichas activas</>} metaTone="muted" />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <KpiCard
            label="Facturado a clientes"
            value={formatMZN(stats.faturado, { decimals: false })}
            unit="MZN"
            meta={<>IVA incluído</>}
            metaTone="muted"
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <KpiCard
            label="Top cliente"
            value={stats.top?.name ?? "—"}
            meta={<>{stats.top ? `${formatMZN(stats.top.value, { decimals: false })} MZN` : "sem facturas"}</>}
            metaTone="muted"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold">Base de clientes</p>
          <div className="relative md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar nome, NUIT ou email"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="grid place-items-center gap-2 px-5 py-16 text-center">
            <Users className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum cliente encontrado</p>
            <p className="text-xs text-muted-foreground">Crie a primeira ficha para facturar mais rápido.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((c) => {
              const total = stats.byClient.get(c.id) ?? 0;
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      NUIT {c.nuit || "—"} · {c.email || "sem email"} · {c.phone || "sem telefone"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground/80">{c.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatMZN(total, { decimals: false })}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">facturado</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/dashboard/facturas/nova"
                      search={{ cliente: c.id }}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-2 text-[11px] font-semibold hover:bg-muted"
                    >
                      <FileText className="h-3.5 w-3.5" /> Facturar
                    </Link>
                    <button
                      onClick={() => openEdit(c)}
                      aria-label={`Editar ${c.name}`}
                      className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(c.id)}
                      aria-label={`Eliminar ${c.name}`}
                      className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {confirmDelete === c.id && (
                    <div className="w-full rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
                      <p className="font-medium">Eliminar {c.name}? As facturas emitidas permanecem no histórico.</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => {
                            deleteClient(c.id);
                            setConfirmDelete(undefined);
                          }}
                          className="rounded-lg bg-destructive px-3 py-1.5 font-semibold text-destructive-foreground"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(undefined)}
                          className="rounded-lg border border-border px-3 py-1.5 font-semibold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={save}
            className="w-full max-w-lg space-y-4 rounded-lg border border-border/60 bg-card p-6 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  {editing === "new" ? "Novo cliente" : "Editar cliente"}
                </h2>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Estes dados aparecem no documento fiscal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Fechar"
                className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <FieldRow>
              <Field label="Nome" htmlFor="c-name">
                <input id="c-name" className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </Field>
              <Field label="NUIT" htmlFor="c-nuit">
                <input id="c-nuit" className={inputClass} value={draft.nuit} onChange={(e) => setDraft({ ...draft, nuit: e.target.value })} />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Email" htmlFor="c-email">
                <input id="c-email" type="email" className={inputClass} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              </Field>
              <Field label="Telefone" htmlFor="c-phone">
                <input id="c-phone" className={inputClass} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              </Field>
            </FieldRow>
            <Field label="Endereço" htmlFor="c-addr">
              <input id="c-addr" className={inputClass} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
            </Field>
            <Field label="Notas" htmlFor="c-notes">
              <textarea id="c-notes" rows={2} className={inputClass} value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </Field>

            {error && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {error}
              </p>
            )}

            <div className={cn("flex justify-end gap-2 pt-1")}>
              <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-border px-4 py-2.5 text-xs font-semibold">
                Cancelar
              </button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
                Guardar cliente
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
