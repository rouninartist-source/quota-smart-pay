import { ArrowRight, FileText, ReceiptText, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import monitor from "@/assets/monitor-mockup.png";

const chips = [
  { icon: FileText, label: "Cotações" },
  { icon: ReceiptText, label: "Facturas & recibos" },
  { icon: ShieldCheck, label: "Selo de verificação" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Camadas de cor da identidade Quota */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] bg-gradient-mesh" />
      <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/25 blur-[140px]" />
      <div className="pointer-events-none absolute left-[12%] top-64 -z-10 h-56 w-56 rounded-full bg-primary-glow/30 blur-[100px]" />

      <div className="mx-auto max-w-5xl px-6 pb-4 pt-20 text-center md:pt-28">
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Feito para Moçambique · MZN · NUIT · IVA
        </div>

        <h1 className="animate-fade-up mt-6 text-balance font-display text-[40px] font-semibold leading-[1.03] tracking-tight md:text-[64px]">
          Cotações, facturas e recibos{" "}
          <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
            em minutos
          </span>
          .
        </h1>

        <p className="animate-fade-up mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground md:text-base">
          Emita documentos profissionais com os seus dados de pagamento — banco, M-Pesa ou e-Mola —
          e envie ao cliente pelo WhatsApp ou email. Sem folhas de cálculo.
        </p>

        <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90"
          >
            Começar grátis <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#produto"
            className="inline-flex items-center rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium transition hover:bg-muted"
          >
            Ver como funciona
          </a>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {chips.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card/60 px-2.5 py-1 text-[12px] text-muted-foreground backdrop-blur"
            >
              <Icon className="h-3.5 w-3.5 text-primary" /> {label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-6 pb-20">
        <img
          src={monitor}
          alt="Quota aberto num computador"
          width={1200}
          height={896}
          className="animate-fade-up mx-auto w-full max-w-3xl drop-shadow-2xl"
          style={{ animationDelay: "120ms" }}
        />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          14 dias grátis · Sem cartão · Web e telemóvel
        </p>
      </div>
    </section>
  );
}
