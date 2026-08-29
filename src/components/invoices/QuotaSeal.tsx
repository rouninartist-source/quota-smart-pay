import { useState } from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";

/** Código curto determinístico a partir do número do documento. */
export function verificationCode(reference: string) {
  let hash = 0;
  for (let i = 0; i < reference.length; i++) hash = (hash * 31 + reference.charCodeAt(i)) % 1_000_000_007;
  return `QT-${hash.toString(36).toUpperCase().padStart(6, "0").slice(0, 6)}`;
}

/**
 * Selo de autenticidade discreto (canto do documento). Ao clicar revela a nota
 * de que o documento foi criado pelo sistema Quota.
 */
export function QuotaSeal({ reference, compact }: { reference: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const code = verificationCode(reference);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Verificar autenticidade do documento"
        className="flex items-center gap-2 rounded-sm border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left transition hover:border-slate-300"
      >
        <ShieldCheck className="h-4 w-4 shrink-0 text-slate-700" />
        <span className="leading-tight">
          <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Verificação
          </span>
          <span className="block font-mono text-[10px] font-semibold tabular-nums text-slate-700">{code}</span>
        </span>
      </button>

      {open && (
        <div className="print:hidden absolute bottom-full right-0 z-10 mb-2 w-64 rounded-sm border border-slate-200 bg-white p-3 text-[11px] leading-relaxed text-slate-600 shadow-lg">
          <p className="flex items-center gap-1.5 font-semibold text-slate-900">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> Documento autêntico
          </p>
          <p className="mt-1.5">
            Este documento foi criado pelo sistema de facturação <strong>Quota</strong>. Código de
            verificação <span className="font-mono">{code}</span>
            {compact ? "" : ` · Referência ${reference}`}.
          </p>
          <a
            href={`/verificar/${code}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white"
          >
            Verificar online
          </a>
        </div>
      )}

    </div>
  );
}
