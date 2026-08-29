import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { signUp, signIn } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  ImagePlus,
  Trash2,
  UserRound,
  Building2,
  Sparkles,
} from "lucide-react";
import loginVisual from "@/assets/login-visual.jpg";
import { saveCompany } from "@/lib/company-store";

export const Route = createFileRoute("/registo")({
  head: () => ({
    meta: [
      { title: "Criar conta · Quota" },
      {
        name: "description",
        content:
          "Crie a sua conta Quota em três passos: dados pessoais, dados da empresa e preferências de facturação em MZN.",
      },
      { property: "og:title", content: "Criar conta · Quota" },
      {
        property: "og:description",
        content: "Comece a emitir cotações, facturas e recibos em Moçambique em três passos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Registo,
});

const sectors = [
  "Comércio a retalho",
  "Comércio a grosso",
  "Construção civil",
  "Consultoria e serviços",
  "Logística e transportes",
  "Restauração e hotelaria",
  "Saúde e farmácia",
  "Tecnologia e software",
  "Educação e formação",
  "Outro",
];

const ivaRegimes = [
  { id: "normal", label: "Regime normal (IVA 16%)", hint: "Facturas com IVA discriminado" },
  { id: "isento", label: "Isento de IVA", hint: "Documentos sem IVA aplicado" },
  { id: "simplificado", label: "Regime simplificado", hint: "Pequenos contribuintes" },
];

const steps = [
  { n: 1, label: "A sua conta", icon: UserRound },
  { n: 2, label: "A sua empresa", icon: Building2 },
  { n: 3, label: "Pronto para facturar", icon: Sparkles },
];

const inputCls =
  "mt-1.5 w-full rounded-md border border-border bg-surface px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:bg-card";

function Registo() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Passo 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Passo 2
  const [companyName, setCompanyName] = useState("");
  const [nuit, setNuit] = useState("");
  const [sector, setSector] = useState(sectors[0]);

  // Passo 3
  const [iva, setIva] = useState("normal");
  const [logo, setLogo] = useState<string | null>(null);

  const validate = () => {
    if (step === 1) {
      if (!fullName.trim()) return "Indique o seu nome completo.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Indique um e-mail válido.";
      if (phone.replace(/\D/g, "").length < 9) return "Indique um telefone válido.";
      if (password.length < 6) return "A palavra-passe deve ter pelo menos 6 caracteres.";
    }
    if (step === 2) {
      if (!companyName.trim()) return "Indique o nome da empresa.";
      if (nuit.replace(/\D/g, "").length !== 9) return "O NUIT deve ter 9 dígitos.";
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(3, s + 1));
  };

  /**
   * Registo self-service: cria a conta, cria a empresa e associa-a ao
   * utilizador. O `create_org` do Postgres faz as duas últimas coisas numa só
   * transacção — sem isso, um registo a meio deixava um utilizador sem empresa
   * e sem acesso a nada.
   */
  const finish = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    const created = await signUp(email.trim(), password);
    if (created.error) {
      setBusy(false);
      setError(created.error);
      return;
    }

    // Sem sessão devolvida, o projecto exige confirmação por email.
    if ("needsConfirmation" in created && created.needsConfirmation) {
      const signedIn = await signIn(email.trim(), password);
      if (signedIn.error) {
        setBusy(false);
        setError(
          "Conta criada. Confirme o email e depois inicie sessão para terminar a configuração da empresa.",
        );
        return;
      }
    }

    const sb = supabase;
    if (sb) {
      const { error: orgError } = await sb.rpc("create_org", {
        p_name: companyName.trim(),
        p_nuit: nuit.trim(),
        p_sector: sector,
        p_iva_regime: iva,
      });
      if (orgError && !orgError.message.includes("já pertence")) {
        setBusy(false);
        setError(orgError.message);
        return;
      }
    }

    await saveCompany({
      name: companyName.trim(),
      nuit: nuit.trim(),
      email: email.trim(),
      phone: phone.trim(),
      ...(logo ? { logo } : {}),
    });

    setBusy(false);
    navigate({ to: "/dashboard" });
  };

  const onLogo = (file?: File | null) => {
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setError("O logotipo deve ter menos de 1,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 md:px-14">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary">
            <span className="font-display text-xs font-bold text-primary-foreground">Q</span>
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">Quota</span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-fade-up">
            {/* Stepper */}
            <ol className="flex items-center gap-2">
              {steps.map((s) => {
                const done = step > s.n;
                const active = step === s.n;
                return (
                  <li key={s.n} className="flex flex-1 items-center gap-2">
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border text-[12px] font-semibold ${
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : active
                            ? "border-primary text-primary"
                            : "border-border text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : s.n}
                    </span>
                    <span className="h-px flex-1 bg-border last:hidden" />
                  </li>
                );
              })}
            </ol>

            <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Passo {step} de 3
            </p>
            <h1 className="mt-1.5 font-display text-[26px] font-semibold tracking-tight">
              {step === 1 && "Criar a sua conta"}
              {step === 2 && "A sua empresa"}
              {step === 3 && "Pronto para facturar"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === 1 && "Os seus dados de acesso ao Quota."}
              {step === 2 && "Aparecem nas facturas, cotações e recibos."}
              {step === 3 && "Defina a moeda, o IVA e o logotipo dos documentos."}
            </p>

            <form
              className="mt-7 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                step === 3 ? finish() : next();
              }}
            >
              {step === 1 && (
                <>
                  <div>
                    <label htmlFor="nome" className="text-[13px] font-medium">Nome completo</label>
                    <input id="nome" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} placeholder="Helena Macuácua" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-[13px] font-medium">E-mail</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} placeholder="nome@empresa.co.mz" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="tel" className="text-[13px] font-medium">Telefone</label>
                    <input id="tel" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="+258 84 000 0000" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="pw" className="text-[13px] font-medium">Palavra-passe</label>
                    <div className="relative mt-1.5">
                      <input
                        id="pw"
                        type={show ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        maxLength={72}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full rounded-md border border-border bg-surface px-3.5 py-3 pr-11 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:bg-card"
                      />
                      <button
                        type="button"
                        onClick={() => setShow((v) => !v)}
                        aria-label={show ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                      >
                        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label htmlFor="empresa" className="text-[13px] font-medium">Nome da empresa</label>
                    <input id="empresa" value={companyName} onChange={(e) => setCompanyName(e.target.value)} maxLength={120} placeholder="Quota Retail, Lda" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="nuit" className="text-[13px] font-medium">NUIT</label>
                    <input id="nuit" value={nuit} onChange={(e) => setNuit(e.target.value)} inputMode="numeric" maxLength={12} placeholder="400 000 000" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="sector" className="text-[13px] font-medium">Sector de actividade</label>
                    <select id="sector" value={sector} onChange={(e) => setSector(e.target.value)} className={inputCls}>
                      {sectors.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="rounded-md border border-border bg-surface px-3.5 py-3">
                    <p className="text-[13px] font-medium">Moeda</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">MZN · Metical moçambicano</p>
                  </div>

                  <div>
                    <p className="text-[13px] font-medium">Regime de IVA</p>
                    <div className="mt-1.5 space-y-2">
                      {ivaRegimes.map((r) => (
                        <label
                          key={r.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 transition ${
                            iva === r.id ? "border-primary bg-primary/5" : "border-border bg-surface hover:bg-muted"
                          }`}
                        >
                          <input
                            type="radio"
                            name="iva"
                            value={r.id}
                            checked={iva === r.id}
                            onChange={() => setIva(r.id)}
                            className="mt-1 accent-[hsl(var(--primary))]"
                          />
                          <span>
                            <span className="block text-sm font-medium">{r.label}</span>
                            <span className="block text-[12px] text-muted-foreground">{r.hint}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[13px] font-medium">Adicionar logotipo <span className="text-muted-foreground">(opcional)</span></p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      onChange={(e) => onLogo(e.target.files?.[0])}
                    />
                    {logo ? (
                      <div className="mt-1.5 flex items-center gap-3 rounded-md border border-border bg-surface p-3">
                        <img src={logo} alt="Pré-visualização do logotipo da empresa" className="h-12 w-12 rounded-md object-contain" />
                        <button type="button" onClick={() => fileRef.current?.click()} className="text-[13px] font-medium hover:text-primary">
                          Alterar
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogo(null)}
                          className="ml-auto grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                          aria-label="Remover logotipo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface px-4 py-5 text-sm text-muted-foreground transition hover:bg-muted"
                      >
                        <ImagePlus className="h-4 w-4" /> Carregar logotipo (PNG ou JPG)
                      </button>
                    )}
                  </div>
                </>
              )}

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep((s) => s - 1);
                    }}
                    className="flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition hover:bg-muted"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                )}
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  {step === 3 ? "Começar a facturar" : "Continuar"} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-[13px] text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="font-medium text-foreground hover:text-primary">
                Iniciar sessão
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground lg:text-left">
          © 2026 Quota · Maputo, Moçambique
        </p>
      </div>

      <aside className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-4 overflow-hidden rounded-lg bg-gradient-brand">
          <img
            src={loginVisual}
            alt="Empresária moçambicana a criar a sua conta Quota num tablet"
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
              Três passos
            </p>
            <p className="mt-4 font-display text-[30px] font-semibold leading-[1.15] tracking-tight text-primary-foreground">
              Conta criada, primeira factura em minutos.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
              Dados da empresa, NUIT e logotipo entram automaticamente nas suas
              cotações, facturas e recibos.
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
