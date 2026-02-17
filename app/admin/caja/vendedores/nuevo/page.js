"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import VendedorForm from "@/components/caja/vendedorForm";
import { createVendedor } from "@/lib/api/caja/vendedores";

export default function NuevoVendedorPage() {
  const router = useRouter();

  const handleSubmit = async (vendedorData) => {
    try {
      const { data, error } = await createVendedor(vendedorData);

      if (error) throw error;

      alert("Distribuidora creada correctamente");
      router.push("/admin/caja/vendedores");
    } catch (err) {
      console.error("Error al crear vendedor:", err);
      throw err; // El form lo manejará
    }
  };

  const handleCancel = () => {
    router.push("/admin/caja/vendedores");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nueva Distribuidora
          </h1>
          <p className="text-gray-600">Registra una nueva distribuidora</p>
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
            <span className="font-medium text-gray-900">Nuevo</span>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <VendedorForm onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  );
}
