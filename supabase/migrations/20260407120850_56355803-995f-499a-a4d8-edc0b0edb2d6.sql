
-- Table: epis (same structure as bens)
CREATE TABLE public.epis (
  id text NOT NULL PRIMARY KEY,
  descricao text NOT NULL,
  categoria_id uuid NOT NULL REFERENCES public.categorias(id),
  setor_id uuid NOT NULL REFERENCES public.setores(id),
  usuario text NOT NULL DEFAULT '',
  data_compra date NOT NULL,
  nfe text NOT NULL DEFAULT '',
  numero_aprovacao text NOT NULL DEFAULT '',
  valor_compra numeric NOT NULL DEFAULT 0,
  depreciacao_anual integer NOT NULL DEFAULT 10,
  motivo_baixa text NOT NULL DEFAULT '',
  data_baixa date,
  status status_bem NOT NULL DEFAULT 'Ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.epis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read epis" ON public.epis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert epis" ON public.epis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update epis" ON public.epis FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete epis" ON public.epis FOR DELETE TO authenticated USING (true);

-- Table: ferramentas_consumo (same structure as bens)
CREATE TABLE public.ferramentas_consumo (
  id text NOT NULL PRIMARY KEY,
  descricao text NOT NULL,
  categoria_id uuid NOT NULL REFERENCES public.categorias(id),
  setor_id uuid NOT NULL REFERENCES public.setores(id),
  usuario text NOT NULL DEFAULT '',
  data_compra date NOT NULL,
  nfe text NOT NULL DEFAULT '',
  numero_aprovacao text NOT NULL DEFAULT '',
  valor_compra numeric NOT NULL DEFAULT 0,
  depreciacao_anual integer NOT NULL DEFAULT 10,
  motivo_baixa text NOT NULL DEFAULT '',
  data_baixa date,
  status status_bem NOT NULL DEFAULT 'Ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ferramentas_consumo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read ferramentas_consumo" ON public.ferramentas_consumo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ferramentas_consumo" ON public.ferramentas_consumo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ferramentas_consumo" ON public.ferramentas_consumo FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete ferramentas_consumo" ON public.ferramentas_consumo FOR DELETE TO authenticated USING (true);

-- Table: epis_entregas (same structure as entregas)
CREATE TABLE public.epis_entregas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bem_id text NOT NULL,
  gerente_nome text NOT NULL DEFAULT '',
  data_entrega date NOT NULL,
  data_devolucao date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.epis_entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read epis_entregas" ON public.epis_entregas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert epis_entregas" ON public.epis_entregas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update epis_entregas" ON public.epis_entregas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete epis_entregas" ON public.epis_entregas FOR DELETE TO authenticated USING (true);

-- Table: ferramentas_consumo_entregas (same structure as entregas)
CREATE TABLE public.ferramentas_consumo_entregas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bem_id text NOT NULL,
  gerente_nome text NOT NULL DEFAULT '',
  data_entrega date NOT NULL,
  data_devolucao date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ferramentas_consumo_entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read fc_entregas" ON public.ferramentas_consumo_entregas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert fc_entregas" ON public.ferramentas_consumo_entregas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update fc_entregas" ON public.ferramentas_consumo_entregas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete fc_entregas" ON public.ferramentas_consumo_entregas FOR DELETE TO authenticated USING (true);
