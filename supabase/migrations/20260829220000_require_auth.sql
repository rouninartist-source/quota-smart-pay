-- Fecha o acesso anónimo.
--
-- Até aqui as políticas eram de desenvolvimento: davam acesso total ao papel
-- `anon`. Como a chave publicável vai no bundle do browser, isso significava que
-- qualquer pessoa que abrisse o site conseguia ler e escrever as facturas.
--
-- A partir desta migração é preciso **sessão iniciada**: as políticas passam a
-- exigir `auth.uid() is not null`, e o papel `anon` deixa de ser contemplado.

do $$
declare t text;
begin
  foreach t in array array[
    'company','clients','invoices','invoice_lines','payments',
    'products','services','template_tickets'
  ] loop
    -- fora com a política permissiva
    execute format('drop policy if exists dev_all_access on public.%I;', t);

    execute format(
      'create policy authenticated_all on public.%I '
      'for all to authenticated '
      'using (auth.uid() is not null) '
      'with check (auth.uid() is not null);', t);
  end loop;
end $$;

-- Nota para quando houver mais do que uma empresa a usar o mesmo projecto:
-- estas políticas dão a qualquer utilizador autenticado acesso a todas as
-- linhas. Para separar por empresa é preciso uma coluna `org_id` em cada tabela
-- e trocar a condição por `org_id = (auth.jwt() ->> 'org_id')::uuid` (ou uma
-- tabela de membros). Enquanto for uma só empresa, isto chega.
