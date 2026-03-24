
CREATE TABLE public.entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id text NOT NULL,
  gerente_nome text NOT NULL DEFAULT '',
  data_entrega date NOT NULL,
  data_devolucao date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read entregas" ON public.entregas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert entregas" ON public.entregas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update entregas" ON public.entregas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete entregas" ON public.entregas FOR DELETE TO authenticated USING (true);
