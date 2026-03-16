-- Allow authenticated users to delete bens
CREATE POLICY "Authenticated can delete bens"
ON public.bens
FOR DELETE
TO authenticated
USING (true);

-- Allow authenticated users to delete manutencoes
CREATE POLICY "Authenticated can delete manutencoes"
ON public.manutencoes
FOR DELETE
TO authenticated
USING (true);