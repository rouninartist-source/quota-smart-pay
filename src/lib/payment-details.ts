/**
 * Bancos moçambicanos e carteiras móveis usados nos dados de pagamento
 * impressos nos documentos. Frontend-only (sem processamento de pagamentos).
 */

export type BankId =
  | "bci"
  | "bim"
  | "standard"
  | "absa"
  | "moza"
  | "fnb"
  | "nedbank"
  | "ecobank"
  | "letshego";

export type Bank = {
  id: BankId;
  name: string;
  short: string;
  /** Cor de marca (fixa — o documento é papel). */
  color: string;
};

export const banks: Bank[] = [
  { id: "bci", name: "BCI — Banco Comercial e de Investimentos", short: "BCI", color: "#f28c00" },
  { id: "bim", name: "Millennium bim", short: "bim", color: "#0069b4" },
  { id: "standard", name: "Standard Bank Moçambique", short: "Standard", color: "#0033a1" },
  { id: "absa", name: "Absa Bank Moçambique", short: "Absa", color: "#d40000" },
  { id: "moza", name: "Moza Banco", short: "Moza", color: "#7a1e6c" },
  { id: "fnb", name: "FNB Moçambique", short: "FNB", color: "#008a5e" },
  { id: "nedbank", name: "Nedbank Moçambique", short: "Nedbank", color: "#005844" },
  { id: "ecobank", name: "Ecobank Moçambique", short: "Ecobank", color: "#0079c1" },
  { id: "letshego", name: "Letshego Bank", short: "Letshego", color: "#00a3a1" },
];

export function getBank(id?: BankId | string) {
  return banks.find((b) => b.id === id);
}

export type WalletProvider = "mpesa" | "emola";

export const walletMeta: Record<WalletProvider, { name: string; color: string; hint: string }> = {
  mpesa: { name: "M-Pesa", color: "#e2001a", hint: "84 / 85 …" },
  emola: { name: "e-Mola", color: "#f5a300", hint: "86 / 87 …" },
};

export type BankAccount = {
  bankId: BankId;
  accountName: string;
  account: string;
  nib?: string;
};

export type WalletAccount = {
  provider: WalletProvider;
  number: string;
  /** Nome que aparece ao confirmar o número no M-Pesa / e-Mola. */
  name: string;
};
