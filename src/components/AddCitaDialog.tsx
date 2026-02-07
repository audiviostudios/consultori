import { useState } from 'react';
import { User, Phone, Mail, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { TipusCita, Cita } from '@/lib/types';
import { useCrearCita } from '@/hooks/useDiesVisita';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { generatePin } from '@/lib/generatePin';

interface AddCitaDialogProps {
  diaVisitaId: string;
  tipus: TipusCita;
  maxTandes: number;
  citesOcupades: Cita[];
  dataVisita?: string;
}

const formSchema = z.object({
  nom_complet: z.string().trim().min(2, 'El nom ha de tenir almenys 2 caràcters').max(100),
  telefon: z.string().trim().regex(/^[0-9]{9}$/, 'El telèfon ha de tenir 9 dígits'),
  email: z.string().trim().email('Correu electrònic no vàlid').max(255).optional().or(z.literal('')),
});

export function AddCitaDialog({ diaVisitaId, tipus, maxTandes, citesOcupades, dataVisita }: AddCitaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTanda, setSelectedTanda] = useState<string>('');
  const [formData, setFormData] = useState({
    nom_complet: '',
    telefon: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const crearCita = useCrearCita();

  const tandesOcupades = citesOcupades
    .filter(c => c.tipus === tipus)
    .map(c => c.numero_tanda);

  const tandesDisponibles = Array.from({ length: maxTandes }, (_, i) => i + 1)
    .filter(n => !tandesOcupades.includes(n));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTanda) {
      toast.error('Selecciona un número de tanda');
      return;
    }

    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const pin = generatePin();
    const numeroTanda = parseInt(selectedTanda);

    try {
      await crearCita.mutateAsync({
        dia_visita_id: diaVisitaId,
        tipus,
        numero_tanda: numeroTanda,
        pin_cancelacio: pin,
        ...formData,
      });
      
      // Enviar recordatori per email només si hi ha correu
      if (formData.email) {
        supabase.functions.invoke('enviar-recordatori', {
          body: {
            email: formData.email,
            nom: formData.nom_complet,
            numero_tanda: numeroTanda,
            tipus,
            data: dataVisita || new Date().toISOString(),
            pin_cancelacio: pin,
          },
        }).catch(console.error);
      }
      
      toast.success(`Cita ${numeroTanda} creada correctament!`);
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Aquesta tanda ja ha estat reservada');
      } else {
        toast.error('Error al crear la cita');
      }
    }
  };

  const resetForm = () => {
    setFormData({ nom_complet: '', telefon: '', email: '' });
    setSelectedTanda('');
    setErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (tandesDisponibles.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Afegir</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Afegir cita manualment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tanda">Número de tanda</Label>
            <Select value={selectedTanda} onValueChange={setSelectedTanda}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tanda..." />
              </SelectTrigger>
              <SelectContent>
                {tandesDisponibles.map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    Tanda {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nom_complet" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nom i cognoms
            </Label>
            <Input
              id="nom_complet"
              value={formData.nom_complet}
              onChange={(e) => setFormData({ ...formData, nom_complet: e.target.value })}
              placeholder="Joan García Martínez"
              required
            />
            {errors.nom_complet && (
              <p className="text-sm text-destructive">{errors.nom_complet}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefon" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telèfon de contacte
            </Label>
            <Input
              id="telefon"
              type="tel"
              value={formData.telefon}
              onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
              placeholder="612345678"
              required
            />
            {errors.telefon && (
              <p className="text-sm text-destructive">{errors.telefon}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Correu electrònic <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="joan@exemple.cat (opcional)"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={crearCita.isPending}>
            {crearCita.isPending ? 'Creant...' : 'Crear cita'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
