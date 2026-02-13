-- Lligar consultes telefòniques i receptes al dia de visita seleccionat
ALTER TABLE public.consultes_telefoniques
ADD COLUMN IF NOT EXISTS dia_visita_id uuid NULL;

ALTER TABLE public.receptes
ADD COLUMN IF NOT EXISTS dia_visita_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'consultes_telefoniques_dia_visita_id_fkey'
  ) THEN
    ALTER TABLE public.consultes_telefoniques
    ADD CONSTRAINT consultes_telefoniques_dia_visita_id_fkey
    FOREIGN KEY (dia_visita_id)
    REFERENCES public.dies_visita(id)
    ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'receptes_dia_visita_id_fkey'
  ) THEN
    ALTER TABLE public.receptes
    ADD CONSTRAINT receptes_dia_visita_id_fkey
    FOREIGN KEY (dia_visita_id)
    REFERENCES public.dies_visita(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consultes_telefoniques_dia_visita_id
  ON public.consultes_telefoniques (dia_visita_id);

CREATE INDEX IF NOT EXISTS idx_receptes_dia_visita_id
  ON public.receptes (dia_visita_id);
