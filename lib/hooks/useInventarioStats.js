import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useInventarioStats() {
  return useQuery({
    queryKey: ['inventario', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('peso, stock, factor:factores(valor)')
        .eq('activo', true)
        .gt('stock', 0);

      if (error) throw error;

      // Calcular valores
      let valorCalculado = 0;
      let valorFinal = 0;

      data.forEach(producto => {
        if (producto.peso && producto.factor && producto.factor.valor && producto.stock) {
          const peso = parseFloat(producto.peso);
          const factor = parseFloat(producto.factor.valor);
          const stock = parseInt(producto.stock);

          // Valor calculado: peso × factor × stock
          const valorUnitarioCalculado = peso * factor;
          valorCalculado += valorUnitarioCalculado * stock;

          // Valor final: precioFinal × stock
          const precioFinal = Math.ceil(valorUnitarioCalculado / 5) * 5;
          valorFinal += precioFinal * stock;
        }
      });

      return {
        valorCalculado,
        valorFinal,
        totalProductos: data.length
      };
    },
    staleTime: 30 * 1000, // Actualizar cada 30 segundos
  });
}