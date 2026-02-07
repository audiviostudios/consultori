import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { ca } from 'date-fns/locale';
import { ArrowLeft, Plus, Trash2, Calendar, Stethoscope, Heart, Syringe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useDiesVisita, useCrearDiaVisita, useActualitzarDiaVisita, useEliminarDiaVisita } from '@/hooks/useDiesVisita';
import { DiaVisita } from '@/lib/types';
import { toast } from 'sonner';

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
            <Calendar className="w-5 h-5 text-primary" />
            {dataFormatada}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metge */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
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
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
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
        <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
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
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
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
  
  const [novaData, setNovaData] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  const handleCrearDia = async () => {
    const existeix = diesVisita.some(d => d.data === novaData);
    if (existeix) {
      toast.error('Ja existeix un dia de visita per aquesta data');
      return;
    }

    try {
      await crearDia.mutateAsync({
        data: novaData,
        metge_actiu: true,
        infermera_activa: true,
        max_tandes_metge: 10,
        max_tandes_infermera: 10,
        vacunes_grip_actiu: false,
        max_tandes_grip: 10,
        vacunes_covid_actiu: false,
        max_tandes_covid: 10,
      });
      toast.success('Dia de visita creat');
    } catch (error) {
      toast.error('Error al crear el dia');
    }
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
          {/* Afegir nou dia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Afegir dia de visita
              </CardTitle>
              <CardDescription>
                Crea un nou dia amb visites del metge i/o infermera
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <Button onClick={handleCrearDia} disabled={crearDia.isPending}>
                  <Plus className="w-4 h-4 mr-2" />
                  Afegir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Llista de dies */}
          {diesVisita.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
