
-- 1. Fix profile role escalation: prevent users from changing their own perfil
ALTER POLICY "Users can update own profile" ON public.profiles
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND perfil = (SELECT p.perfil FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 2. Restrict gerentes write operations to directors only
DROP POLICY IF EXISTS "Authenticated can insert gerentes" ON public.gerentes;
DROP POLICY IF EXISTS "Authenticated can update gerentes" ON public.gerentes;
DROP POLICY IF EXISTS "Authenticated can delete gerentes" ON public.gerentes;

CREATE POLICY "Directors can insert gerentes" ON public.gerentes
  FOR INSERT TO authenticated
  WITH CHECK (is_diretor());

CREATE POLICY "Directors can update gerentes" ON public.gerentes
  FOR UPDATE TO authenticated
  USING (is_diretor());

CREATE POLICY "Directors can delete gerentes" ON public.gerentes
  FOR DELETE TO authenticated
  USING (is_diretor());

-- 3. Add explicit write policies to app_config (director-only)
CREATE POLICY "Directors can insert app_config" ON public.app_config
  FOR INSERT TO authenticated
  WITH CHECK (is_diretor());

CREATE POLICY "Directors can update app_config" ON public.app_config
  FOR UPDATE TO authenticated
  USING (is_diretor());

CREATE POLICY "Directors can delete app_config" ON public.app_config
  FOR DELETE TO authenticated
  USING (is_diretor());
