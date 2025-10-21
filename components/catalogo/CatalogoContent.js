'use client';
import { useState, useEffect, useCallback } from 'react';
import { getProductosAgrupados } from '@/lib/supabase/client';
import ProductGrid from './ProductGrid';
import Filters from './Filters';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const CONJUNTOS_POR_PAGINA = 6;

export default function CatalogoContent() {
  const [data, setData] = useState({ conjuntos: [], productosSueltos: [] });
  const [conjuntosMostrados, setConjuntosMostrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMoreConjuntos, setLoadingMoreConjuntos] = useState(false);
  const [cantidadConjuntosMostrada, setCantidadConjuntosMostrada] = useState(CONJUNTOS_POR_PAGINA);
  const [filters, setFilters] = useState({
    tipo: '',
    categoria: '',
    material: '',
    precioMin: '',
    precioMax: ''
  });

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        const result = await getProductosAgrupados(filters);
        setData(result);
        setConjuntosMostrados(result.conjuntos.slice(0, CONJUNTOS_POR_PAGINA));
        // Reset contador al cambiar filtros
        setCantidadConjuntosMostrada(CONJUNTOS_POR_PAGINA);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, [filters]);

  useEffect(() => {
    // Actualizar conjuntos mostrados
    setConjuntosMostrados(data.conjuntos.slice(0, cantidadConjuntosMostrada));
  }, [cantidadConjuntosMostrada, data.conjuntos]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      tipo: '',
      categoria: '',
      material: '',
      precioMin: '',
      precioMax: ''
    });
  }, []);

  const handleVerMasConjuntos = () => {
    setLoadingMoreConjuntos(true);
    setTimeout(() => {
      setCantidadConjuntosMostrada(prev => prev + CONJUNTOS_POR_PAGINA);
      setLoadingMoreConjuntos(false);
    }, 300);
  };

  const hayMasConjuntos = cantidadConjuntosMostrada < data.conjuntos.length;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="font-elegant text-5xl md:text-6xl font-light text-gray-900 mb-4">
          Catálogo
        </h1>
        <div className="w-24 h-px bg-gray-300 mx-auto"></div>
      </div>

      <Filters 
        filters={filters} 
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      <ProductGrid 
        conjuntos={conjuntosMostrados} 
        productosSueltos={data.productosSueltos}
      />

      {/* Botón Ver Más solo para conjuntos */}
      {hayMasConjuntos && (
        <div className="text-center mt-12">
          <button
            onClick={handleVerMasConjuntos}
            disabled={loadingMoreConjuntos}
            className="px-12 py-4 border-2 border-gray-900 text-gray-900 font-light tracking-widest uppercase text-sm hover:bg-gray-900 hover:text-white transition-all duration-300 disabled:opacity-50"
          >
            {loadingMoreConjuntos ? 'Cargando...' : `Ver Más Conjuntos (${data.conjuntos.length - cantidadConjuntosMostrada} restantes)`}
          </button>
        </div>
      )}

      {/* Mensaje cuando se muestran todos los conjuntos */}
      {!hayMasConjuntos && data.conjuntos.length > CONJUNTOS_POR_PAGINA && (
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm font-light">
            Has visto todos los conjuntos ({data.conjuntos.length} en total)
          </p>
        </div>
      )}
    </div>
  );
}