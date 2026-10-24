import qrcode from "qrcode-generator";
import { verificationCode, verificationUrl } from "@/lib/verify";

/**
 * Código QR de verificação no rodapé do documento — substitui o antigo selo
 * "Verificação QT-…". Desenhado em SVG: nítido na impressão e no PDF.
 */
export function DocQr({ reference, orgId, label }: { reference: string; orgId?: string; label: string }) {
  const qr = qrcode(0, "M");
  qr.addData(verificationUrl(reference, orgId));
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  const code = verificationCode(reference);

  return (
    <div className="flex shrink-0 items-end gap-2">
      <div className="text-right leading-tight">
        <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</span>
        <span className="block font-mono text-[9px] font-semibold tabular-nums text-slate-600">{code}</span>
      </div>
      <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="h-[68px] w-[68px] shrink-0" shapeRendering="crispEdges" role="img" aria-label={`QR ${code}`}>
        <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="#fff" />
        <path d={d} fill="#0f172a" />
      </svg>
    </div>
  );
}
