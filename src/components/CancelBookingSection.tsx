import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function CancelBookingSection() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundCita, setFoundCita] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const handleSearch = async () => {
    if (pin.length !== 6) {
      toast.error('El PIN ha de tenir 6 dígits');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cites')
        .select('*, dies_visita(data)')
        .eq('pin_cancelacio', pin)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('No s\'ha trobat cap cita amb aquest PIN');
        return;
      }

      setFoundCita(data);
      setShowConfirmDialog(true);
    } catch (error) {
      toast.error('Error al buscar la cita');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!foundCita) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cites')
        .delete()
        .eq('id', foundCita.id);

      if (error) throw error;

      setIsCancelled(true);
      toast.success('Cita cancel·lada correctament');
      
      setTimeout(() => {
        setShowConfirmDialog(false);
        setFoundCita(null);
        setPin('');
        setIsCancelled(false);
      }, 3000);
    } catch (error) {
      toast.error('Error al cancel·lar la cita');
    } finally {
      setIsLoading(false);
    }
  };

  const tipusNom: Record<string, string> = {
    metge: 'Metge',
    infermera: 'Infermera',
    grip: 'Vacuna Grip',
    covid: 'Vacuna COVID',
  };

  return (
    <>
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <X className="w-4 h-4 text-destructive" />
            Cancel·lar cita
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Si no pots venir, introdueix el PIN que vas rebre per alliberar la teva tanda.
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="cancel-pin" className="sr-only">PIN de cancel·lació</Label>
              <Input
                id="cancel-pin"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Introdueix el PIN de 6 dígits"
                className="text-center tracking-widest font-mono"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || pin.length !== 6}
              variant="destructive"
            >
              <KeyRound className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isCancelled ? 'Cita cancel·lada' : 'Confirmar cancel·lació'}
            </DialogTitle>
            {!isCancelled && (
              <DialogDescription>
                Estàs segur que vols cancel·lar aquesta cita?
              </DialogDescription>
            )}
          </DialogHeader>

          <AnimatePresence mode="wait">
            {isCancelled ? (
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
                <p className="text-center text-muted-foreground">
                  La tanda ja està disponible per a altres persones
                </p>
              </motion.div>
            ) : foundCita && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nom:</span>
                    <span className="font-medium">{foundCita.nom_complet}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Servei:</span>
                    <span className="font-medium">{tipusNom[foundCita.tipus]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanda:</span>
                    <span className="font-medium text-xl">{foundCita.numero_tanda}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data:</span>
                    <span className="font-medium">
                      {foundCita.dies_visita?.data ? new Date(foundCita.dies_visita.data).toLocaleDateString('ca-ES') : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/30">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <p className="text-sm text-warning">
                    Aquesta acció no es pot desfer. La tanda quedarà lliure.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowConfirmDialog(false)}
                  >
                    Enrere
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cancel·lant...' : 'Sí, cancel·la'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
