'use client';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase/client';
import ConjuntoForm from '@/components/admin/ConjuntoForm';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function EditarConjuntoPage({ params }) {
  const resolvedParams = use(params);
  const [conjunto, setConjunto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConjunto = async () => {
      try {
        const { data, error } = await supabase
          .from('conjuntos')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();

        if (error) throw error;
        setConjunto(data);
      } catch (error) {
        console.error('Error al cargar conjunto:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConjunto();
  }, [resolvedParams.id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!conjunto) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-light text-gray-900 mb-4">Conjunto no encontrado</h2>
        <Link href="/admin/conjuntos" className="text-gray-600 hover:text-gray-900 underline">
          Volver a conjuntos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/admin/conjuntos" className="text-gray-600 hover:text-gray-900 text-sm">
          ← Volver a conjuntos
        </Link>
      </div>

      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-8">
        Editar Conjunto
      </h1>

      <ConjuntoForm conjunto={conjunto} />
    </div>
  );
}