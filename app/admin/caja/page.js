"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getVentas } from "@/lib/api/caja/ventas";
import { getVendedores } from "@/lib/api/caja/vendedores";

export default function CajaDashboardPage() {
  const [stats, setStats] = useState({
    ventasHoy: 0,
    totalHoy: 0,
    ventasMes: 0,
    totalMes: 0,
    comisionesPendientes: 0,
  });
  const [ultimasVentas, setUltimasVentas] = useState([]);
  const [vendedoresActivos, setVendedoresActivos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar ventas recientes
      const { data: ventas } = await getVentas(1, 10);
      setUltimasVentas(ventas || []);

      // Calcular estadísticas
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const ventasHoy =
        ventas?.filter((v) => {
          const fechaVenta = new Date(v.fecha);
          return fechaVenta >= hoy;
        }) || [];

      const ventasMes =
        ventas?.filter((v) => {
          const fechaVenta = new Date(v.fecha);
          return fechaVenta >= inicioMes;
        }) || [];

      const comisionesPendientes =
        ventas
          ?.filter((v) => v.comision_monto > 0 && !v.comision_pagada)
          .reduce((sum, v) => sum + parseFloat(v.comision_monto), 0) || 0;

      setStats({
        ventasHoy: ventasHoy.length,
        totalHoy: ventasHoy.reduce((sum, v) => sum + parseFloat(v.total), 0),
        ventasMes: ventasMes.length,
        totalMes: ventasMes.reduce((sum, v) => sum + parseFloat(v.total), 0),
        comisionesPendientes,
      });

      // Cargar distribuidoras activas
      const { data: vendedores } = await getVendedores(true);
      setVendedoresActivos(vendedores || []);
    } catch (err) {
      console.error("Error al cargar datos:", err);
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
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Hace unos minutos";
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;
    if (days < 7) return `Hace ${days} día${days > 1 ? "s" : ""}`;

    return new Intl.DateTimeFormat("es-EC", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando dashboard...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Módulo de Caja
          </h1>
          <p className="text-gray-600">
            Panel de control de ventas y comisiones
          </p>
        </div>

        {/* Accesos Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/admin/caja/ventas/nueva"
            className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <div>
                <p className="font-semibold">Nueva Venta</p>
                <p className="text-sm text-blue-100">Registrar venta</p>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/caja/creditos"
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Créditos</p>
                <p className="text-sm text-gray-500">Ver créditos</p>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/caja/ventas"
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Ventas</p>
                <p className="text-sm text-gray-500">Ver historial</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/caja/comisiones"
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
                <p className="font-semibold text-gray-900">Comisiones</p>
                <p className="text-sm text-gray-500">Gestionar pagos</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/caja/vendedores"
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Distribuidoras</p>
                <p className="text-sm text-gray-500">Gestionar</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Ventas Hoy</p>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.ventasHoy}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {formatPrice(stats.totalHoy)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Ventas del Mes</p>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.ventasMes}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {formatPrice(stats.totalMes)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Comisiones Pendientes</p>
              <span className="text-2xl">💵</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {formatPrice(stats.comisionesPendientes)}
            </p>
            <Link
              href="/admin/caja/comisiones"
              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
            >
              Ver detalles →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Distribuidoras Activas</p>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {vendedoresActivos.length}
            </p>
            <Link
              href="/admin/caja/vendedores"
              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
            >
              Ver todas →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Últimas Ventas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Últimas Ventas
                </h3>
                <Link
                  href="/admin/caja/ventas"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver todas →
                </Link>
              </div>

              {ultimasVentas.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No hay ventas registradas</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {ultimasVentas.slice(0, 5).map((venta) => (
                    <Link
                      key={venta.id}
                      href={`/admin/caja/ventas/${venta.id}`}
                      className="block p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {formatPrice(venta.total)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {venta.vendedor?.nombre || "Sin distribuidora"} •{" "}
                            {formatDate(venta.fecha)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              venta.estado === "completada"
                                ? "bg-green-100 text-green-800"
                                : venta.estado === "cancelada"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {venta.estado === "completada"
                              ? "Completada"
                              : venta.estado}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Distribuidoras */}
          <div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Distribuidoras
                </h3>
              </div>

              {vendedoresActivos.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500 text-sm mb-4">
                    No hay distribuidoras registradas
                  </p>
                  <Link
                    href="/admin/caja/vendedores/nuevo"
                    className="inline-block text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Agregar primera distribuidora →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {vendedoresActivos.map((vendedor) => (
                    <Link
                      key={vendedor.id}
                      href={`/admin/caja/vendedores/${vendedor.id}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900">
                        {vendedor.nombre}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Comisión: 10%
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
