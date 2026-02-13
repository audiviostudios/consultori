import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DiaVisita, Cita } from '@/lib/types';
import { format } from 'date-fns';

export function useDiesVisita() {
  return useQuery({
    queryKey: ['dies-visita'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dies_visita')
        .select('*')
        .gte('data', format(new Date(), 'yyyy-MM-dd'))
        .order('data', { ascending: true });
      
      if (error) throw error;
      return data as DiaVisita[];
    },
  });
}

export function useDiaVisitaActual() {
  return useQuery({
    queryKey: ['dia-visita-actual'],
    queryFn: async () => {
      const avui = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('dies_visita')
        .select('*')
        .eq('data', avui)
        .maybeSingle();
      
      if (error) throw error;
      return data as DiaVisita | null;
    },
  });
}

export function useCitesDia(diaVisitaId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cites', diaVisitaId],
    queryFn: async () => {
      if (!diaVisitaId) return [];
      const { data, error } = await supabase
        .from('cites')
        .select('*')
        .eq('dia_visita_id', diaVisitaId)
        .order('numero_tanda', { ascending: true });
      
      if (error) throw error;
      return data as Cita[];
    },
    enabled: !!diaVisitaId,
  });

  // Realtime subscription per actualitzar cites en temps real
  useEffect(() => {
    if (!diaVisitaId) return;

    const channel = supabase
      .channel(`cites-${diaVisitaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cites',
          filter: `dia_visita_id=eq.${diaVisitaId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['cites', diaVisitaId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [diaVisitaId, queryClient]);

  return query;
}

export function useCrearCita() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cita: Omit<Cita, 'id' | 'created_at'> & { pin_cancelacio?: string }) => {
      const { data, error } = await supabase
        .from('cites')
        .insert(cita)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cites'] });
    },
  });
}

export function useEliminarCita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('cites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cites'] });
    },
  });
}

export function useEliminarCitesMultiples() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids }: { ids: string[] }) => {
      const { error } = await supabase
        .from('cites')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return ids;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cites'] });
    },
  });
}

export function useActualitzarEstatCita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estat_assistencia }: { id: string; estat_assistencia: 'visitat' | 'no_assistit' | 'eliminat' | null }) => {
      const { data, error } = await supabase
        .from('cites')
        .update({ estat_assistencia })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cites'] });
    },
  });
}

export function useActualitzarCita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nom_complet }: { id: string; nom_complet: string }) => {
      const { data, error } = await supabase
        .from('cites')
        .update({ nom_complet })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cites'] });
    },
  });
}

export function useCrearDiaVisita() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dia: Omit<DiaVisita, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('dies_visita')
        .insert(dia)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dies-visita'] });
    },
  });
}

export function useActualitzarDiaVisita() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DiaVisita> & { id: string }) => {
      const { data, error } = await supabase
        .from('dies_visita')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dies-visita'] });
    },
  });
}

export function useEliminarDiaVisita() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dies_visita')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['dies-visita'] });
      
      // Snapshot the previous value
      const previousDies = queryClient.getQueryData<DiaVisita[]>(['dies-visita']);
      
      // Optimistically update by removing the deleted day
      if (previousDies) {
        queryClient.setQueryData<DiaVisita[]>(
          ['dies-visita'],
          previousDies.filter(dia => dia.id !== deletedId)
        );
      }
      
      return { previousDies };
    },
    onError: (_err, _deletedId, context) => {
      // Rollback on error
      if (context?.previousDies) {
        queryClient.setQueryData(['dies-visita'], context.previousDies);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['dies-visita'] });
    },
  });
}
