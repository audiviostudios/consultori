import { useEffect, useRef, useState, useCallback } from 'react';

const SOUND_ENABLED_KEY = 'pantalla_sound_enabled';
const SOUND_URL = `${import.meta.env.BASE_URL}sounds/notification.mp3`;

let sharedAudioContext: AudioContext | null = null;
let sharedAudioUnlocked = false;
let sharedNotificationBuffer: AudioBuffer | null = null;
let sharedLoadingPromise: Promise<void> | null = null;

function getAudioContextCtor() {
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

async function unlockSharedAudio(): Promise<boolean> {
  const AudioContextCtor = getAudioContextCtor();
  if (!AudioContextCtor) return false;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor();
  }

  if (sharedAudioContext.state === 'suspended') {
    try {
      await sharedAudioContext.resume();
    } catch {
      return false;
    }
  }

  // So molt curt per desbloquejar l'àudio en Safari/iOS
  const osc = sharedAudioContext.createOscillator();
  const gain = sharedAudioContext.createGain();
  gain.gain.value = 0.0001;
  osc.frequency.value = 440;
  osc.connect(gain);
  gain.connect(sharedAudioContext.destination);
  osc.start();
  osc.stop(sharedAudioContext.currentTime + 0.02);

  sharedAudioUnlocked = true;
  return true;
}

function playBeep(): void {
  if (!sharedAudioContext || !sharedAudioUnlocked) return;

  const start = sharedAudioContext.currentTime;
  const osc = sharedAudioContext.createOscillator();
  const gain = sharedAudioContext.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(960, start);
  osc.frequency.exponentialRampToValueAtTime(700, start + 0.25);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);

  osc.connect(gain);
  gain.connect(sharedAudioContext.destination);
  osc.start(start);
  osc.stop(start + 0.32);
}

async function ensureNotificationBuffer(): Promise<void> {
  if (!sharedAudioContext || sharedNotificationBuffer) return;
  if (sharedLoadingPromise) return sharedLoadingPromise;

  sharedLoadingPromise = (async () => {
    try {
      const response = await fetch(SOUND_URL);
      if (!response.ok) {
        throw new Error(`No s'ha pogut carregar ${SOUND_URL}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      sharedNotificationBuffer = await sharedAudioContext!.decodeAudioData(arrayBuffer.slice(0));
    } catch (error) {
      console.warn("No s'ha pogut carregar notification.mp3, s'usarà beep:", error);
      sharedNotificationBuffer = null;
    } finally {
      sharedLoadingPromise = null;
    }
  })();

  return sharedLoadingPromise;
}

function playNotificationSound(): void {
  if (!sharedAudioContext || !sharedAudioUnlocked) return;

  if (sharedNotificationBuffer) {
    const playOnce = (delaySeconds: number) => {
      const source = sharedAudioContext!.createBufferSource();
      source.buffer = sharedNotificationBuffer;

      const gain = sharedAudioContext!.createGain();
      // Empenta extra perquè se senti en mòbils i TVs
      gain.gain.value = 3.2;

      // Suavitza saturació quan pugem el guany
      const compressor = sharedAudioContext!.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 20;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.2;

      source.connect(gain);
      gain.connect(compressor);
      compressor.connect(sharedAudioContext!.destination);
      source.start(sharedAudioContext!.currentTime + delaySeconds);
    };

    // Doble toc curt per fer-lo més perceptible
    playOnce(0);
    playOnce(0.14);
    return;
  }

  playBeep();
}

export function useNumeroChangeSound(numeroMetge: number, numeroInfermera: number) {
  const prevMetgeRef = useRef(numeroMetge);
  const prevInfermeraRef = useRef(numeroInfermera);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  const activateSound = useCallback(async () => {
    const ok = await unlockSharedAudio();
    if (ok) {
      await ensureNotificationBuffer();
      localStorage.setItem(SOUND_ENABLED_KEY, 'true');
      setIsSoundEnabled(true);
      playNotificationSound();
    }
    return ok;
  }, []);

  useEffect(() => {
    const wanted = localStorage.getItem(SOUND_ENABLED_KEY) === 'true';
    if (!wanted) return;

    unlockSharedAudio().then((ok) => {
      if (ok) {
        ensureNotificationBuffer();
        setIsSoundEnabled(true);
      }
    });
  }, []);

  useEffect(() => {
    const onFirstInteraction = () => {
      unlockSharedAudio().then((ok) => {
        if (ok) {
          ensureNotificationBuffer();
          setIsSoundEnabled(true);
          localStorage.setItem(SOUND_ENABLED_KEY, 'true');
        }
      });
    };

    document.addEventListener('click', onFirstInteraction, { once: true });
    document.addEventListener('touchstart', onFirstInteraction, { once: true });
    document.addEventListener('keydown', onFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', onFirstInteraction);
      document.removeEventListener('touchstart', onFirstInteraction);
      document.removeEventListener('keydown', onFirstInteraction);
    };
  }, []);

  useEffect(() => {
    if (prevMetgeRef.current !== numeroMetge && numeroMetge > 0 && isSoundEnabled) {
      playNotificationSound();
    }
    prevMetgeRef.current = numeroMetge;
  }, [numeroMetge, isSoundEnabled]);

  useEffect(() => {
    if (prevInfermeraRef.current !== numeroInfermera && numeroInfermera > 0 && isSoundEnabled) {
      playNotificationSound();
    }
    prevInfermeraRef.current = numeroInfermera;
  }, [numeroInfermera, isSoundEnabled]);

  return {
    isSoundEnabled,
    activateSound,
  };
}
