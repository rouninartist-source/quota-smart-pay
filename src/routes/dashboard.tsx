import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth";
import { GRACE_DAYS, planState, rootOf, useOrg } from "@/lib/org-store";
import { formatDate } from "@/lib/format";
import { FirstLogin } from "@/components/app/FirstLogin";
import { hydrateInvoices } from "@/lib/invoices-store";
import { useT } from "@/lib/i18n";
import { hydrateClients } from "@/lib/clients-store";
import { hydrateCompany } from "@/lib/company-store";
import { hydrateCatalog } from "@/lib/catalog-store";
import { migrateInlineImages } from "@/lib/media-migrate";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { MobileMenu } from "@/components/dashboard/MobileMenu";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { CommandPalette, useCommandPalette } from "@/components/app/CommandPalette";

/** Rotas sem scroll de página — ver `design/` para os layouts. */
const FITS_VIEWPORT = new Set([
  "/dashboard",
  "/dashboard/clientes",
  "/dashboard/design",
  "/dashboard/assistente",
  "/dashboard/equipa",
  "/dashboard/utilizadores",
  "/dashboard/documentos",
  "/dashboard/equipa",
  "/dashboard/documentos/novo",
  "/dashboard/perfil",
  "/dashboard/definicoes",
  "/dashboard/whatsapp",
  "/dashboard/produtos",
  "/dashboard/servicos",
]);

/**
 * Rotas cujos filhos dinâmicos herdam o bloqueio — /equipa e /assistente
 * redireccionam para /equipa/ch-x e /assistente/t-x.
 */
const FITS_VIEWPORT_PREFIXES = ["/dashboard/assistente/", "/dashboard/equipa/", "/dashboard/documentos/"];

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Quota Studio · Dashboard" },
      { name: "description", content: "Painel operacional Quota: facturas, cobranças, clientes e desempenho do estúdio numa só vista." },
      { property: "og:title", content: "Quota Studio · Dashboard" },
      { property: "og:description", content: "Painel operacional Quota para PMEs em Moçambique." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  useT();
  const { session, loading } = useSession();
  const { org, orgs, ready: orgReady } = useOrg();
  const plan = planState(rootOf(org, orgs));
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { open: searchOpen, setOpen: setSearchOpen } = useCommandPalette();

  /**
   * Rotas desenhadas para caber num ecrã: em md+ trava a altura e as listas
   * rolam dentro dos painéis. As restantes páginas rolam normalmente.
   */
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const path = pathname.replace(/\/+$/, "") || pathname;
  const fitsViewport =
    FITS_VIEWPORT.has(path) || FITS_VIEWPORT_PREFIXES.some((p) => path.startsWith(p));

  /**
   * Guarda client-only: no servidor `loading` é true, por isso o HTML servido é
   * sempre o ecrã de espera — não há divergência na hidratação.
   */
  useEffect(() => {
    if (isSupabaseConfigured && !loading && !session)
      void navigate({ to: "/login", search: { next: window.location.pathname + window.location.search } });
  }, [loading, session, navigate]);

  /**
   * Pré-carrega tudo em paralelo assim que há empresa: as páginas abrem já com
   * dados em vez de cada uma ir buscar os seus ao primeiro clique.
   */
  useEffect(() => {
    if (!org) return;
    void Promise.all([hydrateInvoices(), hydrateClients(), hydrateCompany(), hydrateCatalog()]);
    // Imagens antigas guardadas como texto na base de dados passam para o Storage.
    migrateInlineImages();
  }, [org]);

  if (isSupabaseConfigured && (loading || !session)) {
    return (
      <div className="grid h-dvh place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Com sessão mas sem empresa não há nada que o painel possa mostrar — e
  // qualquer emissão falharia. Melhor resolver o impasse aqui.
  if (isSupabaseConfigured && session && !orgReady) {
    return (
      <div className="grid h-dvh place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isSupabaseConfigured && session && orgReady && !org) {
    return <FirstLogin session={session} />;
  }

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain",
            fitsViewport ? "pb-24 md:min-h-0 md:overflow-hidden md:pb-0" : "pb-24 md:pb-10",
          )}
        >
          <div
            className={cn(
              "mx-auto max-w-[1200px] px-4 md:px-6",
              fitsViewport ? "py-4 md:flex md:h-full md:flex-col md:py-4" : "py-6 md:py-8",
            )}
          >
            {path !== "/dashboard/planos" && <PlanBanner plan={plan} />}
            <Outlet />
          </div>
        </main>
      </div>


      <MobileBottomNav />
    </div>
  );
}

/**
 * Aviso do plano em todas as páginas: bloqueado (trial terminado / expirado),
 * em tolerância (aviso diário — aparece em cada sessão até renovar) ou a
 * terminar nos próximos 7 dias.
 */
function PlanBanner({ plan }: { plan: ReturnType<typeof planState> }) {
  const cta = (label: string) => (
    <Link to="/dashboard/planos" className="ml-auto rounded-md bg-primary px-3 py-1.5 text-[11.5px] font-semibold text-primary-foreground hover:opacity-90">
      {label}
    </Link>
  );
  if (plan.phase === "trial-ended" || plan.phase === "expired")
    return (
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px]">
        <span className="font-semibold">{plan.phase === "trial-ended" ? "O período experimental terminou." : "O plano expirou."}</span>
        <span className="text-muted-foreground">Pode consultar tudo, mas emitir documentos exige um plano activo.</span>
        {cta(plan.phase === "trial-ended" ? "Escolher plano" : "Renovar agora")}
      </div>
    );
  if (plan.phase === "grace")
    return (
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[12px]">
        <span className="font-semibold">O plano terminou a {formatDate(plan.until!)}.</span>
        <span className="text-muted-foreground">
          Tem {plan.graceDaysLeft} dia{plan.graceDaysLeft === 1 ? "" : "s"} de tolerância (de {GRACE_DAYS}) — depois deixa de poder emitir documentos.
        </span>
        {cta("Renovar")}
      </div>
    );
  if (plan.phase === "due-soon")
    return (
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-[12px]">
        <span className="font-semibold">O plano termina {plan.daysLeft === 1 ? "amanhã" : `em ${plan.daysLeft} dias`} ({formatDate(plan.until!)}).</span>
        <span className="text-muted-foreground">Renove para continuar sem interrupções.</span>
        {cta("Renovar")}
      </div>
    );
  return null;
}
