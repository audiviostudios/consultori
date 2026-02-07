import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNumeroActual } from '@/hooks/useNumeroActual';
import { useCitesDia, useDiaVisitaActual } from '@/hooks/useDiesVisita';
import { useNumeroChangeSound } from '@/hooks/useNumeroChangeSound';
import { useIsMobile } from '@/hooks/use-mobile';
import { Cita } from '@/lib/types';

// Extreu el cognom d'un nom complet
const getCognom = (nomComplet: string): string => {
  const parts = nomComplet.trim().split(' ');
  if (parts.length > 1) {
    return parts[1]; // Retorna el primer cognom
  }
  return parts[0]; // Si només hi ha un nom, el retorna
};

const LlistaTorns = ({ 
  cites, 
  tipus, 
  maxTorns, 
  numeroActual,
  textColor 
}: { 
  cites: Cita[];
  tipus: 'metge' | 'infermera';
  maxTorns: number;
  numeroActual: number;
  textColor: string;
}) => {
  const citesDelTipus = cites.filter(c => c.tipus === tipus);
  
  return (
    <div className="mt-4 sm:mt-6 w-full max-w-[200px] mx-auto">
      <div className="space-y-1">
        {Array.from({ length: maxTorns }, (_, i) => i + 1).map(num => {
          const cita = citesDelTipus.find(c => c.numero_tanda === num);
          const isActual = num === numeroActual;
          const isPast = num < numeroActual;
          
          return (
            <motion.div
              key={num}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: num * 0.05 }}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                ${isActual ? 'bg-primary/20 ring-2 ring-primary' : ''}
                ${isPast ? 'opacity-40' : ''}
              `}
            >
              <span className={`font-bold w-6 text-center ${isActual ? textColor : 'text-foreground'}`}>
                {num}
              </span>
              <span className={`text-xs truncate flex-1 ${cita ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {cita ? getCognom(cita.nom_complet) : '—'}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const NumeroDisplay = ({ 
  numero, 
  tipus, 
  icon: Icon, 
  iconBg,
  textColor,
  seguentNumero,
  cites,
  maxTorns
}: { 
  numero: number; 
  tipus: string;
  icon: typeof Stethoscope;
  iconBg: string;
  textColor: string;
  seguentNumero: number | null;
  cites: Cita[];
  maxTorns: number;
}) => {
  const isMobile = useIsMobile();
  const tipusCita = tipus.toLowerCase() as 'metge' | 'infermera';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center flex flex-col items-center justify-center py-4 sm:py-0 h-full"
    >
      <div className="flex-shrink-0">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-2 sm:mb-3`}>
          <Icon className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 ${textColor}`} />
        </div>
        
        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-4`}>
          {tipus.toUpperCase()}
        </h1>
      </div>
      
      <div className="flex items-start gap-4 sm:gap-6 flex-1">
        {/* Número gran */}
        <div className="flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={numero}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`text-[6rem] sm:text-[8rem] md:text-[10rem] font-bold ${textColor} leading-none`}
            >
              {numero}
            </motion.div>
          </AnimatePresence>
          
          <p className="text-base sm:text-lg text-muted-foreground mt-1">
            Número actual
          </p>

          {seguentNumero && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 flex items-center justify-center gap-1.5 text-muted-foreground"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Prepari's el</span>
              <span className={`text-lg sm:text-xl font-bold ${textColor}`}>{seguentNumero}</span>
            </motion.div>
          )}
        </div>

        {/* Llista de torns */}
        {!isMobile && (
          <LlistaTorns 
            cites={cites} 
            tipus={tipusCita} 
            maxTorns={maxTorns} 
            numeroActual={numero}
            textColor={textColor}
          />
        )}
      </div>
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
        <div className={`flex-1 flex flex-col items-center justify-center ${isMobile ? 'border-b' : 'border-r'} border-border p-4`}>
          <NumeroDisplay
            numero={numeroMetge}
            tipus="Metge"
            icon={Stethoscope}
            iconBg="bg-primary/10"
            textColor="text-primary"
            seguentNumero={seguentMetge}
            cites={cites}
            maxTorns={diaActual?.max_tandes_metge || 10}
          />
        </div>

        {/* Infermera */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <NumeroDisplay
            numero={numeroInfermera}
            tipus="Infermera"
            icon={Heart}
            iconBg="bg-accent"
            textColor="text-accent-foreground"
            seguentNumero={seguentInfermera}
            cites={cites}
            maxTorns={diaActual?.max_tandes_infermera || 10}
          />
        </div>
      </div>
    </div>
  );
};

export default Pantalla;
