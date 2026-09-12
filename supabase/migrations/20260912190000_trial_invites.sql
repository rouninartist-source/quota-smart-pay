-- Período experimental, empresas filhas no plano Multi-Empresas, crédito de IA e convites.

-- ─────────────────────────────────────────────────────────────
-- 1. Empresa: trial, plano pedido, empresa-mãe, usos de IA
-- ─────────────────────────────────────────────────────────────
alter table public.orgs add column if not exists trial_ends_at timestamptz;
alter table public.orgs add column if not exists plan_requested text;
alter table public.orgs add column if not exists parent_org uuid references public.orgs (id) on delete cascade;
alter table public.orgs add column if not exists ai_uses int not null default 0;

-- Empresas já existentes recebem 14 dias a contar de hoje (nunca um trial já expirado).
update public.orgs set trial_ends_at = now() + interval '14 days' where trial_ends_at is null and parent_org is null;

create index if not exists orgs_parent_idx on public.orgs (parent_org);

/** Empresa-raiz da conta (a que tem o plano). */
create or replace function public.root_org_of(p_org uuid)
returns uuid language sql stable as $$
  select coalesce(parent_org, id) from public.orgs where id = p_org;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Criar empresa: a primeira é raiz (em trial); as seguintes são filhas e
--    herdam o plano — só o plano Multi-Empresas as permite.
-- ─────────────────────────────────────────────────────────────
create or replace function public.create_org(
  p_name text,
  p_nuit text default '',
  p_sector text default '',
  p_iva_regime text default 'normal',
  p_plan text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org  uuid;
  root     uuid;
  root_row public.orgs%rowtype;
  n_orgs   int;
begin
  if auth.uid() is null then
    raise exception 'é preciso sessão iniciada';
  end if;

  select o.id into root
    from public.org_members m join public.orgs o on o.id = m.org_id
   where m.user_id = auth.uid() and o.parent_org is null
   order by m.joined_at limit 1;

  if root is null then
    -- primeira empresa da conta: 14 dias experimentais no Basic
    insert into public.orgs (name, nuit, sector, iva_regime, plan, plan_requested, trial_ends_at)
    values (coalesce(nullif(p_name, ''), 'A minha empresa'), p_nuit, p_sector, p_iva_regime,
            'basic', case when p_plan in ('basic','smart','multi') then p_plan else null end,
            now() + interval '14 days')
    returning id into new_org;
  else
    select * into root_row from public.orgs where id = root;
    select count(*) into n_orgs from public.orgs where id = root or parent_org = root;
    if n_orgs >= public.plan_org_limit(root_row.plan) then
      raise exception 'o plano actual permite % empresa(s) — faça upgrade para Multi-Empresas', public.plan_org_limit(root_row.plan);
    end if;
    -- empresa filha: mesmo plano e mesmo trial da raiz
    insert into public.orgs (name, nuit, sector, iva_regime, plan, parent_org, trial_ends_at)
    values (coalesce(nullif(p_name, ''), 'A minha empresa'), p_nuit, p_sector, p_iva_regime,
            root_row.plan, root, root_row.trial_ends_at)
    returning id into new_org;
  end if;

  insert into public.org_members (org_id, user_id, role) values (new_org, auth.uid(), 'owner');

  insert into public.user_prefs (user_id, current_org) values (auth.uid(), new_org)
  on conflict (user_id) do update set current_org = excluded.current_org, updated_at = now();

  insert into public.company (org_id, name, nuit, settings)
  values (new_org, p_name, p_nuit, jsonb_build_object('name', p_name, 'nuit', p_nuit));

  return new_org;
end $$;

/** Escolher plano: aplica-se à raiz e às filhas e termina o período experimental. */
create or replace function public.set_org_plan(p_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  root uuid := public.root_org_of(public.current_org_id());
begin
  if root is null then raise exception 'sem empresa'; end if;
  if not exists (select 1 from public.org_members where org_id = root and user_id = auth.uid() and role in ('owner','admin')) then
    raise exception 'só o dono da conta pode mudar o plano';
  end if;
  if p_plan not in ('basic','smart','multi') then raise exception 'plano inválido'; end if;
  if p_plan <> 'multi' and (select count(*) from public.orgs where parent_org = root) > 0 then
    raise exception 'tem empresas adicionais — só o plano Multi-Empresas as suporta';
  end if;
  update public.orgs set plan = p_plan, plan_requested = null, trial_ends_at = null
   where id = root or parent_org = root;
end $$;

/** Crédito de IA: no trial (Basic experimental) há 3 operações; depois é ilimitado. */
create or replace function public.use_ai_credit()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  root uuid := public.root_org_of(public.current_org_id());
  r public.orgs%rowtype;
  lim int := 3;
begin
  if root is null then raise exception 'sem empresa'; end if;
  select * into r from public.orgs where id = root for update;
  if r.trial_ends_at is null then
    -- plano pago: sem limite
    update public.orgs set ai_uses = ai_uses + 1 where id = root;
    return jsonb_build_object('allowed', true, 'uses', r.ai_uses + 1, 'limit', null);
  end if;
  if r.ai_uses >= lim then
    return jsonb_build_object('allowed', false, 'uses', r.ai_uses, 'limit', lim);
  end if;
  update public.orgs set ai_uses = ai_uses + 1 where id = root;
  return jsonb_build_object('allowed', true, 'uses', r.ai_uses + 1, 'limit', lim);
end $$;

-- ─────────────────────────────────────────────────────────────
-- 3. Utilizadores e convites
-- ─────────────────────────────────────────────────────────────
create table if not exists public.org_invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs (id) on delete cascade,
  email       text not null,
  role        text not null default 'membro' check (role in ('admin','membro')),
  token       text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_by  uuid not null default auth.uid(),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by uuid
);
alter table public.org_invites enable row level security;
drop policy if exists invites_org on public.org_invites;
create policy invites_org on public.org_invites for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());

