-- Quota :: só três layouts de documento (Clássico, Básico Claro, Básico Escuro)
--
-- Moderno, Minimal e Corporativo foram retirados. Quem os tinha passa ao
-- Clássico — a app já o fazia ao ler um valor desconhecido; isto deixa a base
-- de dados coerente com o que é mostrado.
update public.company
   set doc_template = 'classico'
 where doc_template is not null
   and doc_template not in ('classico', 'basic-claro', 'basic-escuro');
