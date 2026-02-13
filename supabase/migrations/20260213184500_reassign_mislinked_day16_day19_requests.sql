-- Reassignar sol·licituds creades en mode fallback (created_at al dia triat)
-- que van quedar enllaçades al dia legacy 2026-02-12.
DO $$
DECLARE
  _legacy_dia_id uuid;
BEGIN
  SELECT id
  INTO _legacy_dia_id
  FROM public.dies_visita
  WHERE data = DATE '2026-02-12'
  ORDER BY created_at ASC
  LIMIT 1;

  IF _legacy_dia_id IS NULL THEN
    RAISE NOTICE 'No hi ha dia legacy 2026-02-12. No es reassigna cap registre.';
    RETURN;
  END IF;

  UPDATE public.receptes r
  SET dia_visita_id = d.id
  FROM public.dies_visita d
  WHERE r.dia_visita_id = _legacy_dia_id
    AND r.created_at >= TIMESTAMPTZ '2026-02-13T00:00:00.000Z'
    AND d.data = (r.created_at AT TIME ZONE 'UTC')::date
    AND d.id IS DISTINCT FROM r.dia_visita_id;

  UPDATE public.consultes_telefoniques c
  SET dia_visita_id = d.id
  FROM public.dies_visita d
  WHERE c.dia_visita_id = _legacy_dia_id
    AND c.created_at >= TIMESTAMPTZ '2026-02-13T00:00:00.000Z'
    AND d.data = (c.created_at AT TIME ZONE 'UTC')::date
    AND d.id IS DISTINCT FROM c.dia_visita_id;
END $$;
