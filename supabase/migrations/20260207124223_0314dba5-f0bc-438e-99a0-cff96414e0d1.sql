-- Afegir camp pin_cancelacio a la taula cites
ALTER TABLE public.cites ADD COLUMN pin_cancelacio text;

-- Crear índex per buscar per PIN
CREATE INDEX idx_cites_pin_cancelacio ON public.cites(pin_cancelacio);

-- Política per permetre eliminar cites amb PIN (públic)
CREATE POLICY "Qualsevol pot eliminar cita amb PIN" 
ON public.cites 
FOR DELETE 
USING (true);