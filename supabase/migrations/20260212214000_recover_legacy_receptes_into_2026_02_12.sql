-- Recuperar receptes legacy (abans del canvi per dia) cap al dia 2026-02-12
DO $$
DECLARE
  _dia_id uuid;
BEGIN
  SELECT id
    INTO _dia_id
  FROM public.dies_visita
  WHERE data = DATE '2026-02-12'
  ORDER BY created_at ASC
  LIMIT 1;

  IF _dia_id IS NULL THEN
    RAISE NOTICE 'No s''ha trobat dies_visita per 2026-02-12. No s''actualitza cap recepta.';
    RETURN;
  END IF;

  UPDATE public.receptes
  SET dia_visita_id = _dia_id
  WHERE created_at < TIMESTAMPTZ '2026-02-13T00:00:00.000Z'
    AND dia_visita_id IS DISTINCT FROM _dia_id;
END $$;
