import { useState } from "react";
import { getBank, walletMeta, type BankId, type WalletProvider } from "@/lib/payment-details";

/**
 * Logótipos dos bancos e carteiras. Vêm de /public/banks/<id>.svg — basta
 * substituir o ficheiro pelo oficial. Se faltar, cai numa marca em texto com
 * a cor do banco. Cores fixas de propósito: o documento é papel/PDF.
 */
export function BankMark({ id, size = "sm" }: { id: BankId; size?: "sm" | "md" }) {
  const bank = getBank(id);
  const [broken, setBroken] = useState(false);
  if (!bank) return null;
  const h = size === "md" ? "h-9" : "h-6";
  if (!broken) {
    return (
      <img
        src={`/banks/${bank.id}.svg`}
        alt={bank.name}
        className={`${h} w-auto rounded-sm`}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span
      className={`inline-flex ${h} items-center gap-1.5 rounded-sm px-2 text-[10px] font-bold uppercase tracking-[0.06em] text-white`}
      style={{ backgroundColor: bank.color }}
    >
      {bank.short}
    </span>
  );
}

export function WalletMark({ provider }: { provider: WalletProvider }) {
  const meta = walletMeta[provider];
  const [broken, setBroken] = useState(false);
  if (!broken) {
    return <img src={`/banks/${provider}.svg`} alt={meta.name} className="h-6 w-auto rounded-sm" onError={() => setBroken(true)} />;
  }
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-sm px-2 text-[10px] font-bold tracking-[0.04em] text-white"
      style={{ backgroundColor: meta.color }}
    >
      {meta.name}
    </span>
  );
}
