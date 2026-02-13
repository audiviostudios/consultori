-- Permetre només al configurador (rol admin) gestionar alta/baixa de PIN des del panell
CREATE OR REPLACE FUNCTION public.is_config_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = _user_id
      AND rol = 'admin'
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_config_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS "Admins configurador poden veure usuaris pin" ON public.usuaris_pin;
CREATE POLICY "Admins configurador poden veure usuaris pin"
ON public.usuaris_pin
FOR SELECT
USING (public.is_config_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins configurador poden eliminar usuaris pin" ON public.usuaris_pin;
CREATE POLICY "Admins configurador poden eliminar usuaris pin"
ON public.usuaris_pin
FOR DELETE
USING (public.is_config_admin(auth.uid()));
