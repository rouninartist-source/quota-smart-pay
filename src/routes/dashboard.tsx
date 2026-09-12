import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth";
import { rootOf, trialState, useOrg } from "@/lib/org-store";
import { CompleteOrgSetup } from "@/components/app/CompleteOrgSetup";
import { hydrateInvoices } from "@/lib/invoices-store";
import { hydrateClients } from "@/lib/clients-store";
import { hydrateCompany } from "@/lib/company-store";
import { hydrateCatalog } from "@/lib/catalog-store";
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
  "/dashboard/planos",
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
  const { session, loading } = useSession();
  const { org, orgs, ready: orgReady } = useOrg();
  const trial = trialState(rootOf(org, orgs));
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
    return <CompleteOrgSetup email={session.user.email} />;
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
            {trial.expired && path !== "/dashboard/planos" && (
              <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px]">
                <span className="font-semibold">O período experimental terminou.</span>
                <span className="text-muted-foreground">Pode consultar tudo, mas emitir documentos exige um plano.</span>
                <Link to="/dashboard/planos" className="ml-auto rounded-md bg-primary px-3 py-1.5 text-[11.5px] font-semibold text-primary-foreground hover:opacity-90">
                  Escolher plano
                </Link>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>


      <MobileBottomNav />
    </div>
  );
}
