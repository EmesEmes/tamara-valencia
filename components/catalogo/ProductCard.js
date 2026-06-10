"use client";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/utils/formatters";

export default function ProductCard({ producto }) {
  const calcularPrecio = (prod) => {
    if (!prod.peso || !prod.factor || !prod.factor.valor) return 0;
    return parseFloat(prod.peso) * parseFloat(prod.factor.valor);
  };

  const redondearPrecio = (precio) => {
    if (!precio || precio === 0) return 0;
    return Math.ceil(precio / 5) * 5;
  };

  const precioFinal = redondearPrecio(calcularPrecio(producto));

  return (
    <Link
      href={`/catalogo/${producto.id}`}
      className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Imagen */}
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
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
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
              />
            </svg>
          </div>
        )}

        {/* Badge de stock */}
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
      </div>

      {/* Información */}
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

        <p className="font-light text-xl text-gray-900">
          {precioFinal > 0 ? formatPrice(precioFinal) : "Precio no disponible"}
        </p>

        <p className="text-sm text-gray-500 uppercase tracking-wider mt-2">
          Cod: {producto.codigo}
        </p>
      </div>
    </Link>
  );
}
