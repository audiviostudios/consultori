-- Afegir estat d'emergència i comptadors visibles a la pantalla pública
ALTER TABLE public.numero_actual
ADD COLUMN IF NOT EXISTS emergencia_activa boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS consultes_pendents integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS receptes_pendents integer NOT NULL DEFAULT 0;

-- Recalcula comptadors de consultes i receptes per a cada professional
CREATE OR REPLACE FUNCTION public.refresh_numero_actual_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _consultes_metge integer;
  _consultes_infermera integer;
  _receptes integer;
BEGIN
  SELECT COUNT(*)::integer
  INTO _consultes_metge
  FROM public.consultes_telefoniques
  WHERE tipus = 'metge' AND atesa = false;

  SELECT COUNT(*)::integer
  INTO _consultes_infermera
  FROM public.consultes_telefoniques
  WHERE tipus = 'infermera' AND atesa = false;

  SELECT COUNT(*)::integer
  INTO _receptes
  FROM public.receptes
  WHERE atesa = false;

  UPDATE public.numero_actual
  SET
    consultes_pendents = CASE
      WHEN tipus = 'metge' THEN _consultes_metge
      WHEN tipus = 'infermera' THEN _consultes_infermera
      ELSE 0
    END,
    receptes_pendents = CASE
      WHEN tipus = 'metge' THEN _receptes
      ELSE 0
    END;
END;
$$;

-- Trigger wrapper per executar la funció de recompte
CREATE OR REPLACE FUNCTION public.trg_refresh_numero_actual_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_numero_actual_metrics();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS refresh_numero_actual_from_consultes ON public.consultes_telefoniques;
CREATE TRIGGER refresh_numero_actual_from_consultes
AFTER INSERT OR UPDATE OR DELETE ON public.consultes_telefoniques
FOR EACH STATEMENT
EXECUTE FUNCTION public.trg_refresh_numero_actual_metrics();

DROP TRIGGER IF EXISTS refresh_numero_actual_from_receptes ON public.receptes;
CREATE TRIGGER refresh_numero_actual_from_receptes
AFTER INSERT OR UPDATE OR DELETE ON public.receptes
FOR EACH STATEMENT
EXECUTE FUNCTION public.trg_refresh_numero_actual_metrics();

-- Inicialitzar comptadors existents
SELECT public.refresh_numero_actual_metrics();
