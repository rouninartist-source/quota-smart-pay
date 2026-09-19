-- Terceira ronda do QA: convites por empresa, estado "emitida", recibos por pagamento, pagamentos de plano.

-- ─────────────────────────────────────────────────────────────
-- 1. Convidar para qualquer empresa de que o utilizador seja dono/admin
-- ─────────────────────────────────────────────────────────────
alter table public.org_invites alter column org_id drop default;
alter table public.org_invites alter column org_id set default public.current_org_id();
drop policy if exists invites_org on public.org_invites;
create policy invites_org on public.org_invites for all to authenticated
  using (org_id in (select org_id from public.org_members where user_id = auth.uid()))
  with check (org_id in (select org_id from public.org_members where user_id = auth.uid() and role in ('owner','admin')));

/** Empresas onde o utilizador pode convidar (dono/admin) — para o selector do plano Multi-Empresas. */
create or replace function public.my_admin_orgs()
returns table (id uuid, name text)
language sql stable security definer set search_path = public as $$
  select o.id, o.name from public.orgs o join public.org_members m on m.org_id = o.id
   where m.user_id = auth.uid() and m.role in ('owner','admin') order by o.parent_org nulls first, o.name;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Estado "emitida": o documento foi emitido mas ainda não enviado
-- ─────────────────────────────────────────────────────────────
alter type public.invoice_status add value if not exists 'emitida';

-- ─────────────────────────────────────────────────────────────
-- 3. Recibos por pagamento (total ou parcial)
-- ─────────────────────────────────────────────────────────────
alter table public.payments add column if not exists receipt_number text;
alter table public.payments add column if not exists receipt_issued date;
create unique index if not exists payments_receipt_number_key on public.payments (receipt_number) where receipt_number is not null;

/** Atribui um número de recibo a um pagamento (idempotente). */
create or replace function public.issue_payment_receipt(p_payment uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  p public.payments%rowtype;
  n text;
begin
  select * into p from public.payments where id = p_payment for update;
  if p.id is null then raise exception 'pagamento não encontrado'; end if;
  if not exists (select 1 from public.invoices i where i.id = p.invoice_id and i.org_id = public.current_org_id()) then
    raise exception 'sem permissão';
  end if;
  if p.receipt_number is not null then return p.receipt_number; end if;
  n := public.next_document_number('rec');
  update public.payments set receipt_number = n, receipt_issued = current_date where id = p_payment;
  return n;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 4. Pedidos de pagamento de plano (M-Pesa / e-Mola) confirmados pela equipa
-- ─────────────────────────────────────────────────────────────
create table if not exists public.plan_payments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.current_org_id() references public.orgs (id) on delete cascade,
  plan        text not null check (plan in ('basic','smart','multi')),
  months      int  not null default 1,
  amount      numeric(12,2) not null,
  method      text not null check (method in ('mpesa','emola')),
  phone       text not null default '',
  reference   text not null default '',
  status      text not null default 'pendente' check (status in ('pendente','confirmado','rejeitado')),
  created_by  uuid not null default auth.uid(),
  created_at  timestamptz not null default now(),
  confirmed_at timestamptz
);
alter table public.plan_payments enable row level security;
drop policy if exists plan_payments_org on public.plan_payments;
create policy plan_payments_org on public.plan_payments for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
