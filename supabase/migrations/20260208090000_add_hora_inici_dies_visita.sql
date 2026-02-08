-- Hores d'inici configurables per dia de visita
ALTER TABLE public.dies_visita
  ADD COLUMN IF NOT EXISTS hora_inici_metge time without time zone NOT NULL DEFAULT '08:50:00',
  ADD COLUMN IF NOT EXISTS hora_inici_infermera time without time zone NOT NULL DEFAULT '09:00:00';

-- Assegurar valors per defecte en dades antigues (si venien de migracions prèvies)
UPDATE public.dies_visita
SET
  hora_inici_metge = COALESCE(hora_inici_metge, '08:50:00'::time),
  hora_inici_infermera = COALESCE(hora_inici_infermera, '09:00:00'::time)
WHERE hora_inici_metge IS NULL OR hora_inici_infermera IS NULL;
