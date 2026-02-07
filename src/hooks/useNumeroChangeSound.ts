import { useEffect, useRef } from 'react';

// URL del so de campana fort per canvi de número
const BELL_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function useNumeroChangeSound(numeroMetge: number, numeroInfermera: number) {
  const prevMetgeRef = useRef(numeroMetge);
  const prevInfermeraRef = useRef(numeroInfermera);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Precarregar l'àudio de campana
    audioRef.current = new Audio(BELL_SOUND_URL);
    audioRef.current.volume = 1.0; // Volum màxim
  }, []);

  useEffect(() => {
    // Detectar canvi en el número del metge
    if (prevMetgeRef.current !== numeroMetge && prevMetgeRef.current !== 0) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    }
    prevMetgeRef.current = numeroMetge;
  }, [numeroMetge]);

  useEffect(() => {
    // Detectar canvi en el número de la infermera
    if (prevInfermeraRef.current !== numeroInfermera && prevInfermeraRef.current !== 0) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    }
    prevInfermeraRef.current = numeroInfermera;
  }, [numeroInfermera]);
}
