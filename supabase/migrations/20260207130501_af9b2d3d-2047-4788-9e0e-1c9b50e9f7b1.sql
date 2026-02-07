-- Crear taula per sol·licituds de receptes
CREATE TABLE public.receptes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_complet TEXT NOT NULL,
  telefon TEXT NOT NULL,
  email TEXT,
  medicament TEXT NOT NULL,
  notes TEXT,
  atesa BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activar RLS
ALTER TABLE public.receptes ENABLE ROW LEVEL SECURITY;

-- Tothom pot veure les receptes (per admins)
CREATE POLICY "Receptes visibles per admins" 
ON public.receptes 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Qualsevol pot crear una sol·licitud de recepta
CREATE POLICY "Qualsevol pot sol·licitar recepta" 
ON public.receptes 
FOR INSERT 
WITH CHECK (true);

-- Admins poden actualitzar (marcar com atesa)
CREATE POLICY "Admins poden actualitzar receptes" 
ON public.receptes 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Admins poden eliminar receptes
CREATE POLICY "Admins poden eliminar receptes" 
ON public.receptes 
FOR DELETE 
USING (is_admin(auth.uid()));