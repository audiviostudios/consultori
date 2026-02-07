import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, Stethoscope, Heart, Syringe, RefreshCw, Users, CheckSquare, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useDiesVisita, useCrearDiaVisita, useActualitzarDiaVisita, useEliminarDiaVisita, useCitesDia, useEliminarCita, useEliminarCitesMultiples } from '@/hooks/useDiesVisita';
import { useCleanupData } from '@/hooks/useCleanupData';
import { DiaVisita, Cita } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DiaVisitaCardProps {
  dia: DiaVisita;
  onUpdate: (updates: Partial<DiaVisita>) => void;
  onDelete: () => void;
}

function DiaVisitaCard({ dia, onUpdate, onDelete }: DiaVisitaCardProps) {
  const dataFormatada = format(new Date(dia.data), "EEEE, d MMMM", { locale: ca });

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {dataFormatada}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            <span className="font-medium">Metge</span>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={30}
              value={dia.max_tandes_metge}
              onChange={(e) => onUpdate({ max_tandes_metge: parseInt(e.target.value) || 10 })}
              className="w-16 h-8"
            />
            <Switch
              checked={dia.metge_actiu}
              onCheckedChange={(checked) => onUpdate({ metge_actiu: checked })}
            />
          </div>
        </div>

        {/* Infermera */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            <span className="font-medium">Infermera</span>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={30}
              value={dia.max_tandes_infermera}
              onChange={(e) => onUpdate({ max_tandes_infermera: parseInt(e.target.value) || 10 })}
              className="w-16 h-8"
            />
            <Switch
              checked={dia.infermera_activa}
              onCheckedChange={(checked) => onUpdate({ infermera_activa: checked })}
            />
          </div>
        </div>

        {/* Vacunes Grip */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-center gap-2">
            <Syringe className="w-4 h-4 text-warning" />
            <span className="font-medium">Vacunes Grip</span>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={30}
              value={dia.max_tandes_grip}
              onChange={(e) => onUpdate({ max_tandes_grip: parseInt(e.target.value) || 10 })}
              className="w-16 h-8"
              disabled={!dia.vacunes_grip_actiu}
            />
            <Switch
              checked={dia.vacunes_grip_actiu}
              onCheckedChange={(checked) => onUpdate({ vacunes_grip_actiu: checked })}
            />
          </div>
        </div>

        {/* Vacunes COVID */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2">
            <Syringe className="w-4 h-4 text-primary" />
            <span className="font-medium">Vacunes COVID</span>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={30}
              value={dia.max_tandes_covid}
              onChange={(e) => onUpdate({ max_tandes_covid: parseInt(e.target.value) || 10 })}
              className="w-16 h-8"
              disabled={!dia.vacunes_covid_actiu}
            />
            <Switch
              checked={dia.vacunes_covid_actiu}
              onCheckedChange={(checked) => onUpdate({ vacunes_covid_actiu: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const AdminConfig = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: diesVisita = [], isLoading: loadingDies } = useDiesVisita();
  const crearDia = useCrearDiaVisita();
  const actualitzarDia = useActualitzarDiaVisita();
  const eliminarDia = useEliminarDiaVisita();
  const eliminarCita = useEliminarCita();
  const eliminarCitesMultiples = useEliminarCitesMultiples();
  const cleanupData = useCleanupData();
  
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedDiaPerCites, setSelectedDiaPerCites] = useState<string | undefined>(undefined);
  const [selectedCites, setSelectedCites] = useState<Set<string>>(new Set());
  
  // Obtenir cites del dia seleccionat
  const { data: citesDelDia = [] } = useCitesDia(selectedDiaPerCites);
  
  // Dates que ja tenen visita configurada
  const diesExistents = diesVisita.map(d => new Date(d.data));

  const handleCleanup = async () => {
    if (!confirm('Estàs segur? S\'eliminaran totes les cites i dies de visita anteriors a avui, i les consultes ateses de més de 24h.')) return;
    
    try {
      const result = await cleanupData.mutateAsync();
      toast.success(result.message || 'Neteja completada correctament');
    } catch (error) {
      toast.error('Error al netejar les dades');
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  const handleCrearDies = async () => {
    if (selectedDates.length === 0) {
      toast.error('Selecciona almenys un dia');
      return;
    }

    let creats = 0;
    let errors = 0;

    for (const date of selectedDates) {
      const dataStr = format(date, 'yyyy-MM-dd');
      const existeix = diesVisita.some(d => d.data === dataStr);
      
      if (existeix) {
        errors++;
        continue;
      }

      try {
        await crearDia.mutateAsync({
          data: dataStr,
          metge_actiu: true,
          infermera_activa: true,
          max_tandes_metge: 10,
          max_tandes_infermera: 10,
          vacunes_grip_actiu: false,
          max_tandes_grip: 10,
          vacunes_covid_actiu: false,
          max_tandes_covid: 10,
        });
        creats++;
      } catch (error) {
        errors++;
      }
    }

    if (creats > 0) {
      toast.success(`${creats} dia${creats > 1 ? 's' : ''} de visita creat${creats > 1 ? 's' : ''}`);
    }
    if (errors > 0) {
      toast.error(`${errors} dia${errors > 1 ? 's' : ''} no s'han pogut crear (ja existien o error)`);
    }
    
    setSelectedDates([]);
  };

  const handleUpdateDia = async (id: string, updates: Partial<DiaVisita>) => {
    try {
      await actualitzarDia.mutateAsync({ id, ...updates });
    } catch (error) {
      toast.error('Error al actualitzar');
    }
  };

  const handleDeleteDia = async (id: string) => {
    if (!confirm('Estàs segur? S\'eliminaran totes les cites d\'aquest dia.')) return;
    
    try {
      await eliminarDia.mutateAsync(id);
      toast.success('Dia eliminat');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  // Funcions per gestionar cites
  const handleToggleCita = (citaId: string) => {
    setSelectedCites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(citaId)) {
        newSet.delete(citaId);
      } else {
        newSet.add(citaId);
      }
      return newSet;
    });
  };

  const handleSelectAllCites = () => {
    if (selectedCites.size === citesDelDia.length) {
      setSelectedCites(new Set());
    } else {
      setSelectedCites(new Set(citesDelDia.map(c => c.id)));
    }
  };

  const handleEliminarCita = async (id: string) => {
    try {
      await eliminarCita.mutateAsync({ id });
      setSelectedCites(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success('Cita eliminada');
    } catch (error) {
      toast.error('Error al eliminar la cita');
    }
  };

  const handleEliminarCitesSeleccionades = async () => {
    if (selectedCites.size === 0) return;
    
    if (!confirm(`Estàs segur que vols eliminar ${selectedCites.size} cita${selectedCites.size > 1 ? 's' : ''}?`)) return;
    
    try {
      await eliminarCitesMultiples.mutateAsync({ ids: Array.from(selectedCites) });
      setSelectedCites(new Set());
      toast.success(`${selectedCites.size} cita${selectedCites.size > 1 ? 's' : ''} eliminada${selectedCites.size > 1 ? 'es' : ''}`);
    } catch (error) {
      toast.error('Error al eliminar les cites');
    }
  };

  if (loading || loadingDies) {
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
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tornar
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Configuració de dies</h1>
            <p className="text-sm text-muted-foreground">Gestiona els dies de visita</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Afegir nous dies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Afegir dies de visita
              </CardTitle>
              <CardDescription>
                Selecciona un o més dies al calendari i prem "Afegir"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto -mx-2 px-2">
                <div className="flex justify-center min-w-max">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => setSelectedDates(dates || [])}
                    locale={ca}
                    disabled={(date) => {
                      // Deshabilitar dies passats
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      // Deshabilitar dies que ja existeixen
                      return diesExistents.some(d => 
                        d.toDateString() === date.toDateString()
                      );
                    }}
                    modifiers={{
                      existing: diesExistents
                    }}
                    modifiersClassNames={{
                      existing: 'bg-primary/20 text-primary font-bold'
                    }}
                    className={cn("p-3 pointer-events-auto rounded-md border")}
                  />
                </div>
              </div>
              
              {selectedDates.length > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  {selectedDates.length} dia{selectedDates.length > 1 ? 's' : ''} seleccionat{selectedDates.length > 1 ? 's' : ''}
                </div>
              )}
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleCrearDies} 
                  disabled={crearDia.isPending || selectedDates.length === 0}
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Afegir {selectedDates.length > 0 ? `${selectedDates.length} dia${selectedDates.length > 1 ? 's' : ''}` : 'dies'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gestió de cites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestió de cites
              </CardTitle>
              <CardDescription>
                Selecciona un dia per veure i gestionar les cites reservades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedDiaPerCites} onValueChange={(value) => {
                setSelectedDiaPerCites(value);
                setSelectedCites(new Set());
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un dia..." />
                </SelectTrigger>
                <SelectContent>
                  {diesVisita.map((dia) => (
                    <SelectItem key={dia.id} value={dia.id}>
                      {format(new Date(dia.data), "EEEE, d MMMM", { locale: ca })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedDiaPerCites && citesDelDia.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hi ha cites per aquest dia</p>
                </div>
              )}

              {selectedDiaPerCites && citesDelDia.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllCites}
                    >
                      {selectedCites.size === citesDelDia.length ? (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Desseleccionar tot
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-4 h-4 mr-2" />
                          Seleccionar tot
                        </>
                      )}
                    </Button>
                    
                    {selectedCites.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleEliminarCitesSeleccionades}
                        disabled={eliminarCitesMultiples.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar {selectedCites.size} seleccionada{selectedCites.size > 1 ? 'es' : ''}
                      </Button>
                    )}
                  </div>

                  <div className="divide-y rounded-lg border">
                    {citesDelDia
                      .sort((a, b) => a.numero_tanda - b.numero_tanda)
                      .map((cita) => (
                        <div
                          key={cita.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedCites.has(cita.id)}
                              onCheckedChange={() => handleToggleCita(cita.id)}
                            />
                            <div className="flex items-center gap-2">
                              <Badge variant={cita.tipus === 'metge' ? 'default' : 'secondary'}>
                                {cita.numero_tanda}
                              </Badge>
                              {cita.tipus === 'metge' ? (
                                <Stethoscope className="w-4 h-4 text-primary" />
                              ) : cita.tipus === 'infermera' ? (
                                <Heart className="w-4 h-4 text-pink-500" />
                              ) : (
                                <Syringe className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{cita.nom_complet}</p>
                              <p className="text-xs text-muted-foreground">{cita.telefon}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminarCita(cita.id)}
                            disabled={eliminarCita.isPending}
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Neteja de dades */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Neteja de dades antigues
              </CardTitle>
              <CardDescription>
                Elimina les cites i dies de visita anteriors a avui, i les consultes telefòniques ateses de més de 24 hores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={handleCleanup} 
                disabled={cleanupData.isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${cleanupData.isPending ? 'animate-spin' : ''}`} />
                {cleanupData.isPending ? 'Netejant...' : 'Netejar dades antigues'}
              </Button>
            </CardContent>
          </Card>

          {/* Llista de dies */}
          {diesVisita.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hi ha dies de visita configurats</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {diesVisita.map((dia) => (
                <DiaVisitaCard
                  key={dia.id}
                  dia={dia}
                  onUpdate={(updates) => handleUpdateDia(dia.id, updates)}
                  onDelete={() => handleDeleteDia(dia.id)}
                />
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminConfig;
