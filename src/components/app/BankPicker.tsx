import { Check } from "lucide-react";
import { banks, type BankId } from "@/lib/payment-details";
import { BankMark } from "@/components/invoices/PaymentLogos";
import { cn } from "@/lib/utils";

/** Escolha do banco pelo logótipo — em vez de um select de texto. */
export function BankPicker({ value, onChange, hideNone }: { value?: BankId; onChange: (id?: BankId) => void; hideNone?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Banco" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {!hideNone && <button
        type="button"
        role="radio"
        aria-checked={!value}
        onClick={() => onChange(undefined)}
        className={cn(
          "flex h-[68px] items-center justify-center rounded-lg border text-[11.5px] font-medium transition",
          !value ? "border-primary bg-primary/5 text-foreground" : "border-border/70 bg-surface text-muted-foreground hover:border-border",
        )}
      >
        Sem conta bancária
      </button>}
      {banks.map((b) => {
        const on = value === b.id;
        return (
          <button
            key={b.id}
            type="button"
            role="radio"
            aria-checked={on}
            title={b.name}
            onClick={() => onChange(b.id)}
            className={cn(
              "relative flex h-[68px] flex-col items-center justify-center gap-1.5 rounded-lg border px-2 transition",
              on ? "border-primary bg-primary/5" : "border-border/70 bg-surface hover:border-border",
            )}
          >
            <BankMark id={b.id} size="md" />
            <span className="truncate text-[10px] text-muted-foreground">{b.name}</span>
            {on && (
              <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-2.5 w-2.5" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
