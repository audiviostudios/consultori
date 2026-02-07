import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// URL del so d'alerta
const ALERT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function useConsultesRealtime(tipus: 'metge' | 'infermera' | null) {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Precarregar l'àudio
    audioRef.current = new Audio(ALERT_SOUND_URL);
    audioRef.current.volume = 0.7;
  }, []);

  useEffect(() => {
    if (!tipus) return;

    const channel = supabase
      .channel(`consultes-${tipus}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultes_telefoniques',
          filter: `tipus=eq.${tipus}`,
        },
        (payload) => {
          // Reproduir so d'alerta
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
          }

          // Mostrar toast d'alerta
          const consulta = payload.new as any;
          toast.warning(`Nova consulta telefònica!`, {
            description: `${consulta.nom_complet} - ${consulta.urgencia === 'alta' ? '🔴 URGENT' : consulta.urgencia === 'mitjana' ? '🟡 Mitjana' : '🟢 Baixa'}`,
            duration: 10000,
          });

          // Invalidar queries
          queryClient.invalidateQueries({ queryKey: ['consultes'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tipus, queryClient]);
}
