import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, User, Phone, Mail, X, Copy, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { TipusCita, Cita } from '@/lib/types';
import { useCrearCita } from '@/hooks/useDiesVisita';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { generatePin } from '@/lib/generatePin';

interface TandaSelectorProps {
  tipus: TipusCita;
  maxTandes: number;
  citesOcupades: Cita[];
  diaVisitaId: string;
  titol: string;
  dataVisita?: string;
}

const formSchema = z.object({
  nom_complet: z.string().trim().min(2, 'El nom ha de tenir almenys 2 caràcters').max(100),
  telefon: z.string().trim().regex(/^[0-9]{9}$/, 'El telèfon ha de tenir 9 dígits'),
  email: z.string().trim().email('Correu electrònic no vàlid').max(255),
});

export function TandaSelector({ tipus, maxTandes, citesOcupades, diaVisitaId, titol, dataVisita }: TandaSelectorProps) {
  const [selectedTanda, setSelectedTanda] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string>('');
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

  const handleTandaClick = (numero: number) => {
    if (tandesOcupades.includes(numero)) return;
    setSelectedTanda(numero);
    setIsDialogOpen(true);
    setIsConfirmed(false);
    setGeneratedPin('');
    setFormData({ nom_complet: '', telefon: '', email: '' });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    try {
      await crearCita.mutateAsync({
        dia_visita_id: diaVisitaId,
        tipus,
        numero_tanda: selectedTanda!,
        pin_cancelacio: pin,
        ...formData,
      });
      
      setGeneratedPin(pin);
      
      // Enviar recordatori per email (en segon pla)
      supabase.functions.invoke('enviar-recordatori', {
        body: {
          email: formData.email,
          nom: formData.nom_complet,
          numero_tanda: selectedTanda,
          tipus,
          data: dataVisita || new Date().toISOString(),
          pin_cancelacio: pin,
        },
      }).catch(console.error);
      
      setIsConfirmed(true);
      toast.success('Cita reservada correctament!');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Aquesta tanda ja ha estat reservada');
        setIsDialogOpen(false);
      } else {
        toast.error('Error al reservar la cita');
      }
    }
  };

  const copyPin = () => {
    navigator.clipboard.writeText(generatedPin);
    toast.success('PIN copiat!');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{titol}</h3>
      
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {Array.from({ length: maxTandes }, (_, i) => i + 1).map((numero) => {
          const ocupada = tandesOcupades.includes(numero);
          
          return (
            <motion.button
              key={numero}
              whileHover={!ocupada ? { scale: 1.05 } : {}}
              whileTap={!ocupada ? { scale: 0.95 } : {}}
              onClick={() => handleTandaClick(numero)}
              disabled={ocupada}
              className={`
                relative aspect-square rounded-xl flex items-center justify-center
                text-xl sm:text-2xl font-bold transition-all duration-200
                ${ocupada
                  ? 'bg-destructive/10 text-destructive cursor-not-allowed border-2 border-destructive/30'
                  : 'bg-accent hover:bg-primary hover:text-primary-foreground cursor-pointer border-2 border-transparent hover:border-primary shadow-sm hover:shadow-md'
                }
              `}
            >
              {numero}
              {ocupada && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <X className="w-8 h-8 text-destructive/50" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isConfirmed ? 'Cita confirmada!' : `Reservar tanda ${selectedTanda}`}
            </DialogTitle>
          </DialogHeader>
          
          <AnimatePresence mode="wait">
            {isConfirmed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-success" />
                </motion.div>
                
                <div className="text-center space-y-2">
                  <p className="text-3xl font-bold text-primary">Tanda {selectedTanda}</p>
                  <p className="text-muted-foreground">
                    Sigues puntual i vine una estona abans
                  </p>
                </div>

                {/* PIN de cancel·lació */}
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 w-full space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <KeyRound className="w-4 h-4 text-warning" />
                    <p className="text-sm font-medium text-warning">PIN de cancel·lació</p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-2xl font-mono font-bold tracking-widest">{generatedPin}</p>
                    <Button variant="ghost" size="icon" onClick={copyPin} className="h-8 w-8">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Guarda'l per si necessites cancel·lar la cita
                  </p>
                </div>

                <div className="bg-accent/50 rounded-lg p-3 text-center w-full">
                  <p className="text-sm text-muted-foreground">
                    Rebràs un recordatori amb el PIN al teu correu
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
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
                    Correu electrònic
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="joan@exemple.cat"
                    required
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={crearCita.isPending}>
                  {crearCita.isPending ? 'Reservant...' : 'Confirmar reserva'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
