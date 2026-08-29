import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  FileText,
  FileCheck2,
  Receipt,
  ImagePlus,
  Plus,
  Trash2,
  Send,
  Download,
  Copy,
  Check,
  Sparkles,
  Package,
  ChevronLeft,
  ChevronDown,
  Percent,
  type LucideIcon,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/documentos/novo")({
  head: () => ({
    meta: [
      { title: "Emitir documento · Quota Studio" },
      {
        name: "description",
        content:
          "Emita cotações, cotações visuais, facturas, facturas pró-forma e VD/Factura-recibo com pré-visualização em tempo real.",
      },
      { property: "og:title", content: "Emitir documento · Quota Studio" },
      {
        property: "og:description",
        content: "Criação de documentos com live preview, IVA automático e envio por WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    tipo: typeof search.tipo === "string" ? search.tipo : undefined,
  }),
  component: Documentos,
});

type DocType = {
  id: string;
  code: string;
  label: string;
  short: string;
  desc: string;
  icon: LucideIcon;
};

const docTypes: DocType[] = [
  { id: "cot", code: "COT", label: "Cotação", short: "Cotação", desc: "Proposta de preço enviada ao cliente", icon: FileText },
  { id: "cotv", code: "COTV", label: "Cotação visual", short: "Cotação visual", desc: "Proposta com imagem de cada produto — ideal para WhatsApp", icon: ImagePlus },
  { id: "ft", code: "FT", label: "Factura", short: "Factura", desc: "Documento fiscal com IVA", icon: FileCheck2 },
  { id: "pf", code: "PF", label: "Factura pró-forma", short: "Pró-forma", desc: "Proposta com aspecto de factura, sem valor fiscal", icon: FileText },
  { id: "fr", code: "FR", label: "VD/Factura-recibo", short: "VD/Recibo", desc: "Factura já paga no acto", icon: Receipt },
];

type Line = { id: number; desc: string; note: string; qty: number; price: number; vat: number; img: string };

const mzn = (n: number) =>
  new Intl.NumberFormat("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const tileGradients = [
  "linear-gradient(135deg, oklch(0.62 0.19 263), oklch(0.78 0.14 230))",
  "linear-gradient(135deg, oklch(0.68 0.16 155), oklch(0.82 0.12 190))",
  "linear-gradient(135deg, oklch(0.70 0.17 60), oklch(0.82 0.13 95))",
  "linear-gradient(135deg, oklch(0.62 0.20 20), oklch(0.78 0.14 350))",
];

const noteChips = ["Pagamento a 15 dias", "50% adiantamento", "Preços com IVA incluído", "Validade 30 dias"];

