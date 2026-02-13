import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { obtenirUsuariPerPin, registrarUsuariPin } from '@/lib/usuariPin';

interface UsuariPinHelperProps {
  nomComplet: string;
  telefon: string;
  email?: string;
  onLoadPerfil: (perfil: { nom_complet: string; telefon: string; email: string }) => void;
}

export function UsuariPinHelper({ nomComplet, telefon, email = '', onLoadPerfil }: UsuariPinHelperProps) {
  const [pinInput, setPinInput] = useState('');
  const [generatedPin, setGeneratedPin] = useState('');
  const [loadingPin, setLoadingPin] = useState(false);
  const [savingPin, setSavingPin] = useState(false);

  const handleLoadByPin = async () => {
    if (!/^[0-9]{4}$/.test(pinInput.trim())) {
      toast.error('El PIN personal ha de tenir 4 xifres');
      return;
    }

    try {
      setLoadingPin(true);
      const perfil = await obtenirUsuariPerPin(pinInput.trim());
      if (!perfil) {
        toast.error('No existeix cap perfil amb aquest PIN');
        return;
      }

      onLoadPerfil({
        nom_complet: perfil.nom_complet,
        telefon: perfil.telefon,
        email: perfil.email || '',
      });
      toast.success('Dades carregades des del PIN');
    } catch {
      toast.error('No s\'ha pogut carregar el perfil');
    } finally {
      setLoadingPin(false);
    }
  };

  const handleSavePin = async () => {
    if (nomComplet.trim().length < 2) {
      toast.error('Primer indica el nom i cognoms');
      return;
    }
    if (!/^[0-9]{9}$/.test(telefon.trim())) {
      toast.error('Primer indica un telèfon de 9 dígits');
      return;
    }

    try {
      setSavingPin(true);
      const perfil = await registrarUsuariPin({
        nom_complet: nomComplet.trim(),
        telefon: telefon.trim(),
        email: email.trim() || null,
      });
      setGeneratedPin(perfil.pin);
      setPinInput(perfil.pin);
      toast.success('PIN personal guardat correctament');
    } catch {
      toast.error('No s\'ha pogut generar o recuperar el PIN');
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
      <p className="text-xs text-muted-foreground">
        Si ja tens PIN personal, escriu-lo per carregar dades. Si no, omple nom i telèfon i genera\'l.
      </p>
      <div className="flex gap-2">
        <Input
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="PIN personal (4 xifres)"
          inputMode="numeric"
          maxLength={4}
        />
        <Button type="button" variant="outline" onClick={handleLoadByPin} disabled={loadingPin}>
          {loadingPin ? 'Carregant...' : 'Carregar'}
        </Button>
      </div>
      <Button type="button" variant="secondary" className="w-full gap-2" onClick={handleSavePin} disabled={savingPin}>
        <KeyRound className="w-4 h-4" />
        {savingPin ? 'Guardant...' : 'Guardar dades i obtenir PIN'}
      </Button>
      {generatedPin && (
        <p className="text-sm text-center">
          PIN personal: <span className="font-mono font-semibold tracking-wider">{generatedPin}</span>
        </p>
      )}
    </div>
  );
}
