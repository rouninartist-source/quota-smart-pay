import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Plus, Pencil, Search, FileText, Mail, Phone, MessageCircle } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
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
        content:
          "Crie, edite e remova clientes com NUIT, contactos e morada para usar directamente nas suas facturas.",
      },
      { property: "og:title", content: "Clientes · Quota Studio" },
      {
        property: "og:description",
        content: "CRM leve para PMEs — clientes, contactos e histórico num só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Clientes,
});

type Draft = Omit<Client, "id">;

const emptyDraft: Draft = { name: "", nuit: "", email: "", phone: "", address: "", notes: "" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /[a-zA-ZÀ-ÿ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** O endereço guarda "Rua X 12, Maputo" — a linha só tem espaço para a cidade. */
function city(address: string) {
  const parts = address.split(",");
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0]).trim();
}

const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

function Clientes() {
  const clients = useClients();
  const invoices = useInvoices();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const byClient = useMemo(() => {
    const m = new Map<string, { total: number; docs: number }>();
    invoices.forEach((i) => {
      if (!i.clientId) return;
      const cur = m.get(i.clientId) ?? { total: 0, docs: 0 };
      m.set(i.clientId, { total: cur.total + invoiceTotal(i), docs: cur.docs + 1 });
    });
    return m;
  }, [invoices]);

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

  const invoiced = useMemo(
    () => [...byClient.values()].reduce((s, v) => s + v.total, 0),
    [byClient],
  );

  function openNew() {
    setDraft(emptyDraft);
    setEditing("new");
    setError(undefined);
    setConfirmDelete(false);
  }

  function openEdit(c: Client) {
    const { id: _id, ...rest } = c;
    setDraft({ notes: "", ...rest });
    setEditing(c.id);
    setError(undefined);
    setConfirmDelete(false);
  }

  function close() {
    setEditing(null);
    setError(undefined);
    setConfirmDelete(false);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return setError("Indique o nome do cliente.");
    if (editing === "new") {
      addClient(draft);
    } else if (editing) {
      updateClient(editing, draft);
      syncInvoiceClient(editing, {
        name: draft.name,
        nuit: draft.nuit,
        email: draft.email,
        phone: draft.phone,
        address: draft.address,
      });
    }
    close();
  }

  const editor = (
    <ClientEditor
      draft={draft}
      setDraft={setDraft}
      onSubmit={save}
      onCancel={close}
      error={error}
      isNew={editing === "new"}
      confirmDelete={confirmDelete}
      onAskDelete={() => setConfirmDelete(true)}
      onCancelDelete={() => setConfirmDelete(false)}
      onDelete={() => {
        if (typeof editing === "string" && editing !== "new") deleteClient(editing);
        close();
      }}
    />
  );

  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      {/* ─── Barra de contexto ─── */}
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-[320px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar nome, NUIT, email ou telefone"
              aria-label="Procurar clientes"
              className="h-8 w-full truncate rounded-lg border border-border bg-surface pl-8 pr-3 text-[12px] outline-none transition focus:border-primary/60"
            />
          </div>
          <button
            onClick={openNew}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Novo cliente
          </button>
        </div>
      </section>

      {/* ─── Linhas de contacto ─── */}
      <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm md:min-h-0 md:flex-1">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {editing === "new" && editor}

          {rows.length === 0 ? (
            <div className="grid place-items-center gap-2 px-5 py-16 text-center">
              <Users className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">Nenhum cliente encontrado</p>
              <p className="text-xs text-muted-foreground">
                {query ? "Ajuste a procura." : "Crie a primeira ficha para facturar mais rápido."}
              </p>
            </div>
          ) : (
            rows.map((c) => {
              const stat = byClient.get(c.id);
              return (
                <Fragment key={c.id}>
                  <div className="flex items-center gap-3 border-b border-border/60 px-3 py-2.5 transition hover:bg-muted/40 sm:gap-4 sm:px-4">
                    <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[10.5px] font-bold text-primary sm:grid">
                      {initials(c.name)}
                    </span>

                    <span className="min-w-0 flex-1 sm:w-[200px] sm:flex-none">
                      <span className="block truncate text-[12.5px] font-semibold">{c.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] tabular-nums text-muted-foreground">
                        NUIT {c.nuit || "—"}
                      </span>
                    </span>

                    <span className="hidden min-w-0 flex-1 flex-col gap-0.5 lg:flex">
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="flex items-center gap-1.5 truncate text-[11.5px] text-muted-foreground transition hover:text-primary"
                        >
                          <Mail className="h-3 w-3 shrink-0 opacity-60" />
                          <span className="truncate">{c.email}</span>
                        </a>
                      )}
                      {c.phone && (
                        <a
                          href={`tel:${c.phone.replace(/\s/g, "")}`}
                          className="flex items-center gap-1.5 truncate text-[11.5px] text-muted-foreground transition hover:text-primary"
                        >
                          <Phone className="h-3 w-3 shrink-0 opacity-60" />
                          <span className="truncate">{c.phone}</span>
                        </a>
                      )}
                    </span>

                    <span className="hidden w-[88px] shrink-0 truncate text-[11.5px] text-muted-foreground xl:block">
                      {city(c.address)}
                    </span>

                    <span className="w-[76px] shrink-0 text-right sm:w-[92px]">
                      <span className="block text-[12.5px] font-bold tabular-nums">
                        {formatMZN(stat?.total ?? 0, { decimals: false })}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">
                        {stat?.docs ?? 0} documento{stat?.docs === 1 ? "" : "s"}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-1.5">
                      {c.phone && (
                        <a
                          href={waLink(c.phone)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`WhatsApp para ${c.name}`}
                          className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition hover:border-success/45 hover:bg-success/8 hover:text-success"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => (editing === c.id ? close() : openEdit(c))}
                        aria-label={`Editar ${c.name}`}
                        aria-expanded={editing === c.id}
                        className={cn(
                          "grid h-[30px] w-[30px] place-items-center rounded-lg border transition",
                          editing === c.id
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                        )}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        to="/dashboard/facturas/nova"
                        search={{ cliente: c.id }}
                        aria-label={`Facturar ${c.name}`}
                        className="inline-flex h-[30px] w-[30px] items-center justify-center gap-1.5 rounded-lg border border-border bg-surface text-[11px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary sm:w-auto sm:px-2.5"
                      >
                        <FileText className="h-3 w-3" />
                        <span className="hidden sm:inline">Facturar</span>
                      </Link>
                    </span>
                  </div>

                  {editing === c.id && editor}
                </Fragment>
              );
            })
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-border/70 bg-surface px-4 py-2 text-[11px] text-muted-foreground">
          <span>
            {rows.length} cliente{rows.length === 1 ? "" : "s"}
          </span>
          <span>
            Facturado{" "}
            <b className="font-bold tabular-nums text-foreground">
              {formatMZN(invoiced, { decimals: false })}
            </b>
          </span>
          <span className="ml-auto hidden sm:inline">Editar abre na própria linha</span>
        </div>
      </section>
    </div>
  );
}

function ClientEditor({
  draft,
  setDraft,
  onSubmit,
  onCancel,
  onDelete,
  onAskDelete,
  onCancelDelete,
  confirmDelete,
  error,
  isNew,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDelete: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  confirmDelete: boolean;
  error?: string;
  isNew: boolean;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="border-b border-border bg-primary/5 px-3 py-3.5 sm:px-4"
    >
      <p className="mb-2.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {isNew ? "Novo cliente" : `A editar · ${draft.name || "sem nome"}`}
      </p>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <EditField
          label="Nome"
          value={draft.name}
          onChange={(v) => setDraft({ ...draft, name: v })}
          className="lg:col-span-2"
          autoFocus
        />
        <EditField label="NUIT" value={draft.nuit} onChange={(v) => setDraft({ ...draft, nuit: v })} />
        <EditField
          label="Email"
          type="email"
          value={draft.email}
          onChange={(v) => setDraft({ ...draft, email: v })}
        />
        <EditField label="Telefone" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
        <EditField
          label="Endereço"
          value={draft.address}
          onChange={(v) => setDraft({ ...draft, address: v })}
        />
        <EditField
          label="Notas"
          value={draft.notes ?? ""}
          onChange={(v) => setDraft({ ...draft, notes: v })}
          className="lg:col-span-3"
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-[11.5px] font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!isNew &&
          (confirmDelete ? (
            <>
              <span className="text-[11.5px] font-medium text-destructive">
                Eliminar? As facturas emitidas permanecem.
              </span>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-md bg-destructive px-3 py-1.5 text-[11.5px] font-semibold text-destructive-foreground"
              >
                Sim, eliminar
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[11.5px] font-semibold"
              >
                Não
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onAskDelete}
              className="rounded-md border border-destructive/30 bg-card px-3 py-1.5 text-[11.5px] font-semibold text-destructive transition hover:bg-destructive/8"
            >
              Eliminar
            </button>
          ))}

        <span className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border bg-card px-3.5 py-1.5 text-[11.5px] font-semibold transition hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-3.5 py-1.5 text-[11.5px] font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Guardar
          </button>
        </span>
      </div>
    </form>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  className,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className="h-[30px] w-full min-w-0 rounded-md border border-border bg-background px-2.5 text-[12px] outline-none transition focus:border-primary/60 focus:ring-[3px] focus:ring-primary/12"
      />
    </label>
  );
}
