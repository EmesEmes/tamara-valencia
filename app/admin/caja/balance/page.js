"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getResumenFinanciero,
  getComparacionMeses,
} from "@/lib/api/caja/finanzas";
import { CATEGORIAS_EGRESO } from "@/lib/constants/caja";

export default function BalanceFinancieroPage() {
  const [resumen, setResumen] = useState(null);
  const [comparacion, setComparacion] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(
    new Date().getMonth() + 1,
  );
  const [anioSeleccionado, setAnioSeleccionado] = useState(
    new Date().getFullYear(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Cargar resumen del mes
      const { data: resumenData, error: errorResumen } =
        await getResumenFinanciero(mesSeleccionado, anioSeleccionado);

      if (errorResumen) throw errorResumen;

      setResumen(resumenData);

      // Cargar comparación de últimos 6 meses
      const { data: comparacionData, error: errorComparacion } =
        await getComparacionMeses(6);

      if (errorComparacion) throw errorComparacion;

      setComparacion(comparacionData || []);
    } catch (err) {
      console.error("Error al cargar datos financieros:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mesSeleccionado, anioSeleccionado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const cambiarMes = (direccion) => {
    let nuevoMes = mesSeleccionado + direccion;
    let nuevoAnio = anioSeleccionado;

    if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAnio += 1;
    } else if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoAnio -= 1;
    }

    setMesSeleccionado(nuevoMes);
    setAnioSeleccionado(nuevoAnio);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getNombreMes = (mes) => {
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return meses[mes - 1];
  };

  const getLabelCategoria = (categoria) => {
    const cat = CATEGORIAS_EGRESO.find((c) => c.value === categoria);
    return cat?.label || categoria;
  };

  const getSaludFinanciera = (porcentaje) => {
    if (porcentaje >= 30)
      return { label: "Excelente", color: "green", emoji: "🟢" };
    if (porcentaje >= 15) return { label: "Buena", color: "blue", emoji: "🔵" };
    if (porcentaje >= 0)
      return { label: "Estable", color: "yellow", emoji: "🟡" };
    if (porcentaje >= -15)
      return { label: "Cuidado", color: "orange", emoji: "🟠" };
    return { label: "Crítico", color: "red", emoji: "🔴" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando balance financiero...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!resumen) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            Error al cargar datos financieros
          </div>
        </div>
      </div>
    );
  }

  const salud = getSaludFinanciera(resumen.balance.porcentajeRentabilidad);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Balance Financiero
          </h1>
          <p className="text-gray-600">Análisis de ingresos vs egresos</p>
        </div>

        {/* Navegación */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="flex gap-4 items-center">
            <Link
              href="/admin/caja"
              className="text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">Balance</span>
          </div>
        </div>

        {/* Selector de Mes */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => cambiarMes(-1)}
              className="p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ◀
            </button>
            <div className="text-center min-w-[200px]">
              <p className="text-2xl font-bold text-gray-900">
                {getNombreMes(mesSeleccionado)} {anioSeleccionado}
              </p>
            </div>
            <button
              onClick={() => cambiarMes(1)}
              className="p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Cards Principales */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          {/* Ingresos */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 border-2 border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-800 text-sm uppercase tracking-wider font-medium">
                💰 Ingresos
              </p>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-3xl font-bold text-green-900 mb-1">
              {formatPrice(resumen.ingresos.total)}
            </p>
            <p className="text-xs text-green-700">
              {resumen.ingresos.cantidadVentas} ventas
            </p>
          </div>

          {/* Egresos */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 border-2 border-red-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-red-800 text-sm uppercase tracking-wider font-medium">
                💸 Egresos
              </p>
              <span className="text-2xl">📉</span>
            </div>
            <p className="text-3xl font-bold text-red-900 mb-1">
              {formatPrice(resumen.egresos.total)}
            </p>
            <p className="text-xs text-red-700">
              {resumen.egresos.cantidadPagos} pagos
            </p>
          </div>

          {/* Balance */}
          <div
            className={`bg-gradient-to-br from-${salud.color}-50 to-${salud.color}-100 p-6 border-2 border-${salud.color}-200 rounded-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <p
                className={`text-${salud.color}-800 text-sm uppercase tracking-wider font-medium`}
              >
                📊 Balance
              </p>
              <span className="text-2xl">{salud.emoji}</span>
            </div>
            <p className={`text-3xl font-bold text-${salud.color}-900 mb-1`}>
              {formatPrice(resumen.balance.total)}
            </p>
            <p className={`text-xs text-${salud.color}-700`}>
              {resumen.balance.porcentajeRentabilidad}% rentabilidad
            </p>
          </div>

          {/* Salud Financiera */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-2 border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-800 text-sm uppercase tracking-wider font-medium">
                🏥 Salud
              </p>
              <span className="text-2xl">{salud.emoji}</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mb-1">
              {salud.label}
            </p>
            <p className="text-xs text-blue-700">Estado financiero</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Desglose de Ingresos */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4">
              <h2 className="text-xl font-semibold">💰 Desglose de Ingresos</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Ventas de Contado</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatPrice(resumen.ingresos.contado)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(resumen.ingresos.contado / resumen.ingresos.total) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Ventas a Crédito</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatPrice(resumen.ingresos.credito)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(resumen.ingresos.credito / resumen.ingresos.total) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {resumen.ingresos.comisionesPendientes > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-800 font-medium">
                      ⚠️ Comisiones Pendientes
                    </span>
                    <span className="text-lg font-semibold text-orange-900">
                      {formatPrice(resumen.ingresos.comisionesPendientes)}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Link
                  href="/admin/caja/ventas"
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Ver todas las ventas →
                </Link>
              </div>
            </div>
          </div>

          {/* Desglose de Egresos */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4">
              <h2 className="text-xl font-semibold">💸 Desglose de Egresos</h2>
            </div>
            <div className="p-6 space-y-3">
              {Object.entries(resumen.egresos.porCategoria)
                .sort(([, a], [, b]) => b - a)
                .map(([categoria, monto]) => (
                  <div
                    key={categoria}
                    className="border-b border-gray-200 pb-3"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">
                        {getLabelCategoria(categoria)}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatPrice(monto)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(monto / resumen.egresos.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}

              <div className="pt-4">
                <Link
                  href="/admin/caja/egresos"
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Ver todos los egresos →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Comparación de Meses */}
        {comparacion.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4">
              <h2 className="text-xl font-semibold">📈 Últimos 6 Meses</h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        Mes
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        Ingresos
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        Egresos
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        Balance
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparacion.map((mes, index) => {
                      const saludMes = getSaludFinanciera(
                        mes.balance.porcentajeRentabilidad,
                      );
                      return (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {mes.periodo.nombre} {mes.periodo.anio}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-green-600 font-semibold">
                            {formatPrice(mes.ingresos.total)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-red-600 font-semibold">
                            {formatPrice(mes.egresos.total)}
                          </td>
                          <td
                            className={`py-3 px-4 text-sm text-right font-bold ${
                              mes.balance.total >= 0
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {formatPrice(mes.balance.total)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-2xl">{saludMes.emoji}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
