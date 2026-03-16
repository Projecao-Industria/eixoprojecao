
-- Helper function to check if current user is Diretor
CREATE OR REPLACE FUNCTION public.is_diretor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND perfil = 'Diretor'
  )
$$;

-- Trigger to prevent non-Diretor users from changing perfil column
CREATE OR REPLACE FUNCTION public.prevent_perfil_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If perfil is being changed, check if the current user is a Diretor
  IF NEW.perfil IS DISTINCT FROM OLD.perfil THEN
    IF NOT public.is_diretor() THEN
      RAISE EXCEPTION 'Apenas Diretores podem alterar o perfil de usuários';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_prevent_perfil_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_perfil_escalation();

-- Fix profile_setores: only own rows OR Diretor can manage
DROP POLICY IF EXISTS "Authenticated can manage own profile_setores" ON public.profile_setores;
CREATE POLICY "Users can manage own or admin profile_setores"
  ON public.profile_setores FOR ALL TO authenticated
  USING (profile_id = auth.uid() OR public.is_diretor())
  WITH CHECK (profile_id = auth.uid() OR public.is_diretor());

-- Fix profile_categorias: only own rows OR Diretor can manage
DROP POLICY IF EXISTS "Authenticated can manage own profile_categorias" ON public.profile_categorias;
CREATE POLICY "Users can manage own or admin profile_categorias"
  ON public.profile_categorias FOR ALL TO authenticated
  USING (profile_id = auth.uid() OR public.is_diretor())
  WITH CHECK (profile_id = auth.uid() OR public.is_diretor());
