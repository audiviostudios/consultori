import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, Stethoscope, HandHeart, Syringe, RefreshCw, Users, CheckSquare, Square, X, Phone, Pill, Pencil, Save, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useDiesVisita, useCrearDiaVisita, useActualitzarDiaVisita, useEliminarDiaVisita, useCitesDia, useEliminarCita, useEliminarCitesMultiples, useActualitzarCita } from '@/hooks/useDiesVisita';
import { useConsultesTelefoniques, useEliminarConsulta, useEliminarConsultesMultiples } from '@/hooks/useConsultes';
import { useReceptes, useEliminarRecepta, useEliminarReceptesMultiples } from '@/hooks/useReceptes';
import { useUsuarisPin, useEliminarUsuariPin } from '@/hooks/useUsuarisPin';
import { useCleanupData } from '@/hooks/useCleanupData';
import { DiaVisita, Cita } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEFAULT_HORA_INICI_METGE = '08:50';
const DEFAULT_HORA_INICI_INFERMERA = '09:00';
const LEGACY_RECEPTES_RECOVERY_DAY = '2026-02-12';
const LEGACY_RECEPTES_CUTOFF = new Date('2026-02-13T00:00:00.000Z').getTime();
const LEGACY_CONSULTES_RECOVERY_DAY = '2026-02-12';
const LEGACY_CONSULTES_CUTOFF = new Date('2026-02-13T00:00:00.000Z').getTime();

interface DiaVisitaCardProps {
  dia: DiaVisita;
  onUpdate: (updates: Partial<DiaVisita>) => void;
  onDelete: () => void;
  allowHourEdit: boolean;
}

