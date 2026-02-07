-- Afegir camp estat_visita a numero_actual per guardar si el pacient ha estat visitat o no
ALTER TABLE public.numero_actual 
ADD COLUMN estat_visita text DEFAULT NULL;

-- Els valors possibles seran: NULL (en curs), 'visitat', 'no_assistit'