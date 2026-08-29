-- Definições da empresa, tickets de template e seed do catálogo.

-- ─────────────────────────────────────────────────────────────
-- 1. Definições da empresa como JSONB
--
-- O tipo `Company` da app tem estrutura aninhada (conta bancária e uma lista de
-- carteiras móveis). Espalhar isso por colunas seria uma tradução com perdas —
-- e é sempre lido e gravado de uma vez só. JSONB é o encaixe honesto.
-- ─────────────────────────────────────────────────────────────
alter table public.company add column if not exists settings jsonb not null default '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────
-- 2. Pedidos de template personalizado
-- ─────────────────────────────────────────────────────────────
do $$ begin
  create type public.ticket_status as enum ('aberto', 'em_analise', 'resolvido');
exception when duplicate_object then null; end $$;

create table if not exists public.template_tickets (
  id          uuid primary key default gen_random_uuid(),
  ref         text not null unique,
  title       text not null,
  description text not null default '',
  contact     text not null default '',
  documents   text[] not null default '{}',
  fee         numeric(12,2) not null default 0,
  status      public.ticket_status not null default 'aberto',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create sequence if not exists public.ticket_seq start 1;

create or replace function public.next_ticket_ref()
returns text language sql security definer set search_path = public as $$
  select 'TPL-' || lpad(nextval('public.ticket_seq')::text, 4, '0');
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Seed do catálogo (só se as tabelas estiverem vazias)
-- ─────────────────────────────────────────────────────────────
insert into public.products (sku, name, category, price, cost, stock, min_stock, unit, vat)
select * from (values
  ('QT-001','Papel A4 80g (resma)','Consumíveis',480,320,240,50,'un',16),
  ('QT-002','Toner HP 26A','Consumíveis',4200,3100,12,15,'un',16),
  ('QT-003','Cadeira ergonómica Zeta','Mobiliário',12500,8600,8,4,'un',16),
  ('QT-004','Secretária 140cm','Mobiliário',18900,12000,3,5,'un',16),
  ('QT-005','Router Wi-Fi 6 AX3000','Tecnologia',7400,5200,26,10,'un',16),
  ('QT-006','Portátil Ultra 14"','Tecnologia',68000,52000,5,3,'un',16),
  ('QT-007','Tinteiro Epson 664','Consumíveis',890,560,0,20,'un',16),
  ('QT-008','Monitor 27" QHD','Tecnologia',24500,17800,14,6,'un',16),
  ('QT-009','Água mineral 5L (cx)','Alimentar',620,410,180,40,'cx',5),
  ('QT-010','Café torrado 1kg','Alimentar',1450,980,62,25,'kg',5),
  ('QT-011','Disco SSD 1TB','Tecnologia',9800,7100,19,8,'un',16),
  ('QT-012','Arquivador metálico','Mobiliário',15600,10400,0,2,'un',16)
) as v(sku,name,category,price,cost,stock,min_stock,unit,vat)
where not exists (select 1 from public.products);

insert into public.services (code, name, category, rate, billing, duration, margin, active)
select * from (values
  ('SV-01','Consultoria fiscal','Consultoria',3500,'Hora','1h',68,true),
  ('SV-02','Implementação de rede','Tecnologia',42000,'Projecto','3-5 dias',54,true),
  ('SV-03','Manutenção mensal TI','Tecnologia',18500,'Mensal','Contínuo',61,true),
  ('SV-04','Design de marca','Criativo',65000,'Projecto','2 semanas',72,true),
  ('SV-05','Formação em facturação','Formação',2800,'Hora','2h',80,true),
  ('SV-06','Auditoria interna','Consultoria',95000,'Projecto','1 mês',49,false),
  ('SV-07','Suporte WhatsApp Business','Tecnologia',7500,'Mensal','Contínuo',66,true),
  ('SV-08','Gestão de cobranças','Financeiro',12000,'Mensal','Contínuo',58,true)
) as v(code,name,category,rate,billing,duration,margin,active)
where not exists (select 1 from public.services);

-- RLS para a tabela nova (mesmas políticas de desenvolvimento — ver 0001).
alter table public.template_tickets enable row level security;
drop policy if exists dev_all_access on public.template_tickets;
create policy dev_all_access on public.template_tickets
  for all to anon, authenticated using (true) with check (true);