function DiaVisitaCard({ dia, onUpdate, onDelete, allowHourEdit }: DiaVisitaCardProps) {
  const dataFormatada = format(new Date(dia.data), "EEEE, d MMMM", { locale: ca });

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CalendarIcon className="w-5 h-5 text-primary" />
          {dataFormatada}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hores d'inici */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-accent/40">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Inici metge</p>
            <Input
              type="time"
              value={(dia.hora_inici_metge || DEFAULT_HORA_INICI_METGE).slice(0, 5)}
              onChange={(e) => onUpdate({ hora_inici_metge: e.target.value || DEFAULT_HORA_INICI_METGE })}
              className="h-9"
              disabled={!allowHourEdit}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Inici infermera</p>
            <Input
              type="time"
              value={(dia.hora_inici_infermera || DEFAULT_HORA_INICI_INFERMERA).slice(0, 5)}
              onChange={(e) => onUpdate({ hora_inici_infermera: e.target.value || DEFAULT_HORA_INICI_INFERMERA })}
              className="h-9"
              disabled={!allowHourEdit}
            />
          </div>
        </div>
        {!allowHourEdit && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            Per editar hores d'inici, cal aplicar la migració SQL de les columnes d'hores.
          </p>
        )}

        {/* Metge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            <span className="font-medium">Metge</span>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
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
            <HandHeart className="w-4 h-4" />
            <span className="font-medium">Infermera</span>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
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
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
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
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
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

        <div className="pt-2 border-t">
          <Button variant="destructive" size="sm" className="w-full sm:w-auto" onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Esborrar dia de visita
          </Button>
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
  const actualitzarCita = useActualitzarCita();
  const eliminarConsulta = useEliminarConsulta();
  const eliminarConsultesMultiples = useEliminarConsultesMultiples();
  const eliminarRecepta = useEliminarRecepta();
  const eliminarReceptesMultiples = useEliminarReceptesMultiples();
  const { data: usuarisPin = [] } = useUsuarisPin();
  const eliminarUsuariPin = useEliminarUsuariPin();
  const cleanupData = useCleanupData();
  
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedDiaPerCites, setSelectedDiaPerCites] = useState<string | undefined>(undefined);
  const [selectedDiaPerConsultes, setSelectedDiaPerConsultes] = useState<string | undefined>(undefined);
  const [selectedDiaPerReceptes, setSelectedDiaPerReceptes] = useState<string | undefined>(undefined);
  const [selectedCites, setSelectedCites] = useState<Set<string>>(new Set());
  const [selectedConsultes, setSelectedConsultes] = useState<Set<string>>(new Set());
  const [selectedReceptes, setSelectedReceptes] = useState<Set<string>>(new Set());
  const [editingCitaId, setEditingCitaId] = useState<string | null>(null);
  const [editingCitaNom, setEditingCitaNom] = useState('');
  const [pinSearch, setPinSearch] = useState('');
  
  // Obtenir cites del dia seleccionat
  const { data: citesDelDia = [] } = useCitesDia(selectedDiaPerCites);
  const { data: consultes = [] } = useConsultesTelefoniques();
  const { data: receptes = [] } = useReceptes();
  const diaConsultesSeleccionat = diesVisita.find((d) => d.id === selectedDiaPerConsultes);
  const diaReceptesSeleccionat = diesVisita.find((d) => d.id === selectedDiaPerReceptes);
  const esDiaRecuperacioReceptes = diaReceptesSeleccionat?.data === LEGACY_RECEPTES_RECOVERY_DAY;
  const esDiaRecuperacioConsultes = diaConsultesSeleccionat?.data === LEGACY_CONSULTES_RECOVERY_DAY;
  const esReceptaLegacy = (createdAt: string) => {
    const timestamp = new Date(createdAt).getTime();
    return Number.isFinite(timestamp) && timestamp < LEGACY_RECEPTES_CUTOFF;
  };
  const esConsultaLegacy = (createdAt: string) => {
    const timestamp = new Date(createdAt).getTime();
    return Number.isFinite(timestamp) && timestamp < LEGACY_CONSULTES_CUTOFF;
  };
  const obtenirDataProgramadaConsulta = (consulta: { dia_visita_id?: string | null; created_at: string }) => {
    if (consulta.dia_visita_id) {
      const dia = diesVisita.find((d) => d.id === consulta.dia_visita_id);
      if (dia?.data) return dia.data;
    }
    return format(new Date(consulta.created_at), 'yyyy-MM-dd');
  };
  const consultesFiltrades = diaConsultesSeleccionat
    ? consultes.filter(
        (c) => {
          if (c.dia_visita_id === diaConsultesSeleccionat.id) return true;
          if (esDiaRecuperacioConsultes && esConsultaLegacy(c.created_at)) return true;
          if (!c.atesa && obtenirDataProgramadaConsulta(c) < diaConsultesSeleccionat.data) return true;
          return !c.dia_visita_id && format(new Date(c.created_at), 'yyyy-MM-dd') === diaConsultesSeleccionat.data;
        }
      )
    : [];
  const receptesFiltrades = diaReceptesSeleccionat
    ? receptes.filter(
        (r) => {
          if (r.dia_visita_id === diaReceptesSeleccionat.id) return true;
          if (esDiaRecuperacioReceptes && esReceptaLegacy(r.created_at)) return true;
          return !r.dia_visita_id && format(new Date(r.created_at), 'yyyy-MM-dd') === diaReceptesSeleccionat.data;
        }
      )
    : [];
  const pinSearchNormalized = pinSearch.trim().toLowerCase();
  const usuarisPinFiltrats = usuarisPin.filter((usuari) => {
    if (!pinSearchNormalized) return true;
    return (
      usuari.nom_complet.toLowerCase().includes(pinSearchNormalized) ||
      usuari.telefon.includes(pinSearchNormalized) ||
      usuari.pin.includes(pinSearchNormalized) ||
      (usuari.email || '').toLowerCase().includes(pinSearchNormalized)
    );
  });
  const allowHourEdit = diesVisita.length === 0
    ? true
    : Object.prototype.hasOwnProperty.call(diesVisita[0] as object, 'hora_inici_metge') &&
      Object.prototype.hasOwnProperty.call(diesVisita[0] as object, 'hora_inici_infermera');
  
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
      const message = error instanceof Error ? error.message : '';
      if (message.includes('hora_inici_metge') || message.includes('hora_inici_infermera') || message.includes('column')) {
        toast.error('No es poden editar hores: falta aplicar la migració SQL al Supabase');
      } else {
        toast.error('Error al actualitzar');
      }
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

  const handleStartEditCita = (cita: Cita) => {
    setEditingCitaId(cita.id);
    setEditingCitaNom(cita.nom_complet);
  };

  const handleCancelEditCita = () => {
    setEditingCitaId(null);
    setEditingCitaNom('');
  };

  const handleSaveEditCita = async () => {
    if (!editingCitaId) return;
    const nom = editingCitaNom.trim();
    if (nom.length < 2) {
      toast.error('El nom ha de tenir almenys 2 caràcters');
      return;
    }

    try {
      await actualitzarCita.mutateAsync({ id: editingCitaId, nom_complet: nom });
      toast.success('Nom de la cita actualitzat');
      handleCancelEditCita();
    } catch {
      toast.error('No s\'ha pogut actualitzar la cita');
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

  const handleToggleConsulta = (consultaId: string) => {
    setSelectedConsultes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(consultaId)) {
        newSet.delete(consultaId);
      } else {
        newSet.add(consultaId);
      }
      return newSet;
    });
  };

  const handleSelectAllConsultes = () => {
    if (selectedConsultes.size === consultesFiltrades.length) {
      setSelectedConsultes(new Set());
    } else {
      setSelectedConsultes(new Set(consultesFiltrades.map((consulta) => consulta.id)));
    }
  };

  const handleEliminarConsulta = async (id: string) => {
    try {
      await eliminarConsulta.mutateAsync({ id });
      setSelectedConsultes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success('Consulta eliminada');
    } catch (error) {
      toast.error('Error al eliminar la consulta');
    }
  };

  const handleEliminarConsultesSeleccionades = async () => {
    if (selectedConsultes.size === 0) return;

    if (!confirm(`Estàs segur que vols eliminar ${selectedConsultes.size} consulta${selectedConsultes.size > 1 ? 's' : ''}?`)) return;

    try {
      await eliminarConsultesMultiples.mutateAsync({ ids: Array.from(selectedConsultes) });
      setSelectedConsultes(new Set());
      toast.success(`${selectedConsultes.size} consulta${selectedConsultes.size > 1 ? 's' : ''} eliminada${selectedConsultes.size > 1 ? 'es' : ''}`);
    } catch (error) {
      toast.error('Error al eliminar les consultes');
    }
  };

  const handleToggleRecepta = (receptaId: string) => {
    setSelectedReceptes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(receptaId)) {
        newSet.delete(receptaId);
      } else {
        newSet.add(receptaId);
      }
      return newSet;
    });
  };

  const handleSelectAllReceptes = () => {
    if (selectedReceptes.size === receptesFiltrades.length) {
      setSelectedReceptes(new Set());
    } else {
      setSelectedReceptes(new Set(receptesFiltrades.map((recepta) => recepta.id)));
    }
  };

  const handleEliminarRecepta = async (id: string) => {
    try {
      await eliminarRecepta.mutateAsync({ id });
      setSelectedReceptes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success('Recepta eliminada');
    } catch (error) {
      toast.error('Error al eliminar la recepta');
    }
  };

  const handleEliminarReceptesSeleccionades = async () => {
    if (selectedReceptes.size === 0) return;

    if (!confirm(`Estàs segur que vols eliminar ${selectedReceptes.size} recepta${selectedReceptes.size > 1 ? 'es' : ''}?`)) return;

    try {
      await eliminarReceptesMultiples.mutateAsync({ ids: Array.from(selectedReceptes) });
      setSelectedReceptes(new Set());
      toast.success(`${selectedReceptes.size} recepta${selectedReceptes.size > 1 ? 'es' : ''} eliminada${selectedReceptes.size > 1 ? 'es' : ''}`);
    } catch (error) {
      toast.error('Error al eliminar les receptes');
    }
  };

  const handleEliminarPin = async (id: string, pin: string) => {
    if (!confirm(`Vols donar de baixa el PIN ${pin}?`)) return;

    try {
      await eliminarUsuariPin.mutateAsync({ id });
      toast.success(`PIN ${pin} donat de baixa`);
    } catch {
      toast.error('No s\'ha pogut donar de baixa el PIN');
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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tornar
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold truncate">Configuració de dies</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Gestiona els dies de visita</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
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
                    className={cn("p-2 sm:p-3 pointer-events-auto rounded-md border")}
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
                  className="w-full sm:w-auto"
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
                handleCancelEditCita();
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllCites}
                      className="w-full sm:w-auto"
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
                        className="w-full sm:w-auto"
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
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 hover:bg-muted/50"
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <Checkbox
                              checked={selectedCites.has(cita.id)}
                              onCheckedChange={() => handleToggleCita(cita.id)}
                            />
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={cita.tipus === 'metge' ? 'default' : 'secondary'}>
                                {cita.numero_tanda}
                              </Badge>
                              {cita.tipus === 'metge' ? (
                                <Stethoscope className="w-4 h-4 text-primary" />
                              ) : cita.tipus === 'infermera' ? (
                                <HandHeart className="w-4 h-4 text-pink-500" />
                              ) : (
                                <Syringe className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              {editingCitaId === cita.id ? (
                                <Input
                                  value={editingCitaNom}
                                  onChange={(e) => setEditingCitaNom(e.target.value)}
                                  className="h-8"
                                />
                              ) : (
                                <p className="font-medium text-sm break-words">{cita.nom_complet}</p>
                              )}
                              <p className="text-xs text-muted-foreground break-all">{cita.telefon}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 self-end sm:self-auto">
                            {editingCitaId === cita.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSaveEditCita}
                                  disabled={actualitzarCita.isPending}
                                >
                                  <Save className="w-4 h-4 text-primary" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleCancelEditCita}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => handleStartEditCita(cita)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminarCita(cita.id)}
                              disabled={eliminarCita.isPending}
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gestió de consultes telefòniques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Gestió de consultes telefòniques
              </CardTitle>
              <CardDescription>
                Elimina consultes pendents o ateses des d'aquest panell
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedDiaPerConsultes} onValueChange={(value) => {
                setSelectedDiaPerConsultes(value);
                setSelectedConsultes(new Set());
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtra per dia de visita..." />
                </SelectTrigger>
                <SelectContent>
                  {diesVisita.map((dia) => (
                    <SelectItem key={dia.id} value={dia.id}>
                      {format(new Date(dia.data), "EEEE, d MMMM", { locale: ca })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!selectedDiaPerConsultes ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona un dia per veure les consultes</p>
                </div>
              ) : consultesFiltrades.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hi ha consultes registrades per aquest dia</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllConsultes}
                      className="w-full sm:w-auto"
                    >
                      {selectedConsultes.size === consultesFiltrades.length ? (
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

                    {selectedConsultes.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleEliminarConsultesSeleccionades}
                        disabled={eliminarConsultesMultiples.isPending}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar {selectedConsultes.size} seleccionada{selectedConsultes.size > 1 ? 'es' : ''}
                      </Button>
                    )}
                  </div>

                  <div className="divide-y rounded-lg border">
                    {consultesFiltrades.map((consulta) => (
                      <div
                        key={consulta.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 hover:bg-muted/50"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <Checkbox
                            checked={selectedConsultes.has(consulta.id)}
                            onCheckedChange={() => handleToggleConsulta(consulta.id)}
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={consulta.tipus === 'metge' ? 'default' : 'secondary'}>
                              {consulta.tipus === 'metge' ? 'Metge' : 'Infermera'}
                            </Badge>
                            <Phone className="w-4 h-4 text-sky-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm break-words">{consulta.nom_complet}</p>
                            <p className="text-xs text-muted-foreground break-all">{consulta.telefon}</p>
                            <p className="text-xs text-muted-foreground">
                              {consulta.atesa ? 'Atesa' : 'Pendent'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminarConsulta(consulta.id)}
                          disabled={eliminarConsulta.isPending}
                          className="self-end sm:self-auto"
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

          {/* Gestió de receptes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Gestió de receptes
              </CardTitle>
              <CardDescription>
                Elimina sol·licituds de recepta pendents o ateses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedDiaPerReceptes} onValueChange={(value) => {
                setSelectedDiaPerReceptes(value);
                setSelectedReceptes(new Set());
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtra per dia de visita..." />
                </SelectTrigger>
                <SelectContent>
                  {diesVisita.map((dia) => (
                    <SelectItem key={dia.id} value={dia.id}>
                      {format(new Date(dia.data), "EEEE, d MMMM", { locale: ca })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!selectedDiaPerReceptes ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona un dia per veure les receptes</p>
                </div>
              ) : receptesFiltrades.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hi ha receptes registrades per aquest dia</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllReceptes}
                      className="w-full sm:w-auto"
                    >
                      {selectedReceptes.size === receptesFiltrades.length ? (
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

                    {selectedReceptes.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleEliminarReceptesSeleccionades}
                        disabled={eliminarReceptesMultiples.isPending}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar {selectedReceptes.size} seleccionada{selectedReceptes.size > 1 ? 'es' : ''}
                      </Button>
                    )}
                  </div>

                  <div className="divide-y rounded-lg border">
                    {receptesFiltrades.map((recepta) => (
                      <div
                        key={recepta.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 hover:bg-muted/50"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <Checkbox
                            checked={selectedReceptes.has(recepta.id)}
                            onCheckedChange={() => handleToggleRecepta(recepta.id)}
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <Pill className="w-4 h-4 text-violet-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm break-words">{recepta.nom_complet}</p>
                            <p className="text-xs text-muted-foreground break-all">{recepta.telefon}</p>
                            <p className="text-xs text-muted-foreground break-words">{recepta.medicament}</p>
                            <p className="text-xs text-muted-foreground">
                              {recepta.atesa ? 'Atesa' : 'Pendent'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminarRecepta(recepta.id)}
                          disabled={eliminarRecepta.isPending}
                          className="self-end sm:self-auto"
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Gestió de PIN simplificat
              </CardTitle>
              <CardDescription>
                Dona de baixa PIN d\'usuaris perquè hagin de generar-ne un de nou
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Filtra per nom, telèfon, correu o PIN..."
                value={pinSearch}
                onChange={(e) => setPinSearch(e.target.value)}
              />

              {usuarisPinFiltrats.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <KeyRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hi ha PIN registrats amb aquest filtre</p>
                </div>
              ) : (
                <div className="divide-y rounded-lg border">
                  {usuarisPinFiltrats.map((usuari) => (
                    <div
                      key={usuari.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm break-words">{usuari.nom_complet}</p>
                        <p className="text-xs text-muted-foreground break-all">{usuari.telefon}</p>
                        {usuari.email && (
                          <p className="text-xs text-muted-foreground break-all">{usuari.email}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          PIN: <span className="font-mono font-semibold tracking-wide">{usuari.pin}</span>
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleEliminarPin(usuari.id, usuari.pin)}
                        disabled={eliminarUsuariPin.isPending}
                        className="self-end sm:self-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Donar de baixa
                      </Button>
                    </div>
                  ))}
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
                className="w-full sm:w-auto"
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
                  allowHourEdit={allowHourEdit}
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
