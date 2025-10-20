'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ProductCard from './ProductCard';

export default function ConjuntoDetalle({ conjuntoId }) {
  const [conjunto, setConjunto] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener conjunto
        const { data: conjuntoData, error: conjuntoError } = await supabase
          .from('conjuntos')
          .select('*')
          .eq('id', conjuntoId)
          .single();

        if (conjuntoError) throw conjuntoError;
        setConjunto(conjuntoData);

        // Obtener productos del conjunto con factor
        const { data: productosData, error: productosError } = await supabase
          .from('productos')
          .select('*, factor:factores(*)')
          .eq('id_conjunto', conjuntoId)
          .eq('activo', true)
          .gt('stock', 0);

        if (productosError) throw productosError;
        setProductos(productosData);
      } catch (error) {
        console.error('Error al cargar conjunto:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conjuntoId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!conjunto) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-light text-gray-900 mb-4">
          Conjunto no encontrado
        </h2>
        <Link href="/" className="text-gray-600 hover:text-gray-900 underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">
          ← Volver al inicio
        </Link>
      </div>

      <div className='grid md:grid-cols-2 gap-6 items-center'>
        {/* Imagen grande del conjunto */}
      {conjunto.imagen_url && (
        <div className="relative w-full h-[600px] md:h-[700px] overflow-hidden bg-gray-100 mb-12 rounded-lg">
          <Image
            src={conjunto.imagen_url}
            alt={conjunto.nombre}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      {/* Información del conjunto */}
      <div className="text-center mb-16">
        <h1 className="font-elegant text-4xl md:text-6xl font-light text-gray-900 mb-4">
          {conjunto.nombre}
        </h1>
        
        <div className="w-24 h-px bg-[#FFF2E0] mx-auto mb-6"></div>
        
        {conjunto.descripcion && (
          <p className="text-lg text-gray-600 font-light max-w-3xl mx-auto leading-relaxed">
            {conjunto.descripcion}
          </p>
        )}

        <p className="text-sm text-gray-500 mt-6">
          {productos.length} {productos.length === 1 ? 'pieza disponible' : 'piezas disponibles'}
        </p>
      </div>
      </div>

      {/* Grid de productos */}
      {productos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productos.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg font-light">
            No hay productos disponibles en este conjunto en este momento
          </p>
        </div>
      )}
    </div>
  );
}0