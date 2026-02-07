import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, User, Mail, MessageSquare, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useCrearConsulta } from '@/hooks/useConsultes';
import { z } from 'zod';

interface ConsultaFormProps {
  tipus: 'metge' | 'infermera';
}

const formSchema = z.object({
  nom_complet: z.string().trim().min(2, 'El nom ha de tenir almenys 2 caràcters').max(100),
  telefon: z.string().trim().regex(/^[0-9]{9}$/, 'El telèfon ha de tenir 9 dígits'),
  email: z.string().trim().email('Correu electrònic no vàlid').max(255).optional().or(z.literal('')),
  motiu: z.string().trim().min(10, 'Explica breument el motiu').max(500),
  urgencia: z.enum(['baixa', 'mitjana', 'alta']),
});

export function ConsultaForm({ tipus }: ConsultaFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nom_complet: '',
    telefon: '',
    email: '',
    motiu: '',
    urgencia: 'mitjana' as 'baixa' | 'mitjana' | 'alta',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const crearConsulta = useCrearConsulta();

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
      await crearConsulta.mutateAsync({
        tipus,
        ...formData,
      });
      
      setIsSubmitted(true);
      toast.success('Sol·licitud enviada correctament!');
    } catch (error) {
      toast.error('Error al enviar la sol·licitud');
    }
  };

  const titol = tipus === 'metge' ? 'Sol·licitar trucada del metge' : 'Sol·licitar trucada de la infermera';

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
                {tipus === 'metge' ? 'El metge' : 'La infermera'} es posarà en contacte amb tu
              </p>
            </div>

            <Button variant="outline" onClick={() => setIsSubmitted(false)}>
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
          <Phone className="w-5 h-5" />
          {titol}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`nom-${tipus}`} className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nom i cognoms
            </Label>
            <Input
              id={`nom-${tipus}`}
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
            <Label htmlFor={`tel-${tipus}`} className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telèfon de contacte
            </Label>
            <Input
              id={`tel-${tipus}`}
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
            <Label htmlFor={`email-${tipus}`} className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Correu electrònic <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input
              id={`email-${tipus}`}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="joan@exemple.cat (opcional)"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Urgència
            </Label>
            <RadioGroup
              value={formData.urgencia}
              onValueChange={(value) => setFormData({ ...formData, urgencia: value as any })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="baixa" id={`baixa-${tipus}`} />
                <Label htmlFor={`baixa-${tipus}`} className="text-success font-medium cursor-pointer">Baixa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mitjana" id={`mitjana-${tipus}`} />
                <Label htmlFor={`mitjana-${tipus}`} className="text-warning font-medium cursor-pointer">Mitjana</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alta" id={`alta-${tipus}`} />
                <Label htmlFor={`alta-${tipus}`} className="text-destructive font-medium cursor-pointer">Alta</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`motiu-${tipus}`} className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Motiu de la consulta
            </Label>
            <Textarea
              id={`motiu-${tipus}`}
              value={formData.motiu}
              onChange={(e) => setFormData({ ...formData, motiu: e.target.value })}
              placeholder="Explica breument el motiu de la teva consulta..."
              rows={3}
              required
            />
            {errors.motiu && (
              <p className="text-sm text-destructive">{errors.motiu}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={crearConsulta.isPending}>
            {crearConsulta.isPending ? 'Enviant...' : 'Enviar sol·licitud'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
