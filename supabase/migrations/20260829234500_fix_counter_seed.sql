-- Corrige a semente dos contadores por empresa.
--
-- A migração anterior semeou `org_counters` com `count(*)` das facturas. Isso
-- está errado quando a numeração não começa em 1 ou tem saltos: com facturas
-- FT 2026/00003 … 00006 o contador ficou em 4, e a emissão seguinte produziria
-- FT 2026/00005 — um número **já usado**, que rebentaria contra o índice único
-- `(org_id, number)`.
--
-- O contador tem de partir do **maior número já emitido**, não da contagem.

with maxima as (
  select
    org_id,
    max(coalesce(nullif(regexp_replace(split_part(number, '/', 2), '\D', '', 'g'), ''), '0')::bigint) as high
  from public.invoices
  group by org_id
)
insert into public.org_counters (org_id, kind, value)
select org_id, 'ft', high from maxima
on conflict (org_id, kind) do update
  set value = greatest(public.org_counters.value, excluded.value);

-- Mesmo raciocínio para recibos, que vivem numa coluna própria.
with maxima as (
  select
    org_id,
    max(coalesce(nullif(regexp_replace(split_part(receipt_number, '/', 2), '\D', '', 'g'), ''), '0')::bigint) as high
  from public.invoices
  where receipt_number is not null
  group by org_id
)
insert into public.org_counters (org_id, kind, value)
select org_id, 'rec', high from maxima
on conflict (org_id, kind) do update
  set value = greatest(public.org_counters.value, excluded.value);
