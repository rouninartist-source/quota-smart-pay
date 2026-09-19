/** Barra vermelha na lateral do documento anulado — visível no ecrã e na impressão. */
export function CancelledBand() {
  return (
    <div
      aria-label="Documento anulado"
      className="absolute inset-y-0 left-0 z-10 flex w-8 items-center justify-center bg-red-600 text-white print:bg-red-600"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      <span className="rotate-180 text-[13px] font-bold uppercase tracking-[0.35em]" style={{ writingMode: "vertical-rl" }}>
        Anulado
      </span>
    </div>
  );
}
