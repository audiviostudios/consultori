-- Afegir política de lectura pública per dies_visita
CREATE POLICY "Dies visita visibles per tothom" ON public.dies_visita FOR SELECT USING (true);