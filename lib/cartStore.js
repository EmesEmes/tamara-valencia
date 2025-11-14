import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      items: [],

      // Agregar producto al carrito (con validación de stock)
      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find(item => item.id === product.id);

        // Validar stock disponible
        const cantidadActual = existingItem ? existingItem.quantity : 0;
        const stockDisponible = product.stock || 0;

        if (cantidadActual >= stockDisponible) {
          // Ya llegamos al límite del stock
          return false; // Retornamos false para indicar que no se pudo agregar
        }

        if (existingItem) {
          // Si ya existe, aumentar cantidad (solo si hay stock)
          set({
            items: items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          });
        } else {
          // Calcular precio
          const precioCalculado = product.peso * (product.factor?.valor || 0);
          const precioFinal = Math.ceil(precioCalculado / 5) * 5;

          // Si no existe, agregarlo con cantidad 1
          set({
            items: [...items, {
              id: product.id,
              codigo: product.codigo,
              nombre_comercial: product.nombre_comercial,
              tipo: product.tipo,
              categoria: product.categoria,
              material: product.material,
              peso: product.peso,
              imagen_url: product.imagen_url,
              imagen_public_id: product.imagen_public_id,
              precio_calculado: precioCalculado,
              precio_final: precioFinal,
              factor_nombre: product.factor?.nombre || 'N/A',
              conjunto_nombre: product.conjunto?.nombre || null,
              stock: product.stock, // Guardamos el stock disponible
              quantity: 1
            }]
          });
        }

        return true; // Retornamos true para indicar que se agregó correctamente
      },

      // Remover producto del carrito
      removeItem: (productId) => {
        set({
          items: get().items.filter(item => item.id !== productId)
        });
      },

      // Actualizar cantidad de un producto (con validación de stock)
      updateQuantity: (productId, quantity) => {
        const items = get().items;
        const item = items.find(item => item.id === productId);
        
        if (!item) return false;

        if (quantity <= 0) {
          get().removeItem(productId);
          return true;
        }

        // Validar que no exceda el stock
        if (quantity > item.stock) {
          return false; // No permitir exceder el stock
        }

        set({
          items: items.map(item =>
            item.id === productId
              ? { ...item, quantity }
              : item
          )
        });

        return true;
      },

      // Limpiar todo el carrito
      clearCart: () => {
        set({ items: [] });
      },

      // Calcular total de items
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Calcular precio total
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          return total + (item.precio_final * item.quantity);
        }, 0);
      },

      // Verificar si un producto está en el carrito
      isInCart: (productId) => {
        return get().items.some(item => item.id === productId);
      },

      // Obtener cantidad de un producto específico
      getItemQuantity: (productId) => {
        const item = get().items.find(item => item.id === productId);
        return item?.quantity || 0;
      },

      // Verificar si se puede agregar más de un producto (nuevo)
      canAddMore: (productId, stock) => {
        const item = get().items.find(item => item.id === productId);
        const cantidadActual = item?.quantity || 0;
        return cantidadActual < stock;
      }
    }),
    {
      name: 'cart-storage', // nombre en localStorage
    }
  )
);