import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Save, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Field, FieldRow, SettingRow } from "@/components/app/FormSection";
import { SettingsShell, type SettingsSection } from "@/components/app/SettingsShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { shrinkImage } from "@/lib/images";
import { Camera } from "lucide-react";
import {
  changePassword,
  initialsOf,
  saveProfile,
  signOutEverywhere,
  useProfile,
  type Profile,
} from "@/lib/profile-store";

export const Route = createFileRoute("/dashboard/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil · Quota Studio" },
      { name: "description", content: "Dados pessoais, preferências de conta e segurança." },
      { property: "og:title", content: "Perfil · Quota Studio" },
      { property: "og:description", content: "Dados pessoais, preferências de conta e segurança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { profile, email, loaded } = useProfile();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Profile>(profile);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);

  // O formulário arranca com o que está guardado; só diverge quando o utilizador edita.
  useEffect(() => {
    if (loaded && !dirty) setDraft(profile);
  }, [loaded, profile, dirty]);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setDirty(true);
  };

  async function save() {
    if (!draft.firstName.trim()) return toast.error("Indique o seu nome.");
    setBusy(true);
    const ok = await saveProfile({ ...draft, firstName: draft.firstName.trim(), lastName: draft.lastName.trim() });
    setBusy(false);
    if (ok) {
      setDirty(false);
      toast.success("Perfil guardado", { description: "As alterações já estão activas." });
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next.length < 8) return toast.error("A palavra-passe deve ter pelo menos 8 caracteres.");
    if (pw.next !== pw.confirm) return toast.error("As palavras-passe não coincidem.");
    setPwBusy(true);
    const ok = await changePassword(pw.next);
    setPwBusy(false);
    if (ok) {
      setPw({ next: "", confirm: "" });
      toast.success("Palavra-passe alterada");
    }
  }

  async function endAllSessions() {
    await signOutEverywhere();
    navigate({ to: "/login" });
  }

  const sections: SettingsSection[] = [
    {
      id: "identidade",
      label: "Identidade",
      hint: "Nome, contactos, assinatura",
      title: "Identidade",
      description: "Como aparece para a sua equipa e nos documentos enviados.",
      content: (
        <>
          <div className="flex items-center gap-4">
            {draft.avatar ? (
              <img src={draft.avatar} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {initialsOf(draft, email.slice(0, 1).toUpperCase() || "Q")}
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium hover:bg-muted">
                <Camera className="h-3.5 w-3.5" /> {draft.avatar ? "Trocar fotografia" : "Carregar fotografia"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) set("avatar", await shrinkImage(f, 160));
                  }}
                />
              </label>
              {draft.avatar && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => set("avatar", undefined)}>
                  Remover
                </Button>
              )}
            </div>
          </div>
          <FieldRow>
            <Field label="Nome" htmlFor="nome">
              <Input id="nome" value={draft.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </Field>
            <Field label="Apelido" htmlFor="apelido">
              <Input id="apelido" value={draft.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="E-mail" htmlFor="email" hint="Usado para iniciar sessão. Para o alterar, contacte o suporte.">
              <Input id="email" type="email" value={email} readOnly className="text-muted-foreground" />
            </Field>
            <Field label="Telefone" htmlFor="tel">
              <Input id="tel" value={draft.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+258 84 000 0000" />
            </Field>
          </FieldRow>
          <Field label="Cargo" htmlFor="cargo">
            <Input id="cargo" value={draft.role} onChange={(e) => set("role", e.target.value)} placeholder="Administrador, Contabilista…" />
          </Field>
          <Field label="Assinatura de e-mail" htmlFor="bio" hint="Anexada às mensagens enviadas aos clientes.">
            <Textarea id="bio" rows={3} value={draft.signature} onChange={(e) => set("signature", e.target.value)} />
          </Field>
        </>
      ),
    },
    {
      id: "preferencias",
      label: "Preferências",
      hint: "Idioma, fuso, notificações",
      title: "Preferências",
      description: "Idioma, fuso horário e avisos.",
      content: (
        <>
          <FieldRow>
            <Field label="Idioma" htmlFor="idioma">
              <select id="idioma" value={draft.locale} onChange={(e) => set("locale", e.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus:border-primary">
                <option value="pt-MZ">Português (Moçambique)</option>
                <option value="pt-PT">Português (Portugal)</option>
                <option value="en">English</option>
              </select>
            </Field>
            <Field label="Fuso horário" htmlFor="fuso">
              <select id="fuso" value={draft.timezone} onChange={(e) => set("timezone", e.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus:border-primary">
                <option value="Africa/Maputo">África/Maputo (CAT)</option>
                <option value="Europe/Lisbon">Europa/Lisboa</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>
          </FieldRow>
          <SettingRow
            htmlFor="resumo"
            title="Resumo diário por e-mail"
            description="Receba todas as manhãs o estado de cobranças e facturas."
            control={<Switch id="resumo" checked={draft.dailyDigest} onCheckedChange={(v) => set("dailyDigest", v)} />}
          />
          <SettingRow
            htmlFor="wpp"
            title="Alertas no WhatsApp"
            description="Pagamentos confirmados e facturas vencidas em tempo real."
            control={<Switch id="wpp" checked={draft.whatsappAlerts} onCheckedChange={(v) => set("whatsappAlerts", v)} />}
          />
        </>
      ),
    },
    {
      id: "seguranca",
      label: "Segurança",
      hint: "Palavra-passe, sessões",
      title: "Segurança",
      description: "Proteja o acesso à sua conta.",
      content: (
        <>
          <form onSubmit={updatePassword} className="grid gap-3">
            <FieldRow>
              <Field label="Nova palavra-passe" htmlFor="pw2" hint="Mínimo 8 caracteres.">
                <Input id="pw2" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
              </Field>
              <Field label="Confirmar" htmlFor="pw3">
                <Input id="pw3" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
              </Field>
            </FieldRow>
            <div>
              <Button type="submit" size="sm" variant="outline" disabled={pwBusy || !pw.next}>
                {pwBusy ? "A alterar…" : "Alterar palavra-passe"}
              </Button>
            </div>
          </form>
          <div className="rounded-md border border-border/70 bg-surface p-4">
            <p className="text-sm font-medium">Sessões</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Se usou a conta num dispositivo partilhado, termine a sessão em todos os dispositivos. Terá de iniciar sessão de novo.
            </p>
            <Button variant="ghost" size="sm" className="mt-3 h-8 text-xs text-destructive" onClick={endAllSessions}>
              <LogOut className="h-3.5 w-3.5" /> Terminar sessão em todos os dispositivos
            </Button>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      <section className="shrink-0 rounded-lg border border-border/70 bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="pl-1 text-[12.5px] font-semibold">Perfil</span>
          <span className="hidden border-l border-border/60 pl-3 text-[11px] text-muted-foreground sm:inline">
            {email || "Os seus dados pessoais e preferências de conta."}
          </span>
          {dirty && <span className="text-[11px] text-warning-foreground dark:text-warning">Alterações por guardar</span>}
          <Button size="sm" className="ml-auto h-8" onClick={save} disabled={busy || !dirty}>
            <Save className="h-3.5 w-3.5" /> {busy ? "A guardar…" : "Guardar alterações"}
          </Button>
        </div>
      </section>

      <SettingsShell sections={sections} />
    </div>
  );
}
