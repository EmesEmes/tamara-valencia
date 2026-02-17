"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getVenta, cancelarVenta, pagarComision } from "@/lib/api/caja/ventas";

export default function DetalleVentaPage({ params }) {
  const router = useRouter();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const ventaId = params.id;

  const cargarVenta = useCallback(async () => {
    try {
      const { data, error } = await getVenta(ventaId);

      if (error) throw error;

      if (!data) {
        throw new Error("Venta no encontrada");
      }

      setVenta(data);
    } catch (err) {
      console.error("Error al cargar venta:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ventaId]);

  useEffect(() => {
    cargarVenta();
  }, [cargarVenta]);

  const handleCancelarVenta = async () => {
    if (
      !confirm(
        "¿Estás seguro de cancelar esta venta? Se devolverá el stock de los productos.",
      )
    ) {
      return;
    }

    setProcesando(true);

    try {
      const { error } = await cancelarVenta(ventaId);

      if (error) throw error;

      alert("Venta cancelada correctamente");
      await cargarVenta(); // Recargar
    } catch (err) {
      console.error("Error al cancelar venta:", err);
      alert("Error al cancelar venta: " + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const handlePagarComision = async () => {
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
      await cargarVenta(); // Recargar
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getTipoLabel = (tipo) => {
    const tipos = {
      contado: "Contado",
      credito: "Crédito",
      online: "Online",
    };
    return tipos[tipo] || tipo;
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      completada: "bg-green-100 text-green-800",
      credito_activo: "bg-yellow-100 text-yellow-800",
      credito_pagado: "bg-blue-100 text-blue-800",
      cancelada: "bg-red-100 text-red-800",
    };

    const labels = {
      completada: "Completada",
      credito_activo: "Crédito Activo",
      credito_pagado: "Crédito Pagado",
      cancelada: "Cancelada",
    };

    return (
      <span
        className={`px-3 py-1 text-sm font-semibold rounded-full ${badges[estado]}`}
      >
        {labels[estado] || estado}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando venta...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="font-medium">Error al cargar venta</p>
            <p className="text-sm mt-1">{error}</p>
            <Link
              href="/admin/caja/ventas"
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Detalle de Venta
              </h1>
              <p className="text-gray-600">{formatDate(venta.fecha)}</p>
            </div>
            <Link
              href="/admin/caja/ventas"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Volver
            </Link>
          </div>
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
              href="/admin/caja/ventas"
              className="text-gray-600 hover:text-gray-900"
            >
              Ventas
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">Detalle</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Productos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Productos Vendidos */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Productos Vendidos ({venta.detalle?.length || 0})
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {venta.detalle?.map((item, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start gap-4">
                      {item.producto?.imagen_url && (
                        <img
                          src={item.producto.imagen_url}
                          alt={item.producto.nombre_comercial}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.producto?.nombre_comercial}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Código: {item.producto?.codigo}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              Precio unitario
                            </p>
                            <p className="font-medium text-gray-900">
                              {formatPrice(item.precio_unitario)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-between items-center">
                          <p className="text-sm text-gray-600">
                            Cantidad:{" "}
                            <span className="font-medium">{item.cantidad}</span>
                          </p>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Subtotal</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatPrice(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-900">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(venta.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notas */}
            {venta.notas && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Notas
                </h3>
                <p className="text-gray-700">{venta.notas}</p>
              </div>
            )}
          </div>

          {/* Columna Derecha - Información */}
          <div className="space-y-6">
            {/* Info General */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información General
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <div className="mt-1">{getEstadoBadge(venta.estado)}</div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-medium text-gray-900">
                    {getTipoLabel(venta.tipo)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Método de Pago</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {venta.metodo_pago}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(venta.fecha)}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Distribuidora */}
            {venta.vendedor && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Distribuidora
                </h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="font-medium text-gray-900">
                      {venta.vendedor.nombre}
                    </p>
                  </div>

                  {venta.vendedor.telefono && (
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium text-gray-900">
                        {venta.vendedor.telefono}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500">Comisión (10%)</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatPrice(venta.comision_monto)}
                    </p>
                    <div className="mt-2">
                      {venta.comision_pagada ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Pagada
                        </span>
                      ) : (
                        <>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pendiente
                          </span>
                          <button
                            onClick={handlePagarComision}
                            disabled={procesando}
                            className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
                          >
                            {procesando ? "Procesando..." : "Pagar Comisión"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones */}
            {venta.estado !== "cancelada" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Acciones
                </h3>
                <button
                  onClick={handleCancelarVenta}
                  disabled={procesando}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {procesando ? "Procesando..." : "Cancelar Venta"}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ Se devolverá el stock de los productos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
