
-- Enums
CREATE TYPE public.status_bem AS ENUM ('Ativo', 'Baixado');
CREATE TYPE public.perfil_usuario AS ENUM ('Diretor', 'Gestor', 'Manutenção');
CREATE TYPE public.tipo_manutencao AS ENUM ('Preventiva', 'Corretiva');

-- Categorias
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Setores
CREATE TABLE public.setores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  perfil perfil_usuario NOT NULL DEFAULT 'Manutenção',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profile <-> Categorias junction
CREATE TABLE public.profile_categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  UNIQUE(profile_id, categoria_id)
);

-- Profile <-> Setores junction
CREATE TABLE public.profile_setores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
  UNIQUE(profile_id, setor_id)
);

-- Bens (assets)
CREATE TABLE public.bens (
  id TEXT NOT NULL PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria_id UUID NOT NULL REFERENCES public.categorias(id),
  setor_id UUID NOT NULL REFERENCES public.setores(id),
  usuario TEXT NOT NULL DEFAULT '',
  data_compra DATE NOT NULL,
  nfe TEXT NOT NULL DEFAULT '',
  valor_compra NUMERIC(12,2) NOT NULL DEFAULT 0,
  depreciacao_anual INTEGER NOT NULL DEFAULT 10,
  data_baixa DATE,
  motivo_baixa TEXT NOT NULL DEFAULT '',
  status status_bem NOT NULL DEFAULT 'Ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bem extras (vehicle/machine specs)
CREATE TABLE public.bem_extras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bem_id TEXT NOT NULL REFERENCES public.bens(id) ON DELETE CASCADE UNIQUE,
  placa TEXT NOT NULL DEFAULT '',
  km TEXT NOT NULL DEFAULT '',
  renavam TEXT NOT NULL DEFAULT '',
  chassi TEXT NOT NULL DEFAULT '',
  numero_serie TEXT NOT NULL DEFAULT '',
  modelo TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Manutencoes
CREATE TABLE public.manutencoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  bem_id TEXT NOT NULL REFERENCES public.bens(id),
  descricao TEXT NOT NULL DEFAULT '',
  data DATE NOT NULL,
  tipo tipo_manutencao NOT NULL DEFAULT 'Corretiva',
  custo NUMERIC(12,2) NOT NULL DEFAULT 0,
  responsavel TEXT NOT NULL DEFAULT '',
  observacoes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Manutencao itens
CREATE TABLE public.manutencao_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manutencao_id UUID NOT NULL REFERENCES public.manutencoes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL DEFAULT '',
  custo NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- RLS Policies (allow authenticated users full access for now)
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bem_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manutencao_itens ENABLE ROW LEVEL SECURITY;

-- Categorias: authenticated can read/write
CREATE POLICY "Authenticated can read categorias" ON public.categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert categorias" ON public.categorias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete categorias" ON public.categorias FOR DELETE TO authenticated USING (true);

-- Setores: authenticated can read/write
CREATE POLICY "Authenticated can read setores" ON public.setores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert setores" ON public.setores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete setores" ON public.setores FOR DELETE TO authenticated USING (true);

-- Profiles: users can read all, update own
CREATE POLICY "Authenticated can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Junction tables
CREATE POLICY "Authenticated can read profile_categorias" ON public.profile_categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage own profile_categorias" ON public.profile_categorias FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read profile_setores" ON public.profile_setores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage own profile_setores" ON public.profile_setores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Bens: authenticated full access
CREATE POLICY "Authenticated can read bens" ON public.bens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert bens" ON public.bens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update bens" ON public.bens FOR UPDATE TO authenticated USING (true);

-- Bem extras
CREATE POLICY "Authenticated can read bem_extras" ON public.bem_extras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert bem_extras" ON public.bem_extras FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update bem_extras" ON public.bem_extras FOR UPDATE TO authenticated USING (true);

-- Manutencoes
CREATE POLICY "Authenticated can read manutencoes" ON public.manutencoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert manutencoes" ON public.manutencoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update manutencoes" ON public.manutencoes FOR UPDATE TO authenticated USING (true);

-- Manutencao itens
CREATE POLICY "Authenticated can read manutencao_itens" ON public.manutencao_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert manutencao_itens" ON public.manutencao_itens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update manutencao_itens" ON public.manutencao_itens FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete manutencao_itens" ON public.manutencao_itens FOR DELETE TO authenticated USING (true);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
