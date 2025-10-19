'use client';
import ProductCard from './ProductCard';
import Image from 'next/image';

export default function ProductGrid({ conjuntos, productosSueltos }) {
  const hasProducts = conjuntos.length > 0 || productosSueltos.length > 0;

  if (!hasProducts) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg font-light">
          No se encontraron productos con los filtros seleccionados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Mostrar Conjuntos */}
      {conjuntos.map(conjunto => (
        <div key={conjunto.id} className="space-y-8 ">
          {/* Imagen del conjunto */}
          <div className='grid items-center lg:grid-cols-2 lg:gap-6'>
            {conjunto.imagen_url && (
            <div className="relative w-full h-[400px] md:h-[700px] overflow-hidden bg-gray-100 mb-6 rounded-lg">
              <Image
                src={conjunto.imagen_url}
                alt={conjunto.nombre}
                fill
                className="object-cover object-center"
                sizes="100vw"
                priority
              />
            </div>
          )}

          {/* Info del conjunto */}
          <div className="text-center">
            <h2 className="font-elegant text-3xl md:text-4xl font-light text-gray-900 mb-2">
              {conjunto.nombre}
            </h2>
            {conjunto.descripcion && (
              <p className="text-gray-600 font-light max-w-2xl mx-auto">
                {conjunto.descripcion}
              </p>
            )}
            <div className="w-16 h-px bg-[#FFF2E0] mx-auto mt-4"></div>
          </div>
          </div>
          
          {/* Productos del conjunto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {conjunto.productos.map(producto => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        </div>
      ))}

      {/* Mostrar Productos Sueltos */}
      {productosSueltos.length > 0 && (
        <div className="space-y-6">
          {conjuntos.length > 0 && (
            <div className="text-center">
              <h2 className="font-elegant text-3xl font-light text-gray-900 mb-2">
                Piezas Individuales
              </h2>
              <div className="w-16 h-px bg-[#FFF2E0] mx-auto mt-4"></div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productosSueltos.map(producto => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}