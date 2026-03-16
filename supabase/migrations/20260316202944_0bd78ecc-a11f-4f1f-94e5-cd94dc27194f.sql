
-- Create enum for frequency
CREATE TYPE public.frequencia_manutencao AS ENUM ('Semanal', 'Quinzenal', 'Mensal', 'Trimestral');

-- Create the agenda table
CREATE TABLE public.manutencao_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id text NOT NULL REFERENCES public.bens(id),
  descricao text NOT NULL DEFAULT '',
  frequencia public.frequencia_manutencao NOT NULL DEFAULT 'Mensal',
  primeira_data date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manutencao_agenda ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can read manutencao_agenda"
  ON public.manutencao_agenda FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert manutencao_agenda"
  ON public.manutencao_agenda FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update manutencao_agenda"
  ON public.manutencao_agenda FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete manutencao_agenda"
  ON public.manutencao_agenda FOR DELETE TO authenticated
  USING (true);
