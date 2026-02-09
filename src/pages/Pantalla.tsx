import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, HandHeart, ArrowRight, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useNumeroActual } from '@/hooks/useNumeroActual';
import { useCitesDia, useDiaVisitaActual, useDiesVisita } from '@/hooks/useDiesVisita';
import { useNumeroChangeSound } from '@/hooks/useNumeroChangeSound';
import { useConsultesTelefoniques } from '@/hooks/useConsultes';
import { useReceptes } from '@/hooks/useReceptes';
import { useIsMobile } from '@/hooks/use-mobile';
import { Cita } from '@/lib/types';

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
  tipus: Array<'metge' | 'infermera' | 'grip' | 'covid'>;
  maxTorns: number;
  numeroActual: number;
  textColor: string;
}) => {
  const citesDelTipus = cites.filter(c => tipus.includes(c.tipus));
  
  return (
    <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3.5 mt-4">
      {Array.from({ length: maxTorns }, (_, i) => i + 1).map(num => {
        const cita = citesDelTipus.find(c => c.numero_tanda === num);
        const isActual = num === numeroActual;
        const isVisitat = cita?.estat_assistencia === 'visitat';
        const isNoAssistit = cita?.estat_assistencia === 'no_assistit';
        
        // Determinar el color de fons
        let bgClass = 'bg-secondary/50'; // Per defecte (pendent)
        if (isActual) {
          bgClass = 'bg-primary/20 ring-2 ring-primary scale-110';
        } else if (isVisitat) {
          bgClass = 'bg-green-500/30 ring-2 ring-green-500';
        } else if (isNoAssistit) {
          bgClass = 'bg-red-500/30 ring-2 ring-red-500';
        }
        
        return (
          <motion.div
            key={num}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: num * 0.03 }}
            className={`
              flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-xl min-w-[66px] sm:min-w-[76px]
              ${bgClass}
            `}
          >
            <span className={`text-xl sm:text-2xl font-bold ${
              isActual ? textColor : 
              isVisitat ? 'text-green-600' : 
              isNoAssistit ? 'text-red-600' : 
              'text-foreground'
            }`}>
              {num}
            </span>
            <span className={`text-xs sm:text-sm truncate max-w-[60px] sm:max-w-[70px] text-center leading-tight ${
              cita ? (isVisitat ? 'text-green-700' : isNoAssistit ? 'text-red-700' : 'text-foreground') : 'text-muted-foreground/40'
            }`}>
              {cita ? getInicials(cita.nom_complet) : '—'}
            </span>
            {isActual && (
              <span className={`text-[9px] sm:text-[10px] font-semibold ${textColor} mt-0.5`}>
                Actual
              </span>
            )}
            {isVisitat && !isActual && (
              <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
            )}
            {isNoAssistit && !isActual && (
              <XCircle className="w-3 h-3 text-red-600 mt-0.5" />
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
  nomProfessional,
  estatVisita,
  consultesPendents,
  receptesPendents,
  emergenciaActiva,
  tipusCita,
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
  estatVisita: 'visitat' | 'no_assistit' | null;
  consultesPendents: number;
  receptesPendents: number;
  emergenciaActiva: boolean;
  tipusCita: Array<'metge' | 'infermera' | 'grip' | 'covid'>;
}) => {
  // Trobar les inicials del pacient actual
  const citaActual = cites.find(c => tipusCita.includes(c.tipus) && c.numero_tanda === numero);
  const inicialsActual = citaActual ? getInicials(citaActual.nom_complet) : null;
  const numeroDisplay = numero === 0 ? '✕' : numero;
  
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
            key={String(numeroDisplay)}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`text-[5rem] sm:text-[6rem] md:text-[8rem] font-bold ${textColor} leading-none`}
          >
            {numeroDisplay}
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

        {/* Mostrar estat de la visita */}
        <AnimatePresence mode="wait">
          {estatVisita && (
            <motion.div
              key={estatVisita}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm sm:text-base ${
                estatVisita === 'visitat' 
                  ? 'bg-green-500/20 text-green-600' 
                  : 'bg-red-500/20 text-red-600'
              }`}
            >
              {estatVisita === 'visitat' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>VISITAT</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  <span>NO HA ASSISTIT</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {seguentNumero && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2.5 flex items-center justify-center gap-2 text-muted-foreground"
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-medium">Prepari's el</span>
            <span className={`text-xl sm:text-2xl font-bold ${textColor}`}>{seguentNumero}</span>
          </motion.div>
        )}

        {emergenciaActiva && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 mx-2 rounded-2xl border border-red-400/60 bg-red-500/15 px-3 py-2 text-red-700"
          >
            <p className="text-sm sm:text-base font-semibold flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Atenent una urgència, esperi.
            </p>
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

      <div className="mt-3 text-[11px] sm:text-xs text-muted-foreground text-center space-y-0.5">
        <p>
          <span className="font-semibold text-foreground">{consultesPendents}</span> consultes telefòniques
        </p>
        <p>
          <span className="font-semibold text-foreground">{receptesPendents}</span> receptes
        </p>
      </div>
    </motion.div>
  );
};

const Pantalla = () => {
  const { data: numerosActuals = [] } = useNumeroActual();
  const { data: diesVisita = [] } = useDiesVisita();
  const { data: diaActual } = useDiaVisitaActual();
  const { data: consultesMetge = [] } = useConsultesTelefoniques('metge');
  const { data: consultesInfermera = [] } = useConsultesTelefoniques('infermera');
  const { data: receptes = [] } = useReceptes();
  const isMobile = useIsMobile();
  
  const metgeData = numerosActuals.find(n => n.tipus === 'metge');
  const infermeraData = numerosActuals.find(n => n.tipus === 'infermera');

  // Sempre mostrem el proper dia de visita disponible al calendari.
  const properDiaVisita = diesVisita.length > 0 ? diesVisita[0] : null;
  const diaPantalla = properDiaVisita || diaActual || null;
  const diaVisitaIdPantalla = diaPantalla?.id;
  const { data: cites = [] } = useCitesDia(diaVisitaIdPantalla);
  
  const numeroMetgeGuardat = metgeData?.numero || 0;
  const numeroInfermeraGuardat = infermeraData?.numero || 0;
  const citesMetgeDia = cites.filter((c) => c.tipus === 'metge');
  const tipusInfermeraPantalla: Array<'infermera' | 'grip' | 'covid'> = [
    'infermera',
    ...(diaPantalla?.vacunes_grip_actiu ? ['grip' as const] : []),
    ...(diaPantalla?.vacunes_covid_actiu ? ['covid' as const] : []),
  ];
  const citesInfermeraDia = cites.filter((c) => tipusInfermeraPantalla.includes(c.tipus as 'infermera' | 'grip' | 'covid'));
  const metgeTornExisteix = citesMetgeDia.some((c) => c.numero_tanda === numeroMetgeGuardat);
  const infermeraTornExisteix = citesInfermeraDia.some((c) => c.numero_tanda === numeroInfermeraGuardat);

  // Mostrem el número actiu si hi ha agenda del dia per aquell professional;
  // si no hi ha cap cita del dia, forcem 0.
  const metgeNumeroDelDia = metgeData?.dia_visita_id === diaVisitaIdPantalla;
  const infermeraNumeroDelDia = infermeraData?.dia_visita_id === diaVisitaIdPantalla;
  const metgeValidAvui =
    metgeNumeroDelDia &&
    citesMetgeDia.length > 0 &&
    numeroMetgeGuardat > 0 &&
    (metgeTornExisteix || numeroMetgeGuardat <= (diaPantalla?.max_tandes_metge || 0));
  const infermeraValidAvui =
    infermeraNumeroDelDia &&
    citesInfermeraDia.length > 0 &&
    numeroInfermeraGuardat > 0 &&
    (infermeraTornExisteix || numeroInfermeraGuardat <= (diaPantalla?.max_tandes_infermera || 0));

  // Si no hi ha cita actual vàlida del dia, mostrar 0
  const numeroMetge = metgeValidAvui ? numeroMetgeGuardat : 0;
  const numeroInfermera = infermeraValidAvui ? numeroInfermeraGuardat : 0;
  const nomMetge = metgeData?.nom_professional || null;
  const nomInfermera = infermeraData?.nom_professional || null;
  const estatMetge = metgeValidAvui ? metgeData?.estat_visita || null : null;
  const estatInfermera = infermeraValidAvui ? infermeraData?.estat_visita || null : null;
  const emergenciaMetge = metgeData?.emergencia_activa || false;
  const emergenciaInfermera = infermeraData?.emergencia_activa || false;
  const consultesMetgePendents = consultesMetge.filter((c) => !c.atesa).length;
  const consultesInfermeraPendents = consultesInfermera.filter((c) => !c.atesa).length;
  const receptesPendents = receptes.filter((r) => !r.atesa).length;

  // So quan canvia el número (requereix activació inicial de l'àudio al navegador)
  const { isSoundEnabled, activateSound } = useNumeroChangeSound(numeroMetge, numeroInfermera);

  // Trobar el número següent amb cita reservada
  const getNumeroSeguent = (
    tipus: Array<'metge' | 'infermera' | 'grip' | 'covid'>,
    actual: number
  ) => {
    const citesDelTipus = cites
      .filter(c => tipus.includes(c.tipus) && c.numero_tanda > actual)
      .sort((a, b) => a.numero_tanda - b.numero_tanda);
    return citesDelTipus[0]?.numero_tanda || null;
  };

  const seguentMetge = getNumeroSeguent(['metge'], numeroMetge);
  const seguentInfermera = getNumeroSeguent(tipusInfermeraPantalla, numeroInfermera);
  const maxTornsInfermera = Math.max(
    diaPantalla?.max_tandes_infermera || 10,
    diaPantalla?.vacunes_grip_actiu ? (diaPantalla?.max_tandes_grip || 10) : 0,
    diaPantalla?.vacunes_covid_actiu ? (diaPantalla?.max_tandes_covid || 10) : 0,
  );
  const dataPantalla = diaPantalla?.data
    ? format(new Date(diaPantalla.data), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ca })
    : null;

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
      {!isSoundEnabled && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-9 gap-1.5"
            onClick={() => activateSound()}
          >
            <Volume2 className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Activar so</span>
          </Button>
        </div>
      )}

      {dataPantalla && (
        <div className="pt-12 sm:pt-14 px-4">
          <p className="text-center text-sm sm:text-base text-muted-foreground">
            Consultes del <span className="font-semibold text-foreground capitalize">{dataPantalla}</span>
          </p>
        </div>
      )}

      <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {/* Metge */}
        <div className={`flex-1 flex flex-col items-center justify-center ${isMobile ? 'border-b' : 'border-r'} border-border p-4 ${emergenciaMetge ? 'bg-red-500/10' : ''}`}>
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
            estatVisita={estatMetge}
            consultesPendents={consultesMetgePendents}
            receptesPendents={receptesPendents}
            emergenciaActiva={emergenciaMetge}
            tipusCita={['metge']}
          />
        </div>

        {/* Infermera */}
        <div className={`flex-1 flex flex-col items-center justify-center p-4 ${emergenciaInfermera ? 'bg-red-500/10' : ''}`}>
          <NumeroDisplay
            numero={numeroInfermera}
            tipus="Infermera"
            icon={HandHeart}
            iconBg="bg-accent"
            textColor="text-accent-foreground"
            seguentNumero={seguentInfermera}
            cites={cites}
            maxTorns={maxTornsInfermera}
            nomProfessional={nomInfermera}
            estatVisita={estatInfermera}
            consultesPendents={consultesInfermeraPendents}
            receptesPendents={0}
            emergenciaActiva={emergenciaInfermera}
            tipusCita={tipusInfermeraPantalla}
          />
        </div>
      </div>
    </div>
  );
};

export default Pantalla;
