import { getBank, walletMeta, type BankId, type WalletProvider } from "@/lib/payment-details";

/**
 * Marcas em SVG simples (wordmark) para os bancos e carteiras móveis.
 * Cores fixas de propósito: o documento é papel/PDF.
 */
export function BankMark({ id }: { id: BankId }) {
  const bank = getBank(id);
  if (!bank) return null;
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-sm px-2 text-[10px] font-bold uppercase tracking-[0.06em] text-white"
      style={{ backgroundColor: bank.color }}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true" fill="currentColor">
        <path d="M12 2 2 7v2h20V7L12 2Zm-7 9v8H3v2h18v-2h-2v-8h-2v8h-3v-8h-2v8H9v-8H5Z" />
      </svg>
      {bank.short}
    </span>
  );
}

export function WalletMark({ provider }: { provider: WalletProvider }) {
  const meta = walletMeta[provider];
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-sm px-2 text-[10px] font-bold tracking-[0.04em] text-white"
      style={{ backgroundColor: meta.color }}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true" fill="currentColor">
        <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 3v11h10V5H7Zm5 13.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z" />
      </svg>
      {meta.name}
    </span>
  );
}
