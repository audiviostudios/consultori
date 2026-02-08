import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Recepta } from '@/lib/types';

export function useReceptes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['receptes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receptes')
        .select('*')
        .order('created_at', { ascending: false });
      
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
    mutationFn: async (recepta: Omit<Recepta, 'id' | 'created_at' | 'atesa'>) => {
      const { data, error } = await supabase
        .from('receptes')
        .insert(recepta)
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
