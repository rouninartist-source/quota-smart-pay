-- Quota :: pagamento dos planos pela Payzeno (checkout alojado)
--
-- Até aqui o cliente transferia à mão e escrevia a referência; a equipa
-- confirmava. Agora o servidor da app cria a sessão de checkout na Payzeno, o
-- cliente paga na página da Payzeno, e o plano activa-se sozinho quando a
-- Payzeno confirma — pelo webhook ou pela consulta de estado ao regressar.
-- Os dois caminhos acabam em `settle_plan_payment`, que activa uma só vez.

alter table public.plan_payments add column if not exists checkout_id  text unique;
alter table public.plan_payments add column if not exists checkout_url text;
alter table public.plan_payments add column if not exists provider_ref text;
alter table public.plan_payments add column if not exists provider_raw jsonb;

alter table public.plan_payments drop constraint if exists plan_payments_status_check;
alter table public.plan_payments add constraint plan_payments_status_check
  check (status in ('pendente','confirmado','rejeitado','expirado'));

-- Até onde o plano está pago. Cada pagamento confirmado acrescenta os seus
-- meses a partir do que for mais tarde: hoje ou o fim do período já pago.
alter table public.orgs add column if not exists paid_until timestamptz;

-- Só leitura para o cliente. Antes a política era `for all`, o que deixava o
-- próprio cliente mudar o plano ou o estado de uma linha — inofensivo com
-- confirmação manual, perigoso agora que a confirmação activa o plano.
-- As escritas passam a ser só do servidor (service_role).
drop policy if exists plan_payments_org on public.plan_payments;
drop policy if exists plan_payments_read on public.plan_payments;
create policy plan_payments_read on public.plan_payments for select to authenticated
  using (org_id = public.current_org_id());

create or replace function public.settle_plan_payment(
  p_checkout_id  text,
  p_status       text,
  p_provider_ref text  default null,
  p_raw          jsonb default null
) returns public.plan_payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row  public.plan_payments;
  v_root uuid;
begin
  if p_status not in ('confirmado','rejeitado','expirado') then
    raise exception 'estado_invalido: %', p_status using errcode = 'P0001';
  end if;

  if p_status = 'confirmado' then
    -- O pagamento ganha a qualquer estado anterior (dinheiro que saiu da
    -- carteira é um facto); o `status <> 'confirmado'` é o que garante que um
    -- webhook repetido e a consulta de estado activam uma só vez.
    update public.plan_payments
       set status = 'confirmado', confirmed_at = now(),
           provider_ref = coalesce(p_provider_ref, provider_ref),
           provider_raw = coalesce(p_raw, provider_raw)
     where checkout_id = p_checkout_id and status <> 'confirmado'
    returning * into v_row;

    if not found then
      select * into v_row from public.plan_payments where checkout_id = p_checkout_id;
      return v_row;  -- já confirmado, ou checkout desconhecido (null)
    end if;

    select coalesce(o.parent_org, o.id) into v_root from public.orgs o where o.id = v_row.org_id;

    -- Raiz e filhas: as filhas herdam o plano da raiz.
    update public.orgs
       set plan = v_row.plan, plan_requested = null, trial_ends_at = null,
           paid_until = greatest(coalesce(paid_until, now()), now()) + make_interval(months => v_row.months)
     where id = v_root;
    update public.orgs set plan = v_row.plan, trial_ends_at = null where parent_org = v_root;
  else
    update public.plan_payments
       set status = p_status,
           provider_ref = coalesce(p_provider_ref, provider_ref),
           provider_raw = coalesce(p_raw, provider_raw)
     where checkout_id = p_checkout_id and status = 'pendente'
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

revoke all on function public.settle_plan_payment(text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.settle_plan_payment(text, text, text, jsonb) to service_role;

-- ─────────────────────────────────────────────────────────────
-- O plano só muda por pagamento confirmado
-- ─────────────────────────────────────────────────────────────
-- `set_org_plan` deixava o dono mudar de plano sem pagar (a UI já não a usa
-- desde o QA 3, mas continuava acessível pela API). Fica só para o servidor.
revoke execute on function public.set_org_plan(text) from public, anon, authenticated;

-- A política `org_update` deixa os membros editar a própria empresa — e com
-- isso também plan / trial_ends_at / paid_until. Este trigger trava essas
-- colunas para pedidos directos do cliente. As funções `security definer`
-- (criar empresa, créditos de IA, settle_plan_payment) correm como o dono da
-- base de dados e não são afectadas.
create or replace function public.orgs_guard_billing()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') and (
       new.plan is distinct from old.plan
    or new.trial_ends_at is distinct from old.trial_ends_at
    or new.paid_until is distinct from old.paid_until
    or new.parent_org is distinct from old.parent_org
    or new.ai_uses is distinct from old.ai_uses
  ) then
    raise exception 'o plano só muda através de um pagamento confirmado' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists orgs_guard_billing on public.orgs;
create trigger orgs_guard_billing before update on public.orgs
  for each row execute function public.orgs_guard_billing();
