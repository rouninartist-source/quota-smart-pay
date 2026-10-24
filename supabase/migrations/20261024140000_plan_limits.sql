-- Quota :: limites dos planos novos (aprovados a 24/10/2026)
--
-- Utilizadores por empresa: Basic 2 · Smart 5 · Multi-Empresas 10.
-- Quota AI por mês:          Basic 20 · Smart 300 · Multi-Empresas 1000
--                            (o trial continua com 3 operações no total).
-- Os mesmos números estão em src/lib/plans.ts.

create or replace function public.plan_user_limit(p_plan text)
returns int language sql immutable as $$
  select case p_plan when 'multi' then 10 when 'smart' then 5 else 2 end;
$$;

create or replace function public.plan_ai_limit(p_plan text)
returns int language sql immutable as $$
  select case p_plan when 'multi' then 1000 when 'smart' then 300 else 20 end;
$$;

-- Mês a que o contador ai_uses diz respeito (num plano pago reinicia todos os meses).
alter table public.orgs add column if not exists ai_month text;

create or replace function public.use_ai_credit()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  root uuid := public.root_org_of(public.current_org_id());
  r public.orgs%rowtype;
  lim int;
  month text := to_char(now() at time zone 'Africa/Maputo', 'YYYY-MM');
  uses int;
begin
  if root is null then raise exception 'sem empresa'; end if;
  select * into r from public.orgs where id = root for update;

  if r.trial_ends_at is not null then
    -- trial: 3 operações no total
    lim := 3;
    uses := r.ai_uses;
  else
    lim := public.plan_ai_limit(r.plan);
    uses := case when r.ai_month is distinct from month then 0 else r.ai_uses end;
  end if;

  if uses >= lim then
    return jsonb_build_object('allowed', false, 'uses', uses, 'limit', lim, 'trial', r.trial_ends_at is not null);
  end if;

  update public.orgs
     set ai_uses = uses + 1,
         ai_month = case when r.trial_ends_at is null then month else ai_month end
   where id = root;
  return jsonb_build_object('allowed', true, 'uses', uses + 1, 'limit', lim, 'trial', r.trial_ends_at is not null);
end $$;
