-- Quota — esquema inicial
--
-- Correr no SQL Editor do projecto Supabase (Dashboard → SQL Editor → New query).
--
-- ⚠️  LER A SECÇÃO 6 (RLS) ANTES DE PUBLICAR. As políticas aqui são de
--     DESENVOLVIMENTO: qualquer pessoa com a chave publicável — que vai no
--     bundle do browser — consegue ler e escrever. Serve para trabalhar
--     localmente; NÃO serve para produção.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1. Empresa (linha única — os dados que saem no documento)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.company (
  id               uuid primary key default gen_random_uuid(),
  name             text not null default '',
  nuit             text not null default '',
  address          text not null default '',
  email            text not null default '',
  phone            text not null default '',
  logo_url         text,
  show_payment     boolean not null default true,
  bank             text not null default '',
  bank_account     text not null default '',
  bank_holder      text not null default '',
  bank_nib         text not null default '',
  mpesa            text not null default '',
  emola            text not null default '',
  legal_note       text not null default '',
  payment_note     text not null default '',
  doc_template     text not null default 'classico',
  updated_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. Clientes
-- ─────────────────────────────────────────────────────────────
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  nuit        text not null default '',
  email       text not null default '',
  phone       text not null default '',
  address     text not null default '',
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists clients_name_idx on public.clients (lower(name));

-- ─────────────────────────────────────────────────────────────
-- 3. Documentos
--
-- `status` inclui 'cancelada': anular NUNCA apaga — o rasto fiscal do
-- documento tem de permanecer.
-- ─────────────────────────────────────────────────────────────
do $$ begin
  create type public.invoice_status as enum
    ('rascunho', 'enviada', 'paga', 'vencida', 'parcial', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum
    ('mpesa', 'emola', 'transferencia', 'numerario', 'cheque', 'cartao');
exception when duplicate_object then null; end $$;

create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  number          text not null unique,
  kind            text not null default 'ft',
  issued          date not null default current_date,
  due             date not null,
  status          public.invoice_status not null default 'rascunho',
  notes           text,
  discount        numeric(6,2) not null default 0,
  client_id       uuid references public.clients (id) on delete set null,
  -- Cópia dos dados do cliente no momento da emissão. Um documento fiscal não
  -- pode mudar porque a ficha do cliente foi editada depois.
  client_snapshot jsonb not null default '{}'::jsonb,
  receipt_number  text,
  receipt_issued  date,
  created_at      timestamptz not null default now()
);

create index if not exists invoices_issued_idx on public.invoices (issued desc);
create index if not exists invoices_client_idx on public.invoices (client_id);

create table if not exists public.invoice_lines (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices (id) on delete cascade,
  position    int  not null default 0,
  description text not null default '',
  note        text,
  qty         numeric(12,3) not null default 1,
  price       numeric(14,2) not null default 0,
  vat         numeric(5,2)  not null default 16,
  image_url   text
);

create index if not exists invoice_lines_invoice_idx on public.invoice_lines (invoice_id, position);

create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices (id) on delete cascade,
  paid_on     date not null default current_date,
  amount      numeric(14,2) not null,
  method      public.payment_method not null default 'numerario',
  reference   text,
  created_at  timestamptz not null default now()
);

create index if not exists payments_invoice_idx on public.payments (invoice_id);

-- ─────────────────────────────────────────────────────────────
-- 4. Catálogo
-- ─────────────────────────────────────────────────────────────
create table if not exists public.products (
  id         uuid primary key default gen_random_uuid(),
  sku        text not null unique,
  name       text not null,
  category   text not null default '',
  price      numeric(14,2) not null default 0,
  cost       numeric(14,2) not null default 0,
  stock      numeric(12,3) not null default 0,
  min_stock  numeric(12,3) not null default 0,
  unit       text not null default 'un',
  vat        numeric(5,2) not null default 16,
  active     boolean not null default true,
  image_url  text
);

create table if not exists public.services (
  id        uuid primary key default gen_random_uuid(),
  code      text not null unique,
  name      text not null,
  category  text not null default '',
  rate      numeric(14,2) not null default 0,
  billing   text not null default 'Hora',
  duration  text not null default '',
  margin    numeric(5,2) not null default 0,
  active    boolean not null default true
);

-- ─────────────────────────────────────────────────────────────
-- 5. Numeração sequencial — a parte que não pode falhar
--
-- Dois dispositivos a emitir ao mesmo tempo não podem produzir o mesmo
-- FT 2026/00042. Uma sequência do Postgres resolve isso de forma atómica:
-- cada chamada devolve um número único, mesmo em concorrência.
-- ─────────────────────────────────────────────────────────────
create sequence if not exists public.invoice_seq  start 1;
create sequence if not exists public.receipt_seq  start 1;
create sequence if not exists public.quote_seq    start 1;

create or replace function public.next_document_number(p_kind text default 'ft')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n   bigint;
  yr  text := to_char(current_date, 'YYYY');
begin
  case lower(p_kind)
    when 'rec' then n := nextval('public.receipt_seq');
                    return format('REC %s/%s', yr, lpad(n::text, 3, '0'));
    when 'cot' then n := nextval('public.quote_seq');
                    return format('COT %s/%s', yr, lpad(n::text, 3, '0'));
    else            n := nextval('public.invoice_seq');
                    return format('FT %s/%s', yr, lpad(n::text, 5, '0'));
  end case;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 6. RLS  ⚠️  POLÍTICAS DE DESENVOLVIMENTO
--
-- O RLS fica LIGADO (sem ele, a chave publicável dá acesso total à tabela).
-- Mas as políticas abaixo permitem tudo ao papel `anon`, porque a aplicação
-- ainda não tem autenticação.
--
-- ANTES DE PUBLICAR, uma de duas:
--   (a) Adicionar Supabase Auth e trocar `using (true)` por
--       `using (auth.uid() is not null)`; ou
--   (b) Falar com o Supabase só do lado do servidor (a app corre em Node),
--       com uma chave secreta, e apagar de vez as políticas `anon`.
-- ─────────────────────────────────────────────────────────────
alter table public.company       enable row level security;
alter table public.clients       enable row level security;
alter table public.invoices      enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.payments      enable row level security;
alter table public.products      enable row level security;
alter table public.services      enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'company','clients','invoices','invoice_lines','payments','products','services'
  ] loop
    execute format(
      'drop policy if exists dev_all_access on public.%I; '
      'create policy dev_all_access on public.%I for all to anon, authenticated '
      'using (true) with check (true);', t, t);
  end loop;
end $$;

-- Uma linha de empresa, se ainda não existir.
insert into public.company (name)
select 'Quota Studio'
where not exists (select 1 from public.company);
