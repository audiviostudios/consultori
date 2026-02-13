import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, User, Phone, Mail, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useCrearRecepta } from '@/hooks/useReceptes';
import { z } from 'zod';

const formSchema = z.object({
  nom_complet: z.string().trim().min(2, 'El nom ha de tenir almenys 2 caràcters').max(100),
  telefon: z.string().trim().regex(/^[0-9]{9}$/, 'El telèfon ha de tenir 9 dígits'),
  email: z.string().trim().email('Correu electrònic no vàlid').max(255).optional().or(z.literal('')),
  medicament: z.string().trim().min(2, 'Indica el medicament que necessites').max(500),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export function ReceptaForm({
  diaVisitaId,
  diaVisitaData,
  perfilInicial,
}: {
  diaVisitaId?: string;
  diaVisitaData?: string;
  perfilInicial?: {
    nom_complet: string;
    telefon: string;
    email?: string;
  } | null;
}) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nom_complet: '',
    telefon: '',
    email: '',
    medicament: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const crearRecepta = useCrearRecepta();

  useEffect(() => {
    if (!perfilInicial) return;
    setFormData((prev) => ({
      ...prev,
      nom_complet: perfilInicial.nom_complet || prev.nom_complet,
      telefon: perfilInicial.telefon || prev.telefon,
      email: perfilInicial.email || '',
    }));
  }, [perfilInicial]);

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

    try {
      if (!diaVisitaId) {
        toast.error('No s\'ha trobat el dia de visita');
        return;
      }

      await crearRecepta.mutateAsync({
        dia_visita_id: diaVisitaId,
        dia_visita_data: diaVisitaData,
        nom_complet: formData.nom_complet,
        telefon: formData.telefon,
        email: formData.email || null,
        medicament: formData.medicament,
        notes: formData.notes || null,
      });
      
      setIsSubmitted(true);
      toast.success('Sol·licitud de recepta enviada!');
    } catch (error) {
      toast.error('Error al enviar la sol·licitud');
    }
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-8 space-y-4"
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
              <p className="text-xl font-semibold">Sol·licitud rebuda</p>
              <p className="text-muted-foreground">
                El metge revisarà la sol·licitud. Si has indicat correu, rebràs una notificació quan estigui renovada.
              </p>
            </div>

            <Button variant="outline" onClick={() => {
              setIsSubmitted(false);
              setFormData({
                nom_complet: '',
                telefon: '',
                email: '',
                medicament: '',
                notes: '',
              });
            }}>
              Enviar una altra sol·licitud
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Sol·licitar recepta
        </CardTitle>
        <CardDescription>
          Demana la renovació de la teva medicació.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom-recepta" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nom i cognoms
            </Label>
            <Input
              id="nom-recepta"
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
            <Label htmlFor="tel-recepta" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telèfon de contacte
            </Label>
            <Input
              id="tel-recepta"
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
            <Label htmlFor="email-recepta" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Correu electrònic <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input
              id="email-recepta"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="joan@exemple.cat (opcional)"
            />
            <p className="text-xs text-muted-foreground">
              Si indiques correu electrònic, t'enviarem una notificació quan la recepta estigui renovada.
            </p>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicament" className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Medicament que necessites
            </Label>
            <Input
              id="medicament"
              value={formData.medicament}
              onChange={(e) => setFormData({ ...formData, medicament: e.target.value })}
              placeholder="Ex: Paracetamol, Ibuprofè, etc."
              required
            />
            {errors.medicament && (
              <p className="text-sm text-destructive">{errors.medicament}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes-recepta" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes addicionals <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Textarea
              id="notes-recepta"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Qualsevol informació addicional..."
              rows={2}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={crearRecepta.isPending}>
            {crearRecepta.isPending ? 'Enviant...' : 'Sol·licitar recepta'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
