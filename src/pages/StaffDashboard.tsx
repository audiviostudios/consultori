import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { LogOut, Stethoscope, HandHeart, Calendar, Monitor, ChevronLeft, ChevronRight, Pill, Phone, CheckCircle, User, Save, X, Syringe, AlertTriangle, Trash2 } from 'lucide-react';
import { AddCitaDialog } from '@/components/AddCitaDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDiesVisita, useCitesDia, useActualitzarEstatCita } from '@/hooks/useDiesVisita';
import { useNumeroActual, useActualitzarNumero, useActualitzarNomProfessional, useToggleEmergencia } from '@/hooks/useNumeroActual';
import { useConsultesRealtime } from '@/hooks/useConsultesRealtime';
import { useReceptes, useMarcarReceptaAtesa, useCrearRecepta } from '@/hooks/useReceptes';
import { useConsultesTelefoniques, useMarcarConsultaAtesa, useCrearConsulta } from '@/hooks/useConsultes';
import { supabase } from '@/integrations/supabase/client';
import { Cita, DiaVisita, Recepta, ConsultaTelefonica } from '@/lib/types';
import { toast } from 'sonner';

interface CitaCardProps {
  cita: Cita;
  isActive: boolean;
  onSelect: () => void;
  onAssistit: (cita: Cita) => void;
  onNoAssistit: (cita: Cita) => void;
  onDelete: () => void;
}

function CitaCard({ cita, isActive, onSelect, onAssistit, onNoAssistit, onDelete }: CitaCardProps) {
  const isEliminada = cita.estat_assistencia === 'eliminat';
  const getTipusInfo = (tipus: Cita['tipus']) => {
    switch (tipus) {
      case 'grip':
        return { label: 'Grip', icon: Syringe };
      case 'covid':
        return { label: 'COVID', icon: Syringe };
      case 'infermera':
        return { label: 'Infermera', icon: HandHeart };
      default:
        return { label: 'Metge', icon: Stethoscope };
    }
  };

  const tipusInfo = getTipusInfo(cita.tipus);
  const TipusIcon = tipusInfo.icon;

  const handleAssistit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAssistit(cita);
  };

  const handleNoAssistit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNoAssistit(cita);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        if (!isEliminada) onSelect();
      }}
      className={`
        p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all relative
        ${isEliminada ? 'opacity-45 grayscale cursor-not-allowed' : ''}
        ${isActive 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50'
        }
      `}
    >
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span className="text-2xl sm:text-3xl font-bold text-primary">{cita.numero_tanda}</span>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="gap-1">
            <TipusIcon className="w-3 h-3" />
            {tipusInfo.label}
          </Badge>
          {isEliminada && <Badge variant="secondary" className="text-xs">Eliminada</Badge>}
          {isActive && <Badge className="text-xs">Visitant</Badge>}
          <button
            onClick={handleDelete}
            className="w-6 h-6 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors"
            title="Esborrar visita"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
          <button
            onClick={handleAssistit}
            className="w-6 h-6 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
            title={cita.estat_assistencia === 'visitat' ? 'Desmarcar visitat' : 'Marcar com a assistit'}
            disabled={isEliminada}
          >
            <CheckCircle className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={handleNoAssistit}
            className="w-6 h-6 rounded-full bg-destructive hover:bg-destructive/80 flex items-center justify-center transition-colors"
            title="No ha assistit"
            disabled={isEliminada}
          >
            <X className="w-3.5 h-3.5 text-destructive-foreground" />
          </button>
        </div>
      </div>
      <p className="font-medium text-foreground text-sm sm:text-base truncate">{cita.nom_complet}</p>
      <p className="text-xs sm:text-sm text-muted-foreground">{cita.telefon}</p>
    </motion.div>
  );
}

