-- Arreglar la política d'INSERT per consultes_telefoniques (permetre a tothom)
DROP POLICY IF EXISTS "Qualsevol pot crear consulta" ON public.consultes_telefoniques;
CREATE POLICY "Qualsevol pot crear consulta" 
ON public.consultes_telefoniques 
FOR INSERT 
WITH CHECK (true);

-- Permetre eliminar cites (per neteja de dies anteriors)
DROP POLICY IF EXISTS "Admins poden eliminar cites" ON public.cites;
CREATE POLICY "Admins poden eliminar cites" 
ON public.cites 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Permetre eliminar consultes telefòniques
CREATE POLICY "Admins poden eliminar consultes" 
ON public.consultes_telefoniques 
FOR DELETE 
USING (is_admin(auth.uid()));