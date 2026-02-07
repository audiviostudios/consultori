import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Heart, ArrowRight } from 'lucide-react';
import { useNumeroActual } from '@/hooks/useNumeroActual';
import { useCitesDia, useDiaVisitaActual } from '@/hooks/useDiesVisita';

const Pantalla = () => {
  const { data: numerosActuals = [] } = useNumeroActual();
  const { data: diaActual } = useDiaVisitaActual();
  const { data: cites = [] } = useCitesDia(diaActual?.id);
  
  const numeroMetge = numerosActuals.find(n => n.tipus === 'metge')?.numero || 0;
  const numeroInfermera = numerosActuals.find(n => n.tipus === 'infermera')?.numero || 0;

  // Trobar el número següent amb cita reservada
  const getNumeroSeguent = (tipus: 'metge' | 'infermera', actual: number) => {
    const citesDelTipus = cites
      .filter(c => c.tipus === tipus && c.numero_tanda > actual)
      .sort((a, b) => a.numero_tanda - b.numero_tanda);
    return citesDelTipus[0]?.numero_tanda || null;
  };

  const seguentMetge = getNumeroSeguent('metge', numeroMetge);
  const seguentInfermera = getNumeroSeguent('infermera', numeroInfermera);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Metge */}
      <div className="flex-1 flex flex-col items-center justify-center border-r border-border">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="w-12 h-12 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
            METGE
          </h1>
          
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={numeroMetge}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="text-[12rem] md:text-[16rem] font-bold text-primary leading-none"
              >
                {numeroMetge}
              </motion.div>
            </AnimatePresence>
          </div>
          
          <p className="text-2xl text-muted-foreground mt-4">
            Número actual
          </p>

          {seguentMetge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex items-center justify-center gap-2 text-muted-foreground"
            >
              <ArrowRight className="w-5 h-5" />
              <span className="text-lg">Que es prepari el número</span>
              <span className="text-2xl font-bold text-primary">{seguentMetge}</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Infermera */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-accent-foreground" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
            INFERMERA
          </h1>
          
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={numeroInfermera}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="text-[12rem] md:text-[16rem] font-bold text-accent-foreground leading-none"
              >
                {numeroInfermera}
              </motion.div>
            </AnimatePresence>
          </div>
          
          <p className="text-2xl text-muted-foreground mt-4">
            Número actual
          </p>

          {seguentInfermera && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex items-center justify-center gap-2 text-muted-foreground"
            >
              <ArrowRight className="w-5 h-5" />
              <span className="text-lg">Que es prepari el número</span>
              <span className="text-2xl font-bold text-accent-foreground">{seguentInfermera}</span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Pantalla;
