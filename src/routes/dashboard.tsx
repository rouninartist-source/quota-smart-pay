import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { MobileMenu } from "@/components/dashboard/MobileMenu";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { CommandPalette, useCommandPalette } from "@/components/app/CommandPalette";

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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { open: searchOpen, setOpen: setSearchOpen } = useCommandPalette();

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
        <main className="flex-1 overflow-y-auto overscroll-contain pb-24 md:pb-10">
          <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>


      <MobileBottomNav />
    </div>
  );
}
