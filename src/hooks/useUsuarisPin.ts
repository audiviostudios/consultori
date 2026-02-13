import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UsuariPin } from '@/lib/types';

export function useUsuarisPin() {
  return useQuery({
    queryKey: ['usuaris-pin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuaris_pin')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UsuariPin[];
    },
  });
}

export function useEliminarUsuariPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('usuaris_pin')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuaris-pin'] });
    },
  });
}
