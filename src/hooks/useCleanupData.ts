import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCleanupData() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cleanup-old-data');
      
      if (error) throw error;
      return data;
    },
  });
}
