"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VendedorForm from "@/components/caja/VendedorForm";
import { getVendedor, updateVendedor } from "@/lib/api/caja/vendedores";

export default function EditarVendedorPage({ params }) {
  const router = useRouter();
  const [vendedor, setVendedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener ID del vendedor desde los params
  const vendedorId = params.id;

  const cargarVendedor = useCallback(async () => {
    try {
      const { data, error } = await getVendedor(vendedorId);

      if (error) throw error;

      if (!data) {
        throw new Error("Vendedor no encontrado");
      }

      setVendedor(data);
    } catch (err) {
      console.error("Error al cargar vendedor:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [vendedorId]);

  useEffect(() => {
    cargarVendedor();
  }, [cargarVendedor]);

  const handleSubmit = async (vendedorData) => {
    try {
      const { data, error } = await updateVendedor(vendedorId, vendedorData);

      if (error) throw error;

      alert("Distribuidora actualizada correctamente");
      router.push("/admin/caja/vendedores");
    } catch (err) {
      console.error("Error al actualizar vendedor:", err);
      throw err; // El form lo manejará
    }
  };

  const handleCancel = () => {
    router.push("/admin/caja/vendedores");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando distribuidora...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="font-medium">Error al cargar distribuidora</p>
            <p className="text-sm mt-1">{error}</p>
            <Link
              href="/admin/caja/vendedores"
              className="text-sm underline mt-2 inline-block"
            >
              Volver a la lista
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Editar Distribuidora
          </h1>
          <p className="text-gray-600">
            Modifica la información de la distribuidora
          </p>
        </div>

        {/* Navegación */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="flex gap-4 text-sm">
            <Link
              href="/admin/caja"
              className="text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <span className="text-gray-400">›</span>
            <Link
              href="/admin/caja/vendedores"
              className="text-gray-600 hover:text-gray-900"
            >
              Distribuidoras
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">
              {vendedor?.nombre}
            </span>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <VendedorForm
            vendedor={vendedor}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
