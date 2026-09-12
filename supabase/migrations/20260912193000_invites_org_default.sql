-- O convite pertence à empresa activa — a app não precisa de enviar org_id.
alter table public.org_invites alter column org_id set default public.current_org_id();
