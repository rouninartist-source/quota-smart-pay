-- Numeração definida pela empresa (QA: «definir o número da cotação»).
-- Quem vem de outro sistema continua a sua série: o próximo número de cada
-- série (COT, FT, PF, FR, REC) passa a poder ser definido em Definições.
-- O contador continua a ser o de next_document_number (org_counters).

-- Prefixo impresso de cada série.
create or replace function public.document_prefix(p_kind text)
returns text
language sql
immutable
as $$
  select case lower(p_kind)
    when 'rec' then 'REC'
    when 'cot' then 'COT'
    when 'pf'  then 'PF'
    when 'fr'  then 'FR'
    else 'FT'
  end
$$;

-- Maior número já usado na série este ano (para não repetir números).
create or replace function public.document_series_max(p_org uuid, p_kind text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  with pattern as (
    select '^' || public.document_prefix(p_kind) || ' ' || to_char(current_date, 'YYYY') || '/([0-9]+)$' as re
  ),
  used as (
    select number from public.invoices
     where org_id = p_org
       and lower(p_kind) <> 'rec'
       and (case when lower(p_kind) = 'cot' then kind in ('cot','cotv') else kind = lower(p_kind) end)
    union all
    select number from public.receipts where org_id = p_org and lower(p_kind) = 'rec'
    union all
    select p.receipt_number from public.payments p
      join public.invoices i on i.id = p.invoice_id
     where i.org_id = p_org and lower(p_kind) = 'rec' and p.receipt_number is not null
  )
  select coalesce(max((regexp_match(number, (select re from pattern)))[1]::bigint), 0)
    from used
   where number ~ (select re from pattern)
$$;

-- Próximo número de cada série, para mostrar em Definições.
create or replace function public.document_counters()
returns table (kind text, next_number bigint, used_max bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  org uuid := public.current_org_id();
begin
  if org is null then
    raise exception 'sem empresa associada ao utilizador';
  end if;
  return query
    select k, coalesce((select c.value from public.org_counters c where c.org_id = org and c.kind = k), 0) + 1,
           public.document_series_max(org, k)
      from unnest(array['cot','ft','pf','fr','rec']) as k;
end $$;

-- Define o próximo número de uma série. Só o dono ou um administrador.
create or replace function public.set_document_counter(p_kind text, p_next bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  org uuid := public.current_org_id();
  k   text := lower(coalesce(p_kind, ''));
  mx  bigint;
begin
  if org is null then
    raise exception 'sem empresa associada ao utilizador';
  end if;
  if not exists (select 1 from public.org_members where org_id = org and user_id = auth.uid() and role in ('owner','admin')) then
    raise exception 'só o dono ou um administrador pode alterar a numeração';
  end if;
  if k = 'cotv' then k := 'cot'; end if;
  if k not in ('cot','ft','pf','fr','rec') then
    raise exception 'série desconhecida: %', p_kind;
  end if;
  if p_next is null or p_next < 1 or p_next > 9999999 then
    raise exception 'o número tem de estar entre 1 e 9 999 999';
  end if;

  mx := public.document_series_max(org, k);
  if p_next <= mx then
    raise exception 'já existe % %/% — o próximo número tem de ser maior do que %',
      public.document_prefix(k), to_char(current_date, 'YYYY'), mx, mx;
  end if;

  insert into public.org_counters (org_id, kind, value)
  values (org, k, p_next - 1)
  on conflict (org_id, kind) do update set value = excluded.value;
end $$;

revoke all on function public.document_series_max(uuid, text) from public, anon, authenticated;
grant execute on function public.document_counters() to authenticated;
grant execute on function public.set_document_counter(text, bigint) to authenticated;
