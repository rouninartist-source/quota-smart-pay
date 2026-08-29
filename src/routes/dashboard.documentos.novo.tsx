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
  Users,
  Package,
  ArrowRight,
  GripVertical,
  Percent,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
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
  desc: string;
  icon: LucideIcon;
};

const docTypes: DocType[] = [
  { id: "cot", code: "COT", label: "Cotação", desc: "Proposta de preço enviada ao cliente", icon: FileText },
  { id: "cotv", code: "COTV", label: "Cotação visual", desc: "Proposta com imagem de cada produto — ideal para WhatsApp", icon: ImagePlus },
  { id: "ft", code: "FT", label: "Factura", desc: "Documento fiscal com IVA", icon: FileCheck2 },
  { id: "pf", code: "PF", label: "Factura pró-forma", desc: "Proposta com aspecto de factura, sem valor fiscal", icon: FileText },
  { id: "fr", code: "FR", label: "VD/Factura-recibo", desc: "Factura já paga no acto", icon: Receipt },
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

function Documentos() {
  const { tipo } = Route.useSearch();
  const [type, setType] = useState<DocType>(docTypes.find((d) => d.id === tipo) ?? docTypes[2]);
  const [client, setClient] = useState("Construções Beira, Lda.");
  const [nuit, setNuit] = useState("400123456");
  const [date, setDate] = useState("2026-07-27");
  const [validity, setValidity] = useState("15");
  const [notes, setNotes] = useState("Pagamento a 15 dias. M-Pesa: 84 000 0000.");
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

  const reference = `${type.code}/2026/0042`;

  const steps = [
    { label: "Tipo de documento", hint: type.label },
    { label: "Cliente e datas", hint: client ? client : "Em falta" },
    { label: "Linhas", hint: `${lines.length} linha(s)` },
    { label: "Emitir", hint: `${mzn(totals.total)} MZN` },
  ];
  const hasClient = client.trim().length > 0;
  const hasLines = lines.some((l) => l.desc.trim() && l.qty > 0 && l.price > 0);
  const isReady = hasClient && hasLines;
  const currentStep = !hasClient ? 2 : !hasLines ? 3 : 4;

  const copyRef = () => {
    navigator.clipboard?.writeText(reference);
    setCopied(true);
    toast.success("Referência copiada", { description: reference });
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo documento"
        description="Escolha o tipo, preencha os dados e veja o resultado final em tempo real."
        Icon={FileText}
        crumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Documentos", to: "/dashboard/documentos" },
          { label: "Novo" },
        ]}
        actions={
          <>
            <button
              onClick={copyRef}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2.5 text-xs font-medium transition hover:bg-muted"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {reference}
            </button>
            <button
              onClick={() => toast.success("PDF gerado", { description: `${reference} pronto a descarregar.` })}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-xs font-medium transition hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
            <button
              onClick={() =>
                toast.success(`${type.label} emitida`, {
                  description: `${reference} · ${mzn(totals.total)} MZN enviado a ${client || "cliente"}.`,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Send className="h-3.5 w-3.5" /> Emitir e enviar
            </button>
          </>
        }
      />

      {/* Step indicator + document state */}
      <section className="rounded-lg border border-border/70 bg-card p-4 md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-muted-foreground">
            Etapa {currentStep} de {steps.length} — {steps[currentStep - 1].label}
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface px-2.5 py-1 text-[11px] font-medium">
            <span
              aria-hidden
              className={cn("h-1.5 w-1.5 rounded-full", isReady ? "bg-success" : "bg-warning")}
            />
            {isReady ? "Pronto a emitir" : "Rascunho"} · {type.code}
          </span>
        </div>

        <ol className="mt-3 grid gap-2 sm:grid-cols-4">
          {steps.map((s, i) => {
            const n = i + 1;
            const done = n < currentStep;
            const active = n === currentStep;
            return (
              <li
                key={s.label}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2.5",
                  active
                    ? "border-primary/60 bg-primary/8"
                    : done
                      ? "border-border/70 bg-surface"
                      : "border-border/60 bg-surface/60",
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                    done
                      ? "bg-success/15 text-success"
                      : active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : n}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-[12.5px] font-medium",
                      !active && !done && "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">{s.hint}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Type selector */}
      <section className="rounded-lg border border-border/70 bg-card p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-[15px] font-semibold">Tipo de documento</h2>
          <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {type.desc}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {docTypes.map((d) => {
            const Icon = d.icon;
            const active = d.id === type.id;
            return (
              <button
                key={d.id}
                onClick={() => setType(d)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-md border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary/60 bg-primary/8 shadow-sm"
                    : "border-border/70 bg-surface hover:border-border hover:bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg border",
                    active
                      ? "border-primary/30 bg-primary/12 text-primary"
                      : "border-border/70 bg-card text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">{d.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{d.code}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* Editor */}
        <div className="space-y-4">
          <section className="rounded-lg border border-border/70 bg-card p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-[15px] font-semibold">Cliente e datas</h2>
              <Link
                to="/dashboard/clientes"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
              >
                <Users className="h-3.5 w-3.5" /> Escolher da lista
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Cliente" value={client} onChange={setClient} />
              <Field label="NUIT" value={nuit} onChange={setNuit} />
              <Field label="Data de emissão" value={date} onChange={setDate} type="date" />
              <Field
                label={isVisual || type.id === "cot" ? "Validade (dias)" : "Prazo de pagamento (dias)"}
                value={validity}
                onChange={setValidity}
                type="number"
              />
            </div>
          </section>

          <section className="rounded-lg border border-border/70 bg-card p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-display text-[15px] font-semibold">Linhas do documento</h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {isVisual
                    ? "Cada linha vira um cartão com imagem na proposta."
                    : "Descrição, quantidade e preço unitário."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard/produtos"
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium transition hover:bg-muted"
                >
                  <Package className="h-3 w-3" /> Do catálogo
                </Link>
                <button
                  onClick={() =>
                    setLines((ls) => [
                      ...ls,
                      { id: Date.now(), desc: "", note: "", qty: 1, price: 0, vat: 16, img: "" },
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary/15"
                >
                  <Plus className="h-3 w-3" /> Linha
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {lines.map((l, idx) => (
                <div
                  key={l.id}
                  className="group rounded-lg border border-border/70 bg-surface p-3 transition hover:border-border"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-2 hidden text-muted-foreground/50 sm:block">
                      <GripVertical className="h-4 w-4" />
                    </span>

                    {isVisual && (
                      <button
                        onClick={() =>
                          update(l.id, {
                            img: tileGradients[(tileGradients.indexOf(l.img) + 1) % tileGradients.length],
                          })
                        }
                        aria-label="Mudar imagem do produto"
                        className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-border/70 text-xs font-semibold text-primary-foreground"
                        style={{ background: l.img || tileGradients[idx % tileGradients.length] }}
                      >
                        {l.desc ? l.desc.charAt(0).toUpperCase() : <ImagePlus className="h-4 w-4" />}
                      </button>
                    )}

                    <div className="grid min-w-0 flex-1 gap-2">
                      <input
                        value={l.desc}
                        onChange={(e) => update(l.id, { desc: e.target.value })}
                        placeholder="Descrição do item"
                        className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-[13px] font-medium outline-none transition focus:border-primary/60"
                      />
                      {isVisual && (
                        <input
                          value={l.note}
                          onChange={(e) => update(l.id, { note: e.target.value })}
                          placeholder="Detalhe curto (cor, medida, prazo…)"
                          className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground outline-none transition focus:border-primary/60"
                        />
                      )}
                      <div className="grid grid-cols-12 gap-2">
                        <label className="col-span-3 flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
                          <span className="text-[10px] uppercase text-muted-foreground">Qtd</span>
                          <input
                            type="number"
                            value={l.qty}
                            onChange={(e) => update(l.id, { qty: Number(e.target.value) })}
                            className="w-full bg-transparent text-right text-[13px] tabular-nums outline-none"
                          />
                        </label>
                        <label className="col-span-5 flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
                          <span className="text-[10px] uppercase text-muted-foreground">Preço</span>
                          <input
                            type="number"
                            value={l.price}
                            onChange={(e) => update(l.id, { price: Number(e.target.value) })}
                            className="w-full bg-transparent text-right text-[13px] tabular-nums outline-none"
                          />
                        </label>
                        <div className="col-span-4 flex items-center justify-end gap-2">
                          <span className="text-[13px] font-semibold tabular-nums">
                            {mzn(l.qty * l.price)}
                          </span>
                          <button
                            onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
                            aria-label={`Remover ${l.desc || "linha"}`}
                            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
              <label className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
                <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[12px] text-muted-foreground">Desconto</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-14 bg-transparent text-right text-[13px] tabular-nums outline-none"
                />
              </label>
              <div className="ml-auto text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
                <p className="font-display text-lg font-semibold tabular-nums">{mzn(totals.total)} MZN</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border/70 bg-card p-5 md:p-6">
            <h2 className="font-display text-[15px] font-semibold">Notas e condições</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-3 w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] outline-none transition focus:border-primary/60"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {["Pagamento a 15 dias", "50% adiantamento", "Preços com IVA incluído", "Validade 30 dias"].map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setNotes((n) => (n ? `${n}\n${s}.` : `${s}.`))}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1 text-[11px] text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                  >
                    <Sparkles className="h-3 w-3" /> {s}
                  </button>
                ),
              )}
            </div>
          </section>
        </div>

        {/* Live preview */}
        <section className="xl:sticky xl:top-20 xl:self-start">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Pré-visualização
            </div>
            <Link
              to="/dashboard/cotacoes"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition hover:text-foreground"
            >
              Ver documentos emitidos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-elegant">
            <div className="border-b border-border/70 bg-surface px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold">Quota Studio, Lda.</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    NUIT 400987654 · Maputo, Moçambique
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-semibold uppercase text-primary">{type.label}</p>
                  <p className="text-[11px] text-muted-foreground">{reference}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-5 text-[12px]">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cliente</p>
                <p className="mt-1 truncate font-medium">{client || "—"}</p>
                <p className="text-muted-foreground">NUIT {nuit || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Data</p>
                <p className="mt-1 font-medium tabular-nums">{date}</p>
                <p className="text-muted-foreground">Validade {validity} dias</p>
              </div>
            </div>

            {isVisual ? (
              <div className="grid grid-cols-2 gap-3 px-6">
                {lines.map((l, idx) => (
                  <article key={l.id} className="overflow-hidden rounded-md border border-border/70 bg-surface">
                    <div
                      className="grid h-24 place-items-center text-2xl font-bold text-primary-foreground"
                      style={{ background: l.img || tileGradients[idx % tileGradients.length] }}
                    >
                      {l.desc ? l.desc.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="p-3">
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
              <div className="px-6">
                <div className="grid grid-cols-12 border-y border-border/70 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="col-span-6">Descrição</span>
                  <span className="col-span-2 text-right">Qtd</span>
                  <span className="col-span-4 text-right">Total</span>
                </div>
                {lines.map((l) => (
                  <div key={l.id} className="grid grid-cols-12 border-b border-border/50 py-2.5 text-[12px]">
                    <span className="col-span-6 truncate">{l.desc || "—"}</span>
                    <span className="col-span-2 text-right tabular-nums">{l.qty}</span>
                    <span className="col-span-4 text-right tabular-nums">{mzn(l.qty * l.price)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="px-6 py-5 text-[12px]">
              <Row label="Subtotal" value={mzn(totals.sub)} />
              {discount > 0 && <Row label={`Desconto ${discount}%`} value={`− ${mzn(totals.disc)}`} />}
              <Row label="IVA 16%" value={mzn(totals.vat)} />
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                <span className="font-display text-[13px] font-semibold">Total</span>
                <span className="font-display text-[17px] font-semibold tabular-nums text-primary">
                  {mzn(totals.total)} MZN
                </span>
              </div>
              {notes && (
                <p className="mt-5 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
                  {notes}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-[12px] font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] outline-none transition focus:border-primary/60 read-only:text-muted-foreground"
      />
    </div>
  );
}
