import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Company } from "@/lib/company-store";
import type { DocTemplateId } from "@/lib/doc-templates";
import { formatDate } from "@/lib/format";
import { docText, type DocLang } from "@/lib/doc-text";
import { DocQr } from "@/components/invoices/DocQr";
import { CancelledBand } from "@/components/invoices/CancelledBand";

/**
 * Estrutura comum aos três layouts (Clássico, Básico Claro, Básico Escuro).
 *
 * A estrutura é a do Clássico — logotipo no topo, emitente e cliente lado a
 * lado, tabela, totais, rodapé com QR. Cada tema só muda cores e formas.
 */
export type DocTheme = "classico" | "basic-claro" | "basic-escuro";

export function themeOf(id: DocTemplateId): DocTheme {
  return id === "basic-claro" || id === "basic-escuro" ? id : "classico";
}

export const themeStyles = (theme: DocTheme) => {
  const basic = theme !== "classico";
  const dark = theme === "basic-escuro";
  return {
    basic,
    dark,
    /** Bloco do cabeçalho (logo, título, emitente, cliente). */
    head: basic ? cn("rounded-2xl px-7 py-6", dark ? "bg-slate-900 text-white" : "bg-slate-100/80 text-slate-900") : "border-b border-slate-200 pb-6",
    label: cn("text-[10px] font-bold uppercase tracking-[0.18em]", dark ? "text-slate-400" : "text-slate-400"),
    muted: dark ? "text-slate-300" : "text-slate-500",
    tableHead: basic
      ? "text-[11px] text-slate-500 [&>th]:pb-3"
      : "border-y border-slate-200 text-[10px] uppercase tracking-[0.14em] text-slate-500 [&>th]:py-2.5",
    row: basic ? "" : "border-b border-slate-100",
    totals: basic ? "rounded-xl bg-slate-100/80 p-5" : "",
    box: basic ? "rounded-xl bg-slate-50 p-4" : "rounded-sm border border-slate-200 p-4",
  };
};

/** Folha A4 com o cabeçalho comum. `side` é o bloco do cliente (ou "Recebido de"). */
export function DocSheet({
  theme,
  company,
  lang,
  title,
  reference,
  dates,
  side,
  cancelled,
  children,
}: {
  theme: DocTheme;
  company: Company;
  lang: DocLang;
  title: string;
  reference: string;
  dates: [string, string][];
  side: ReactNode;
  cancelled?: boolean;
  children: ReactNode;
}) {
  const s = themeStyles(theme);
  const tx = docText(lang);
  return (
    <div className={cn("invoice-sheet relative mx-auto w-full max-w-[820px] overflow-hidden bg-white text-[13px] text-slate-900 shadow-card", cancelled && "pl-8")}>
      {cancelled && <CancelledBand />}
      <div className="p-8 md:p-12">
        <header className={s.head}>
          {/* Linha 1: área reservada ao logotipo · tipo, número e datas */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex h-16 min-w-[160px] items-center">
              {company.logo && <img src={company.logo} alt={`Logotipo de ${company.name}`} className="max-h-16 max-w-[220px] object-contain object-left" />}
            </div>
            <div className="text-right">
              <p className={cn("text-[11px] font-bold uppercase tracking-[0.18em]", s.dark ? "text-slate-400" : "text-slate-400")}>{title}</p>
              <p className="font-display text-xl font-semibold tabular-nums">{reference}</p>
              <p className={cn("mt-1 text-[12px] tabular-nums", s.muted)}>
                {dates.map(([label, iso], i) => (
                  <span key={label} className="block">
                    {label}: <span className={cn(i > 0 && "font-medium", i > 0 && (s.dark ? "text-white" : "text-slate-700"))}>{formatDate(iso)}</span>
                  </span>
                ))}
              </p>
            </div>
          </div>

          {/* Linha 2: emitente à esquerda, cliente à direita, na mesma altura */}
          <div className="mt-6 grid grid-cols-2 gap-8">
            <div className="min-w-0">
              <p className={s.label}>{tx.issuedBy}</p>
              <p className="mt-1.5 font-display text-[17px] font-semibold tracking-tight">{company.name}</p>
              <p className={cn("mt-1 text-[12px] leading-relaxed", s.muted)}>
                {company.nuit && <>NUIT {company.nuit}<br /></>}
                {company.address && <>{company.address}<br /></>}
                {[company.email, company.phone].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="min-w-0 text-right">{side}</div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

/** Bloco de uma parte (cliente ou "Recebido de"), alinhado à direita. */
export function PartyBlock({ theme, label, party }: { theme: DocTheme; label: string; party: { name: string; nuit?: string; address?: string; email?: string; phone?: string } }) {
  const s = themeStyles(theme);
  return (
    <>
      <p className={s.label}>{label}</p>
      <p className="mt-1.5 font-display text-[17px] font-semibold tracking-tight">{party.name}</p>
      <p className={cn("mt-1 text-[12px] leading-relaxed", s.muted)}>
        {party.nuit && <>NUIT {party.nuit}<br /></>}
        {party.address && <>{party.address}<br /></>}
        {[party.email, party.phone].filter(Boolean).join(" · ")}
      </p>
    </>
  );
}

/** Rodapé: texto legal à esquerda, QR de verificação à direita. */
export function DocFooter({ lang, reference, orgId, children }: { lang: DocLang; reference: string; orgId?: string; children?: ReactNode }) {
  const tx = docText(lang);
  return (
    <footer className="mt-10 flex items-end justify-between gap-6 border-t border-slate-200 pt-5 text-[11px] leading-relaxed text-slate-500">
      <div className="min-w-0 max-w-[70%]">
        {children}
        <p>{tx.footer}</p>
      </div>
      <DocQr reference={reference} orgId={orgId} label={tx.verify} />
    </footer>
  );
}
