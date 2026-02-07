import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConsultaForm } from '@/components/ConsultaForm';

export function MobileConsultaSelector() {
  const [selectedTipus, setSelectedTipus] = useState<'metge' | 'infermera' | null>(null);

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!selectedTipus ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-4"
          >
            <p className="text-center text-muted-foreground mb-2">
              A qui vols demanar la trucada?
            </p>
            
            <Button
              variant="outline"
              size="lg"
              className="h-24 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5"
              onClick={() => setSelectedTipus('metge')}
            >
              <Stethoscope className="w-8 h-8 text-primary" />
              <span className="text-lg font-semibold">Metge</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-24 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5"
              onClick={() => setSelectedTipus('infermera')}
            >
              <Heart className="w-8 h-8 text-primary" />
              <span className="text-lg font-semibold">Infermera</span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTipus(null)}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tornar
            </Button>
            
            <ConsultaForm tipus={selectedTipus} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
