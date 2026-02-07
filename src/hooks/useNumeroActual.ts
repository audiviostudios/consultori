import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NumeroActual } from '@/lib/types';

export function useNumeroActual() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['numero-actual'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('numero_actual')
        .select('*');
      
      if (error) throw error;
      return data as NumeroActual[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('numero-actual-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'numero_actual',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['numero-actual'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useActualitzarNumero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tipus, numero, dia_visita_id }: { tipus: 'metge' | 'infermera'; numero: number; dia_visita_id?: string }) => {
      const { data, error } = await supabase
        .from('numero_actual')
        .update({ numero, dia_visita_id: dia_visita_id || null })
        .eq('tipus', tipus)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numero-actual'] });
    },
  });
}
