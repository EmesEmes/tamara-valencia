'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const CONJUNTOS_POR_PAGINA = 9;

export default function ConjuntosGrid() {
  const [conjuntos, setConjuntos] = useState([]);
  const [conjuntosMostrados, setConjuntosMostrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cantidadMostrada, setCantidadMostrada] = useState(CONJUNTOS_POR_PAGINA);

  useEffect(() => {
    fetchConjuntos();
  }, []);

  useEffect(() => {
    // Actualizar conjuntos mostrados cuando cambia la cantidad
    setConjuntosMostrados(conjuntos.slice(0, cantidadMostrada));
  }, [cantidadMostrada, conjuntos]);

  const fetchConjuntos = async () => {
    try {
      const { data, error } = await supabase
        .from('conjuntos')
        .select(`
          *,
          productos:productos(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filtrar solo conjuntos que tengan productos
      const conjuntosConProductos = data.filter(
        c => c.productos && c.productos[0]?.count > 0
      );
      
      setConjuntos(conjuntosConProductos);
      setConjuntosMostrados(conjuntosConProductos.slice(0, CONJUNTOS_POR_PAGINA));
    } catch (error) {
      console.error('Error al cargar conjuntos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerMas = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setCantidadMostrada(prev => prev + CONJUNTOS_POR_PAGINA);
      setLoadingMore(false);
    }, 300); // Pequeño delay para mejor UX
  };

  const hayMasConjuntos = cantidadMostrada < conjuntos.length;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (conjuntos.length === 0) {
    return null; // No mostrar nada si no hay conjuntos
  }

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-elegant text-5xl font-light text-gray-900 mb-4 font-biloxi">
            Nuestras Colecciones
          </h2>
          <div className="w-24 h-px bg-gray-300 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto">
            Descubre nuestros conjuntos exclusivos de joyería, 
            cada uno diseñado para complementar tu estilo único
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {conjuntosMostrados.map((conjunto) => (
            <div 
              key={conjunto.id} 
              className="bg-white border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              {/* Imagen del conjunto */}
              <div className="relative h-[500px] bg-gray-100 overflow-hidden">
                {conjunto.imagen_url ? (
                  <Image
                    src={conjunto.imagen_url}
                    alt={conjunto.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg 
                      className="w-24 h-24 text-gray-300" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="0.5"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      ></path>
                    </svg>
                  </div>
                )}
              </div>

              {/* Información */}
              <div className="p-6">
                <h3 className="font-elegant text-2xl font-light text-gray-900 mb-3">
                  {conjunto.nombre}
                </h3>
                
                {conjunto.descripcion && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 font-light">
                    {conjunto.descripcion}
                  </p>
                )}

                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    {conjunto.productos[0]?.count || 0} {conjunto.productos[0]?.count === 1 ? 'pieza' : 'piezas'}
                  </p>
                </div>

                <Link
                  href={`/conjuntos/${conjunto.id}`}
                  className="block w-full text-center px-6 py-3 bg-gray-900 text-white font-light tracking-widest uppercase text-sm hover:bg-gray-800 transition-all duration-300"
                >
                  Ver Joyas
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Botón Ver Más */}
        {hayMasConjuntos && (
          <div className="text-center mt-12">
            <button
              onClick={handleVerMas}
              disabled={loadingMore}
              className="px-12 py-4 border-2 border-gray-900 text-gray-900 font-light tracking-widest uppercase text-sm hover:bg-gray-900 hover:text-white transition-all duration-300 disabled:opacity-50"
            >
              {loadingMore ? 'Cargando...' : `Ver Más Colecciones (${conjuntos.length - cantidadMostrada} restantes)`}
            </button>
          </div>
        )}

        {/* Mensaje cuando se muestran todos */}
        {!hayMasConjuntos && conjuntos.length > CONJUNTOS_POR_PAGINA && (
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm font-light">
              Has visto todas nuestras colecciones ({conjuntos.length} en total)
            </p>
          </div>
        )}
      </div>
    </section>
  );
}