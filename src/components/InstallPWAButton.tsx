import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function InstallPWAButton() {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // If already installed, don't show anything
  if (isInstalled) return null;

  // If installable (Android/Desktop Chrome), show direct install button
  if (isInstallable) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={install}
        className="gap-1.5 text-xs h-8 px-2.5 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instal·lar app</span>
        <span className="sm:hidden">Instal·lar</span>
      </Button>
    );
  }

  // For iOS and other browsers, show instructions
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8 px-2.5 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Instal·lar app</span>
          <span className="sm:hidden">Instal·lar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Instal·lar l'aplicació
          </DialogTitle>
          <DialogDescription>
            Afegeix el Consultori de l'Albagés a la teva pantalla d'inici per accedir-hi ràpidament.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">📱 iPhone / iPad (Safari):</h4>
            <ol className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>1. Toca el botó <strong>Compartir</strong> (icona de quadrat amb fletxa)</li>
              <li>2. Desplaça't i toca <strong>"Afegir a la pantalla d'inici"</strong></li>
              <li>3. Toca <strong>"Afegir"</strong></li>
            </ol>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-sm">🤖 Android (Chrome):</h4>
            <ol className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>1. Toca el menú <strong>⋮</strong> (tres punts)</li>
              <li>2. Toca <strong>"Afegir a la pantalla d'inici"</strong></li>
              <li>3. Toca <strong>"Afegir"</strong></li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
