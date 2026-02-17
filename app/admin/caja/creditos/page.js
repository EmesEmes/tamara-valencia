"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getCreditos } from "@/lib/api/caja/creditos";

export default function CreditosPage() {
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState(""); // '' | 'activo' | 'pagado' | 'mora' | 'cancelado'

  const cargarCreditos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = {};
      if (filtroEstado) {
        filters.estado = filtroEstado;
      }

      const { data, error, pagination } = await getCreditos(page, 20, filters);

      if (error) throw error;

      setCreditos(data || []);
      setPagination(pagination);
    } catch (err) {
      console.error("Error al cargar créditos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filtroEstado]);

  useEffect(() => {
    cargarCreditos();
  }, [cargarCreditos]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      activo: "bg-green-100 text-green-800",
      pagado: "bg-blue-100 text-blue-800",
      mora: "bg-red-100 text-red-800",
      cancelado: "bg-gray-100 text-gray-800",
    };

    const labels = {
      activo: "Activo",
      pagado: "Pagado",
      mora: "En Mora",
      cancelado: "Cancelado",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[estado]}`}
      >
        {labels[estado] || estado}
      </span>
    );
  };

  const calcularCuotasPagadas = (pagos) => {
    if (!pagos) return 0;
    return pagos.filter((p) => p.estado === "pagado").length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando créditos...</p>
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
                Créditos Directos
              </h1>
              <p className="text-gray-600">
                Gestiona las ventas a crédito y sus pagos
              </p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="flex gap-4">
            <Link
              href="/admin/caja"
              className="text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">Créditos</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 items-center flex-wrap">
            <span className="text-sm font-medium text-gray-700">
              Filtrar por estado:
            </span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFiltroEstado("")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroEstado === ""
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroEstado("activo")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroEstado === "activo"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setFiltroEstado("mora")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroEstado === "mora"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                En Mora
              </button>
              <button
                onClick={() => setFiltroEstado("pagado")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroEstado === "pagado"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pagados
              </button>
              <button
                onClick={() => setFiltroEstado("cancelado")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroEstado === "cancelado"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Cancelados
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {/* Lista de Créditos */}
        {creditos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">
              No hay créditos{" "}
              {filtroEstado ? `con estado "${filtroEstado}"` : "registrados"}
            </p>
            <Link
              href="/admin/caja/ventas/nueva"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Crear Venta a Crédito
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo Pendiente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cuotas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Próximo Pago
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
                  {creditos.map((credito) => {
                    const cuotasPagadas = calcularCuotasPagadas(credito.pagos);
                    const proximaCuota = credito.pagos?.find(
                      (p) =>
                        p.estado === "pendiente" || p.estado === "atrasado",
                    );

                    return (
                      <tr key={credito.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {credito.cliente_nombre}
                          </div>
                          {credito.cliente_telefono && (
                            <div className="text-sm text-gray-500">
                              {credito.cliente_telefono}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatPrice(credito.monto_total)}
                          {credito.cuota_inicial > 0 && (
                            <div className="text-xs text-gray-500">
                              Inicial: {formatPrice(credito.cuota_inicial)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                          {formatPrice(credito.saldo_pendiente)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cuotasPagadas} / {credito.plazo_meses}
                          <div className="text-xs text-gray-500">
                            {formatPrice(credito.cuota_mensual)}/mes
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {proximaCuota ? (
                            <>
                              {formatDate(proximaCuota.fecha_programada)}
                              {proximaCuota.estado === "atrasado" && (
                                <div className="text-xs text-red-600 font-semibold">
                                  ATRASADA
                                </div>
                              )}
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getEstadoBadge(credito.estado)}
                          {credito.dias_mora > 0 && (
                            <div className="text-xs text-red-600 font-semibold mt-1">
                              {credito.dias_mora} días mora
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/caja/creditos/${credito.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination && pagination.pages > 1 && (
              <div className="bg-white rounded-lg shadow-sm mt-6 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Página {pagination.page} de {pagination.pages} (
                  {pagination.total} créditos)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
