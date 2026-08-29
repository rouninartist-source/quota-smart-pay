import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import loginVisual from "@/assets/login-visual.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · Quota" },
      { name: "description", content: "Aceda à sua conta Quota para emitir facturas, cotações e recibos e acompanhar cobranças." },
      { property: "og:title", content: "Entrar · Quota" },
      { property: "og:description", content: "Aceda à sua conta Quota para gerir facturação e cobranças." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const [show, setShow] = useState(false);

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Form */}
      <div className="flex flex-col px-6 py-8 md:px-14">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary">
            <span className="font-display text-xs font-bold text-primary-foreground">Q</span>
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">Quota</span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm animate-fade-up">
            <h1 className="font-display text-[28px] font-semibold tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre para continuar a facturar.
            </p>

            <form
              className="mt-9 space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <div>
                <label htmlFor="email" className="text-[13px] font-medium">E-mail</label>
                <input
                  id="email"
                  type="email"
                  placeholder="nome@empresa.co.mz"
                  className="mt-1.5 w-full rounded-md border border-border bg-surface px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:bg-card"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[13px] font-medium">Palavra-passe</label>
                  <a href="#" className="text-[12px] text-muted-foreground hover:text-foreground">
                    Esqueceu-se?
                  </a>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-border bg-surface px-3.5 py-3 pr-11 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:bg-card"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Link
                to="/empresas"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Iniciar sessão <ArrowRight className="h-4 w-4" />
              </Link>
            </form>

            <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition hover:bg-muted">
              <GoogleMark /> Continuar com Google
            </button>

            <p className="mt-8 text-center text-[13px] text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/registo" className="font-medium text-foreground hover:text-primary">
                Criar conta
              </Link>
            </p>

          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground lg:text-left">
          © 2026 Quota · Maputo, Moçambique
        </p>
      </div>

      {/* Visual */}
      <aside className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-4 overflow-hidden rounded-lg bg-gradient-brand">
          <img
            src={loginVisual}
            alt="Empresária moçambicana a emitir uma factura no Quota através de um tablet"
            width={1024}
            height={1536}
            loading="lazy"
            className="h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-deep/95 via-primary-deep/55 to-transparent" />
        </div>
        <div className="relative flex h-full flex-col justify-end p-14">
          <div className="max-w-md">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/60">
              Quota Studio
            </p>
            <p className="mt-4 font-display text-[30px] font-semibold leading-[1.15] tracking-tight text-primary-foreground">
              Da cotação ao recibo, num fluxo só.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
              Emita documentos com pré-visualização em tempo real, envie por
              WhatsApp e receba por M-Pesa.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { v: "2 min", l: "para facturar" },
                { v: "100%", l: "conforme IVA" },
                { v: "24/7", l: "acesso móvel" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-display text-xl font-semibold text-primary-foreground">{s.v}</p>
                  <p className="mt-0.5 text-[11px] text-primary-foreground/60">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.4 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
