"use client";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/utils/formatters";
import { useCartStore } from "@/lib/cartStore";
import { useState } from "react";

export default function ProductCard({ producto }) {
  const [agregado, setAgregado] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const canAddMore = useCartStore((state) => state.canAddMore);
  const isInCart = useCartStore((state) => state.isInCart);

  // Funciones para calcular precio
  const calcularPrecio = (prod) => {
    if (!prod.peso || !prod.factor || !prod.factor.valor) return 0;
    return parseFloat(prod.peso) * parseFloat(prod.factor.valor);
  };

  const redondearPrecio = (precio) => {
    if (!precio || precio === 0) return 0;
    return Math.ceil(precio / 5) * 5;
  };

  const precioFinal = redondearPrecio(calcularPrecio(producto));
  const enCarrito = isInCart(producto.id);
  const puedeAgregar = producto.stock > 0 && canAddMore(producto.id, producto.stock);

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevenir navegación del Link
    e.stopPropagation();
    
    const added = addItem(producto);
    
    if (added) {
      setAgregado(true);
      setTimeout(() => setAgregado(false), 1500);
    }
  };

  return (
    <Link
      href={`/catalogo/${producto.id}`}
      className="group block bg-white border border-gray-200 hover:border-gray-400 transition-all duration-300 overflow-hidden"
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre_comercial}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-20 h-20 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="0.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
          </div>
        )}
        
        {/* Botón flotante en la imagen */}
        {puedeAgregar && (
          <button
            onClick={handleAddToCart}
            className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition-all duration-300 ${
              agregado
                ? 'bg-green-600 scale-110'
                : 'bg-white hover:bg-gray-900 hover:text-white'
            }`}
            title="Agregar al carrito"
          >
            {agregado ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-light text-lg text-gray-900 mb-1 line-clamp-2">
          {producto.nombre_comercial}
        </h3>
        <p className="text-sm text-gray-600 uppercase tracking-wider mb-2">
          {producto.material}
        </p>
        {producto.talla && (
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">
            {producto.talla}
          </p>
        )}
        <p className="font-light text-xl text-gray-900">
          {precioFinal > 0 ? formatPrice(precioFinal) : 'Precio no disponible'}
        </p>
        {producto.stock > 3 && (
          <p className="text-xs mt-1 text-green-600">
            En stock: {producto.stock}
          </p>
        )}
        {producto.stock <= 3 && producto.stock > 1 && (
          <p className="text-xs text-orange-600 mt-1">
            ¡Solo quedan {producto.stock}!
          </p>
        )}
        {producto.stock === 1 && (
          <p className="text-xs text-red-500 mt-1">
            ¡Última unidad!
          </p>
        )}
        {producto.stock === 0 && (
          <p className="text-xs text-red-600 mt-1">Agotado</p>
        )}
        {enCarrito && puedeAgregar && (
          <p className="text-xs text-gray-500 mt-1">
            ✓ En carrito
          </p>
        )}
        <p className="text-sm text-gray-500 uppercase tracking-wider mt-2">
          Cod: {producto.codigo}
        </p>
      </div>
    </Link>
  );
}