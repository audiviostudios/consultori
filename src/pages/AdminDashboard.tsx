import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { LogOut, Stethoscope, Heart, Calendar, Phone, Settings, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useDiaVisitaActual, useCitesDia } from '@/hooks/useDiesVisita';
import { useConsultesTelefoniques, useMarcarConsultaAtesa } from '@/hooks/useConsultes';
import { useNumeroActual, useActualitzarNumero } from '@/hooks/useNumeroActual';
import { Cita, ConsultaTelefonica } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface CitaCardProps {
  cita: Cita;
  isActive: boolean;
  onSelect: () => void;
}

function CitaCard({ cita, isActive, onSelect }: CitaCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all
        ${isActive 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl font-bold text-primary">{cita.numero_tanda}</span>
        {isActive && <Badge>Visitant</Badge>}
      </div>
      <p className="font-medium text-foreground">{cita.nom_complet}</p>
      <p className="text-sm text-muted-foreground">{cita.telefon}</p>
      <p className="text-sm text-muted-foreground">{cita.email}</p>
    </motion.div>
  );
}

interface ConsultaCardProps {
  consulta: ConsultaTelefonica;
  onToggle: () => void;
}

function ConsultaCard({ consulta, onToggle }: ConsultaCardProps) {
  const urgenciaColors = {
    baixa: 'bg-success/10 text-success',
    mitjana: 'bg-warning/10 text-warning',
    alta: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card className={consulta.atesa ? 'opacity-50' : ''}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium">{consulta.nom_complet}</p>
            <p className="text-sm text-muted-foreground">{consulta.telefon}</p>
          </div>
          <Badge className={urgenciaColors[consulta.urgencia]}>
            {consulta.urgencia.charAt(0).toUpperCase() + consulta.urgencia.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{consulta.motiu}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {format(new Date(consulta.created_at), "dd/MM/yyyy HH:mm", { locale: ca })}
          </span>
          <Button size="sm" variant={consulta.atesa ? 'outline' : 'default'} onClick={onToggle}>
            {consulta.atesa ? 'Reobrir' : 'Marcar atesa'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardSectionProps {
  tipus: 'metge' | 'infermera';
  icon: typeof Stethoscope;
  titol: string;
}

function DashboardSection({ tipus, icon: Icon, titol }: DashboardSectionProps) {
  const { data: diaActual } = useDiaVisitaActual();
  const { data: cites = [] } = useCitesDia(diaActual?.id);
  const { data: consultes = [] } = useConsultesTelefoniques(tipus);
  const { data: numerosActuals = [] } = useNumeroActual();
  const actualitzarNumero = useActualitzarNumero();
  const marcarAtesa = useMarcarConsultaAtesa();

  const citesFiltered = cites.filter(c => c.tipus === tipus);
  const numeroActual = numerosActuals.find(n => n.tipus === tipus)?.numero || 0;

  const handleSelectCita = async (numero: number) => {
    try {
      await actualitzarNumero.mutateAsync({ 
        tipus, 
        numero, 
        dia_visita_id: diaActual?.id 
      });
      toast.success(`Visitant pacient ${numero}`);
    } catch (error) {
      toast.error('Error al actualitzar');
    }
  };

  const handleToggleConsulta = async (id: string, atesa: boolean) => {
    try {
      await marcarAtesa.mutateAsync({ id, atesa: !atesa });
    } catch (error) {
      toast.error('Error al actualitzar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{titol}</h2>
          <p className="text-muted-foreground">
            {citesFiltered.length} pacients • Visitant: <span className="font-bold text-primary">{numeroActual}</span>
          </p>
        </div>
      </div>

      <Tabs defaultValue="cites" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cites" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Cites ({citesFiltered.length})
          </TabsTrigger>
          <TabsTrigger value="consultes" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Consultes ({consultes.filter(c => !c.atesa).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cites">
          {citesFiltered.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hi ha cites programades
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {citesFiltered
                .sort((a, b) => a.numero_tanda - b.numero_tanda)
                .map((cita) => (
                  <CitaCard
                    key={cita.id}
                    cita={cita}
                    isActive={cita.numero_tanda === numeroActual}
                    onSelect={() => handleSelectCita(cita.numero_tanda)}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="consultes">
          {consultes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hi ha consultes telefòniques
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {consultes.map((consulta) => (
                <ConsultaCard
                  key={consulta.id}
                  consulta={consulta}
                  onToggle={() => handleToggleConsulta(consulta.id, consulta.atesa)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const AdminDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Administració</h1>
            <p className="text-sm text-muted-foreground">Consultori de l'Albagés</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/config">
                <Settings className="w-4 h-4 mr-2" />
                Configuració
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/pantalla">
                <Monitor className="w-4 h-4 mr-2" />
                Pantalla
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sortir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="metge" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="metge" className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              Metge
            </TabsTrigger>
            <TabsTrigger value="infermera" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Infermera
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metge">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DashboardSection tipus="metge" icon={Stethoscope} titol="Metge" />
            </motion.div>
          </TabsContent>

          <TabsContent value="infermera">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DashboardSection tipus="infermera" icon={Heart} titol="Infermera" />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
