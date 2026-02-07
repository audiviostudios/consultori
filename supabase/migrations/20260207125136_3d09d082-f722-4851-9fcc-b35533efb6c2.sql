-- 1. Crear funció security definer per evitar recursió a les polítiques
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = _user_id
  )
$$;

-- 2. Fer el camp email nullable a la taula cites
ALTER TABLE public.cites ALTER COLUMN email DROP NOT NULL;

-- 3. Fer el camp email nullable a la taula consultes_telefoniques
ALTER TABLE public.consultes_telefoniques ALTER COLUMN email DROP NOT NULL;

-- 4. Eliminar les polítiques que causen recursió a la taula cites
DROP POLICY IF EXISTS "Admins poden eliminar cites" ON public.cites;
DROP POLICY IF EXISTS "Admins poden veure cites" ON public.cites;

-- 5. Recrear les polítiques usant la funció security definer
CREATE POLICY "Admins poden eliminar cites" 
ON public.cites 
FOR DELETE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins poden veure cites" 
ON public.cites 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- 6. Arreglar polítiques de la taula admins
DROP POLICY IF EXISTS "Admins poden veure admins" ON public.admins;
CREATE POLICY "Admins poden veure admins" 
ON public.admins 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- 7. Arreglar polítiques de consultes_telefoniques
DROP POLICY IF EXISTS "Admins poden actualitzar consultes" ON public.consultes_telefoniques;
DROP POLICY IF EXISTS "Admins poden veure consultes" ON public.consultes_telefoniques;

CREATE POLICY "Admins poden actualitzar consultes" 
ON public.consultes_telefoniques 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins poden veure consultes" 
ON public.consultes_telefoniques 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- 8. Arreglar polítiques de dies_visita
DROP POLICY IF EXISTS "Admins poden actualitzar dies" ON public.dies_visita;
DROP POLICY IF EXISTS "Admins poden crear dies" ON public.dies_visita;
DROP POLICY IF EXISTS "Admins poden eliminar dies" ON public.dies_visita;

CREATE POLICY "Admins poden actualitzar dies" 
ON public.dies_visita 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins poden crear dies" 
ON public.dies_visita 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins poden eliminar dies" 
ON public.dies_visita 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- 9. Arreglar polítiques de numero_actual
DROP POLICY IF EXISTS "Admins poden actualitzar número" ON public.numero_actual;

CREATE POLICY "Admins poden actualitzar número" 
ON public.numero_actual 
FOR UPDATE 
USING (public.is_admin(auth.uid()));