-- Permetre que qualsevol pugui actualitzar el numero_actual (staff sense autenticació)
CREATE POLICY "Qualsevol pot actualitzar número" 
ON public.numero_actual 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Eliminar la política restrictiva anterior si existeix
DROP POLICY IF EXISTS "Admins poden actualitzar número" ON public.numero_actual;