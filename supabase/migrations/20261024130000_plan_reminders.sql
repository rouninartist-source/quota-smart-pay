-- Quota :: avisos do plano por e-mail (confirmação de pagamento e lembretes diários)
--
-- 1. plan_payments.receipt_emailed_at — o e-mail de confirmação sai uma só vez,
--    mesmo que o webhook e a consulta de estado confirmem ao mesmo tempo.
-- 2. plan_reminders — um lembrete por empresa, tipo e dia (o trabalho diário
--    pode correr duas vezes sem enviar duplicados).
-- 3. Trabalho diário às 08:00 de Maputo (06:00 UTC): o pg_cron chama
--    /api/cron/lembretes com o segredo guardado no Vault como `quota_cron_secret`
--    (o mesmo valor da variável CRON_SECRET no Hostinger). Um segredo não vai
--    para o git, por isso é criado à parte, não nesta migração.

alter table public.plan_payments add column if not exists receipt_emailed_at timestamptz;

create table if not exists public.plan_reminders (
  org_id  uuid not null references public.orgs (id) on delete cascade,
  kind    text not null,
  day     date not null default current_date,
  sent_at timestamptz not null default now(),
  primary key (org_id, kind, day)
);
alter table public.plan_reminders enable row level security;
-- Sem políticas: só o servidor (service_role) lê e escreve.

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron')
     or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
    raise notice 'pg_cron/pg_net indisponíveis — lembretes diários não agendados';
    return;
  end if;
  execute 'create extension if not exists pg_cron with schema extensions';
  execute 'create extension if not exists pg_net with schema extensions';

  begin
    perform cron.unschedule('quota-plan-reminders');
  exception when others then null;
  end;

  perform cron.schedule(
    'quota-plan-reminders',
    '0 6 * * *',
    $job$
      select net.http_get(
        url := 'https://quota.milsonuix.com/api/cron/lembretes',
        headers := jsonb_build_object(
          'x-cron-secret',
          (select decrypted_secret from vault.decrypted_secrets where name = 'quota_cron_secret' limit 1)
        ),
        timeout_milliseconds := 60000
      );
    $job$
  );
end $$;
