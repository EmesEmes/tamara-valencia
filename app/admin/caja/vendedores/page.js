"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getVendedores,
  deleteVendedor,
  activarVendedor,
} from "@/lib/api/caja/vendedores";

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroActivos, setFiltroActivos] = useState("todos"); // 'todos' | 'activos' | 'inactivos'

  useEffect(() => {
    cargarVendedores();
  }, []);

  const cargarVendedores = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getVendedores(false); // Traer todos

      if (error) throw error;

      setVendedores(data || []);
    } catch (err) {
      console.error("Error al cargar vendedores:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de desactivar al vendedor "${nombre}"?`)) {
      return;
    }

    try {
      const { error } = await deleteVendedor(id);

      if (error) throw error;

      // Recargar lista
      await cargarVendedores();

      alert("Vendedor desactivado correctamente");
    } catch (err) {
      console.error("Error al desactivar vendedor:", err);
      alert("Error al desactivar vendedor: " + err.message);
    }
  };

  const handleActivar = async (id, nombre) => {
    if (!confirm(`¿Reactivar al vendedor "${nombre}"?`)) {
      return;
    }

    try {
      const { error } = await activarVendedor(id);

      if (error) throw error;

      await cargarVendedores();

      alert("Vendedor reactivado correctamente");
    } catch (err) {
      console.error("Error al activar vendedor:", err);
      alert("Error al activar vendedor: " + err.message);
    }
  };

  // Filtrar vendedores según el estado
  const vendedoresFiltrados = vendedores.filter((v) => {
    if (filtroActivos === "activos") return v.activo;
    if (filtroActivos === "inactivos") return !v.activo;
    return true; // 'todos'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando vendedores...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Distribuidoras
              </h1>
              <p className="text-gray-600">Gestiona las distribuidoras</p>
            </div>
            <Link
              href="/admin/caja/vendedores/nuevo"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Nueva Distribuidora
            </Link>
          </div>
        </div>

        {/* Navegación Caja */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="flex gap-4">
            <Link
              href="/admin/caja"
              className="text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">Distribuidoras</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium text-gray-700">Filtrar:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFiltroActivos("todos")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroActivos === "todos"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos ({vendedores.length})
              </button>
              <button
                onClick={() => setFiltroActivos("activos")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroActivos === "activos"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Activos ({vendedores.filter((v) => v.activo).length})
              </button>
              <button
                onClick={() => setFiltroActivos("inactivos")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroActivos === "inactivos"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Inactivos ({vendedores.filter((v) => !v.activo).length})
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Vendedores */}
        {vendedoresFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">
              {filtroActivos === "todos"
                ? "No hay distribuidoras registradas"
                : `No hay distribuidoras ${filtroActivos}`}
            </p>
            <Link
              href="/admin/caja/vendedores/nuevo"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Crear Primera Distribuidora
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendedoresFiltrados.map((vendedor) => (
                  <tr key={vendedor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vendedor.nombre}
                          </div>
                          {vendedor.email && (
                            <div className="text-sm text-gray-500">
                              {vendedor.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendedor.telefono || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          vendedor.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {vendedor.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/caja/vendedores/${vendedor.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </Link>
                        {vendedor.activo ? (
                          <button
                            onClick={() =>
                              handleEliminar(vendedor.id, vendedor.nombre)
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleActivar(vendedor.id, vendedor.nombre)
                            }
                            className="text-green-600 hover:text-green-900"
                          >
                            Activar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
