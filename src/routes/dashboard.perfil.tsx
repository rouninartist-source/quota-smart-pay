import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { Field, FieldRow, SettingRow } from "@/components/app/FormSection";
import { SettingsShell, type SettingsSection } from "@/components/app/SettingsShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/dashboard/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil · Quota Studio" },
      { name: "description", content: "Dados pessoais, preferências de conta, segurança e sessões activas." },
      { property: "og:title", content: "Perfil · Quota Studio" },
      { property: "og:description", content: "Dados pessoais, preferências de conta, segurança e sessões activas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
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
                      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                        HM
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">Carregar fotografia</Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">Remover</Button>
                      </div>
                    </div>
                    <FieldRow>
                      <Field label="Nome" htmlFor="nome"><Input id="nome" defaultValue="Helena" /></Field>
                      <Field label="Apelido" htmlFor="apelido"><Input id="apelido" defaultValue="Macuácua" /></Field>
                    </FieldRow>
                    <FieldRow>
                      <Field label="E-mail" htmlFor="email" hint="Usado para iniciar sessão."><Input id="email" type="email" defaultValue="helena@quota.co.mz" /></Field>
                      <Field label="Telefone" htmlFor="tel"><Input id="tel" defaultValue="+258 84 123 4567" /></Field>
                    </FieldRow>
                    <Field label="Cargo" htmlFor="cargo"><Input id="cargo" defaultValue="Administradora" /></Field>
                    <Field label="Assinatura de e-mail" htmlFor="bio" hint="Anexada às mensagens enviadas aos clientes.">
                      <Textarea id="bio" rows={3} defaultValue="Helena Macuácua · Quota Studio · +258 84 123 4567" />
                    </Field>
        </>
      ),
    },
    {
      id: "preferencias",
      label: "Preferências",
      hint: "Idioma, fuso, notificações",
      title: "Preferências",
      description: "Idioma, fuso horário e formato de apresentação.",
      content: (
        <>
          <FieldRow>
                      <Field label="Idioma" htmlFor="idioma"><Input id="idioma" defaultValue="Português (Moçambique)" /></Field>
                      <Field label="Fuso horário" htmlFor="fuso"><Input id="fuso" defaultValue="África/Maputo (CAT)" /></Field>
                    </FieldRow>
                    <SettingRow
                      htmlFor="resumo"
                      title="Resumo diário por e-mail"
                      description="Receba todas as manhãs o estado de cobranças e facturas."
                      control={<Switch id="resumo" defaultChecked />}
                    />
                    <SettingRow
                      htmlFor="wpp"
                      title="Alertas no WhatsApp"
                      description="Pagamentos confirmados e facturas vencidas em tempo real."
                      control={<Switch id="wpp" defaultChecked />}
                    />
        </>
      ),
    },
    {
      id: "seguranca",
      label: "Segurança",
      hint: "Palavra-passe, 2FA, sessões",
      title: "Segurança",
      description: "Proteja o acesso à sua conta e reveja sessões activas.",
      content: (
        <>
          <FieldRow>
                      <Field label="Palavra-passe actual" htmlFor="pw1"><Input id="pw1" type="password" placeholder="••••••••" /></Field>
                      <Field label="Nova palavra-passe" htmlFor="pw2" hint="Mínimo 8 caracteres."><Input id="pw2" type="password" placeholder="••••••••" /></Field>
                    </FieldRow>
                    <SettingRow
                      htmlFor="2fa"
                      title="Autenticação em dois passos"
                      description="Código por SMS sempre que iniciar sessão num novo dispositivo."
                      control={<Switch id="2fa" />}
                    />
                    <div className="rounded-md border border-border/70 bg-surface p-4">
                      <p className="text-sm font-medium">Sessões activas</p>
                      <ul className="mt-3 space-y-3 text-[13px]">
                        {[
                          ["Chrome · Maputo", "Este dispositivo", true],
                          ["iPhone 14 · Matola", "há 2 horas", false],
                        ].map(([d, t, current]) => (
                          <li key={d as string} className="flex items-center justify-between gap-3">
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{d}</span>
                              <span className="block truncate text-xs text-muted-foreground">{t}</span>
                            </span>
                            {current ? (
                              <span className="shrink-0 text-xs text-muted-foreground">Actual</span>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-8 shrink-0 text-xs text-destructive">Terminar</Button>
                            )}
                          </li>
                        ))}
                      </ul>
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
            Os seus dados pessoais e preferências de conta.
          </span>
          <Button size="sm" className="ml-auto h-8">
            <Save className="h-3.5 w-3.5" /> Guardar alterações
          </Button>
        </div>
      </section>

      <SettingsShell sections={sections} />
    </div>
  );
}
