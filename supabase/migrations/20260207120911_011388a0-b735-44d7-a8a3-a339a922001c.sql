-- Taula de configuració general
CREATE TABLE public.configuracio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clau TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Taula de dies de visita
CREATE TABLE public.dies_visita (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  metge_actiu BOOLEAN NOT NULL DEFAULT true,
  infermera_activa BOOLEAN NOT NULL DEFAULT true,
  max_tandes_metge INTEGER NOT NULL DEFAULT 10,
  max_tandes_infermera INTEGER NOT NULL DEFAULT 10,
  vacunes_grip_actiu BOOLEAN NOT NULL DEFAULT false,
  max_tandes_grip INTEGER NOT NULL DEFAULT 10,
  vacunes_covid_actiu BOOLEAN NOT NULL DEFAULT false,
  max_tandes_covid INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(data)
);

-- Taula de cites
CREATE TABLE public.cites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dia_visita_id UUID NOT NULL REFERENCES public.dies_visita(id) ON DELETE CASCADE,
  tipus TEXT NOT NULL CHECK (tipus IN ('metge', 'infermera', 'grip', 'covid')),
  numero_tanda INTEGER NOT NULL,
  nom_complet TEXT NOT NULL,
  telefon TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dia_visita_id, tipus, numero_tanda)
);

-- Taula de consultes telefòniques
CREATE TABLE public.consultes_telefoniques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipus TEXT NOT NULL CHECK (tipus IN ('metge', 'infermera')),
  nom_complet TEXT NOT NULL,
  telefon TEXT NOT NULL,
  email TEXT NOT NULL,
  urgencia TEXT NOT NULL CHECK (urgencia IN ('baixa', 'mitjana', 'alta')),
  motiu TEXT NOT NULL,
  atesa BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Taula per controlar el número actual que s'està visitant
CREATE TABLE public.numero_actual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipus TEXT NOT NULL UNIQUE CHECK (tipus IN ('metge', 'infermera')),
  numero INTEGER NOT NULL DEFAULT 0,
  dia_visita_id UUID REFERENCES public.dies_visita(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configuració inicial per número actual
INSERT INTO public.numero_actual (tipus, numero) VALUES ('metge', 0), ('infermera', 0);

-- Taula d'usuaris admin
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('metge', 'infermera', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.configuracio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dies_visita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultes_telefoniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.numero_actual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Polítiques per configuració (només lectura pública)
CREATE POLICY "Configuració visible per tothom" ON public.configuracio FOR SELECT USING (true);

-- Polítiques per dies_visita (lectura pública, escriptura només admins)
CREATE POLICY "Dies visita visibles per tothom" ON public.dies_visita FOR SELECT USING (true);
CREATE POLICY "Admins poden crear dies" ON public.dies_visita FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);
CREATE POLICY "Admins poden actualitzar dies" ON public.dies_visita FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);
CREATE POLICY "Admins poden eliminar dies" ON public.dies_visita FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);

-- Polítiques per cites (lectura per admins, inserció pública)
CREATE POLICY "Qualsevol pot crear cita" ON public.cites FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins poden veure cites" ON public.cites FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);
CREATE POLICY "Admins poden eliminar cites" ON public.cites FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);

-- Polítiques per consultes_telefoniques
CREATE POLICY "Qualsevol pot crear consulta" ON public.consultes_telefoniques FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins poden veure consultes" ON public.consultes_telefoniques FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);
CREATE POLICY "Admins poden actualitzar consultes" ON public.consultes_telefoniques FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);

-- Polítiques per numero_actual (lectura pública, escriptura admins)
CREATE POLICY "Número actual visible per tothom" ON public.numero_actual FOR SELECT USING (true);
CREATE POLICY "Admins poden actualitzar número" ON public.numero_actual FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);

-- Polítiques per admins
CREATE POLICY "Admins poden veure admins" ON public.admins FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);

-- Habilitar realtime per numero_actual (pantalla sala espera)
ALTER PUBLICATION supabase_realtime ADD TABLE public.numero_actual;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cites;

-- Funció per actualitzar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers per updated_at
CREATE TRIGGER update_configuracio_updated_at BEFORE UPDATE ON public.configuracio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dies_visita_updated_at BEFORE UPDATE ON public.dies_visita FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_numero_actual_updated_at BEFORE UPDATE ON public.numero_actual FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();