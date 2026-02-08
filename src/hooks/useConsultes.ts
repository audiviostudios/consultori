import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConsultaTelefonica } from '@/lib/types';

export function useConsultesTelefoniques(tipus?: 'metge' | 'infermera') {
  return useQuery({
    queryKey: ['consultes', tipus],
    queryFn: async () => {
      let query = supabase
        .from('consultes_telefoniques')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tipus) {
        query = query.eq('tipus', tipus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ConsultaTelefonica[];
    },
  });
}

export function useCrearConsulta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (consulta: Omit<ConsultaTelefonica, 'id' | 'created_at' | 'atesa'>) => {
      const { data, error } = await supabase
        .from('consultes_telefoniques')
        .insert(consulta)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultes'] });
    },
  });
}

export function useMarcarConsultaAtesa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, atesa }: { id: string; atesa: boolean }) => {
      const { data, error } = await supabase
        .from('consultes_telefoniques')
        .update({ atesa })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultes'] });
    },
  });
}

export function useEliminarConsulta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('consultes_telefoniques')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultes'] });
    },
  });
}

export function useEliminarConsultesMultiples() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids }: { ids: string[] }) => {
      const { error } = await supabase
        .from('consultes_telefoniques')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultes'] });
    },
  });
}