create or replace function public.plan_user_limit(p_plan text)
returns int language sql immutable as $$
  select case p_plan when 'multi' then 5 else 3 end;
$$;

/** Lista de membros da empresa activa com e-mail (auth.users não é legível pela app). */
create or replace function public.org_members_list()
returns table (user_id uuid, email text, name text, role text, joined_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select m.user_id, u.email::text, coalesce(u.raw_user_meta_data->>'full_name','')::text, m.role, m.joined_at
    from public.org_members m join auth.users u on u.id = m.user_id
   where m.org_id = public.current_org_id()
   order by m.joined_at;
$$;

/** Aceitar um convite pela ligação: junta o utilizador à empresa com o papel do convite. */
create or replace function public.accept_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.org_invites%rowtype;
  root uuid;
  n int;
begin
  if auth.uid() is null then raise exception 'é preciso sessão iniciada'; end if;
  select * into inv from public.org_invites where token = p_token;
  if inv.id is null then raise exception 'convite inválido'; end if;
  if inv.accepted_at is not null then raise exception 'convite já usado'; end if;
  if inv.created_at < now() - interval '14 days' then raise exception 'convite expirado'; end if;

  root := public.root_org_of(inv.org_id);
  select count(*) into n from public.org_members where org_id = inv.org_id;
  if n >= public.plan_user_limit((select plan from public.orgs where id = root)) then
    raise exception 'a empresa atingiu o limite de utilizadores do plano';
  end if;

  insert into public.org_members (org_id, user_id, role) values (inv.org_id, auth.uid(), inv.role)
  on conflict (org_id, user_id) do nothing;
  update public.org_invites set accepted_at = now(), accepted_by = auth.uid() where id = inv.id;
  insert into public.user_prefs (user_id, current_org) values (auth.uid(), inv.org_id)
  on conflict (user_id) do update set current_org = excluded.current_org, updated_at = now();
  return inv.org_id;
end $$;

/** Informação pública do convite (nome da empresa, papel) para o ecrã de aceitação. */
create or replace function public.invite_info(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('org', o.name, 'role', i.role, 'email', i.email,
           'valid', i.accepted_at is null and i.created_at > now() - interval '14 days')
    from public.org_invites i join public.orgs o on o.id = i.org_id
   where i.token = p_token;
$$;

create or replace function public.remove_member(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare org uuid := public.current_org_id();
begin
  if not exists (select 1 from public.org_members where org_id = org and user_id = auth.uid() and role in ('owner','admin')) then
    raise exception 'sem permissão';
  end if;
  if exists (select 1 from public.org_members where org_id = org and user_id = p_user and role = 'owner') then
    raise exception 'o dono não pode ser removido';
  end if;
  delete from public.org_members where org_id = org and user_id = p_user;
end $$;

create or replace function public.set_member_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare org uuid := public.current_org_id();
begin
  if p_role not in ('admin','membro') then raise exception 'papel inválido'; end if;
  if not exists (select 1 from public.org_members where org_id = org and user_id = auth.uid() and role in ('owner','admin')) then
    raise exception 'sem permissão';
  end if;
  update public.org_members set role = p_role where org_id = org and user_id = p_user and role <> 'owner';
end $$;
