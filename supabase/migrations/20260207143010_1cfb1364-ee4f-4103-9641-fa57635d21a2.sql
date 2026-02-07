-- Afegir camp estat_assistencia a cites per guardar si cada pacient ha assistit o no
ALTER TABLE public.cites 
ADD COLUMN estat_assistencia text DEFAULT NULL;

-- Els valors possibles seran: NULL (pendent), 'visitat', 'no_assistit'