-- Multi-empresa (multi-tenant).
--
-- O registo é self-service: cada cliente cria a sua conta e a sua empresa, sem
-- ninguém a aprovar. Com a política anterior (`auth.uid() is not null`) isso era
-- uma fuga de dados — o segundo cliente a registar-se via as facturas do
-- primeiro. Aqui cada linha passa a pertencer a uma empresa, e cada utilizador
-- só vê a empresa a que pertence.

-- ─────────────────────────────────────────────────────────────
-- 1. Empresas e membros
-- ─────────────────────────────────────────────────────────────
create table if not exists public.orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  nuit        text not null default '',
  sector      text not null default '',
  iva_regime  text not null default 'normal',
  created_at  timestamptz not null default now()
);

create table if not exists public.org_members (
  org_id   uuid not null references public.orgs (id) on delete cascade,
  user_id  uuid not null references auth.users (id) on delete cascade,
  role     text not null default 'owner',
  primary key (org_id, user_id)
);

create index if not exists org_members_user_idx on public.org_members (user_id);

/**
 * Empresa do utilizador actual.
 *
 * `security definer` + `stable` para poder ser usada em políticas RLS e como
 * default de coluna sem recursão nem custo por linha.
 */
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.org_members where user_id = auth.uid() limit 1;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Uma empresa para os dados que já existem
-- ─────────────────────────────────────────────────────────────
insert into public.orgs (id, name, nuit)
select '00000000-0000-0000-0000-000000000001', 'Quota Studio', '400987654'
where not exists (select 1 from public.orgs);

-- ─────────────────────────────────────────────────────────────
-- 3. `org_id` em todas as tabelas de dados
--
-- O default chama `current_org_id()`, por isso a aplicação **não precisa de
-- enviar `org_id`** em cada insert — o Postgres preenche a partir da sessão.
-- ─────────────────────────────────────────────────────────────
do $$
declare
  t text;
  fallback uuid := '00000000-0000-0000-0000-000000000001';
begin
  foreach t in array array[
    'company','clients','invoices','invoice_lines','payments',
    'products','services','template_tickets'
  ] loop
    execute format('alter table public.%I add column if not exists org_id uuid;', t);
    execute format('update public.%I set org_id = %L where org_id is null;', t, fallback);
    execute format(
      'alter table public.%I '
      '  alter column org_id set default public.current_org_id(), '
      '  alter column org_id set not null;', t);
    execute format(
      'alter table public.%I drop constraint if exists %I; '
      'alter table public.%I add constraint %I '
      '  foreign key (org_id) references public.orgs (id) on delete cascade;',
      t, t || '_org_fk', t, t || '_org_fk');
    execute format('create index if not exists %I on public.%I (org_id);', t || '_org_idx', t);
  end loop;
end $$;

-- O número do documento é único **dentro da empresa**, não globalmente.
alter table public.invoices drop constraint if exists invoices_number_key;
create unique index if not exists invoices_org_number_key
  on public.invoices (org_id, number);

-- ─────────────────────────────────────────────────────────────
-- 4. Numeração por empresa
--
-- Uma sequência global daria buracos na numeração de cada cliente e revelaria o
-- volume dos outros. Um contador por empresa, incrementado atomicamente.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.org_counters (
  org_id uuid not null references public.orgs (id) on delete cascade,
  kind   text not null,
  value  bigint not null default 0,
  primary key (org_id, kind)
);

create or replace function public.next_document_number(p_kind text default 'ft')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  org uuid := public.current_org_id();
  k   text := lower(coalesce(p_kind, 'ft'));
  n   bigint;
  yr  text := to_char(current_date, 'YYYY');
begin
  if org is null then
    raise exception 'sem empresa associada ao utilizador';
  end if;

  insert into public.org_counters (org_id, kind, value)
  values (org, k, 1)
  on conflict (org_id, kind) do update set value = public.org_counters.value + 1
  returning value into n;

  return case k
    when 'rec' then format('REC %s/%s', yr, lpad(n::text, 3, '0'))
    when 'cot' then format('COT %s/%s', yr, lpad(n::text, 3, '0'))
    else            format('FT %s/%s',  yr, lpad(n::text, 5, '0'))
  end;
end $$;

create or replace function public.next_ticket_ref()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  org uuid := public.current_org_id();
  n   bigint;
begin
  insert into public.org_counters (org_id, kind, value)
  values (org, 'tpl', 1)
  on conflict (org_id, kind) do update set value = public.org_counters.value + 1
  returning value into n;
  return 'TPL-' || lpad(n::text, 4, '0');
end $$;

-- Os contadores actuais têm de continuar de onde a numeração vai, senão a
-- próxima factura repetiria um número já emitido.
insert into public.org_counters (org_id, kind, value)
select org_id, 'ft', count(*) from public.invoices group by org_id
on conflict (org_id, kind) do update
  set value = greatest(public.org_counters.value, excluded.value);

-- ─────────────────────────────────────────────────────────────
-- 5. Registo self-service: criar empresa + associar quem a criou
-- ─────────────────────────────────────────────────────────────
create or replace function public.create_org(
  p_name text,
  p_nuit text default '',
  p_sector text default '',
  p_iva_regime text default 'normal'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org uuid;
begin
  if auth.uid() is null then
    raise exception 'é preciso sessão iniciada';
  end if;
  if public.current_org_id() is not null then
    raise exception 'este utilizador já pertence a uma empresa';
  end if;

  insert into public.orgs (name, nuit, sector, iva_regime)
  values (coalesce(nullif(p_name, ''), 'A minha empresa'), p_nuit, p_sector, p_iva_regime)
  returning id into new_org;

  insert into public.org_members (org_id, user_id, role)
  values (new_org, auth.uid(), 'owner');

  -- Cada empresa começa com a sua linha de definições.
  insert into public.company (org_id, name, nuit, settings)
  values (new_org, p_name, p_nuit, jsonb_build_object('name', p_name, 'nuit', p_nuit));

  return new_org;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 6. RLS por empresa
-- ─────────────────────────────────────────────────────────────
alter table public.orgs         enable row level security;
alter table public.org_members  enable row level security;
alter table public.org_counters enable row level security;

drop policy if exists org_read on public.orgs;
create policy org_read on public.orgs for select to authenticated
  using (id = public.current_org_id());

drop policy if exists org_update on public.orgs;
create policy org_update on public.orgs for update to authenticated
  using (id = public.current_org_id()) with check (id = public.current_org_id());

drop policy if exists members_read on public.org_members;
create policy members_read on public.org_members for select to authenticated
  using (user_id = auth.uid() or org_id = public.current_org_id());

drop policy if exists counters_read on public.org_counters;
create policy counters_read on public.org_counters for select to authenticated
  using (org_id = public.current_org_id());

do $$
declare t text;
begin
  foreach t in array array[
    'company','clients','invoices','invoice_lines','payments',
    'products','services','template_tickets'
  ] loop
    execute format('drop policy if exists authenticated_all on public.%I;', t);
    execute format(
      'create policy org_isolated on public.%I '
      'for all to authenticated '
      'using (org_id = public.current_org_id()) '
      'with check (org_id = public.current_org_id());', t);
  end loop;
end $$;
