import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { CompleteOrgSetup } from "./CompleteOrgSetup";
import { createOrg, refreshOrg } from "@/lib/org-store";
import { saveCompany } from "@/lib/company-store";
import { supabase } from "@/lib/supabase";
import type { SignupMeta } from "@/lib/auth";
import type { PlanId } from "@/lib/plans";

/**
 * Sessão sem empresa. Se o registo deixou a empresa (ou um convite) nos
 * metadados da conta, resolve-se aqui sem voltar a perguntar nada; só sem
 * nada disso é que aparece o formulário.
 */
export function FirstLogin({ session }: { session: Session }) {
  const meta = (session.user.user_metadata ?? {}) as SignupMeta;
  const pending = !!meta.company || !!meta.invite;
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    (async () => {
      const sb = supabase!;
      if (meta.invite) {
        const { error: err } = await sb.rpc("accept_invite", { p_token: meta.invite });
        if (err && !/já usado|já pertence/i.test(err.message)) return setError(err.message);
      } else if (meta.company) {
        const c = meta.company;
        const res = await createOrg({ name: c.name, nuit: c.nuit, sector: c.sector, ivaRegime: c.iva, plan: (c.plan ?? undefined) as PlanId | undefined });
        if (res.error && !/já pertence/i.test(res.error)) return setError(res.error);
        let logo: string | undefined;
        try {
          logo = localStorage.getItem("quota-pending-logo") ?? undefined;
          localStorage.removeItem("quota-pending-logo");
        } catch {}
        await saveCompany({ name: c.name, nuit: c.nuit, email: session.user.email ?? "", phone: meta.phone ?? "", ...(logo ? { logo } : {}) });
      }
      // já não é preciso repetir no próximo início de sessão
      await sb.auth.updateUser({ data: { company: null, invite: null } });
      if (!cancelled) await refreshOrg();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  if (!pending || error) {
    return <CompleteOrgSetup email={session.user.email} initialError={error} />;
  }
  return (
    <div className="grid h-dvh place-items-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        <p className="mt-3 text-[13px] text-muted-foreground">
          {meta.invite ? "A aceitar o convite…" : `A configurar ${meta.company?.name ?? "a sua empresa"}…`}
        </p>
      </div>
    </div>
  );
}
