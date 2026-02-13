-- Fix RPC PIN functions: avoid ambiguous column references and ensure stable signatures
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

  SELECT u.*
  INTO _existing
  FROM public.usuaris_pin u
  WHERE u.telefon = _telefon
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.usuaris_pin u
    SET nom_complet = trim(_nom_complet),
        email = NULLIF(trim(_email), ''),
        updated_at = now()
    WHERE u.id = _existing.id
    RETURNING u.pin, u.nom_complet, u.telefon, u.email
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

CREATE OR REPLACE FUNCTION public.obtenir_usuari_per_pin(
  _pin text
)
RETURNS TABLE(pin text, nom_complet text, telefon text, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.pin, u.nom_complet, u.telefon, u.email
  FROM public.usuaris_pin u
  WHERE u.pin = _pin
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_usuari_pin(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obtenir_usuari_per_pin(text) TO anon, authenticated;
