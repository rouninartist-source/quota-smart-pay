import * as React from "react";
import { t } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { navGroups, quickCreate } from "@/components/dashboard/nav-items";
import { useClients } from "@/lib/clients-store";
import { useInvoices } from "@/lib/invoices-store";

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const clients = useClients();
  const invoices = useInvoices();

  const go = React.useCallback(
    (to: string, search?: Record<string, string>, params?: Record<string, string>) => {
      onOpenChange(false);
      navigate({ to, search, params } as never);
    },
    [navigate, onOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Procurar páginas, clientes, documentos…" />
      <CommandList>
        <CommandEmpty>{t("Nada encontrado.")}</CommandEmpty>

        <CommandGroup heading={t("Criar")}>
          {quickCreate.map((a) => (
            <CommandItem key={t(a.label)} value={`criar ${t(a.label)}`} onSelect={() => go(a.to, a.search)}>
              <a.icon className="h-4 w-4 text-muted-foreground" />
              {t(a.label)}
              {a.shortcut && <CommandShortcut>{a.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {navGroups.map((g) => (
          <CommandGroup key={g.label} heading={t(g.label)}>
            {g.items.map((it) => (
              <CommandItem key={`${it.to}-${t(it.label)}`} value={`${g.label} ${t(it.label)}`} onSelect={() => go(it.to, it.search)}>
                <it.icon className="h-4 w-4 text-muted-foreground" />
                {t(it.label)}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />

        <CommandGroup heading={t("Clientes")}>
          {clients.slice(0, 8).map((c) => (
            <CommandItem key={c.id} value={`cliente ${c.name} ${c.nuit}`} onSelect={() => go("/dashboard/documentos/novo", { cliente: c.id })}>
              <span className="grid h-5 w-5 place-items-center rounded bg-muted text-[10px] font-semibold">
                {c.name.slice(0, 1)}
              </span>
              {c.name}
              <CommandShortcut>{t("Facturar")}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading={t("Documentos recentes")}>
          {invoices.slice(0, 8).map((d) => (
            <CommandItem key={d.id} value={`documento ${d.number} ${d.client.name}`} onSelect={() => go("/dashboard/documentos/$id", undefined, { id: d.id })}>
              <span className="font-mono text-xs">{d.number}</span>
              <span className="truncate text-muted-foreground">{d.client.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
