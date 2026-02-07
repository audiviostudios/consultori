import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNumeroActual } from '@/hooks/useNumeroActual';
import { useCitesDia, useDiaVisitaActual, useDiesVisita } from '@/hooks/useDiesVisita';
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

// Extreu les inicials d'un nom complet (p.ex. "Paco Seró" -> "P. S.")
const getInicials = (nomComplet: string): string => {
  // Netegem cometes/puntuació i ignorem paraules poc informatives
  const stopwords = new Set(['de', 'del', 'd', 'la', 'el', 'i']);

  const parts = nomComplet
    .trim()
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .map((p) => p.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''))
    .filter((p) => p.length > 0)
    .filter((p) => !stopwords.has(p.toLowerCase()));

  if (parts.length === 0) return '';

  const chosen = parts.length >= 2 ? [parts[0], parts[parts.length - 1]] : [parts[0]];
  return chosen.map((p) => `${p[0].toUpperCase()}.`).join(' ');
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
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4">
      {Array.from({ length: maxTorns }, (_, i) => i + 1).map(num => {
        const cita = citesDelTipus.find(c => c.numero_tanda === num);
        const isActual = num === numeroActual;
        const isPast = num < numeroActual;
        
        return (
          <motion.div
            key={num}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: num * 0.03 }}
            className={`
              flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl min-w-[60px] sm:min-w-[70px]
              ${isActual ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'bg-secondary/50'}
              ${isPast ? 'opacity-30' : ''}
            `}
          >
            <span className={`text-xl sm:text-2xl font-bold ${isActual ? textColor : 'text-foreground'}`}>
              {num}
            </span>
            <span className={`text-[10px] sm:text-xs truncate max-w-[55px] sm:max-w-[65px] text-center ${cita ? 'text-foreground' : 'text-muted-foreground/40'}`}>
              {cita ? getCognom(cita.nom_complet) : '—'}
            </span>
            {isActual && (
              <span className={`text-[9px] sm:text-[10px] font-semibold ${textColor} mt-0.5`}>
                Actual
              </span>
            )}
          </motion.div>
        );
      })}
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
  maxTorns,
  nomProfessional
}: { 
  numero: number; 
  tipus: string;
  icon: typeof Stethoscope;
  iconBg: string;
  textColor: string;
  seguentNumero: number | null;
  cites: Cita[];
  maxTorns: number;
  nomProfessional: string | null;
}) => {
  const tipusCita = tipus.toLowerCase() as 'metge' | 'infermera';
  
  // Trobar les inicials del pacient actual
  const citaActual = cites.find(c => c.tipus === tipusCita && c.numero_tanda === numero);
  const inicialsActual = citaActual ? getInicials(citaActual.nom_complet) : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center flex flex-col items-center justify-center py-4 sm:py-0 h-full w-full"
    >
      <div className="flex-shrink-0">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-2 sm:mb-3`}>
          <Icon className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 ${textColor}`} />
        </div>
        
        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold text-foreground`}>
          {tipus.toUpperCase()}
        </h1>
        
        {nomProfessional && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Avui visita <span className="font-medium text-foreground">{nomProfessional}</span>
          </p>
        )}
      </div>
      
      {/* Número gran */}
      <div className="flex flex-col items-center mt-2 sm:mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={numero}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`text-[5rem] sm:text-[6rem] md:text-[8rem] font-bold ${textColor} leading-none`}
          >
            {numero}
          </motion.div>
        </AnimatePresence>
        
        {inicialsActual ? (
          <p className={`text-lg sm:text-xl md:text-2xl font-semibold ${textColor} mt-1`}>
            {inicialsActual}
          </p>
        ) : (
          <p className="text-base sm:text-lg text-muted-foreground mt-1">
            —
          </p>
        )}

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
      <div className="w-full max-w-md px-2 mt-4">
        <LlistaTorns 
          cites={cites} 
          tipus={tipusCita} 
          maxTorns={maxTorns} 
          numeroActual={numero}
          textColor={textColor}
        />
      </div>
    </motion.div>
  );
};

const Pantalla = () => {
  const { data: numerosActuals = [] } = useNumeroActual();
  const { data: diesVisita = [] } = useDiesVisita();
  const { data: diaActual } = useDiaVisitaActual();
  const isMobile = useIsMobile();
  
  const metgeData = numerosActuals.find(n => n.tipus === 'metge');
  const infermeraData = numerosActuals.find(n => n.tipus === 'infermera');

  // Important: agafem les cites del mateix dia que està assignat al número actual
  const diaVisitaIdPantalla = metgeData?.dia_visita_id || infermeraData?.dia_visita_id || diaActual?.id;
  const { data: cites = [] } = useCitesDia(diaVisitaIdPantalla);

  const diaPantalla = diesVisita.find(d => d.id === diaVisitaIdPantalla) || diaActual;
  
  const numeroMetge = metgeData?.numero || 0;
  const numeroInfermera = infermeraData?.numero || 0;
  const nomMetge = metgeData?.nom_professional || null;
  const nomInfermera = infermeraData?.nom_professional || null;

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
            maxTorns={diaPantalla?.max_tandes_metge || 10}
            nomProfessional={nomMetge}
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
            maxTorns={diaPantalla?.max_tandes_infermera || 10}
            nomProfessional={nomInfermera}
          />
        </div>
      </div>
    </div>
  );
};

export default Pantalla;
