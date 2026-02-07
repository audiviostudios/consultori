-- Política per permetre crear el primer admin (només si no existeix cap)
CREATE POLICY "Primer admin pot ser creat per qualsevol" 
ON public.admins 
FOR INSERT 
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.admins)
);