import { useQuery } from '@tanstack/react-query';
import { getProductosAgrupados } from '@/lib/supabase/client';

export function useProductosAgrupados(filters) {
  return useQuery({
    queryKey: ['productos', 'agrupados', filters],
    queryFn: () => getProductosAgrupados(filters),
    staleTime: 5 * 60 * 1000,
  });
}