function Documentos() {
  const { tipo } = Route.useSearch();
  const [type, setType] = useState<DocType>(docTypes.find((d) => d.id === tipo) ?? docTypes[2]);
  const [client, setClient] = useState("Construções Beira, Lda.");
  const [nuit, setNuit] = useState("400123456");
  const [date, setDate] = useState("2026-07-27");
  const [validity, setValidity] = useState("15");
  const [notes, setNotes] = useState("Pagamento a 15 dias. M-Pesa: 84 000 0000.");
  const [notesOpen, setNotesOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { id: 1, desc: "Consultoria técnica", note: "2 sessões no local", qty: 2, price: 18500, vat: 16, img: "" },
    { id: 2, desc: "Instalação de equipamento", note: "Inclui material", qty: 1, price: 42000, vat: 16, img: "" },
  ]);

  const isVisual = type.id === "cotv";

  const totals = useMemo(() => {
    const sub = lines.reduce((a, l) => a + l.qty * l.price, 0);
    const disc = (sub * discount) / 100;
    const base = sub - disc;
    const vat = lines.reduce((a, l) => {
      const share = sub > 0 ? (l.qty * l.price) / sub : 0;
      return a + (base * share * l.vat) / 100;
    }, 0);
    return { sub, disc, vat, total: base + vat };
  }, [lines, discount]);

  const update = (id: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const addLine = () =>
    setLines((ls) => [...ls, { id: Date.now(), desc: "", note: "", qty: 1, price: 0, vat: 16, img: "" }]);

  const reference = `${type.code}/2026/0042`;
  const hasClient = client.trim().length > 0;
  const hasLines = lines.some((l) => l.desc.trim() && l.qty > 0 && l.price > 0);
  const isReady = hasClient && hasLines;

  const copyRef = () => {
    navigator.clipboard?.writeText(reference);
    setCopied(true);
    toast.success("Referência copiada", { description: reference });
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      {/* ─── Barra de contexto: tipo, referência e acções numa só linha ─── */}
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dashboard/documentos"
            aria-label="Voltar a Documentos"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>

          <div
            role="group"
            aria-label="Tipo de documento"
            className="flex min-w-0 gap-0.5 overflow-x-auto rounded-lg border border-border/60 bg-surface p-0.5"
          >
            {docTypes.map((d) => {
              const active = d.id === type.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setType(d)}
                  aria-pressed={active}
                  title={d.desc}
                  className={cn(
                    "shrink-0 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border border-border bg-card text-foreground shadow-sm"
                      : "border border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d.short}
                </button>
              );
            })}
          </div>

          <button
            onClick={copyRef}
            title="Copiar referência"
            className="inline-flex shrink-0 items-center gap-1.5 border-l border-border/60 py-1 pl-3 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <span
              aria-hidden
              className={cn("h-1.5 w-1.5 rounded-full", isReady ? "bg-success" : "bg-warning")}
            />
            <span className="tabular-nums">{reference}</span>
            <span className="text-muted-foreground/70">· {isReady ? "Pronto" : "Rascunho"}</span>
            {copied ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3 opacity-60" />
            )}
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              onClick={() => toast.success("PDF gerado", { description: `${reference} pronto a descarregar.` })}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium transition hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
            <button
              onClick={() =>
                toast.success(`${type.label} emitida`, {
                  description: `${reference} · ${mzn(totals.total)} MZN enviado a ${client || "cliente"}.`,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Send className="h-3.5 w-3.5" /> Emitir e enviar
            </button>
          </div>
        </div>
      </section>

      {/* ─── Bancada: à esquerda o que se escreve, à direita o que produz ─── */}
      <div className="grid gap-3 md:min-h-0 md:flex-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Editor */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
          <div className="grid shrink-0 gap-2 border-b border-border/70 bg-surface px-4 py-3 sm:grid-cols-[1.5fr_0.9fr_0.9fr_0.7fr]">
            <Field label="Cliente" value={client} onChange={setClient} />
            <Field label="NUIT" value={nuit} onChange={setNuit} />
            <Field label="Emissão" value={date} onChange={setDate} type="date" />
            <Field
              label={isVisual || type.id === "cot" ? "Validade" : "Prazo"}
              value={validity}
              onChange={setValidity}
              type="number"
              suffix="dias"
            />
          </div>

          <div className="hidden shrink-0 grid-cols-[minmax(0,1fr)_56px_96px_96px_28px] gap-2 border-b border-border/70 px-4 py-2 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground sm:grid">
            <span>Descrição</span>
            <span className="text-right">Qtd</span>
            <span className="text-right">Preço</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1.5">
            {lines.length === 0 ? (
              <p className="px-2 py-8 text-center text-[12.5px] text-muted-foreground">
                Sem linhas. Adicione a primeira abaixo.
              </p>
            ) : (
              lines.map((l, idx) => (
                <div
                  key={l.id}
                  className="group grid grid-cols-[minmax(0,1fr)_44px_84px_28px] items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-muted/50 sm:grid-cols-[minmax(0,1fr)_56px_96px_96px_28px]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {isVisual && (
                      <button
                        onClick={() =>
                          update(l.id, {
                            img: tileGradients[(tileGradients.indexOf(l.img) + 1) % tileGradients.length],
                          })
                        }
                        aria-label={`Mudar imagem de ${l.desc || "linha"}`}
                        className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md border border-border/70 text-[11px] font-bold text-primary-foreground"
                        style={{ background: l.img || tileGradients[idx % tileGradients.length] }}
                      >
                        {l.desc ? l.desc.charAt(0).toUpperCase() : <ImagePlus className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    <div className="grid min-w-0 flex-1 gap-1">
                      <Cell
                        value={l.desc}
                        onChange={(v) => update(l.id, { desc: v })}
                        placeholder="Descrição do item"
                      />
                      {isVisual && (
                        <Cell
                          value={l.note}
                          onChange={(v) => update(l.id, { note: v })}
                          placeholder="Detalhe curto (cor, medida, prazo…)"
                          muted
                        />
                      )}
                    </div>
                  </div>

                  <Cell
                    value={String(l.qty)}
                    onChange={(v) => update(l.id, { qty: Number(v) || 0 })}
                    type="number"
                    align="right"
                  />
                  <Cell
                    value={String(l.price)}
                    onChange={(v) => update(l.id, { price: Number(v) || 0 })}
                    type="number"
                    align="right"
                  />
                  <span className="hidden px-2 text-right text-[12.5px] font-bold tabular-nums sm:block">
                    {mzn(l.qty * l.price)}
                  </span>
                  <button
                    onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
                    aria-label={`Remover ${l.desc || "linha"}`}
                    className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}

            <div className="flex flex-wrap gap-2 px-1.5 pb-1 pt-2">
              <button
                onClick={addLine}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11.5px] font-semibold text-muted-foreground transition hover:border-solid hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
              >
                <Plus className="h-3 w-3" /> Linha
              </button>
              <Link
                to="/dashboard/produtos"
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11.5px] font-semibold text-muted-foreground transition hover:border-solid hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
              >
                <Package className="h-3 w-3" /> Do catálogo
              </Link>
            </div>
          </div>

          {/* Só entradas — todos os valores calculados vivem no documento */}
          <div className="flex shrink-0 items-center gap-3 border-t border-border/70 bg-surface px-4 py-2.5">
            <label className="flex items-center gap-2">
              <Percent className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                Desconto
              </span>
              <span className="flex h-7 w-[68px] items-center rounded-md border border-border bg-card px-2 focus-within:border-primary/60">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  aria-label="Desconto em percentagem"
                  className="w-full bg-transparent text-right text-[12.5px] tabular-nums outline-none"
                />
                <span className="pl-1 text-[11px] text-muted-foreground">%</span>
              </span>
            </label>
            <span className="ml-auto text-[11px] text-muted-foreground">
              {lines.length} linha{lines.length === 1 ? "" : "s"} · IVA 16%
            </span>
          </div>
        </section>

        {/* Documento — a única fonte dos valores calculados */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-elegant">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/70 bg-surface px-5 py-4">
            <div className="min-w-0">
              <p className="font-display text-[14px] font-semibold">Quota Studio, Lda.</p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                NUIT 400987654 · Maputo, Moçambique
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-[12.5px] font-bold uppercase tracking-[0.08em] text-primary">
                {type.label}
              </p>
              <p className="mt-0.5 text-[10.5px] tabular-nums text-muted-foreground">{reference}</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-3">
              <div className="min-w-0">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Cliente
                </p>
                <p className="mt-1 truncate text-[12.5px] font-semibold">{client || "—"}</p>
                <p className="mt-0.5 whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
                  NUIT {nuit || "—"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Data
                </p>
                <p className="mt-1 text-[12.5px] font-semibold tabular-nums">{formatDate(date)}</p>
                <p className="mt-0.5 whitespace-nowrap text-[11px] text-muted-foreground">
                  {isVisual || type.id === "cot" ? "Validade" : "Prazo"} {validity} dias
                </p>
              </div>
            </div>

            {isVisual ? (
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {lines.map((l, idx) => (
                  <article key={l.id} className="overflow-hidden rounded-md border border-border/70 bg-surface">
                    <div
                      className="grid h-20 place-items-center text-2xl font-bold text-primary-foreground"
                      style={{ background: l.img || tileGradients[idx % tileGradients.length] }}
                    >
                      {l.desc ? l.desc.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-[12px] font-semibold">{l.desc || "Sem descrição"}</p>
                      {l.note && <p className="truncate text-[11px] text-muted-foreground">{l.note}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {l.qty} un.
                        </span>
                        <span className="text-[12px] font-semibold tabular-nums text-primary">
                          {mzn(l.qty * l.price)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <table className="mt-3 w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/70 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                    <th className="pb-2 text-left font-semibold">Descrição</th>
                    <th className="pb-2 text-right font-semibold">Qtd</th>
                    <th className="pb-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b border-border/50">
                      <td className="max-w-0 truncate py-2.5 pr-3 text-[12px] font-medium">{l.desc || "—"}</td>
                      <td className="py-2.5 text-right text-[12px] tabular-nums">{l.qty}</td>
                      <td className="py-2.5 text-right text-[12px] tabular-nums">{mzn(l.qty * l.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="ml-auto mt-3 flex w-[min(230px,65%)] flex-col gap-1.5">
              <Sum label="Subtotal" value={mzn(totals.sub)} />
              {discount > 0 && <Sum label={`Desconto ${discount}%`} value={`− ${mzn(totals.disc)}`} />}
              <Sum label="IVA 16%" value={mzn(totals.vat)} />
              <div className="mt-1 flex items-baseline justify-between border-t border-border pt-2.5">
                <span className="text-[12px] font-semibold">Total</span>
                <span className="font-display text-[16px] font-semibold tabular-nums text-primary">
                  {mzn(totals.total)} MZN
                </span>
              </div>
            </div>

            {notes && (
              <p className="mt-4 whitespace-pre-wrap border-t border-border/70 pt-3 text-[11px] leading-relaxed text-muted-foreground">
                {notes}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* ─── Notas: uma linha que abre ─── */}
      <section className="shrink-0 rounded-lg border border-border/70 bg-card">
        <button
          onClick={() => setNotesOpen((v) => !v)}
          aria-expanded={notesOpen}
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
        >
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="shrink-0 text-[11.5px] font-semibold">Notas e condições</span>
          {!notesOpen && (
            <span className="min-w-0 flex-1 truncate text-[11.5px] text-muted-foreground">
              {notes || "Sem notas"}
            </span>
          )}
          <ChevronDown
            className={cn(
              "ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              notesOpen && "rotate-180",
            )}
          />
        </button>

        {notesOpen && (
          <div className="border-t border-border/70 px-3.5 py-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              aria-label="Notas e condições"
              className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-[12.5px] outline-none transition focus:border-primary/60"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {noteChips.map((s) => (
                <button
                  key={s}
                  onClick={() => setNotes((n) => (n ? `${n}\n${s}.` : `${s}.`))}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                >
                  <Sparkles className="h-3 w-3" /> {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Sum({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[11.5px] tabular-nums text-muted-foreground">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/** Célula da tabela de linhas: sem moldura até hover/foco, para baixar o ruído. */
function Cell({
  value,
  onChange,
  placeholder,
  type = "text",
  align = "left",
  muted,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  align?: "left" | "right";
  muted?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 w-full min-w-0 rounded-md border border-transparent bg-transparent px-2 text-[12.5px] outline-none transition",
        "hover:border-border/70 hover:bg-background",
        "focus:border-primary/60 focus:bg-background focus:ring-[3px] focus:ring-primary/12",
        align === "right" && "text-right tabular-nums",
        muted && "text-[11.5px] text-muted-foreground",
      )}
    />
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  suffix?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </label>
      <span className="flex h-8 items-center rounded-md border border-border bg-card px-2 focus-within:border-primary/60 focus-within:ring-[3px] focus-within:ring-primary/12">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-[12.5px] font-medium outline-none"
        />
        {suffix && <span className="shrink-0 pl-1 text-[11px] text-muted-foreground">{suffix}</span>}
      </span>
    </div>
  );
}
