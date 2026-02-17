"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useInventarioStats } from "@/lib/hooks/useInventarioStats";
import Link from "next/link";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalConjuntos: 0,
    productosActivos: 0,
  });

  const [cajaStats, setCajaStats] = useState({
    ventasHoy: 0,
    totalHoy: 0,
    comisionesPendientes: 0,
    creditosActivos: 0,
  });

  const [loading, setLoading] = useState(true);
  const [cajaLoading, setCajaLoading] = useState(true);

  // Obtener estadísticas de inventario con React Query
  const { data: inventarioData, isLoading: inventarioLoading } =
    useInventarioStats();

  useEffect(() => {
    fetchStats();
    fetchCajaStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Contar productos
      const { count: totalProductos } = await supabase
        .from("productos")
        .select("*", { count: "exact", head: true });

      const { count: productosActivos } = await supabase
        .from("productos")
        .select("*", { count: "exact", head: true })
        .eq("activo", true);

      // Contar conjuntos
      const { count: totalConjuntos } = await supabase
        .from("conjuntos")
        .select("*", { count: "exact", head: true });

      setStats({
        totalProductos: totalProductos || 0,
        totalConjuntos: totalConjuntos || 0,
        productosActivos: productosActivos || 0,
      });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCajaStats = async () => {
    try {
      // Obtener fecha de hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Ventas de hoy
      const { data: ventasHoy, error: errorVentas } = await supabase
        .from("ventas")
        .select("total, comision_monto, comision_pagada")
        .gte("fecha", hoy.toISOString());

      if (errorVentas) throw errorVentas;

      const totalHoy =
        ventasHoy?.reduce((sum, v) => sum + parseFloat(v.total), 0) || 0;
      const comisionesPendientes =
        ventasHoy
          ?.filter((v) => v.comision_monto > 0 && !v.comision_pagada)
          .reduce((sum, v) => sum + parseFloat(v.comision_monto), 0) || 0;

      // Créditos activos
      const { count: creditosActivos } = await supabase
        .from("creditos")
        .select("*", { count: "exact", head: true })
        .in("estado", ["activo", "mora"]);

      setCajaStats({
        ventasHoy: ventasHoy?.length || 0,
        totalHoy,
        comisionesPendientes,
        creditosActivos: creditosActivos || 0,
      });
    } catch (error) {
      console.error("Error al obtener estadísticas de caja:", error);
    } finally {
      setCajaLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
          <p className="text-4xl font-light text-gray-900">
            {stats.totalProductos}
          </p>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-sm uppercase tracking-wider mb-2">
            Productos Activos
          </p>
          <p className="text-4xl font-light text-gray-900">
            {stats.productosActivos}
          </p>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-sm uppercase tracking-wider mb-2">
            Total Conjuntos
          </p>
          <p className="text-4xl font-light text-gray-900">
            {stats.totalConjuntos}
          </p>
        </div>
      </div>

      {/* Estadísticas de Caja */}
      <h2 className="text-2xl font-light text-gray-900 mb-4">Módulo de Caja</h2>
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 border border-blue-200 shadow-sm">
          <p className="text-blue-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Ventas Hoy
          </p>
          {cajaLoading ? (
            <p className="text-2xl font-light text-blue-900">...</p>
          ) : (
            <>
              <p className="text-4xl font-light text-blue-900">
                {cajaStats.ventasHoy}
              </p>
              <p className="text-sm text-blue-700 mt-2">
                {formatCurrency(cajaStats.totalHoy)}
              </p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 border border-orange-200 shadow-sm">
          <p className="text-orange-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Comisiones Pendientes
          </p>
          {cajaLoading ? (
            <p className="text-2xl font-light text-orange-900">...</p>
          ) : (
            <p className="text-3xl font-light text-orange-900">
              {formatCurrency(cajaStats.comisionesPendientes)}
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 border border-purple-200 shadow-sm">
          <p className="text-purple-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Créditos Activos
          </p>
          {cajaLoading ? (
            <p className="text-2xl font-light text-purple-900">...</p>
          ) : (
            <p className="text-4xl font-light text-purple-900">
              {cajaStats.creditosActivos}
            </p>
          )}
        </div>

        <Link
          href="/admin/caja"
          className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 border border-gray-700 shadow-sm hover:from-gray-700 hover:to-gray-800 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm uppercase tracking-wider mb-2 font-medium">
                Ir a Caja
              </p>
              <p className="text-white text-lg font-light">
                Ver módulo completo →
              </p>
            </div>
            <svg
              className="w-8 h-8 text-white opacity-75 group-hover:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </Link>
        <Link
          href="/admin/caja/egresos"
          className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-gray-900">Egresos</p>
              <p className="text-sm text-gray-500">Gastos recurrentes</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/caja/pagos"
          className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="font-semibold text-gray-900">Calendario de Pagos</p>
              <p className="text-sm text-gray-500">Próximos vencimientos</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/caja/balance"
          className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <p className="font-semibold text-gray-900">Balance Financiero</p>
              <p className="text-sm text-gray-500">Ingresos vs Egresos</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Estadísticas de Inventario */}
      <h2 className="text-2xl font-light text-gray-900 mb-4">
        Valor de Inventario
      </h2>
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
                  Margen:{" "}
                  {formatCurrency(
                    inventarioData.valorFinal - inventarioData.valorCalculado,
                  )}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white p-6 border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-light text-gray-900 mb-6">
          Acciones Rápidas
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
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

          <Link
            href="/admin/caja/ventas/nueva"
            className="p-6 border-2 border-blue-300 hover:border-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors text-center"
          >
            <svg
              className="w-12 h-12 mx-auto mb-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <p className="text-lg text-blue-900 font-medium">Nueva Venta</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
