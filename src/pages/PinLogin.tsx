import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, AlertCircle, Stethoscope, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

// PINs predefinits
const PINS = {
  metge: '25155Doc',
  infermera: '25155Inf',
};

const PinLogin = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar PIN
    if (pin === PINS.metge) {
      sessionStorage.setItem('staff_role', 'metge');
      sessionStorage.setItem('staff_authenticated', 'true');
      toast.success('Benvingut/da, Doctor/a!');
      navigate('/admin/staff');
    } else if (pin === PINS.infermera) {
      sessionStorage.setItem('staff_role', 'infermera');
      sessionStorage.setItem('staff_authenticated', 'true');
      toast.success('Benvingut/da, Infermera!');
      navigate('/admin/staff');
    } else {
      setError('PIN incorrecte');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <Heart className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Accés Personal Sanitari</CardTitle>
            <CardDescription>
              Consultori de l'Albagés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="pin" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  PIN d'accés
                </Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Introdueix el PIN"
                  className="text-center text-2xl tracking-widest"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verificant...' : 'Entrar'}
              </Button>

              <div className="text-center pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/admin/login')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Accés Administració (Alcaldia)
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PinLogin;
