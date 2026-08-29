import * as React from "react";
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
import { clients, invoices } from "@/lib/mock-data";

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

  const go = React.useCallback(
    (to: string) => {
      onOpenChange(false);
      navigate({ to });
    },
    [navigate, onOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Procurar páginas, clientes, documentos…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>

        <CommandGroup heading="Criar">
          {quickCreate.map((a) => (
            <CommandItem key={a.label} value={`criar ${a.label}`} onSelect={() => go(a.to)}>
              <a.icon className="h-4 w-4 text-muted-foreground" />
              {a.label}
              {a.shortcut && <CommandShortcut>{a.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {navGroups.map((g) => (
          <CommandGroup key={g.label} heading={g.label}>
            {g.items.map((it) => (
              <CommandItem key={it.to} value={`${g.label} ${it.label}`} onSelect={() => go(it.to)}>
                <it.icon className="h-4 w-4 text-muted-foreground" />
                {it.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />

        <CommandGroup heading="Clientes">
          {clients.slice(0, 5).map((c) => (
            <CommandItem key={c.id} value={`cliente ${c.name}`} onSelect={() => go("/dashboard/clientes")}>
              <span className="grid h-5 w-5 place-items-center rounded bg-muted text-[10px] font-semibold">
                {c.name.slice(0, 1)}
              </span>
              {c.name}
              <CommandShortcut>{c.city}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Documentos recentes">
          {invoices.slice(0, 5).map((d) => (
            <CommandItem key={d.id} value={`factura ${d.number} ${d.client}`} onSelect={() => go("/dashboard/facturas")}>
              <span className="font-mono text-xs">{d.number}</span>
              <span className="truncate text-muted-foreground">{d.client}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
