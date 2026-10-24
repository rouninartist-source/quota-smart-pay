-- Quota :: imagens no Supabase Storage, não na base de dados
--
-- Até aqui as imagens (foto de perfil, logotipo, fotos de produtos e das
-- linhas da cotação visual) eram data URLs em texto dentro das tabelas — e a
-- foto de perfil nos user_metadata, que o Supabase copia para o token de
-- sessão enviado em cada pedido. Passam a ficheiros no bucket `media`; as
-- tabelas guardam só o URL.
--
-- Caminhos:
--   orgs/<org_id>/<pasta>/<uuid>.jpg   logotipo, produtos, linhas
--   users/<user_id>/avatar/<uuid>.jpg  foto de perfil
--
-- Leitura pública (os documentos partilhados e os PDFs precisam das imagens
-- sem sessão; os nomes são UUIDs, não se adivinham). Escrita só por membros
-- da empresa da pasta, ou pelo próprio utilizador na sua pasta.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

/** Pode o utilizador actual escrever neste caminho do bucket `media`? */
create or replace function public.can_write_media(p_name text)
returns boolean
language sql stable security definer set search_path = public as $$
  select case (storage.foldername(p_name))[1]
    when 'users' then (storage.foldername(p_name))[2] = auth.uid()::text
    when 'orgs'  then exists (
      select 1 from public.org_members m
       where m.user_id = auth.uid() and m.org_id::text = (storage.foldername(p_name))[2])
    else false
  end;
$$;

drop policy if exists media_insert on storage.objects;
create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.can_write_media(name));

drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.can_write_media(name))
  with check (bucket_id = 'media' and public.can_write_media(name));

drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.can_write_media(name));
