export function formatMZN(value: number, opts?: { compact?: boolean; decimals?: boolean }) {
  if (opts?.compact && Math.abs(value) >= 1000) {
    const units = [
      { v: 1_000_000_000, s: "B" },
      { v: 1_000_000, s: "M" },
      { v: 1_000, s: "k" },
    ];
    const u = units.find((x) => Math.abs(value) >= x.v)!;
    return `${(value / u.v).toFixed(1).replace(".0", "").replace(".", ",")}${u.s}`;
  }
  return new Intl.NumberFormat("pt-MZ", {
    minimumFractionDigits: opts?.decimals === false ? 0 : 2,
    maximumFractionDigits: opts?.decimals === false ? 0 : 2,
  }).format(value);
}

export function formatDate(iso: string, style: "short" | "long" = "short") {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: style === "long" ? "long" : "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function relativeDays(iso: string) {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.round((d - now) / 86_400_000);
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  if (days === -1) return "ontem";
  if (days > 1) return `em ${days} dias`;
  return `há ${Math.abs(days)} dias`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}
