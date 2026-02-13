import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { obtenirUsuariPerPin, registrarUsuariPin } from '@/lib/usuariPin';

export interface PerfilSimplificat {
  nom_complet: string;
  telefon: string;
  email: string;
}

interface SimplificaPinSectionProps {
  perfilActual?: PerfilSimplificat | null;
  onPerfilReady: (perfil: PerfilSimplificat) => void;
}

export function SimplificaPinSection({ perfilActual, onPerfilReady }: SimplificaPinSectionProps) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [nomComplet, setNomComplet] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [loadingPin, setLoadingPin] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (!error || typeof error !== 'object') return fallback;
    const maybe = error as { message?: string; details?: string; hint?: string };
    return maybe.message || maybe.details || maybe.hint || fallback;
  };

  useEffect(() => {
    if (!open) return;
    setNomComplet(perfilActual?.nom_complet || '');
    setTelefon(perfilActual?.telefon || '');
    setEmail(perfilActual?.email || '');
  }, [open, perfilActual]);

  const handleCarregarPin = async () => {
    if (!/^[0-9]{4}$/.test(pin.trim())) {
      toast.error('El PIN personal ha de tenir 4 xifres');
      return;
    }

    try {
      setLoadingPin(true);
      const perfil = await obtenirUsuariPerPin(pin.trim());
      if (!perfil) {
        toast.error('No s\'ha trobat cap perfil amb aquest PIN');
        return;
      }

      const normalized = {
        nom_complet: perfil.nom_complet,
        telefon: perfil.telefon,
        email: perfil.email || '',
      };
      setNomComplet(normalized.nom_complet);
      setTelefon(normalized.telefon);
      setEmail(normalized.email);
      onPerfilReady(normalized);
      toast.success('Dades carregades');
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al carregar el PIN'));
    } finally {
      setLoadingPin(false);
    }
  };

  const handleGuardarPin = async () => {
    if (nomComplet.trim().length < 2) {
      toast.error('Nom i cognoms no vàlid');
      return;
    }
    if (!/^[0-9]{9}$/.test(telefon.trim())) {
      toast.error('El telèfon ha de tenir 9 dígits');
      return;
    }

    try {
      setSavingPin(true);
      const perfil = await registrarUsuariPin({
        nom_complet: nomComplet.trim(),
        telefon: telefon.trim(),
        email: email.trim() || null,
      });

      const normalized = {
        nom_complet: perfil.nom_complet,
        telefon: perfil.telefon,
        email: perfil.email || '',
      };
      setGeneratedPin(perfil.pin);
      setPin(perfil.pin);
      onPerfilReady(normalized);
      toast.success('PIN personal guardat');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No s\'ha pogut guardar el PIN'));
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <KeyRound className="w-4 h-4" />
            Simplifica amb PIN
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Escriu el PIN de 4 xifres per omplir automàticament les dades als formularis.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="PIN de 4 xifres"
              inputMode="numeric"
              maxLength={4}
              className="sm:max-w-[220px]"
            />
            <Button type="button" variant="outline" onClick={handleCarregarPin} disabled={loadingPin}>
              {loadingPin ? 'Carregant...' : 'Carregar dades'}
            </Button>
            <Button type="button" className="sm:ml-auto" onClick={() => setOpen(true)}>
              Crear/gestionar PIN
            </Button>
          </div>
          {perfilActual && (
            <p className="text-xs text-muted-foreground">
              Perfil carregat: <span className="font-medium text-foreground">{perfilActual.nom_complet}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear o actualitzar PIN</DialogTitle>
            <DialogDescription>
              Guarda nom, mòbil i correu per poder carregar dades amb PIN als formularis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin-personal">Ja tens PIN?</Label>
              <div className="flex gap-2">
                <Input
                  id="pin-personal"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="PIN de 4 xifres"
                  inputMode="numeric"
                  maxLength={4}
                />
                <Button type="button" variant="outline" onClick={handleCarregarPin} disabled={loadingPin}>
                  {loadingPin ? 'Carregant...' : 'Carregar'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin-nom">Nom i cognoms complets</Label>
              <Input
                id="pin-nom"
                value={nomComplet}
                onChange={(e) => setNomComplet(e.target.value)}
                placeholder="Nom + dos cognoms"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin-tel">Mòbil</Label>
              <Input
                id="pin-tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="612345678"
                inputMode="numeric"
                maxLength={9}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin-email">Correu electrònic (opcional)</Label>
              <Input
                id="pin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@domini.cat"
              />
            </div>

            <Button type="button" className="w-full" onClick={handleGuardarPin} disabled={savingPin}>
              {savingPin ? 'Guardant...' : 'Guardar i obtenir PIN'}
            </Button>

            {generatedPin && (
              <p className="text-center text-sm">
                PIN personal: <span className="font-mono font-semibold tracking-wider">{generatedPin}</span>
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
