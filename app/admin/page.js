'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useInventarioStats } from '@/lib/hooks/useInventarioStats';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalConjuntos: 0,
    productosActivos: 0,
  });
  const [loading, setLoading] = useState(true);

  // Obtener estadísticas de inventario con React Query
  const { data: inventarioData, isLoading: inventarioLoading } = useInventarioStats();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Contar productos
      const { count: totalProductos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true });

      const { count: productosActivos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

      // Contar conjuntos
      const { count: totalConjuntos } = await supabase
        .from('conjuntos')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalProductos: totalProductos || 0,
        totalConjuntos: totalConjuntos || 0,
        productosActivos: productosActivos || 0,
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-8">
        Dashboard
      </h1>

      {/* Estadísticas Generales */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-sm uppercase tracking-wider mb-2">
            Total Productos
          </p>
          <p className="text-4xl font-light text-gray-900">{stats.totalProductos}</p>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-sm uppercase tracking-wider mb-2">
            Productos Activos
          </p>
          <p className="text-4xl font-light text-gray-900">{stats.productosActivos}</p>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-sm uppercase tracking-wider mb-2">
            Total Conjuntos
          </p>
          <p className="text-4xl font-light text-gray-900">{stats.totalConjuntos}</p>
        </div>
      </div>

      {/* Estadísticas de Inventario */}
      <h2 className="text-2xl font-light text-gray-900 mb-4">Valor de Inventario</h2>
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 border border-blue-200 shadow-sm">
          <p className="text-blue-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Valor de Inventario (Calculado)
          </p>
          {inventarioLoading ? (
            <p className="text-2xl font-light text-blue-900">Cargando...</p>
          ) : (
            <>
              <p className="text-4xl font-light text-blue-900 mb-2">
                {formatCurrency(inventarioData?.valorCalculado || 0)}
              </p>
              <p className="text-xs text-blue-700">
                Basado en peso × factor × stock
              </p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 border border-green-200 shadow-sm">
          <p className="text-green-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Valor Final de Inventario
          </p>
          {inventarioLoading ? (
            <p className="text-2xl font-light text-green-900">Cargando...</p>
          ) : (
            <>
              <p className="text-4xl font-light text-green-900 mb-2">
                {formatCurrency(inventarioData?.valorFinal || 0)}
              </p>
              <p className="text-xs text-green-700">
                Precio final redondeado × stock
              </p>
              {inventarioData && (
                <p className="text-xs text-green-600 mt-2">
                  Margen: {formatCurrency(inventarioData.valorFinal - inventarioData.valorCalculado)}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white p-6 border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-light text-gray-900 mb-6">Acciones Rápidas</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/admin/productos/nuevo"
            className="p-6 border-2 border-gray-300 hover:border-gray-900 transition-colors text-center"
          >
            <svg 
              className="w-12 h-12 mx-auto mb-4 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
            <p className="text-lg font-light text-gray-900">Nuevo Producto</p>
          </Link>

          <Link
            href="/admin/conjuntos/nuevo"
            className="p-6 border-2 border-gray-300 hover:border-gray-900 transition-colors text-center"
          >
            <svg 
              className="w-12 h-12 mx-auto mb-4 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              ></path>
            </svg>
            <p className="text-lg font-light text-gray-900">Nuevo Conjunto</p>
          </Link>
        </div>
      </div>
    </div>
  );
}