-- Tipos de documento completos e catálogo por empresa.

-- ─────────────────────────────────────────────────────────────
-- 1. A numeração conhece todos os tipos que a app emite
--    (cot, cotv, ft, pf, fr) e os recibos.
-- ─────────────────────────────────────────────────────────────
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

  -- cotações normais e visuais partilham a mesma sequência
  if k = 'cotv' then k := 'cot'; end if;
  if k not in ('ft','cot','pf','fr','rec') then k := 'ft'; end if;

  insert into public.org_counters (org_id, kind, value)
  values (org, k, 1)
  on conflict (org_id, kind) do update set value = public.org_counters.value + 1
  returning value into n;

  return case k
    when 'rec' then format('REC %s/%s', yr, lpad(n::text, 3, '0'))
    when 'cot' then format('COT %s/%s', yr, lpad(n::text, 3, '0'))
    when 'pf'  then format('PF %s/%s',  yr, lpad(n::text, 3, '0'))
    when 'fr'  then format('FR %s/%s',  yr, lpad(n::text, 5, '0'))
    else            format('FT %s/%s',  yr, lpad(n::text, 5, '0'))
  end;
end $$;

alter table public.invoices drop constraint if exists invoices_kind_check;
alter table public.invoices add constraint invoices_kind_check
  check (kind in ('ft','cot','cotv','pf','fr'));

-- ─────────────────────────────────────────────────────────────
-- 2. SKU e código de serviço únicos **por empresa**, não globalmente —
--    duas empresas podem ter um "QT-001".
-- ─────────────────────────────────────────────────────────────
alter table public.products drop constraint if exists products_sku_key;
create unique index if not exists products_org_sku_key on public.products (org_id, sku);

alter table public.services drop constraint if exists services_code_key;
create unique index if not exists services_org_code_key on public.services (org_id, code);
