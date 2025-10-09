'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function ConjuntosAdminPage() {
  const [conjuntos, setConjuntos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConjuntos();
  }, []);

  const fetchConjuntos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conjuntos')
        .select(`
          *,
          productos:productos(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConjuntos(data);
    } catch (error) {
      console.error('Error al cargar conjuntos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    // Verificar si tiene productos
    const { data: productos } = await supabase
      .from('productos')
      .select('id')
      .eq('id_conjunto', id);

    if (productos && productos.length > 0) {
      alert(`No se puede eliminar el conjunto "${nombre}" porque tiene ${productos.length} producto(s) asociado(s). Primero elimina o desvincula los productos.`);
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el conjunto "${nombre}"?`)) return;

    try {
      const { error } = await supabase
        .from('conjuntos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Conjunto eliminado exitosamente');
      fetchConjuntos();
    } catch (error) {
      console.error('Error al eliminar conjunto:', error);
      alert('Error al eliminar el conjunto');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-elegant text-4xl font-light text-gray-900">
          Conjuntos
        </h1>
        <Link
          href="/admin/conjuntos/nuevo"
          className="px-6 py-3 bg-gray-900 text-white text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors"
        >
          Nuevo Conjunto
        </Link>
      </div>

      {conjuntos.length === 0 ? (
        <div className="bg-white p-12 text-center border border-gray-200">
          <p className="text-gray-600 mb-4">No hay conjuntos registrados</p>
          <Link
            href="/admin/conjuntos/nuevo"
            className="text-gray-900 underline"
          >
            Crear primer conjunto
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conjuntos.map((conjunto) => (
            <div key={conjunto.id} className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Imagen del conjunto */}
              <div className="relative h-64 bg-gray-100">
                {conjunto.imagen_url ? (
                  <Image
                    src={conjunto.imagen_url}
                    alt={conjunto.nombre}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
              </div>

              <div className="p-6">
                <h3 className="font-elegant text-2xl font-light text-gray-900 mb-2">
                  {conjunto.nombre}
                </h3>
                
                {conjunto.descripcion && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {conjunto.descripcion}
                  </p>
                )}

                <div className="mb-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Productos:</span> {conjunto.productos?.[0]?.count || 0}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Link
                    href={`/admin/conjuntos/${conjunto.id}/editar`}
                    className="flex-1 text-center px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(conjunto.id, conjunto.nombre)}
                    className="flex-1 px-4 py-2 border border-red-300 text-red-600 text-sm hover:bg-red-50 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}