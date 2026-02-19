import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export function useInventarioStats() {
  return useQuery({
    queryKey: ["inventario", "stats"],
    queryFn: async () => {
      let allData = [];
      let from = 0;
      const pageSize = 1000;

      // Paginar para traer TODOS los productos sin límite
      while (true) {
        const { data, error } = await supabase
          .from("productos")
          .select("peso, stock, factor:factores(valor)")
          .eq("activo", true)
          .gt("stock", 0)
          .range(from, from + pageSize - 1);

        if (error) throw error;

        allData = [...allData, ...data];

        // Si trajo menos de 1000, ya no hay más páginas
        if (data.length < pageSize) break;

        from += pageSize;
      }

      // Calcular valores
      let valorCalculado = 0;
      let valorFinal = 0;

      allData.forEach((producto) => {
        if (producto.peso && producto.factor?.valor && producto.stock) {
          const peso = parseFloat(producto.peso);
          const factor = parseFloat(producto.factor.valor);
          const stock = parseInt(producto.stock);

          const valorUnitario = peso * factor;
          valorCalculado += valorUnitario * stock;

          const precioFinal = Math.ceil(valorUnitario / 5) * 5;
          valorFinal += precioFinal * stock;
        }
      });

      return {
        valorCalculado,
        valorFinal,
        totalProductos: allData.length,
      };
    },
    staleTime: 30 * 1000,
  });
}
