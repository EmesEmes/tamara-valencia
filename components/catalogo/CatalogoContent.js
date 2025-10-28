'use client';
import { useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProductosAgrupados } from '@/lib/hooks/useProductos';
import ProductGrid from './ProductGrid';
import Filters from './Filters';
import Pagination from './Pagination';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const CONJUNTOS_POR_PAGINA = 6;

export default function CatalogoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Usar useMemo para los filtros
  const filters = useMemo(() => ({
    tipo: searchParams.get('tipo') || '',
    categoria: searchParams.get('categoria') || '',
    material: searchParams.get('material') || '',
    precioMin: searchParams.get('precioMin') || '',
    precioMax: searchParams.get('precioMax') || ''
  }), [searchParams]);

  const currentPage = parseInt(searchParams.get('page')) || 1;

  // Debug logs
  console.log('RENDER - Página actual:', currentPage);
  console.log('RENDER - URL completa:', searchParams.toString());

  // Usar React Query para obtener productos
  const { data, isLoading, error } = useProductosAgrupados(filters);

  const handleFilterChange = useCallback((newFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.tipo) params.set('tipo', newFilters.tipo);
    if (newFilters.categoria) params.set('categoria', newFilters.categoria);
    if (newFilters.material) params.set('material', newFilters.material);
    if (newFilters.precioMin) params.set('precioMin', newFilters.precioMin);
    if (newFilters.precioMax) params.set('precioMax', newFilters.precioMax);
    // Reset a página 1 al cambiar filtros
    params.set('page', '1');

    const queryString = params.toString();
    router.push(`/catalogo?${queryString}`, { scroll: false });
  }, [router]);

  const handleClearFilters = useCallback(() => {
    router.push('/catalogo', { scroll: false });
  }, [router]);

  const handlePageChange = useCallback((newPage) => {
    console.log('=== INICIANDO CAMBIO DE PÁGINA ===');
    console.log('Nueva página:', newPage);
    console.log('searchParams actual:', searchParams.toString());
    
    const params = new URLSearchParams(searchParams);
    console.log('Params después de copiar:', params.toString());
    
    params.set('page', newPage.toString());
    console.log('Params después de setear page:', params.toString());
    
    const finalUrl = `/catalogo?${params.toString()}`;
    console.log('URL final:', finalUrl);
    
    router.push(finalUrl);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [router, searchParams]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-red-600">Error al cargar productos. Por favor, intenta de nuevo.</p>
      </div>
    );
  }

  // Calcular paginación de conjuntos
  const totalConjuntos = data?.conjuntos.length || 0;
  const totalPages = Math.ceil(totalConjuntos / CONJUNTOS_POR_PAGINA);
  const startIndex = (currentPage - 1) * CONJUNTOS_POR_PAGINA;
  const endIndex = startIndex + CONJUNTOS_POR_PAGINA;
  const conjuntosMostrados = data?.conjuntos.slice(startIndex, endIndex) || [];
  const productosSueltos = data?.productosSueltos || [];

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
        productosSueltos={productosSueltos}
      />

      {/* Paginación de Conjuntos */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Mensaje si no hay conjuntos pero sí productos sueltos */}
      {conjuntosMostrados.length === 0 && productosSueltos.length > 0 && (
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm font-light">
            No hay más conjuntos. Todas las piezas individuales se muestran arriba.
          </p>
        </div>
      )}
    </div>
  );
}