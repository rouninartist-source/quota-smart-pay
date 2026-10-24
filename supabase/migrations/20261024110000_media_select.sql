-- Quota :: o Storage só apaga ou substitui um ficheiro que consegue ver
--
-- A leitura pública (pelo URL) não passa pelo RLS, mas `remove` e `upsert`
-- procuram primeiro o ficheiro em storage.objects — sem política de SELECT,
-- apagar devolvia [] sem apagar nada. Cada um vê só a pasta onde pode escrever.

drop policy if exists media_select on storage.objects;
create policy media_select on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.can_write_media(name));
