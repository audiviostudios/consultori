-- Sistema de perfil amb PIN de 4 xifres per reutilitzar dades en formularis públics
CREATE TABLE IF NOT EXISTS public.usuaris_pin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin text NOT NULL UNIQUE,
  nom_complet text NOT NULL,
  telefon text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usuaris_pin_pin_format_chk CHECK (pin ~ '^[0-9]{4}$'),
  CONSTRAINT usuaris_pin_telefon_format_chk CHECK (telefon ~ '^[0-9]{9}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuaris_pin_telefon_unique
  ON public.usuaris_pin (telefon);

ALTER TABLE public.usuaris_pin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualsevol pot inserir usuaris pin" ON public.usuaris_pin;
CREATE POLICY "Qualsevol pot inserir usuaris pin"
ON public.usuaris_pin
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Qualsevol pot actualitzar usuaris pin" ON public.usuaris_pin;
CREATE POLICY "Qualsevol pot actualitzar usuaris pin"
ON public.usuaris_pin
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP TRIGGER IF EXISTS update_usuaris_pin_updated_at ON public.usuaris_pin;
CREATE TRIGGER update_usuaris_pin_updated_at
BEFORE UPDATE ON public.usuaris_pin
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.registrar_usuari_pin(
  _nom_complet text,
  _telefon text,
  _email text DEFAULT NULL
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

-- Permetre editar cites des del panell administrador (configurador)
DROP POLICY IF EXISTS "Admins poden actualitzar cites" ON public.cites;
CREATE POLICY "Admins poden actualitzar cites"
ON public.cites
FOR UPDATE
USING (public.is_admin(auth.uid()));
