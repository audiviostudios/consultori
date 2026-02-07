-- Afegir política per permetre lectura pública de cites (només per veure quines tandes estan ocupades)
CREATE POLICY "Cites visibles per tothom" ON public.cites FOR SELECT USING (true);

-- Afegir política per permetre lectura pública de dies_visita
DROP POLICY IF EXISTS "Dies visita visibles per tothom" ON public.dies_visita;