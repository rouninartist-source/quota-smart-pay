-- Planos e várias empresas por conta.

-- ─────────────────────────────────────────────────────────────
-- 1. Plano da empresa
-- ─────────────────────────────────────────────────────────────
alter table public.orgs add column if not exists plan text not null default 'basic';
alter table public.orgs drop constraint if exists orgs_plan_check;
alter table public.orgs add constraint orgs_plan_check check (plan in ('basic','smart','multi'));

alter table public.org_members add column if not exists joined_at timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────
-- 2. Empresa activa por utilizador
--    Guardada numa tabela (não no JWT) para a troca ser imediata.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.user_prefs (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  current_org uuid references public.orgs (id) on delete set null,
  updated_at  timestamptz not null default now()
);
alter table public.user_prefs enable row level security;
drop policy if exists prefs_own on public.user_prefs;
create policy prefs_own on public.user_prefs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

/** Empresa activa: a escolhida (se ainda for membro), senão a primeira a que aderiu. */
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.current_org
       from public.user_prefs p
       join public.org_members m on m.org_id = p.current_org and m.user_id = auth.uid()
      where p.user_id = auth.uid()),
    (select org_id from public.org_members where user_id = auth.uid() order by joined_at limit 1)
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. O utilizador vê todas as empresas de que é membro (para trocar),
--    mas os dados continuam isolados pela empresa activa.
-- ─────────────────────────────────────────────────────────────
drop policy if exists org_read on public.orgs;
create policy org_read on public.orgs for select to authenticated
  using (id in (select org_id from public.org_members where user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 4. Criar mais empresas quando o plano o permite
-- ─────────────────────────────────────────────────────────────
create or replace function public.plan_org_limit(p_plan text)
returns int language sql immutable as $$
  select case p_plan when 'multi' then 3 else 1 end;
$$;

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
  new_org  uuid;
  n_orgs   int;
  max_orgs int;
begin
  if auth.uid() is null then
    raise exception 'é preciso sessão iniciada';
  end if;

  select count(*) into n_orgs from public.org_members where user_id = auth.uid();
  -- o melhor plano entre as empresas da conta decide quantas pode ter
  select coalesce(max(public.plan_org_limit(o.plan)), 1) into max_orgs
    from public.org_members m join public.orgs o on o.id = m.org_id
   where m.user_id = auth.uid();
  if n_orgs >= max_orgs then
    raise exception 'o plano actual permite % empresa(s) — faça upgrade para Multi-Empresas', max_orgs;
  end if;

  insert into public.orgs (name, nuit, sector, iva_regime)
  values (coalesce(nullif(p_name, ''), 'A minha empresa'), p_nuit, p_sector, p_iva_regime)
  returning id into new_org;

  insert into public.org_members (org_id, user_id, role)
  values (new_org, auth.uid(), 'owner');

  -- a empresa nova passa a ser a activa
  insert into public.user_prefs (user_id, current_org) values (auth.uid(), new_org)
  on conflict (user_id) do update set current_org = excluded.current_org, updated_at = now();

  -- Cada empresa começa com a sua linha de definições.
  insert into public.company (org_id, name, nuit, settings)
  values (new_org, p_name, p_nuit, jsonb_build_object('name', p_name, 'nuit', p_nuit));

  return new_org;
end $$;

/** Troca a empresa activa (só para empresas de que o utilizador é membro). */
create or replace function public.set_current_org(p_org uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.org_members where org_id = p_org and user_id = auth.uid()) then
    raise exception 'não é membro dessa empresa';
  end if;
  insert into public.user_prefs (user_id, current_org) values (auth.uid(), p_org)
  on conflict (user_id) do update set current_org = excluded.current_org, updated_at = now();
end $$;
