"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getEgreso,
  registrarPagoEgreso,
  toggleEgreso,
} from "@/lib/api/caja/egresos";
import {
  CATEGORIAS_EGRESO,
  FRECUENCIAS_EGRESO,
  TIPOS_RECURRENCIA,
} from "@/lib/constants/caja";

export default function DetalleEgresoPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const egresoId = resolvedParams.id;

  const [egreso, setEgreso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // Estados para el modal de pago
  const [mostrarModal, setMostrarModal] = useState(false);
  const [montoPago, setMontoPago] = useState("");
  const [notasPago, setNotasPago] = useState("");
  const [numeroPagoActual, setNumeroPagoActual] = useState(1);
  const [fechaProgramadaActual, setFechaProgramadaActual] = useState("");
  const [montoProgramadoActual, setMontoProgramadoActual] = useState(0);

  const cargarEgreso = useCallback(async () => {
    try {
      const { data, error } = await getEgreso(egresoId);

      if (error) throw error;

      if (!data) {
        throw new Error("Egreso no encontrado");
      }

      setEgreso(data);
    } catch (err) {
      console.error("Error al cargar egreso:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [egresoId]);

  useEffect(() => {
    cargarEgreso();
  }, [cargarEgreso]);

  const handleAbrirModalPago = () => {
    const pagosPagados =
      egreso.pagos?.filter((p) => p.estado === "pagado").length || 0;
    const numeroPago = pagosPagados + 1;

    // Calcular fecha programada
    let fechaProgramada = new Date(egreso.fecha_inicio);

    for (let i = 0; i < pagosPagados; i++) {
      switch (egreso.frecuencia) {
        case "mensual":
          fechaProgramada.setMonth(fechaProgramada.getMonth() + 1);
          break;
        case "quincenal":
          fechaProgramada.setDate(fechaProgramada.getDate() + 15);
          break;
        case "semanal":
          fechaProgramada.setDate(fechaProgramada.getDate() + 7);
          break;
      }
    }

    const montoProgramado =
      egreso.tipo_recurrencia === "fijo" ? egreso.monto_fijo : 0;

    setNumeroPagoActual(numeroPago);
    setFechaProgramadaActual(fechaProgramada.toISOString());
    setMontoProgramadoActual(montoProgramado);
    setMontoPago(montoProgramado.toFixed(2));
    setNotasPago("");
    setMostrarModal(true);
  };

  const handleRegistrarPago = async (e) => {
    e.preventDefault();

    const montoReal = parseFloat(montoPago);

    if (isNaN(montoReal) || montoReal <= 0) {
      alert("Monto inválido");
      return;
    }

    setProcesando(true);

    try {
      const pagoData = {
        egreso_recurrente_id: egresoId,
        numero_pago: numeroPagoActual,
        fecha_programada: fechaProgramadaActual,
        monto_programado: montoProgramadoActual,
        monto_real: montoReal,
        metodo_pago: "transferencia",
        concepto: egreso.concepto,
        notas: notasPago || null,
      };

      const { error } = await registrarPagoEgreso(pagoData);

      if (error) throw error;

      setMostrarModal(false);
      await cargarEgreso();

      // Mostrar mensaje de éxito
      const mensaje = document.createElement("div");
      mensaje.className =
        "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50";
      mensaje.textContent = "✓ Pago registrado correctamente";
      document.body.appendChild(mensaje);
      setTimeout(() => mensaje.remove(), 3000);
    } catch (err) {
      console.error("Error al registrar pago:", err);
      alert("Error al registrar pago: " + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleToggleEstado = async () => {
    const nuevoEstado = !egreso.activo;
    const mensaje = nuevoEstado
      ? "¿Reactivar este egreso?"
      : "¿Desactivar este egreso?";

    if (!confirm(mensaje)) return;

    setProcesando(true);

    try {
      const { error } = await toggleEgreso(egresoId, nuevoEstado);

      if (error) throw error;

      await cargarEgreso();
      alert(
        nuevoEstado
          ? "Egreso reactivado correctamente"
          : "Egreso desactivado correctamente",
      );
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      alert("Error al cambiar estado: " + err.message);
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

  const getLabelCategoria = (categoria) => {
    const cat = CATEGORIAS_EGRESO.find((c) => c.value === categoria);
    return cat?.label || categoria;
  };

  const getLabelFrecuencia = (frecuencia) => {
    const frec = FRECUENCIAS_EGRESO.find((f) => f.value === frecuencia);
    return frec?.label || frecuencia;
  };

  const getLabelTipoRecurrencia = (tipo) => {
    const t = TIPOS_RECURRENCIA.find((tr) => tr.value === tipo);
    return t?.label || tipo;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando egreso...</p>
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
            <p className="font-medium">Error al cargar egreso</p>
            <p className="text-sm mt-1">{error}</p>
            <Link
              href="/admin/caja/egresos"
              className="text-sm underline mt-2 inline-block"
            >
              Volver a la lista
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pagosPagados =
    egreso.pagos?.filter((p) => p.estado === "pagado").length || 0;
  const totalPagado =
    egreso.pagos
      ?.filter((p) => p.estado === "pagado")
      .reduce((sum, p) => sum + parseFloat(p.monto_real), 0) || 0;

  const yaTermino =
    (egreso.cantidad_pagos && pagosPagados >= egreso.cantidad_pagos) ||
    (egreso.fecha_fin && new Date() > new Date(egreso.fecha_fin));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Detalle de Egreso
              </h1>
              <p className="text-gray-600">{egreso.concepto}</p>
            </div>
            <Link
              href="/admin/caja/egresos"
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
              href="/admin/caja/egresos"
              className="text-gray-600 hover:text-gray-900"
            >
              Egresos
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">Detalle</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Pagos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resumen */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Historial de Pagos
                </h3>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    egreso.activo
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {egreso.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Pagos Realizados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pagosPagados}
                    {egreso.cantidad_pagos && ` / ${egreso.cantidad_pagos}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Pagado</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatPrice(totalPagado)}
                  </p>
                </div>
              </div>

              {/* Botón Registrar Pago */}
              {egreso.activo && !yaTermino && (
                <button
                  onClick={handleAbrirModalPago}
                  disabled={procesando}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  + Registrar Nuevo Pago
                </button>
              )}

              {yaTermino && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-center">
                  ✓ Egreso completado
                </div>
              )}
            </div>

            {/* Lista de Pagos */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Historial de Pagos ({pagosPagados})
                </h3>
              </div>

              {pagosPagados === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No hay pagos registrados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Programada
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Pago
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {egreso.pagos
                        ?.filter((p) => p.estado === "pagado")
                        .sort((a, b) => b.numero_pago - a.numero_pago)
                        .map((pago) => (
                          <tr key={pago.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{pago.numero_pago}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(pago.fecha_programada)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(pago.fecha_pago_real)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                {formatPrice(pago.monto_real)}
                              </div>
                              {pago.monto_programado &&
                                pago.monto_real !== pago.monto_programado && (
                                  <div className="text-xs text-gray-500">
                                    Prog: {formatPrice(pago.monto_programado)}
                                  </div>
                                )}
                              {pago.notas && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {pago.notas}
                                </div>
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

          {/* Columna Derecha - Info del Egreso */}
          <div className="space-y-6">
            {/* Información General */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información General
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Categoría</p>
                  <p className="font-medium text-gray-900">
                    {getLabelCategoria(egreso.categoria)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Tipo de Monto</p>
                  <p className="font-medium text-gray-900">
                    {getLabelTipoRecurrencia(egreso.tipo_recurrencia)}
                  </p>
                </div>

                {egreso.tipo_recurrencia === "fijo" && (
                  <div>
                    <p className="text-sm text-gray-500">Monto Fijo</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatPrice(egreso.monto_fijo)}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Frecuencia</p>
                  <p className="font-medium text-gray-900">
                    {getLabelFrecuencia(egreso.frecuencia)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Día de Pago</p>
                  <p className="font-medium text-gray-900">
                    Día {egreso.dia_pago}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Fecha de Inicio</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(egreso.fecha_inicio)}
                  </p>
                </div>

                {egreso.fecha_fin && (
                  <div>
                    <p className="text-sm text-gray-500">Fecha Fin</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(egreso.fecha_fin)}
                    </p>
                  </div>
                )}

                {egreso.cantidad_pagos && (
                  <div>
                    <p className="text-sm text-gray-500">Cantidad de Pagos</p>
                    <p className="font-medium text-gray-900">
                      {egreso.cantidad_pagos} pagos
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            {egreso.notas && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Notas
                </h3>
                <p className="text-gray-700">{egreso.notas}</p>
              </div>
            )}

            {/* Acciones */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Acciones
              </h3>
              <button
                onClick={handleToggleEstado}
                disabled={procesando}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  egreso.activo
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                {procesando
                  ? "Procesando..."
                  : egreso.activo
                    ? "Desactivar Egreso"
                    : "Reactivar Egreso"}
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Registro de Pago */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <form onSubmit={handleRegistrarPago}>
                {/* Header del Modal */}
                <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
                  <h3 className="text-lg font-semibold">
                    Registrar Pago #{numeroPagoActual}
                  </h3>
                  <p className="text-sm text-blue-100 mt-1">
                    {egreso.concepto}
                  </p>
                </div>

                {/* Contenido del Modal */}
                <div className="p-6 space-y-4">
                  {/* Info del Pago */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fecha programada:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(fechaProgramadaActual)}
                      </span>
                    </div>
                    {montoProgramadoActual > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Monto programado:</span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(montoProgramadoActual)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Método de pago:</span>
                      <span className="font-medium text-blue-600">
                        Transferencia
                      </span>
                    </div>
                  </div>

                  {/* Monto */}
                  <div>
                    <label
                      htmlFor="monto"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Monto del Pago *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        id="monto"
                        value={montoPago}
                        onChange={(e) => setMontoPago(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label
                      htmlFor="notas"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Notas (opcional)
                    </label>
                    <textarea
                      id="notas"
                      value={notasPago}
                      onChange={(e) => setNotasPago(e.target.value)}
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Información adicional..."
                    />
                  </div>
                </div>

                {/* Footer del Modal */}
                <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMostrarModal(false)}
                    disabled={procesando}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={procesando}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    {procesando ? "Registrando..." : "Confirmar Pago"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