function AddConsultaDialog({ defaultTipus, diaVisitaId, diaVisitaData }: { defaultTipus: 'metge' | 'infermera'; diaVisitaId: string; diaVisitaData: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tipus, setTipus] = useState<'metge' | 'infermera'>(defaultTipus);
  const [nomComplet, setNomComplet] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [motiu, setMotiu] = useState('');
  const [urgencia, setUrgencia] = useState<'baixa' | 'mitjana' | 'alta'>('mitjana');

  const crearConsulta = useCrearConsulta();

  const resetForm = () => {
    setTipus(defaultTipus);
    setNomComplet('');
    setTelefon('');
    setEmail('');
    setMotiu('');
    setUrgencia('mitjana');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomComplet.trim() || !motiu.trim()) {
      toast.error('Omple el nom i el motiu');
      return;
    }

    if (!/^[0-9]{9}$/.test(telefon.trim())) {
      toast.error('El telèfon ha de tenir 9 dígits');
      return;
    }

    try {
      await crearConsulta.mutateAsync({
        dia_visita_id: diaVisitaId,
        dia_visita_data: diaVisitaData,
        tipus,
        nom_complet: nomComplet.trim(),
        telefon: telefon.trim(),
        email: email.trim() || null,
        motiu: motiu.trim(),
        urgencia,
      });
      toast.success('Consulta creada correctament');
      setIsOpen(false);
      resetForm();
    } catch {
      toast.error('Error al crear la consulta');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Phone className="w-4 h-4" />
          <span className="hidden sm:inline">Nova consulta</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear consulta telefònica</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Professional</Label>
            <Select value={tipus} onValueChange={(v) => setTipus(v as 'metge' | 'infermera')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metge">Metge</SelectItem>
                <SelectItem value="infermera">Infermera</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nom i cognoms</Label>
            <Input value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Telèfon</Label>
            <Input value={telefon} onChange={(e) => setTelefon(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Correu (opcional)</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Urgència</Label>
            <Select value={urgencia} onValueChange={(v) => setUrgencia(v as 'baixa' | 'mitjana' | 'alta')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="mitjana">Mitjana</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Motiu</Label>
            <Textarea value={motiu} onChange={(e) => setMotiu(e.target.value)} rows={3} required />
          </div>
          <Button type="submit" className="w-full" disabled={crearConsulta.isPending}>
            {crearConsulta.isPending ? 'Creant...' : 'Crear consulta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddReceptaDialog({ diaVisitaId, diaVisitaData }: { diaVisitaId: string; diaVisitaData: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nomComplet, setNomComplet] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [medicament, setMedicament] = useState('');
  const [notes, setNotes] = useState('');
  const crearRecepta = useCrearRecepta();

  const resetForm = () => {
    setNomComplet('');
    setTelefon('');
    setEmail('');
    setMedicament('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomComplet.trim() || !medicament.trim()) {
      toast.error('Omple el nom i el medicament');
      return;
    }

    if (!/^[0-9]{9}$/.test(telefon.trim())) {
      toast.error('El telèfon ha de tenir 9 dígits');
      return;
    }

    try {
      await crearRecepta.mutateAsync({
        dia_visita_id: diaVisitaId,
        dia_visita_data: diaVisitaData,
        nom_complet: nomComplet.trim(),
        telefon: telefon.trim(),
        email: email.trim() || null,
        medicament: medicament.trim(),
        notes: notes.trim() || null,
      });
      toast.success('Recepta creada correctament');
      setIsOpen(false);
      resetForm();
    } catch {
      toast.error('Error al crear la recepta');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Pill className="w-4 h-4" />
          <span className="hidden sm:inline">Nova recepta</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear sol·licitud de recepta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Nom i cognoms</Label>
            <Input value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Telèfon</Label>
            <Input value={telefon} onChange={(e) => setTelefon(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Correu (opcional)</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Medicament</Label>
            <Input value={medicament} onChange={(e) => setMedicament(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Notes (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={crearRecepta.isPending}>
            {crearRecepta.isPending ? 'Creant...' : 'Crear recepta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReceptaCard({ recepta, onMarcarAtesa }: { recepta: Recepta; onMarcarAtesa: (id: string) => void }) {
  return (
    <Card className={recepta.atesa ? 'border-emerald-300 bg-emerald-50/50' : 'border-primary/20'}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm sm:text-base truncate">{recepta.nom_complet}</p>
              <Badge
                variant="outline"
                className={recepta.atesa ? 'text-xs border-emerald-600 bg-emerald-100 text-emerald-700' : 'text-xs'}
              >
                {recepta.atesa ? 'Resolta' : 'Pendent'}
              </Badge>
            </div>
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
            disabled={recepta.atesa}
            title={recepta.atesa ? 'Ja resolta' : 'Marcar com resolta'}
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
    <Card
      className={
        consulta.atesa
          ? 'border-emerald-300 bg-emerald-50/50'
          : consulta.urgencia === 'alta'
            ? 'border-destructive/50'
            : 'border-primary/20'
      }
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm sm:text-base truncate">{consulta.nom_complet}</p>
              <Badge
                variant="outline"
                className={consulta.atesa ? 'text-xs border-emerald-600 bg-emerald-100 text-emerald-700' : 'text-xs'}
              >
                {consulta.atesa ? 'Resolta' : 'Pendent'}
              </Badge>
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
            disabled={consulta.atesa}
            title={consulta.atesa ? 'Ja resolta' : 'Marcar com resolta'}
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
  const LEGACY_RECEPTES_RECOVERY_DAY = '2026-02-12';
  const LEGACY_RECEPTES_CUTOFF = new Date('2026-02-13T00:00:00.000Z').getTime();
  const LEGACY_CONSULTES_RECOVERY_DAY = '2026-02-12';
  const LEGACY_CONSULTES_CUTOFF = new Date('2026-02-13T00:00:00.000Z').getTime();

  const navigate = useNavigate();
  const { data: diesVisita = [], isLoading: loadingDies } = useDiesVisita();
  const [selectedDiaIndex, setSelectedDiaIndex] = useState(0);
  
  const staffRole = sessionStorage.getItem('staff_role') as 'metge' | 'infermera' | null;
  const isAuthenticated = sessionStorage.getItem('staff_authenticated') === 'true';
  
  const selectedDia = diesVisita[selectedDiaIndex] || null;
  const { data: cites = [] } = useCitesDia(selectedDia?.id);
  const { data: numerosActuals = [] } = useNumeroActual();
  const actualitzarNumero = useActualitzarNumero();
  const actualitzarNomProfessional = useActualitzarNomProfessional();
  const toggleEmergencia = useToggleEmergencia();
  const actualitzarEstatCita = useActualitzarEstatCita();
  const [activeCitaId, setActiveCitaId] = useState<string | null>(null);

  const numeroActualData = numerosActuals.find(n => n.tipus === staffRole);
  const [nomProfessional, setNomProfessional] = useState('');
  const emergenciaActiva = numeroActualData?.emergencia_activa || false;

  // Dades de receptes i consultes
  const { data: receptes = [] } = useReceptes();
  const marcarReceptaAtesa = useMarcarReceptaAtesa();
  const { data: consultes = [] } = useConsultesTelefoniques(staffRole || undefined);
  const marcarConsultaAtesa = useMarcarConsultaAtesa();

  const esDelDiaSeleccionat = (createdAt: string) =>
    selectedDia ? format(new Date(createdAt), 'yyyy-MM-dd') === selectedDia.data : false;
  const esDiaRecuperacioReceptes = selectedDia?.data === LEGACY_RECEPTES_RECOVERY_DAY;
  const esDiaRecuperacioConsultes = selectedDia?.data === LEGACY_CONSULTES_RECOVERY_DAY;
  const esReceptaLegacy = (createdAt: string) => {
    const timestamp = new Date(createdAt).getTime();
    return Number.isFinite(timestamp) && timestamp < LEGACY_RECEPTES_CUTOFF;
  };
  const esConsultaLegacy = (createdAt: string) => {
    const timestamp = new Date(createdAt).getTime();
    return Number.isFinite(timestamp) && timestamp < LEGACY_CONSULTES_CUTOFF;
  };
  const obtenirDataProgramadaConsulta = (consulta: ConsultaTelefonica) => {
    if (consulta.dia_visita_id) {
      const dia = diesVisita.find((d) => d.id === consulta.dia_visita_id);
      if (dia?.data) return dia.data;
    }
    return format(new Date(consulta.created_at), 'yyyy-MM-dd');
  };
  const obtenirDataProgramadaRecepta = (recepta: Recepta) => {
    if (recepta.dia_visita_id) {
      const dia = diesVisita.find((d) => d.id === recepta.dia_visita_id);
      if (dia?.data) return dia.data;
    }
    return format(new Date(recepta.created_at), 'yyyy-MM-dd');
  };

  const consultesDelDia = selectedDia
    ? consultes.filter((c) => {
        if (c.dia_visita_id === selectedDia.id) return true;
        if (esDiaRecuperacioConsultes && esConsultaLegacy(c.created_at)) return true;
        // Si la consulta està pendent, s'arrossega i es mostra a qualsevol visita posterior.
        const dataProgramada = obtenirDataProgramadaConsulta(c);
        if (!c.atesa && dataProgramada < selectedDia.data) return true;
        return !c.dia_visita_id && esDelDiaSeleccionat(c.created_at);
      })
    : [];
  const receptesDelDia = selectedDia
    ? receptes.filter(
        (r) => {
          if (r.dia_visita_id === selectedDia.id) return true;
          if (esDiaRecuperacioReceptes && esReceptaLegacy(r.created_at)) return true;
          // Si la recepta està pendent, s'arrossega i es mostra a qualsevol visita posterior.
          const dataProgramada = obtenirDataProgramadaRecepta(r);
          if (!r.atesa && dataProgramada < selectedDia.data) return true;
          return !r.dia_visita_id && esDelDiaSeleccionat(r.created_at);
        }
      )
    : [];

  const receptesPendents = receptesDelDia.filter(r => !r.atesa);
  const consultesPendents = consultesDelDia.filter(c => !c.atesa);

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

  const handleToggleEmergencia = async () => {
    if (!staffRole) return;
    try {
      await toggleEmergencia.mutateAsync({
        tipus: staffRole,
        emergencia_activa: !emergenciaActiva,
      });
      toast.success(!emergenciaActiva ? 'Emergència activada' : 'Emergència desactivada');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('emergencia_activa') || message.includes('column')) {
        toast.error('Cal aplicar la migració de base de dades per activar emergències');
      } else {
        toast.error('No s\'ha pogut actualitzar l\'estat d\'emergència');
      }
    }
  };

  const citesTipus = staffRole === 'infermera' ? ['infermera', 'grip', 'covid'] : ['metge'];
  const citesFiltered = cites.filter(c => citesTipus.includes(c.tipus));
  const numeroActual = numeroActualData?.numero || 0;

  useEffect(() => {
    if (!citesFiltered.length || numeroActual === 0) {
      setActiveCitaId(null);
      return;
    }

    if (activeCitaId && citesFiltered.some(c => c.id === activeCitaId && c.numero_tanda === numeroActual)) {
      return;
    }

    const byNumber = citesFiltered.find(c => c.numero_tanda === numeroActual && c.estat_assistencia !== 'eliminat');
    setActiveCitaId(byNumber?.id || null);
  }, [citesFiltered, numeroActual, activeCitaId]);

  const handleSelectCita = async (cita: Cita) => {
    if (!staffRole) return;
    if (cita.estat_assistencia === 'eliminat') return;
    try {
      // Si hi havia un pacient anterior i no s'ha marcat com no_assistit, marcar-lo com visitat
      if (numeroActual > 0 && numeroActual !== cita.numero_tanda && activeCitaId) {
        const citaAnterior = citesFiltered.find(c => c.id === activeCitaId);
        if (citaAnterior && citaAnterior.estat_assistencia !== 'no_assistit') {
          await actualitzarEstatCita.mutateAsync({ id: citaAnterior.id, estat_assistencia: 'visitat' });
        }
      }
      
      // Canviar al nou pacient
      await actualitzarNumero.mutateAsync({ 
        tipus: staffRole, 
        numero: cita.numero_tanda,
        dia_visita_id: selectedDia?.id 
      });
      setActiveCitaId(cita.id);
      toast.success(`Visitant pacient ${cita.numero_tanda}`);
    } catch (error) {
      toast.error('Error al actualitzar');
    }
  };

  const handleResetMarcador = async () => {
    if (!staffRole) return;
    try {
      await actualitzarNumero.mutateAsync({
        tipus: staffRole,
        numero: 0,
        dia_visita_id: selectedDia?.id,
      });
      setActiveCitaId(null);
      toast.info('Marcador reiniciat: encara no s\'ha començat a cridar');
    } catch {
      toast.error('Error al reiniciar el marcador');
    }
  };

  const handleAssistit = async (cita: Cita) => {
    if (!staffRole) return;
    try {
      const nouEstat = cita.estat_assistencia === 'visitat' ? null : 'visitat';
      await actualitzarEstatCita.mutateAsync({ id: cita.id, estat_assistencia: nouEstat });
      if (nouEstat === 'visitat') {
        toast.success('Pacient marcat com a assistit');
      } else {
        toast.info('Estat de visita desactivat');
      }
    } catch (error) {
      toast.error('Error al marcar');
    }
  };

  const handleNoAssistit = async (cita: Cita) => {
    if (!staffRole) return;
    try {
      await actualitzarEstatCita.mutateAsync({ id: cita.id, estat_assistencia: 'no_assistit' });
      toast.info('Pacient marcat com no assistit');
    } catch (error) {
      toast.error('Error al marcar');
    }
  };

  const handleMarcarReceptaAtesa = async (id: string) => {
    try {
      const recepta = receptesDelDia.find((r) => r.id === id);
      await marcarReceptaAtesa.mutateAsync({ id, atesa: true });
      if (recepta?.email) {
        const { error: mailError } = await supabase.functions.invoke('enviar-recepta-renovada', {
          body: {
            email: recepta.email,
            nom: recepta.nom_complet,
            medicament: recepta.medicament,
          },
        });

        if (mailError) {
          console.error('Error enviant notificacio de recepta renovada:', mailError);
          toast.warning('Recepta marcada com atesa, pero no s\'ha pogut enviar el correu');
          return;
        }
      }
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

  const handleEliminarVisita = async (cita: Cita) => {
    const confirmacio = confirm(`Vols esborrar la visita ${cita.numero_tanda} de ${cita.nom_complet}?`);
    if (!confirmacio) return;

    try {
      await actualitzarEstatCita.mutateAsync({ id: cita.id, estat_assistencia: 'eliminat' });
      if (activeCitaId === cita.id) {
        setActiveCitaId(null);
        if (staffRole) {
          await actualitzarNumero.mutateAsync({
            tipus: staffRole,
            numero: 0,
            dia_visita_id: selectedDia?.id,
          });
        }
      }
      toast.success('Visita marcada com eliminada (només admin la pot eliminar definitivament)');
    } catch {
      toast.error("No s'ha pogut esborrar la visita");
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

  const Icon = staffRole === 'metge' ? Stethoscope : HandHeart;
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
            <Button
              size="sm"
              variant={emergenciaActiva ? 'destructive' : 'outline'}
              onClick={handleToggleEmergencia}
              disabled={toggleEmergencia.isPending}
              className="h-8 shrink-0 gap-1"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">
                {emergenciaActiva ? 'Emergència ON' : 'Emergència OFF'}
              </span>
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
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="truncate">
                          {citesFiltered.length} pacients • Visitant: <span className="text-primary">{numeroActual === 0 ? '✕' : numeroActual}</span>
                        </span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleResetMarcador}
                          disabled={actualitzarNumero.isPending || !selectedDia}
                          className="gap-1"
                          title="Marcar com no iniciat"
                        >
                          <X className="w-4 h-4" />
                          <span className="hidden sm:inline">No iniciat</span>
                        </Button>
                        {selectedDia && (
                          <AddCitaDialog
                            diaVisitaId={selectedDia.id}
                            tipus={staffRole!}
                            diaVisita={selectedDia}
                            citesOcupades={cites}
                          />
                        )}
                      </div>
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
                          .sort((a, b) => {
                            if (a.numero_tanda !== b.numero_tanda) {
                              return a.numero_tanda - b.numero_tanda;
                            }
                            return a.tipus.localeCompare(b.tipus);
                          })
                          .map((cita) => (
                            <CitaCard
                              key={cita.id}
                              cita={cita}
                              isActive={activeCitaId === cita.id}
                              onSelect={() => handleSelectCita(cita)}
                              onAssistit={(selectedCita) => handleAssistit(selectedCita)}
                              onNoAssistit={(selectedCita) => handleNoAssistit(selectedCita)}
                              onDelete={() => handleEliminarVisita(cita)}
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
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                        Consultes telefòniques
                      </CardTitle>
                      {selectedDia && <AddConsultaDialog defaultTipus={staffRole} diaVisitaId={selectedDia.id} diaVisitaData={selectedDia.data} />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {consultesDelDia.length === 0 ? (
                      <div className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
                        No hi ha consultes registrades per aquest dia
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {consultesDelDia.map((consulta) => (
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
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                          <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
                          Sol·licituds de receptes
                        </CardTitle>
                        {selectedDia && <AddReceptaDialog diaVisitaId={selectedDia.id} diaVisitaData={selectedDia.data} />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {receptesDelDia.length === 0 ? (
                        <div className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
                          No hi ha sol·licituds de receptes per aquest dia
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {receptesDelDia.map((recepta) => (
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
