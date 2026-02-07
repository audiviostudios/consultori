import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { LogOut, Stethoscope, Heart, Calendar, Monitor, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDiesVisita, useCitesDia } from '@/hooks/useDiesVisita';
import { useNumeroActual, useActualitzarNumero } from '@/hooks/useNumeroActual';
import { useConsultesRealtime } from '@/hooks/useConsultesRealtime';
import { Cita, DiaVisita } from '@/lib/types';
import { toast } from 'sonner';

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
    </motion.div>
  );
}

function DiaSelector({ dies, selectedIndex, onSelect }: { dies: DiaVisita[]; selectedIndex: number; onSelect: (index: number) => void }) {
  const isAvui = (data: string) => data === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex items-center gap-2 mb-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onSelect(Math.max(0, selectedIndex - 1))}
        disabled={selectedIndex === 0}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-2">
          {dies.map((dia, index) => (
            <button
              key={dia.id}
              onClick={() => onSelect(index)}
              className={`
                flex flex-col items-center justify-center p-3 rounded-xl border-2 min-w-[80px] transition-all
                ${index === selectedIndex 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border hover:border-primary/50'
                }
                ${isAvui(dia.data) ? 'ring-2 ring-primary ring-offset-2' : ''}
              `}
            >
              <span className="text-xs text-muted-foreground uppercase">
                {format(new Date(dia.data), "MMM", { locale: ca })}
              </span>
              <span className="text-lg font-bold capitalize">
                {format(new Date(dia.data), "EEE d", { locale: ca })}
              </span>
              {isAvui(dia.data) && <span className="text-[10px] font-medium text-primary">Avui</span>}
            </button>
          ))}
        </div>
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onSelect(Math.min(dies.length - 1, selectedIndex + 1))}
        disabled={selectedIndex === dies.length - 1}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { data: diesVisita = [], isLoading: loadingDies } = useDiesVisita();
  const [selectedDiaIndex, setSelectedDiaIndex] = useState(0);
  
  const selectedDia = diesVisita[selectedDiaIndex] || null;
  const { data: cites = [] } = useCitesDia(selectedDia?.id);
  const { data: numerosActuals = [] } = useNumeroActual();
  const actualitzarNumero = useActualitzarNumero();

  const staffRole = sessionStorage.getItem('staff_role') as 'metge' | 'infermera' | null;
  const isAuthenticated = sessionStorage.getItem('staff_authenticated') === 'true';

  // Subscripció a consultes telefòniques en temps real amb alerta sonora
  useConsultesRealtime(staffRole);

  useEffect(() => {
    if (!isAuthenticated || !staffRole) {
      navigate('/admin/pin');
    }
  }, [isAuthenticated, staffRole, navigate]);

  const handleSignOut = () => {
    sessionStorage.removeItem('staff_role');
    sessionStorage.removeItem('staff_authenticated');
    navigate('/admin/pin');
  };

  const citesFiltered = cites.filter(c => c.tipus === staffRole);
  const numeroActual = numerosActuals.find(n => n.tipus === staffRole)?.numero || 0;

  const handleSelectCita = async (numero: number) => {
    if (!staffRole) return;
    try {
      await actualitzarNumero.mutateAsync({ 
        tipus: staffRole, 
        numero, 
        dia_visita_id: selectedDia?.id 
      });
      toast.success(`Visitant pacient ${numero}`);
    } catch (error) {
      toast.error('Error al actualitzar');
    }
  };

  if (!isAuthenticated || !staffRole) return null;

  if (loadingDies) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const Icon = staffRole === 'metge' ? Stethoscope : Heart;
  const titol = staffRole === 'metge' ? 'Metge' : 'Infermera';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{titol}</h1>
              <p className="text-sm text-muted-foreground">Panell de control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        {diesVisita.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No hi ha dies de visita</h2>
              <p className="text-muted-foreground">
                Contacta amb l'administrador per crear dies de visita
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <DiaSelector 
              dies={diesVisita} 
              selectedIndex={selectedDiaIndex} 
              onSelect={setSelectedDiaIndex} 
            />

            {selectedDia && (
              <div className="mb-4 text-center py-2 px-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Gestionant cites del{' '}
                  <span className="font-semibold text-foreground capitalize">
                    {format(new Date(selectedDia.data), "EEEE, d 'de' MMMM", { locale: ca })}
                  </span>
                </p>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {citesFiltered.length} pacients • Visitant: <span className="text-primary">{numeroActual}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {citesFiltered.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No hi ha cites programades per a aquest dia
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default StaffDashboard;
