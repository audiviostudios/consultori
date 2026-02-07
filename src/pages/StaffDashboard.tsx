import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { LogOut, Stethoscope, Heart, Calendar, Monitor, ChevronLeft, ChevronRight, Pill, Phone, CheckCircle, User, Save, X, UserPlus } from 'lucide-react';
import { AddCitaDialog } from '@/components/AddCitaDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useDiesVisita, useCitesDia, useActualitzarEstatCita } from '@/hooks/useDiesVisita';
import { useNumeroActual, useActualitzarNumero, useActualitzarNomProfessional, useActualitzarEstatVisita } from '@/hooks/useNumeroActual';
import { useConsultesRealtime } from '@/hooks/useConsultesRealtime';
import { useReceptes, useMarcarReceptaAtesa } from '@/hooks/useReceptes';
import { useConsultesTelefoniques, useMarcarConsultaAtesa } from '@/hooks/useConsultes';
import { Cita, DiaVisita, Recepta, ConsultaTelefonica } from '@/lib/types';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface CitaCardProps {
  cita: Cita;
  isActive: boolean;
  onSelect: () => void;
  onAssistit: () => void;
  onNoAssistit: () => void;
}

function CitaCard({ cita, isActive, onSelect, onAssistit, onNoAssistit }: CitaCardProps) {
  const handleAssistit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAssistit();
  };

  const handleNoAssistit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNoAssistit();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all relative
        ${isActive 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50'
        }
      `}
    >
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span className="text-2xl sm:text-3xl font-bold text-primary">{cita.numero_tanda}</span>
        <div className="flex items-center gap-1">
          {isActive && <Badge className="text-xs">Visitant</Badge>}
          {isActive && (
            <>
              <button
                onClick={handleAssistit}
                className="w-6 h-6 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
                title="Marcar com a assistit"
              >
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={handleNoAssistit}
                className="w-6 h-6 rounded-full bg-destructive hover:bg-destructive/80 flex items-center justify-center transition-colors"
                title="No ha assistit"
              >
                <X className="w-3.5 h-3.5 text-destructive-foreground" />
              </button>
            </>
          )}
        </div>
      </div>
      <p className="font-medium text-foreground text-sm sm:text-base truncate">{cita.nom_complet}</p>
      <p className="text-xs sm:text-sm text-muted-foreground">{cita.telefon}</p>
    </motion.div>
  );
}

function ReceptaCard({ recepta, onMarcarAtesa }: { recepta: Recepta; onMarcarAtesa: (id: string) => void }) {
  return (
    <Card className="border-primary/20">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm sm:text-base truncate">{recepta.nom_complet}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{recepta.telefon}</p>
            <div className="mt-2 p-2 bg-accent/50 rounded text-xs sm:text-sm">
              <p className="font-medium">Medicament:</p>
              <p className="text-muted-foreground">{recepta.medicament}</p>
            </div>
            {recepta.notes && (
              <p className="mt-2 text-xs text-muted-foreground italic">{recepta.notes}</p>
            )}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onMarcarAtesa(recepta.id)}
            className="shrink-0"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ConsultaCard({ consulta, onMarcarAtesa }: { consulta: ConsultaTelefonica; onMarcarAtesa: (id: string) => void }) {
  return (
    <Card className={consulta.urgencia === 'alta' ? 'border-destructive/50' : 'border-primary/20'}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm sm:text-base truncate">{consulta.nom_complet}</p>
              {consulta.urgencia === 'alta' && (
                <Badge variant="destructive" className="text-xs">Urgent</Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">{consulta.telefon}</p>
            <div className="mt-2 p-2 bg-accent/50 rounded text-xs sm:text-sm">
              <p className="font-medium">Motiu:</p>
              <p className="text-muted-foreground">{consulta.motiu}</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onMarcarAtesa(consulta.id)}
            className="shrink-0"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DiaSelector({ dies, selectedIndex, onSelect }: { dies: DiaVisita[]; selectedIndex: number; onSelect: (index: number) => void }) {
  const isAvui = (data: string) => data === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"
        onClick={() => onSelect(Math.max(0, selectedIndex - 1))}
        disabled={selectedIndex === 0}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 sm:gap-2">
          {dies.map((dia, index) => (
            <button
              key={dia.id}
              onClick={() => onSelect(index)}
              className={`
                flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 min-w-[60px] sm:min-w-[80px] transition-all
                ${index === selectedIndex 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border hover:border-primary/50'
                }
                ${isAvui(dia.data) ? 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2' : ''}
              `}
            >
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase">
                {format(new Date(dia.data), "MMM", { locale: ca })}
              </span>
              <span className="text-sm sm:text-lg font-bold capitalize">
                {format(new Date(dia.data), "EEE d", { locale: ca })}
              </span>
              {isAvui(dia.data) && <span className="text-[9px] sm:text-[10px] font-medium text-primary">Avui</span>}
            </button>
          ))}
        </div>
      </div>
      
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"
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
  const isMobile = useIsMobile();
  const { data: diesVisita = [], isLoading: loadingDies } = useDiesVisita();
  const [selectedDiaIndex, setSelectedDiaIndex] = useState(0);
  
  const staffRole = sessionStorage.getItem('staff_role') as 'metge' | 'infermera' | null;
  const isAuthenticated = sessionStorage.getItem('staff_authenticated') === 'true';
  
  const selectedDia = diesVisita[selectedDiaIndex] || null;
  const { data: cites = [] } = useCitesDia(selectedDia?.id);
  const { data: numerosActuals = [] } = useNumeroActual();
  const actualitzarNumero = useActualitzarNumero();
  const actualitzarNomProfessional = useActualitzarNomProfessional();
  const actualitzarEstatVisita = useActualitzarEstatVisita();
  const actualitzarEstatCita = useActualitzarEstatCita();

  const numeroActualData = numerosActuals.find(n => n.tipus === staffRole);
  const [nomProfessional, setNomProfessional] = useState('');

  // Dades de receptes i consultes
  const { data: receptes = [] } = useReceptes();
  const marcarReceptaAtesa = useMarcarReceptaAtesa();
  const { data: consultes = [] } = useConsultesTelefoniques(staffRole || undefined);
  const marcarConsultaAtesa = useMarcarConsultaAtesa();

  const receptesPendents = receptes.filter(r => !r.atesa);
  const consultesPendents = consultes.filter(c => !c.atesa);

  // Subscripció a consultes telefòniques en temps real amb alerta sonora
  useConsultesRealtime(staffRole);

  // Inicialitzar el nom del professional
  useEffect(() => {
    if (numeroActualData?.nom_professional) {
      setNomProfessional(numeroActualData.nom_professional);
    }
  }, [numeroActualData?.nom_professional]);

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

  const handleSaveNom = async () => {
    if (!staffRole) return;
    try {
      await actualitzarNomProfessional.mutateAsync({ 
        tipus: staffRole, 
        nom_professional: nomProfessional.trim() 
      });
      toast.success('Nom guardat correctament');
    } catch (error) {
      toast.error('Error al guardar el nom');
    }
  };

  const citesFiltered = cites.filter(c => c.tipus === staffRole);
  const numeroActual = numeroActualData?.numero || 0;
  const estatVisita = numeroActualData?.estat_visita;

  const handleSelectCita = async (numero: number) => {
    if (!staffRole) return;
    try {
      // Si hi havia un pacient anterior i no s'ha marcat com no_assistit, marcar-lo com visitat
      if (numeroActual > 0 && numeroActual !== numero) {
        const citaAnterior = citesFiltered.find(c => c.numero_tanda === numeroActual);
        if (citaAnterior && citaAnterior.estat_assistencia !== 'no_assistit') {
          await actualitzarEstatCita.mutateAsync({ id: citaAnterior.id, estat_assistencia: 'visitat' });
        }
      }
      
      // Canviar al nou pacient
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

  const handleAssistit = async () => {
    if (!staffRole) return;
    try {
      const citaActual = citesFiltered.find(c => c.numero_tanda === numeroActual);
      if (citaActual) {
        await actualitzarEstatCita.mutateAsync({ id: citaActual.id, estat_assistencia: 'visitat' });
        toast.success('Pacient marcat com a assistit');
      }
    } catch (error) {
      toast.error('Error al marcar');
    }
  };

  const handleNoAssistit = async () => {
    if (!staffRole) return;
    try {
      const citaActual = citesFiltered.find(c => c.numero_tanda === numeroActual);
      if (citaActual) {
        await actualitzarEstatCita.mutateAsync({ id: citaActual.id, estat_assistencia: 'no_assistit' });
        toast.info('Pacient marcat com no assistit');
      }
    } catch (error) {
      toast.error('Error al marcar');
    }
  };

  const handleMarcarReceptaAtesa = async (id: string) => {
    try {
      await marcarReceptaAtesa.mutateAsync({ id, atesa: true });
      toast.success('Recepta marcada com atesa');
    } catch (error) {
      toast.error('Error al marcar la recepta');
    }
  };

  const handleMarcarConsultaAtesa = async (id: string) => {
    try {
      await marcarConsultaAtesa.mutateAsync({ id, atesa: true });
      toast.success('Consulta marcada com atesa');
    } catch (error) {
      toast.error('Error al marcar la consulta');
    }
  };

  if (!isAuthenticated || !staffRole) return null;

  if (loadingDies) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const Icon = staffRole === 'metge' ? Stethoscope : Heart;
  const titol = staffRole === 'metge' ? 'Metge' : 'Infermera';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">{titol}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Panell de control</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="sm" asChild className="h-8 sm:h-9">
                <Link to="/pantalla">
                  <Monitor className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Pantalla</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 sm:h-9">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sortir</span>
              </Button>
            </div>
          </div>
          
          {/* Camp per al nom del professional */}
          <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="El teu nom (es mostrarà a la pantalla)"
              value={nomProfessional}
              onChange={(e) => setNomProfessional(e.target.value)}
              className="h-8 text-sm flex-1"
            />
            <Button 
              size="sm" 
              onClick={handleSaveNom} 
              disabled={actualitzarNomProfessional.isPending}
              className="h-8 shrink-0"
            >
              <Save className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Desar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {diesVisita.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold mb-2">No hi ha dies de visita</h2>
              <p className="text-sm text-muted-foreground">
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
              <div className="mb-3 sm:mb-4 text-center py-2 px-3 sm:px-4 bg-accent/50 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gestionant cites del{' '}
                  <span className="font-semibold text-foreground capitalize">
                    {format(new Date(selectedDia.data), "EEEE, d 'de' MMMM", { locale: ca })}
                  </span>
                </p>
              </div>
            )}

            <Tabs defaultValue="cites" className="space-y-4">
              <TabsList className={`grid w-full ${staffRole === 'metge' ? 'grid-cols-3' : 'grid-cols-2'} h-10 sm:h-11`}>
                <TabsTrigger value="cites" className="text-xs sm:text-sm gap-1 sm:gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Cites</span>
                  {citesFiltered.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">{citesFiltered.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="consultes" className="text-xs sm:text-sm gap-1 sm:gap-2">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Consultes</span>
                  {consultesPendents.length > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">{consultesPendents.length}</Badge>
                  )}
                </TabsTrigger>
                {staffRole === 'metge' && (
                  <TabsTrigger value="receptes" className="text-xs sm:text-sm gap-1 sm:gap-2">
                    <Pill className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Receptes</span>
                    {receptesPendents.length > 0 && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-xs">{receptesPendents.length}</Badge>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="cites">
                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="truncate">
                          {citesFiltered.length} pacients • Visitant: <span className="text-primary">{numeroActual}</span>
                        </span>
                      </CardTitle>
                      {selectedDia && (
                        <AddCitaDialog
                          diaVisitaId={selectedDia.id}
                          tipus={staffRole!}
                          maxTandes={staffRole === 'metge' ? selectedDia.max_tandes_metge : selectedDia.max_tandes_infermera}
                          citesOcupades={cites}
                          dataVisita={selectedDia.data}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {citesFiltered.length === 0 ? (
                      <div className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
                        No hi ha cites programades per a aquest dia
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {citesFiltered
                          .sort((a, b) => a.numero_tanda - b.numero_tanda)
                          .map((cita) => (
                            <CitaCard
                              key={cita.id}
                              cita={cita}
                              isActive={cita.numero_tanda === numeroActual}
                              onSelect={() => handleSelectCita(cita.numero_tanda)}
                              onAssistit={handleAssistit}
                              onNoAssistit={handleNoAssistit}
                            />
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="consultes">
                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                      Consultes telefòniques pendents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {consultesPendents.length === 0 ? (
                      <div className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
                        No hi ha consultes pendents
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {consultesPendents.map((consulta) => (
                          <ConsultaCard
                            key={consulta.id}
                            consulta={consulta}
                            onMarcarAtesa={handleMarcarConsultaAtesa}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {staffRole === 'metge' && (
                <TabsContent value="receptes">
                  <Card>
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
                        Sol·licituds de receptes pendents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {receptesPendents.length === 0 ? (
                        <div className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
                          No hi ha sol·licituds de receptes pendents
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {receptesPendents.map((recepta) => (
                            <ReceptaCard
                              key={recepta.id}
                              recepta={recepta}
                              onMarcarAtesa={handleMarcarReceptaAtesa}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default StaffDashboard;
