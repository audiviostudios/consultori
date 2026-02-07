import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNumeroActual } from '@/hooks/useNumeroActual';
import { useCitesDia, useDiaVisitaActual } from '@/hooks/useDiesVisita';
import { useNumeroChangeSound } from '@/hooks/useNumeroChangeSound';
import { useIsMobile } from '@/hooks/use-mobile';

const NumeroDisplay = ({ 
  numero, 
  tipus, 
  icon: Icon, 
  iconBg,
  textColor,
  seguentNumero 
}: { 
  numero: number; 
  tipus: string;
  icon: typeof Stethoscope;
  iconBg: string;
  textColor: string;
  seguentNumero: number | null;
}) => {
  const isMobile = useIsMobile();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center flex flex-col items-center justify-center py-4 sm:py-0"
    >
      <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6`}>
        <Icon className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${textColor}`} />
      </div>
      
      <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 md:mb-8`}>
        {tipus.toUpperCase()}
      </h1>
      
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={numero}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`text-[8rem] sm:text-[10rem] md:text-[12rem] lg:text-[16rem] font-bold ${textColor} leading-none`}
          >
            {numero}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mt-2 sm:mt-4">
        Número actual
      </p>

      {seguentNumero && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 sm:mt-4 md:mt-6 flex items-center justify-center gap-1.5 sm:gap-2 text-muted-foreground"
        >
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base md:text-lg">Que es prepari el número</span>
          <span className={`text-xl sm:text-2xl font-bold ${textColor}`}>{seguentNumero}</span>
        </motion.div>
      )}
    </motion.div>
  );
};

const Pantalla = () => {
  const { data: numerosActuals = [] } = useNumeroActual();
  const { data: diaActual } = useDiaVisitaActual();
  const { data: cites = [] } = useCitesDia(diaActual?.id);
  const isMobile = useIsMobile();
  
  const numeroMetge = numerosActuals.find(n => n.tipus === 'metge')?.numero || 0;
  const numeroInfermera = numerosActuals.find(n => n.tipus === 'infermera')?.numero || 0;

  // So quan canvia el número
  useNumeroChangeSound(numeroMetge, numeroInfermera);

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Botó tornar */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
        <Button variant="ghost" size="sm" asChild className="h-8 sm:h-9">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-sm">Tornar</span>
          </Link>
        </Button>
      </div>

      <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {/* Metge */}
        <div className={`flex-1 flex flex-col items-center justify-center ${isMobile ? 'border-b' : 'border-r'} border-border`}>
          <NumeroDisplay
            numero={numeroMetge}
            tipus="Metge"
            icon={Stethoscope}
            iconBg="bg-primary/10"
            textColor="text-primary"
            seguentNumero={seguentMetge}
          />
        </div>

        {/* Infermera */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <NumeroDisplay
            numero={numeroInfermera}
            tipus="Infermera"
            icon={Heart}
            iconBg="bg-accent"
            textColor="text-accent-foreground"
            seguentNumero={seguentInfermera}
          />
        </div>
      </div>
    </div>
  );
};

export default Pantalla;
