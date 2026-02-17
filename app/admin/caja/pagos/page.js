"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getEgresos, getProximosPagos } from "@/lib/api/caja/egresos";
import { CATEGORIAS_EGRESO } from "@/lib/constants/caja";

export default function CalendarioPagosPage() {
  const [proximosPagos, setProximosPagos] = useState([]);
  const [todosEgresos, setTodosEgresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(
    new Date().getFullYear(),
  );

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      // Obtener próximos pagos (próximos 30 días)
      const { data: proximos, error: errorProximos } =
        await getProximosPagos(30);
      if (errorProximos) throw errorProximos;

      // Obtener todos los egresos activos
      const { data: egresos, error: errorEgresos } = await getEgresos(true);
      if (errorEgresos) throw errorEgresos;

      setProximosPagos(proximos || []);
      setTodosEgresos(egresos || []);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
    }).format(date);
  };

  const getLabelCategoria = (categoria) => {
    const cat = CATEGORIAS_EGRESO.find((c) => c.value === categoria);
    return cat?.label || categoria;
  };

  const getColorCategoria = (categoria) => {
    const colores = {
      bancos: "bg-red-100 text-red-800",
      servicios_basicos: "bg-blue-100 text-blue-800",
      alimentacion: "bg-green-100 text-green-800",
      transporte: "bg-yellow-100 text-yellow-800",
      salud: "bg-purple-100 text-purple-800",
      vivienda: "bg-orange-100 text-orange-800",
      educacion: "bg-indigo-100 text-indigo-800",
      impuestos: "bg-pink-100 text-pink-800",
      negocio: "bg-teal-100 text-teal-800",
      otros: "bg-gray-100 text-gray-800",
    };
    return colores[categoria] || "bg-gray-100 text-gray-800";
  };

  const calcularTotalesMes = () => {
    const totalProgramado = proximosPagos.reduce(
      (sum, p) => sum + parseFloat(p.monto_estimado || 0),
      0,
    );

    const pagosPagados = proximosPagos.filter((p) => {
      const pago = p.pagos?.find((pg) => pg.numero_pago === p.numero_pago);
      return pago?.estado === "pagado";
    });

    const totalPagado = pagosPagados.reduce(
      (sum, p) => sum + parseFloat(p.monto_estimado || 0),
      0,
    );

    const totalPendiente = totalProgramado - totalPagado;

    return {
      totalProgramado,
      totalPagado,
      totalPendiente,
      cantidadPagados: pagosPagados.length,
      cantidadPendientes: proximosPagos.length - pagosPagados.length,
    };
  };

  const agruparPorCategoria = () => {
    const grupos = {};

    todosEgresos.forEach((egreso) => {
      if (!grupos[egreso.categoria]) {
        grupos[egreso.categoria] = {
          categoria: egreso.categoria,
          egresos: [],
          totalMensual: 0,
        };
      }

      grupos[egreso.categoria].egresos.push(egreso);

      if (egreso.tipo_recurrencia === "fijo") {
        grupos[egreso.categoria].totalMensual += parseFloat(
          egreso.monto_fijo || 0,
        );
      }
    });

    return Object.values(grupos);
  };

  const totales = calcularTotalesMes();
  const gruposCategoria = agruparPorCategoria();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando calendario de pagos...</p>
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
                📅 Calendario de Pagos
              </h1>
              <p className="text-gray-600">
                Control mensual de todos los egresos y pagos
              </p>
            </div>
            <Link
              href="/admin/caja/egresos"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Gestionar Egresos
            </Link>
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
            <span className="font-medium text-gray-900">
              Calendario de Pagos
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {/* Resumen Ejecutivo */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 border border-blue-200 rounded-lg shadow-sm">
            <p className="text-blue-800 text-sm uppercase tracking-wider mb-2 font-medium">
              Total Programado
            </p>
            <p className="text-3xl font-bold text-blue-900">
              {formatPrice(totales.totalProgramado)}
            </p>
            <p className="text-xs text-blue-700 mt-2">Próximos 30 días</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 border border-green-200 rounded-lg shadow-sm">
            <p className="text-green-800 text-sm uppercase tracking-wider mb-2 font-medium">
              Pagado
            </p>
            <p className="text-3xl font-bold text-green-900">
              {formatPrice(totales.totalPagado)}
            </p>
            <p className="text-xs text-green-700 mt-2">
              {totales.cantidadPagados} pagos realizados
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 border border-orange-200 rounded-lg shadow-sm">
            <p className="text-orange-800 text-sm uppercase tracking-wider mb-2 font-medium">
              Pendiente
            </p>
            <p className="text-3xl font-bold text-orange-900">
              {formatPrice(totales.totalPendiente)}
            </p>
            <p className="text-xs text-orange-700 mt-2">
              {totales.cantidadPendientes} pagos por hacer
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 border border-purple-200 rounded-lg shadow-sm">
            <p className="text-purple-800 text-sm uppercase tracking-wider mb-2 font-medium">
              Egresos Activos
            </p>
            <p className="text-3xl font-bold text-purple-900">
              {todosEgresos.length}
            </p>
            <p className="text-xs text-purple-700 mt-2">Gastos recurrentes</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Próximos Pagos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Próximos Pagos */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
                <h2 className="text-xl font-semibold">
                  🗓️ Próximos Pagos (30 días)
                </h2>
              </div>

              {proximosPagos.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500 mb-4">
                    No hay pagos programados para los próximos 30 días
                  </p>
                  <Link
                    href="/admin/caja/egresos/nuevo"
                    className="inline-block text-blue-600 hover:text-blue-800"
                  >
                    Crear primer egreso →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {proximosPagos.map((pago, index) => {
                    const yaEstaPagado = pago.pagos?.find(
                      (p) =>
                        p.numero_pago === pago.numero_pago &&
                        p.estado === "pagado",
                    );

                    return (
                      <div
                        key={index}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          yaEstaPagado ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {pago.concepto}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${getColorCategoria(
                                  pago.categoria,
                                )}`}
                              >
                                {getLabelCategoria(pago.categoria)}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                📅 Vence: {formatDate(pago.proxima_fecha)}
                              </span>
                              <span className="flex items-center gap-1">
                                💰 {formatPrice(pago.monto_estimado)}
                              </span>
                              <span className="flex items-center gap-1">
                                🔢 Pago #{pago.numero_pago}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {yaEstaPagado ? (
                              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                                ✓ Pagado
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                                ⏳ Pendiente
                              </span>
                            )}

                            <Link
                              href={`/admin/caja/egresos/${pago.id}`}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              Ver →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha - Resumen por Categoría */}
          <div className="space-y-6">
            {/* Resumen por Categoría */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4">
                <h2 className="text-lg font-semibold">📊 Por Categoría</h2>
              </div>

              <div className="p-4 space-y-3">
                {gruposCategoria.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No hay egresos registrados
                  </p>
                ) : (
                  gruposCategoria.map((grupo) => (
                    <div
                      key={grupo.categoria}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getColorCategoria(
                            grupo.categoria,
                          )}`}
                        >
                          {getLabelCategoria(grupo.categoria)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {grupo.egresos.length} egreso
                          {grupo.egresos.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {grupo.egresos.map((egreso) => (
                          <div
                            key={egreso.id}
                            className="flex justify-between text-xs text-gray-600"
                          >
                            <span>{egreso.concepto}</span>
                            {egreso.tipo_recurrencia === "fijo" && (
                              <span className="font-medium text-gray-900">
                                {formatPrice(egreso.monto_fijo)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {grupo.totalMensual > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm font-semibold">
                          <span>Total mensual:</span>
                          <span className="text-blue-600">
                            {formatPrice(grupo.totalMensual)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-3">
                <Link
                  href="/admin/caja/egresos/nuevo"
                  className="block w-full bg-blue-600 text-white text-center px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  + Nuevo Egreso
                </Link>
                <Link
                  href="/admin/caja/egresos"
                  className="block w-full border-2 border-gray-300 text-gray-700 text-center px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Ver Todos los Egresos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
