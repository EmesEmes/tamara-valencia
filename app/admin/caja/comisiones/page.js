"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getVendedores } from "@/lib/api/caja/vendedores";
import { getVentasPorVendedor, pagarComision } from "@/lib/api/caja/ventas";

export default function ComisionesPage() {
  const [vendedores, setVendedores] = useState([]);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [totales, setTotales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarVendedores();
  }, []);

  const cargarVendedores = async () => {
    try {
      const { data, error } = await getVendedores(true); // Solo activos
      if (error) throw error;
      setVendedores(data || []);
    } catch (err) {
      console.error("Error al cargar vendedores:", err);
    } finally {
      setLoading(false);
    }
  };

  const cargarVentasVendedor = async (vendedorId) => {
    setLoadingVentas(true);
    try {
      const { data, error, totales } = await getVentasPorVendedor(
        vendedorId,
        false,
      );
      if (error) throw error;

      setVentas(data || []);
      setTotales(totales);
      setVendedorSeleccionado(vendedorId);
    } catch (err) {
      console.error("Error al cargar ventas:", err);
    } finally {
      setLoadingVentas(false);
    }
  };

  const handlePagarComision = async (ventaId) => {
    const venta = ventas.find((v) => v.id === ventaId);

    if (
      !confirm(
        `¿Confirmar pago de comisión de ${formatPrice(venta.comision_monto)}?`,
      )
    ) {
      return;
    }

    setProcesando(true);

    try {
      const { error } = await pagarComision(ventaId);

      if (error) throw error;

      alert("Comisión pagada correctamente");

      // Recargar ventas del vendedor
      await cargarVentasVendedor(vendedorSeleccionado);
    } catch (err) {
      console.error("Error al pagar comisión:", err);
      alert("Error al pagar comisión: " + err.message);
    } finally {
      setProcesando(false);
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
      year: "numeric",
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
              <p className="text-gray-600">Cargando...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comisiones</h1>
          <p className="text-gray-600">
            Gestiona las comisiones de las distribuidoras
          </p>
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
            <span className="font-medium text-gray-900">Comisiones</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Lista de Distribuidoras */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Distribuidoras
              </h3>

              {vendedores.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No hay distribuidoras registradas
                </p>
              ) : (
                <div className="space-y-2">
                  {vendedores.map((vendedor) => (
                    <button
                      key={vendedor.id}
                      onClick={() => cargarVentasVendedor(vendedor.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        vendedorSeleccionado === vendedor.id
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                    >
                      <p className="font-medium text-gray-900">
                        {vendedor.nombre}
                      </p>
                      {vendedor.telefono && (
                        <p className="text-sm text-gray-500">
                          {vendedor.telefono}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Ventas y Comisiones */}
          <div className="lg:col-span-2">
            {!vendedorSeleccionado ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <p className="mt-4 text-gray-600">
                  Selecciona una distribuidora para ver sus ventas y comisiones
                </p>
              </div>
            ) : loadingVentas ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando ventas...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Resumen */}
                {totales && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <p className="text-sm text-gray-500">Total Vendido</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatPrice(totales.totalVentas)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {totales.cantidadVentas} venta(s)
                      </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <p className="text-sm text-gray-500">
                        Comisiones Totales
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatPrice(totales.totalComisiones)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <p className="text-sm text-gray-500">
                        Pendientes de Pago
                      </p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">
                        {formatPrice(totales.comisionesPendientes)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Lista de Ventas */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Ventas con Comisión
                    </h3>
                  </div>

                  {ventas.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-gray-500">
                        No hay ventas registradas para esta distribuidora
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Venta
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Comisión
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acción
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {ventas.map((venta) => (
                            <tr key={venta.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(venta.fecha)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatPrice(venta.total)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                                {formatPrice(venta.comision_monto)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {venta.comision_pagada ? (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Pagada
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Pendiente
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {!venta.comision_pagada && (
                                  <button
                                    onClick={() =>
                                      handlePagarComision(venta.id)
                                    }
                                    disabled={procesando}
                                    className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                                  >
                                    Pagar
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
