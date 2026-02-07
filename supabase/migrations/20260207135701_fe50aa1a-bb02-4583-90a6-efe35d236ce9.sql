-- Afegir columna per al nom del professional a la taula numero_actual
ALTER TABLE public.numero_actual 
ADD COLUMN nom_professional text DEFAULT null;