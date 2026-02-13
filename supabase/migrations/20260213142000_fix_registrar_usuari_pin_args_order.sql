-- Ajustar ordre d'arguments per compatibilitat amb PostgREST schema cache
DROP FUNCTION IF EXISTS public.registrar_usuari_pin(text, text, text);

CREATE OR REPLACE FUNCTION public.registrar_usuari_pin(
  _email text DEFAULT NULL,
  _nom_complet text DEFAULT NULL,
  _telefon text DEFAULT NULL
)
RETURNS TABLE(pin text, nom_complet text, telefon text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing public.usuaris_pin%ROWTYPE;
  _pin text;
  _tries integer := 0;
BEGIN
  IF _nom_complet IS NULL OR length(trim(_nom_complet)) < 2 THEN
    RAISE EXCEPTION 'Nom complet no vàlid';
  END IF;

  IF _telefon IS NULL OR _telefon !~ '^[0-9]{9}$' THEN
    RAISE EXCEPTION 'Telèfon no vàlid';
  END IF;

  SELECT *
  INTO _existing
  FROM public.usuaris_pin
  WHERE telefon = _telefon
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.usuaris_pin
    SET nom_complet = trim(_nom_complet),
        email = NULLIF(trim(_email), ''),
        updated_at = now()
    WHERE id = _existing.id
    RETURNING public.usuaris_pin.pin,
              public.usuaris_pin.nom_complet,
              public.usuaris_pin.telefon,
              public.usuaris_pin.email
    INTO pin, nom_complet, telefon, email;

    RETURN NEXT;
    RETURN;
  END IF;

  LOOP
    EXIT WHEN _tries >= 25;
    _tries := _tries + 1;
    _pin := lpad((floor(random() * 10000))::int::text, 4, '0');

    BEGIN
      INSERT INTO public.usuaris_pin(pin, nom_complet, telefon, email)
      VALUES (_pin, trim(_nom_complet), _telefon, NULLIF(trim(_email), ''))
      RETURNING public.usuaris_pin.pin,
                public.usuaris_pin.nom_complet,
                public.usuaris_pin.telefon,
                public.usuaris_pin.email
      INTO pin, nom_complet, telefon, email;

      RETURN NEXT;
      RETURN;
    EXCEPTION
      WHEN unique_violation THEN
        CONTINUE;
    END;
  END LOOP;

  RAISE EXCEPTION 'No s''ha pogut generar un PIN únic. Torna-ho a provar.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_usuari_pin(text, text, text) TO anon, authenticated;
