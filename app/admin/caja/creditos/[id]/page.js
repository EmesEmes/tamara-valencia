"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCredito,
  registrarPagoCuota,
  actualizarMora,
  cancelarCredito,
} from "@/lib/api/caja/creditos";

export default function DetalleCreditoPage({ params }) {
  const router = useRouter();
  const [credito, setCredito] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const creditoId = params.id;

  const cargarCredito = useCallback(async () => {
    try {
      const { data, error } = await getCredito(creditoId);

      if (error) throw error;

      if (!data) {
        throw new Error("Crédito no encontrado");
      }

      setCredito(data);

      // Actualizar mora automáticamente
      if (data.estado === "activo") {
        await actualizarMora(creditoId);
      }
    } catch (err) {
      console.error("Error al cargar crédito:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [creditoId]);

  useEffect(() => {
    cargarCredito();
  }, [cargarCredito]);

  const handlePagarCuota = async (pagoId, montoCuota) => {
    const montoPagadoStr = prompt(
      `Monto a pagar (cuota completa: ${formatPrice(montoCuota)}):`,
      montoCuota.toFixed(2),
    );

    if (!montoPagadoStr) return;

    const montoPagado = parseFloat(montoPagadoStr);

    if (isNaN(montoPagado) || montoPagado <= 0) {
      alert("Monto inválido");
      return;
    }

    const metodoPago = prompt(
      "Método de pago:\n1 - Efectivo\n2 - Transferencia\n3 - Tarjeta",
      "1",
    );

    const metodos = {
      1: "efectivo",
      2: "transferencia",
      3: "tarjeta",
    };

    const metodoSeleccionado = metodos[metodoPago] || "efectivo";

    if (
      !confirm(
        `¿Confirmar pago de ${formatPrice(montoPagado)} vía ${metodoSeleccionado}?`,
      )
    ) {
      return;
    }

    setProcesando(true);

    try {
      const { error } = await registrarPagoCuota(
        pagoId,
        montoPagado,
        metodoSeleccionado,
      );

      if (error) throw error;

      alert("Pago registrado correctamente");
      await cargarCredito(); // Recargar
    } catch (err) {
      console.error("Error al registrar pago:", err);
      alert("Error al registrar pago: " + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelarCredito = async () => {
    if (
      !confirm(
        "¿Estás seguro de cancelar este crédito? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    setProcesando(true);

    try {
      const { error } = await cancelarCredito(creditoId);

      if (error) throw error;

      alert("Crédito cancelado correctamente");
      await cargarCredito();
    } catch (err) {
      console.error("Error al cancelar crédito:", err);
      alert("Error al cancelar crédito: " + err.message);
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
        className={`px-3 py-1 text-sm font-semibold rounded-full ${badges[estado]}`}
      >
        {labels[estado] || estado}
      </span>
    );
  };

  const getEstadoCuotaBadge = (estado) => {
    const badges = {
      pendiente: "bg-yellow-100 text-yellow-800",
      pagado: "bg-green-100 text-green-800",
      atrasado: "bg-red-100 text-red-800",
    };

    const labels = {
      pendiente: "Pendiente",
      pagado: "Pagado",
      atrasado: "Atrasado",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[estado]}`}
      >
        {labels[estado] || estado}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando crédito...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="font-medium">Error al cargar crédito</p>
            <p className="text-sm mt-1">{error}</p>
            <Link
              href="/admin/caja/creditos"
              className="text-sm underline mt-2 inline-block"
            >
              Volver a la lista
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cuotasPagadas =
    credito.pagos?.filter((p) => p.estado === "pagado").length || 0;
  const porcentajePagado = (cuotasPagadas / credito.plazo_meses) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Detalle de Crédito
              </h1>
              <p className="text-gray-600">{credito.cliente_nombre}</p>
            </div>
            <Link
              href="/admin/caja/creditos"
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
              href="/admin/caja/creditos"
              className="text-gray-600 hover:text-gray-900"
            >
              Créditos
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">Detalle</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Pagos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progreso */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Progreso del Crédito
                </h3>
                {getEstadoBadge(credito.estado)}
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>
                    {cuotasPagadas} de {credito.plazo_meses} cuotas pagadas
                  </span>
                  <span>{Math.round(porcentajePagado)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${porcentajePagado}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-sm text-gray-500">Monto Total</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPrice(credito.monto_total)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Saldo Pendiente</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatPrice(credito.saldo_pendiente)}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Cuotas */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Calendario de Pagos
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cuota
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Programada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Pago
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {credito.pagos
                      ?.sort((a, b) => a.numero_cuota - b.numero_cuota)
                      .map((pago) => (
                        <tr key={pago.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{pago.numero_cuota}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(pago.fecha_programada)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(pago.monto_cuota)}
                            {pago.monto_pagado &&
                              pago.monto_pagado !== pago.monto_cuota && (
                                <div className="text-xs text-blue-600">
                                  Pagado: {formatPrice(pago.monto_pagado)}
                                </div>
                              )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getEstadoCuotaBadge(pago.estado)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {pago.fecha_pago_real
                              ? formatDate(pago.fecha_pago_real)
                              : "-"}
                            {pago.metodo_pago && (
                              <div className="text-xs text-gray-500 capitalize">
                                {pago.metodo_pago}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {pago.estado !== "pagado" && (
                              <button
                                onClick={() =>
                                  handlePagarCuota(pago.id, pago.monto_cuota)
                                }
                                disabled={
                                  procesando || credito.estado === "cancelado"
                                }
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
            </div>
          </div>

          {/* Columna Derecha - Info del Crédito */}
          <div className="space-y-6">
            {/* Info Cliente */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información del Cliente
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium text-gray-900">
                    {credito.cliente_nombre}
                  </p>
                </div>

                {credito.cliente_telefono && (
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium text-gray-900">
                      {credito.cliente_telefono}
                    </p>
                  </div>
                )}

                {credito.cliente_cedula && (
                  <div>
                    <p className="text-sm text-gray-500">Cédula</p>
                    <p className="font-medium text-gray-900">
                      {credito.cliente_cedula}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles del Crédito */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Detalles del Crédito
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Cuota Inicial</p>
                  <p className="font-medium text-gray-900">
                    {formatPrice(credito.cuota_inicial)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Cuota Mensual</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatPrice(credito.cuota_mensual)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Plazo</p>
                  <p className="font-medium text-gray-900">
                    {credito.plazo_meses} meses
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Fecha Primer Pago</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(credito.fecha_primer_pago)}
                  </p>
                </div>

                {credito.dias_mora > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500">Días en Mora</p>
                    <p className="text-xl font-bold text-red-600">
                      {credito.dias_mora} días
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Venta Relacionada */}
            {credito.venta && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Venta Relacionada
                </h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Venta</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(credito.venta.fecha)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Total Venta</p>
                    <p className="font-medium text-gray-900">
                      {formatPrice(credito.venta.total)}
                    </p>
                  </div>

                  {credito.venta.vendedor && (
                    <div>
                      <p className="text-sm text-gray-500">Distribuidora</p>
                      <p className="font-medium text-gray-900">
                        {credito.venta.vendedor.nombre}
                      </p>
                    </div>
                  )}

                  <Link
                    href={`/admin/caja/ventas/${credito.venta.id}`}
                    className="inline-block text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Ver detalle de venta →
                  </Link>
                </div>
              </div>
            )}

            {/* Notas */}
            {credito.notas && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Notas
                </h3>
                <p className="text-gray-700">{credito.notas}</p>
              </div>
            )}

            {/* Acciones */}
            {credito.estado !== "cancelado" && credito.estado !== "pagado" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Acciones
                </h3>
                <button
                  onClick={handleCancelarCredito}
                  disabled={procesando}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {procesando ? "Procesando..." : "Cancelar Crédito"}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ Esta acción no se puede deshacer
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
