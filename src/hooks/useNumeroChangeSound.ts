import { useEffect, useRef, useCallback } from 'react';

// So de notificació local
const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

// Variable global per desbloquejar l'àudio amb interacció de l'usuari
let audioUnlocked = false;
let audioContext: AudioContext | null = null;

// Funció per desbloquejar l'àudio (es crida amb la primera interacció)
const unlockAudio = () => {
  if (audioUnlocked) return;
  
  // Crear AudioContext per desbloquejar l'àudio
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Crear un buffer buit i reproduir-lo
  const buffer = audioContext.createBuffer(1, 1, 22050);
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start(0);
  
  audioUnlocked = true;
  
  // Eliminar els listeners
  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('touchstart', unlockAudio);
  document.removeEventListener('keydown', unlockAudio);
};

// Afegir listeners per desbloquejar l'àudio
if (typeof document !== 'undefined') {
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });
}

export function useNumeroChangeSound(numeroMetge: number, numeroInfermera: number) {
  const prevMetgeRef = useRef(numeroMetge);
  const prevInfermeraRef = useRef(numeroInfermera);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Precarregar l'àudio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 1.0;
    audioRef.current.load(); // Precarregar
  }, []);

  const playSound = useCallback(() => {
    if (!audioRef.current) return;
    
    // Crear una nova instància per evitar problemes de reproducció
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 1.0;
    audio.play().catch((error) => {
      console.warn('No s\'ha pogut reproduir el so:', error);
    });
  }, []);

  useEffect(() => {
    // Detectar canvi en el número del metge
    if (prevMetgeRef.current !== numeroMetge && prevMetgeRef.current !== 0) {
      playSound();
    }
    prevMetgeRef.current = numeroMetge;
  }, [numeroMetge, playSound]);

  useEffect(() => {
    // Detectar canvi en el número de la infermera
    if (prevInfermeraRef.current !== numeroInfermera && prevInfermeraRef.current !== 0) {
      playSound();
    }
    prevInfermeraRef.current = numeroInfermera;
  }, [numeroInfermera, playSound]);
}
