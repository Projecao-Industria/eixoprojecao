
-- Adicionar novas colunas específicas de EPI
ALTER TABLE public.epis
  ADD COLUMN marca text NOT NULL DEFAULT '',
  ADD COLUMN numero_ca text NOT NULL DEFAULT '',
  ADD COLUMN data_vencimento date;

-- Tornar categoria_id e setor_id nullable (não obrigatórios no novo formulário)
ALTER TABLE public.epis
  ALTER COLUMN categoria_id DROP NOT NULL,
  ALTER COLUMN setor_id DROP NOT NULL;
