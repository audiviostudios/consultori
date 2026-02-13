import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Recepta } from '@/lib/types';

const isDiaVisitaColumnMissing = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string; details?: string; hint?: string };
  const text = `${err.message ?? ''} ${err.details ?? ''} ${err.hint ?? ''}`.toLowerCase();
  return err.code === '42703' || text.includes('dia_visita_id');
};

export function useReceptes(diaVisitaId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['receptes', diaVisitaId],
    queryFn: async () => {
      let query = supabase
        .from('receptes')
        .select('*')
        .order('created_at', { ascending: false });

      if (diaVisitaId) {
        query = query.eq('dia_visita_id', diaVisitaId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Recepta[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('receptes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receptes',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['receptes'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useCrearRecepta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recepta: Omit<Recepta, 'id' | 'created_at' | 'atesa'> & { dia_visita_id?: string | null; dia_visita_data?: string }) => {
      const { dia_visita_data, ...payload } = recepta;
      const { data, error } = await supabase
        .from('receptes')
        .insert(payload)
        .select()
        .single();
      
      if (!error) return data;

      // Compatibilitat temporal: si la BD encara no té dia_visita_id,
      // guardem amb created_at del dia triat per mantenir el filtre per dia.
      if (!isDiaVisitaColumnMissing(error) || !dia_visita_data) throw error;

      const fallbackPayload = { ...payload } as Record<string, unknown>;
      delete fallbackPayload.dia_visita_id;
      const createdAt = new Date(`${dia_visita_data}T12:00:00.000Z`).toISOString();

      const { data: retryData, error: retryError } = await supabase
        .from('receptes')
        .insert({ ...fallbackPayload, created_at: createdAt })
        .select()
        .single();

      if (retryError) throw retryError;
      return retryData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptes'] });
    },
  });
}

export function useMarcarReceptaAtesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, atesa }: { id: string; atesa: boolean }) => {
      const { data, error } = await supabase
        .from('receptes')
        .update({ atesa })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptes'] });
    },
  });
}

export function useEliminarRecepta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('receptes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptes'] });
    },
  });
}

export function useEliminarReceptesMultiples() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids }: { ids: string[] }) => {
      const { error } = await supabase
        .from('receptes')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptes'] });
    },
  });
}
