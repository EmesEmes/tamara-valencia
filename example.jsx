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
    e.preventDefault();
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
      className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Imagen con overlay sutil */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {producto.imagen_url ? (
          <>
            <Image
              src={producto.imagen_url}
              alt={producto.nombre_comercial}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {/* Overlay sutil en hover */}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          </>
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
        
        {/* Badge de stock - Esquina superior izquierda */}
        {producto.stock > 3 && (
          <div className="absolute top-3 left-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
            Stock: {producto.stock}
          </div>
        )}
        {producto.stock <= 3 && producto.stock > 1 && (
          <div className="absolute top-3 left-3 bg-orange-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
            ¡Solo {producto.stock}!
          </div>
        )}
        {producto.stock === 1 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
            ¡Última!
          </div>
        )}
        {producto.stock === 0 && (
          <div className="absolute top-3 left-3 bg-gray-900 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
            Agotado
          </div>
        )}
        
        {/* Botón flotante - Esquina inferior derecha */}
        {puedeAgregar && (
          <button
            onClick={handleAddToCart}
            className={`absolute bottom-4 right-4 p-3.5 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 ${
              agregado
                ? 'bg-green-600 scale-110'
                : 'bg-white/90 hover:bg-gray-900 hover:text-white hover:scale-110'
            }`}
            title="Agregar al carrito"
          >
            {agregado ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Información del producto */}
      <div className="p-5">
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
        
        {/* Precio y indicador "En carrito" en la misma línea */}
        <div className="flex items-center justify-between mb-2">
          <p className="font-light text-xl text-gray-900">
            {precioFinal > 0 ? formatPrice(precioFinal) : 'Precio no disponible'}
          </p>
          {enCarrito && (
            <span className="text-xs text-green-600 font-medium">
              ✓ En carrito
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-500 uppercase tracking-wider">
          Cod: {producto.codigo}
        </p>
      </div>
    </Link>
  );
}