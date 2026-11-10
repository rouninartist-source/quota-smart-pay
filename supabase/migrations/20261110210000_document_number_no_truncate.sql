-- QA (Milson, 10/11): «duplicate key value violates unique constraint
-- invoices_org_number_key» ao emitir depois de definir a numeração.
-- Causa: lpad(n, 3) CORTA números com mais dígitos (lpad('1500',3) = '150'),
-- por isso um próximo número ≥ 1000 virava um número já usado.
-- Correcção: o zero à esquerda só alarga, nunca corta; e, por segurança, se o
-- número calculado já existir (dados antigos, importações), avança até um livre.

create or replace function public.document_number_format(p_kind text, p_n bigint)
returns text
language sql
immutable
as $$
  select public.document_prefix(p_kind) || ' ' || to_char(current_date, 'YYYY') || '/' ||
         lpad(p_n::text, greatest(case when lower(p_kind) in ('ft','fr') then 5 else 3 end, length(p_n::text)), '0')
$$;

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
  num text;
  tries int := 0;
begin
  if org is null then
    raise exception 'sem empresa associada ao utilizador';
  end if;

  -- cotações normais e visuais partilham a mesma sequência
  if k = 'cotv' then k := 'cot'; end if;
  if k not in ('ft','cot','pf','fr','rec') then k := 'ft'; end if;

  loop
    insert into public.org_counters (org_id, kind, value)
    values (org, k, 1)
    on conflict (org_id, kind) do update set value = public.org_counters.value + 1
    returning value into n;

    num := public.document_number_format(k, n);

    exit when not (
      (k <> 'rec' and exists (select 1 from public.invoices where org_id = org and number = num))
      or (k = 'rec' and exists (select 1 from public.receipts where org_id = org and number = num))
      or (k = 'rec' and exists (select 1 from public.payments p join public.invoices i on i.id = p.invoice_id
                                 where i.org_id = org and p.receipt_number = num))
    );

    tries := tries + 1;
    if tries > 10000 then
      raise exception 'não foi possível encontrar um número livre na série %', k;
    end if;
  end loop;

  return num;
end $$;
