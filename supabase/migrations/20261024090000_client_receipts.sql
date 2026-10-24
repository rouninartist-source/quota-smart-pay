-- Quota :: recibo de cliente — um recibo para uma ou várias facturas
--
-- Até aqui cada recibo era de um pagamento numa factura. Agora escolhe-se o
-- cliente, as facturas em aberto e o valor recebido (total, 50% ou outro), e
-- sai um único recibo com o seu número. Cada factura continua a receber o seu
-- pagamento (o saldo e o estado de cada uma não mudam de lógica); o recibo
-- liga-os e guarda o retrato do que foi pago.

create table if not exists public.receipts (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null default public.current_org_id() references public.orgs (id) on delete cascade,
  number          text not null,
  issued          date not null default current_date,
  client_id       uuid references public.clients (id) on delete set null,
  client_snapshot jsonb not null default '{}'::jsonb,
  method          public.payment_method not null,
  reference       text,
  total           numeric(14,2) not null,
  -- [{invoice_id, number, kind, issued, invoice_total, amount, balance_after}]
  items           jsonb not null default '[]'::jsonb,
  notes           text,
  created_by      uuid default auth.uid(),
  created_at      timestamptz not null default now()
);

create unique index if not exists receipts_org_number_key on public.receipts (org_id, number);
create index if not exists receipts_client_idx on public.receipts (org_id, client_id);

alter table public.receipts enable row level security;
drop policy if exists receipts_read on public.receipts;
create policy receipts_read on public.receipts for select to authenticated
  using (org_id = public.current_org_id());

alter table public.payments add column if not exists receipt_id uuid references public.receipts (id) on delete set null;

-- Um recibo com várias facturas põe o mesmo número em vários pagamentos.
-- O índice antigo também era global — duas empresas com "REC 2026/001"
-- colidiam. Passa a ser por empresa e por factura.
drop index if exists public.payments_receipt_number_key;
create unique index if not exists payments_org_receipt_invoice_key
  on public.payments (org_id, receipt_number, invoice_id) where receipt_number is not null;

/** Total de uma factura, igual a `invoiceTotals` em src/lib/invoices-store.ts. */
create or replace function public.invoice_total(p_invoice uuid)
returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(l.qty * l.price * (1 - coalesce(i.discount, 0) / 100) * (1 + l.vat / 100)), 0)
    from public.invoices i
    left join public.invoice_lines l on l.invoice_id = i.id
   where i.id = p_invoice;
$$;

/**
 * Emite um recibo para uma ou várias facturas do mesmo cliente.
 *
 * p_items: [{ "invoice_id": uuid, "amount": number }]. Tudo numa transacção:
 * ou o recibo sai com todos os pagamentos, ou nada fica gravado.
 */
create or replace function public.issue_client_receipt(
  p_client_id uuid,
  p_client    jsonb,
  p_items     jsonb,
  p_method    public.payment_method,
  p_reference text default null,
  p_date      date default current_date,
  p_notes     text default null
) returns public.receipts
language plpgsql
security definer
set search_path = public
as $$
declare
  org       uuid := public.current_org_id();
  item      jsonb;
  inv       public.invoices;
  amt       numeric(14,2);
  tot       numeric(14,2);
  paid      numeric(14,2);
  snapshot  jsonb := '[]'::jsonb;
  grand     numeric(14,2) := 0;
  n         text;
  rec       public.receipts;
begin
  if org is null then raise exception 'sem empresa associada ao utilizador'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'escolha pelo menos uma factura';
  end if;

  for item in select * from jsonb_array_elements(p_items) loop
    amt := round((item->>'amount')::numeric, 2);
    select * into inv from public.invoices
     where id = (item->>'invoice_id')::uuid and org_id = org
     for update;
    if not found then raise exception 'factura não encontrada'; end if;
    if inv.status in ('rascunho', 'cancelada') or inv.kind in ('cot', 'cotv') then
      raise exception 'a % não pode receber pagamentos', inv.number;
    end if;
    if amt is null or amt <= 0 then raise exception 'valor inválido para %', inv.number; end if;

    tot  := round(public.invoice_total(inv.id), 2);
    paid := coalesce((select sum(amount) from public.payments where invoice_id = inv.id), 0);
    if amt > tot - paid + 0.01 then
      raise exception 'o valor para % é maior do que o saldo em dívida (%)', inv.number, tot - paid;
    end if;

    snapshot := snapshot || jsonb_build_object(
      'invoice_id', inv.id, 'number', inv.number, 'kind', inv.kind, 'issued', inv.issued,
      'invoice_total', tot, 'amount', amt, 'balance_after', greatest(tot - paid - amt, 0));
    grand := grand + amt;
  end loop;

  n := public.next_document_number('rec');

  insert into public.receipts (org_id, number, issued, client_id, client_snapshot, method, reference, total, items, notes)
  values (org, n, coalesce(p_date, current_date), p_client_id, coalesce(p_client, '{}'::jsonb), p_method,
          nullif(trim(coalesce(p_reference, '')), ''), grand, snapshot, nullif(trim(coalesce(p_notes, '')), ''))
  returning * into rec;

  for item in select * from jsonb_array_elements(snapshot) loop
    insert into public.payments (org_id, invoice_id, paid_on, amount, method, reference, receipt_number, receipt_issued, receipt_id)
    values (org, (item->>'invoice_id')::uuid, rec.issued, (item->>'amount')::numeric, p_method, rec.reference, n, rec.issued, rec.id);

    -- Estado como em `derivedStatus`: liquidada → paga, senão parcial.
    update public.invoices
       set status = case when (item->>'balance_after')::numeric <= 0.01 then 'paga' else 'parcial' end::public.invoice_status
     where id = (item->>'invoice_id')::uuid;
  end loop;

  return rec;
end;
$$;

revoke all on function public.issue_client_receipt(uuid, jsonb, jsonb, public.payment_method, text, date, text) from public, anon;
grant execute on function public.issue_client_receipt(uuid, jsonb, jsonb, public.payment_method, text, date, text) to authenticated;
revoke all on function public.invoice_total(uuid) from public, anon;
grant execute on function public.invoice_total(uuid) to authenticated;
