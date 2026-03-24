
-- Tabela de gerentes
CREATE TABLE public.gerentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gerentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read gerentes" ON public.gerentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert gerentes" ON public.gerentes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update gerentes" ON public.gerentes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete gerentes" ON public.gerentes FOR DELETE TO authenticated USING (true);

-- Tabela de vínculo setor-gerente
CREATE TABLE public.setor_gerentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id uuid NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
  gerente_id uuid NOT NULL REFERENCES public.gerentes(id) ON DELETE CASCADE,
  data_inicio date NOT NULL,
  data_fim date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.setor_gerentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read setor_gerentes" ON public.setor_gerentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert setor_gerentes" ON public.setor_gerentes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update setor_gerentes" ON public.setor_gerentes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete setor_gerentes" ON public.setor_gerentes FOR DELETE TO authenticated USING (true);
