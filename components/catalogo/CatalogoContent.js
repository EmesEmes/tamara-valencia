'use client';
import { useState, useEffect } from 'react';
import { getProductosAgrupados } from '@/lib/supabase/client';
import ProductGrid from './ProductGrid';
import Filters from './Filters';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function CatalogoContent() {
  const [data, setData] = useState({ conjuntos: [], productosSueltos: [] });
  const [loading, setLoading] = useState(true);
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
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      tipo: '',
      categoria: '',
      material: '',
      precioMin: '',
      precioMax: ''
    });
  };

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
        conjuntos={data.conjuntos} 
        productosSueltos={data.productosSueltos} 
      />
    </div>
  );
}