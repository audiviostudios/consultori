-- Permetre UPDATE per marcar l'assistència (restringit per trigger a només estat_assistencia per a no-admins)
DO $$
BEGIN
  -- Crear o substituir funció de validació
  CREATE OR REPLACE FUNCTION public.enforce_cites_estat_assistencia_only()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $fn$
  DECLARE
    _is_admin boolean := false;
  BEGIN
    IF auth.uid() IS NOT NULL THEN
      _is_admin := public.is_admin(auth.uid());
    END IF;

    -- Admins poden fer qualsevol update (si mai cal)
    IF _is_admin THEN
      RETURN NEW;
    END IF;

    -- Per qualsevol altre usuari: només es pot canviar estat_assistencia
    IF NEW.dia_visita_id IS DISTINCT FROM OLD.dia_visita_id
      OR NEW.tipus IS DISTINCT FROM OLD.tipus
      OR NEW.numero_tanda IS DISTINCT FROM OLD.numero_tanda
      OR NEW.nom_complet IS DISTINCT FROM OLD.nom_complet
      OR NEW.telefon IS DISTINCT FROM OLD.telefon
      OR NEW.email IS DISTINCT FROM OLD.email
      OR NEW.pin_cancelacio IS DISTINCT FROM OLD.pin_cancelacio
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'Només es pot actualitzar estat_assistencia';
    END IF;

    RETURN NEW;
  END;
  $fn$;

  -- Trigger
  DROP TRIGGER IF EXISTS enforce_cites_estat_assistencia_only ON public.cites;
  CREATE TRIGGER enforce_cites_estat_assistencia_only
  BEFORE UPDATE ON public.cites
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_cites_estat_assistencia_only();
END $$;

-- RLS policy per permetre l'UPDATE (el trigger limita què es pot tocar)
DROP POLICY IF EXISTS "Qualsevol pot marcar assistència" ON public.cites;
CREATE POLICY "Qualsevol pot marcar assistència"
ON public.cites
FOR UPDATE
USING (true)
WITH CHECK (true);
