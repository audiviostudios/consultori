-- Permetre eliminar cites des del panell de personal (PIN metge/infermera)
DROP POLICY IF EXISTS "Admins poden eliminar cites" ON public.cites;
DROP POLICY IF EXISTS "Qualsevol pot eliminar cites" ON public.cites;

CREATE POLICY "Qualsevol pot eliminar cites"
ON public.cites
FOR DELETE
USING (true);
