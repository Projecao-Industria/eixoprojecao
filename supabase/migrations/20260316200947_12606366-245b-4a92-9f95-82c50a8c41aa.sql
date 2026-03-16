ALTER TABLE public.manutencoes RENAME COLUMN responsavel TO fornecedor;
ALTER TABLE public.manutencoes ADD COLUMN nfe_pedido text NOT NULL DEFAULT '';