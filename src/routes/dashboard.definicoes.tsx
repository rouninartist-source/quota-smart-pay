import { createFileRoute } from "@tanstack/react-router";
import { Settings, Upload, Trash2, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Field, FieldRow } from "@/components/app/FormSection";
import { SettingsShell, type SettingsSection } from "@/components/app/SettingsShell";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";
import { defaultCompany, resetCompany, saveCompany, useCompany, type Company } from "@/lib/company-store";
import { useInvoices } from "@/lib/invoices-store";
import {
  banks,
  walletMeta,
  type BankId,
  type WalletAccount,
  type WalletProvider,
} from "@/lib/payment-details";

export const Route = createFileRoute("/dashboard/definicoes")({
  head: () => ({
    meta: [
      { title: "Definições da empresa · Quota Studio" },
      {
        name: "description",
        content: "Defina o nome, NUIT, morada, contactos e logotipo da empresa que aparecem nas facturas e PDFs.",
      },
      { property: "og:title", content: "Definições da empresa · Quota Studio" },
      { property: "og:description", content: "Configure os dados oficiais que aparecem nos seus documentos fiscais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Definicoes,
});

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Definicoes() {
  const company = useCompany();
  const invoices = useInvoices();
  const [draft, setDraft] = useState<Company>(company);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(company);
  }, [company]);

  function onLogo(file?: File) {
    if (!file) return;
    if (file.size > 600_000) return setError("O logotipo deve ter menos de 600 KB.");
    const reader = new FileReader();
    reader.onload = () => {
      setError(undefined);
      setDraft((d) => ({ ...d, logo: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return setError("Indique o nome da empresa.");
    setError(undefined);
    saveCompany(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const preview = invoices[0];

  const sections: SettingsSection[] = [
    {
      id: "empresa",
      label: "Empresa",
      hint: "Nome, NUIT, morada",
      title: "Empresa",
      description: "Nome legal, NUIT e morada usados no documento fiscal.",
      content: (
        <>
          <FieldRow>
                      <Field label="Nome da empresa" htmlFor="co-name">
                        <input id="co-name" className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                      </Field>
                      <Field label="NUIT" htmlFor="co-nuit">
                        <input id="co-nuit" className={inputClass} value={draft.nuit} onChange={(e) => setDraft({ ...draft, nuit: e.target.value })} />
                      </Field>
                    </FieldRow>
                    <Field label="Morada" htmlFor="co-addr">
                      <input id="co-addr" className={inputClass} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
                    </Field>
                    <FieldRow>
                      <Field label="Email de facturação" htmlFor="co-email">
                        <input id="co-email" type="email" className={inputClass} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
                      </Field>
                      <Field label="Telefone" htmlFor="co-phone">
                        <input id="co-phone" className={inputClass} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                      </Field>
                    </FieldRow>
        </>
      ),
    },
    {
      id: "logotipo",
      label: "Logotipo",
      hint: "Imagem no topo da factura",
      title: "Logotipo",
      description: "PNG ou JPG até 600 KB. Aparece no topo da factura.",
      content: (
        <>
          <div className="flex flex-wrap items-center gap-4 rounded-md border border-border/70 bg-card p-4">
                      <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-md border border-border bg-muted">
                        {draft.logo ? (
                          <img src={draft.logo} alt="Pré-visualização do logotipo" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-[10px] font-semibold uppercase text-muted-foreground">sem logo</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2.5 text-xs font-semibold hover:bg-muted"
                        >
                          <Upload className="h-3.5 w-3.5" /> Carregar logotipo
                        </button>
                        {draft.logo && (
                          <button
                            type="button"
                            onClick={() => setDraft({ ...draft, logo: undefined })}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remover
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                        onChange={(e) => onLogo(e.target.files?.[0] ?? undefined)}
                      />
                    </div>
        </>
      ),
    },
    {
      id: "pagamento",
      label: "Dados de pagamento",
      hint: "Banco, M-Pesa, e-Mola",
      title: "Dados de pagamento",
      description: "Conta bancária e carteiras móveis impressas no documento.",
      content: (
        <>
          <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.showPaymentDetails}
                        onChange={(e) => setDraft({ ...draft, showPaymentDetails: e.target.checked })}
                        className="h-4 w-4 rounded-sm accent-[var(--primary)]"
                      />
                      Mostrar o bloco de dados de pagamento nos documentos
                    </label>

                    <FieldRow>
                      <Field label="Banco" htmlFor="co-bank">
                        <select
                          id="co-bank"
                          className={inputClass}
                          value={draft.bank?.bankId ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              bank: e.target.value
                                ? {
                                    accountName: draft.bank?.accountName ?? draft.name,
                                    account: draft.bank?.account ?? "",
                                    nib: draft.bank?.nib,
                                    bankId: e.target.value as BankId,
                                  }
                                : undefined,
                            })
                          }
                        >
                          <option value="">Sem conta bancária</option>
                          {banks.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Titular da conta" htmlFor="co-bank-name">
                        <input
                          id="co-bank-name"
                          className={inputClass}
                          disabled={!draft.bank}
                          value={draft.bank?.accountName ?? ""}
                          onChange={(e) =>
                            setDraft({ ...draft, bank: { ...draft.bank!, accountName: e.target.value } })
                          }
                        />
                      </Field>
                    </FieldRow>
                    <FieldRow>
                      <Field label="Número de conta" htmlFor="co-bank-acc">
                        <input
                          id="co-bank-acc"
                          className={inputClass}
                          disabled={!draft.bank}
                          value={draft.bank?.account ?? ""}
                          onChange={(e) => setDraft({ ...draft, bank: { ...draft.bank!, account: e.target.value } })}
                        />
                      </Field>
                      <Field label="NIB (opcional)" htmlFor="co-bank-nib">
                        <input
                          id="co-bank-nib"
                          className={inputClass}
                          disabled={!draft.bank}
                          value={draft.bank?.nib ?? ""}
                          onChange={(e) => setDraft({ ...draft, bank: { ...draft.bank!, nib: e.target.value } })}
                        />
                      </Field>
                    </FieldRow>

                    {(["mpesa", "emola"] as WalletProvider[]).map((provider) => {
                      const wallet = (draft.wallets ?? []).find((w) => w.provider === provider);
                      const meta = walletMeta[provider];
                      const update = (patch: Partial<WalletAccount>) => {
                        const others = (draft.wallets ?? []).filter((w) => w.provider !== provider);
                        const next: WalletAccount = {
                          provider,
                          number: wallet?.number ?? "",
                          name: wallet?.name ?? "",
                          ...patch,
                        };
                        setDraft({
                          ...draft,
                          wallets: next.number || next.name ? [...others, next] : others,
                        });
                      };
                      return (
                        <div key={provider} className="rounded-md border border-border/70 bg-card p-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex h-6 items-center rounded-sm px-2 text-[10px] font-bold text-white"
                              style={{ backgroundColor: meta.color }}
                            >
                              {meta.name}
                            </span>
                            <span className="text-xs text-muted-foreground">Prefixos {meta.hint}</span>
                          </div>
                          <FieldRow>
                            <Field label="Número" htmlFor={`w-${provider}-num`}>
                              <input
                                id={`w-${provider}-num`}
                                className={inputClass}
                                placeholder="84 000 0000"
                                value={wallet?.number ?? ""}
                                onChange={(e) => update({ number: e.target.value })}
                              />
                            </Field>
                            <Field label="Nome que aparece na confirmação" htmlFor={`w-${provider}-name`}>
                              <input
                                id={`w-${provider}-name`}
                                className={inputClass}
                                placeholder="NOME DA EMPRESA"
                                value={wallet?.name ?? ""}
                                onChange={(e) => update({ name: e.target.value })}
                              />
                            </Field>
                          </FieldRow>
                        </div>
                      );
                    })}
        </>
      ),
    },
    {
      id: "rodape",
      label: "Rodapé do PDF",
      hint: "Nota legal e referência",
      title: "Rodapé do PDF",
      description: "Nota legal e referência de pagamento no fim do documento.",
      content: (
        <>
          <Field label="Nota de pagamento" htmlFor="co-note">
                      <textarea
                        id="co-note"
                        rows={3}
                        className={inputClass}
                        value={draft.paymentNote}
                        onChange={(e) => setDraft({ ...draft, paymentNote: e.target.value })}
                      />
                    </Field>
        </>
      ),
    },
    // O layout escolhido não previa pré-visualização; mantida como secção para
    // não perder a funcionalidade que a página já tinha.
    {
      id: "previsualizacao",
      label: "Pré-visualização",
      hint: "Como sai a factura",
      title: "Pré-visualização",
      description: "Documento gerado com os dados já guardados.",
      content: preview ? (
        <InvoiceDocument invoice={preview} />
      ) : (
        <p className="text-[12px] text-muted-foreground">Sem documentos para pré-visualizar.</p>
      ),
    },
  ];

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 md:h-full md:min-h-0">
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 pl-1 text-[12.5px] font-semibold">
            <Settings className="h-3.5 w-3.5 text-primary" /> Definições
          </span>
          <span className="hidden border-l border-border/60 pl-3 text-[11px] text-muted-foreground sm:inline">
            Estes dados aparecem no cabeçalho e rodapé de todas as facturas e PDFs.
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {error && (
              <span role="alert" className="text-[11px] font-medium text-destructive">
                {error}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                resetCompany();
                setDraft(defaultCompany);
              }}
              className="rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium transition hover:bg-muted"
            >
              Restaurar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {saved ? <Check className="h-3.5 w-3.5" /> : null}
              {saved ? "Guardado" : "Guardar"}
            </button>
          </div>
        </div>
      </section>

      <SettingsShell sections={sections} />
    </form>
  );
}
