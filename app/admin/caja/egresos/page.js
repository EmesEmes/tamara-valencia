"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getPagosPeriodo,
  registrarPagoEgreso,
  getTotalEgresosMes,
} from "@/lib/api/caja/egresos";
import { CATEGORIAS_EGRESO } from "@/lib/constants/caja";

export default function EgresosPage() {
  const [pagosMes, setPagosMes] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(
    new Date().getMonth() + 1,
  );
  const [anioSeleccionado, setAnioSeleccionado] = useState(
    new Date().getFullYear(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [vistaPeriodo, setVistaPeriodo] = useState("mes"); // mes, trimestre, semestre, año

  // Modal de pago
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [montoPago, setMontoPago] = useState("");
  const [procesando, setProcesando] = useState(false);

  // Comparación mes anterior
  const [totalMesAnterior, setTotalMesAnterior] = useState(0);

  const cargarPagosMes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getPagosPeriodo(
        mesSeleccionado,
        anioSeleccionado,
      );

      if (error) throw error;

      setPagosMes(data || []);
    } catch (err) {
      console.error("Error al cargar pagos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mesSeleccionado, anioSeleccionado]);

  const cargarComparacion = useCallback(async () => {
    try {
      let mesAnterior = mesSeleccionado - 1;
      let anioAnterior = anioSeleccionado;

      if (mesAnterior === 0) {
        mesAnterior = 12;
        anioAnterior -= 1;
      }

      const { data: total } = await getTotalEgresosMes(
        mesAnterior,
        anioAnterior,
      );
      setTotalMesAnterior(total || 0);
    } catch (err) {
      console.error("Error al cargar comparación:", err);
    }
  }, [mesSeleccionado, anioSeleccionado]);

  useEffect(() => {
    cargarPagosMes();
    cargarComparacion();
  }, [cargarPagosMes, cargarComparacion]);

  const handleAbrirModalPago = (pago) => {
    setPagoSeleccionado(pago);
    setMontoPago(pago.monto_programado.toFixed(2));
    setMostrarModalPago(true);
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
        egreso_recurrente_id: pagoSeleccionado.egreso_id,
        numero_pago: pagoSeleccionado.numero_pago,
        fecha_programada: pagoSeleccionado.fecha_programada,
        monto_programado: pagoSeleccionado.monto_programado,
        monto_real: montoReal,
        metodo_pago: "transferencia",
        concepto: pagoSeleccionado.concepto,
      };

      const { error } = await registrarPagoEgreso(pagoData);
      if (error) throw error;

      setMostrarModalPago(false);
      await cargarPagosMes();

      // Notificación de éxito
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
    }).format(date);
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

  const getColorEstado = (estado) => {
    const colores = {
      pagado: "bg-green-100 text-green-800 border-green-300",
      pendiente: "bg-gray-100 text-gray-800 border-gray-300",
      proximo: "bg-yellow-100 text-yellow-800 border-yellow-300",
      vence_hoy: "bg-orange-100 text-orange-800 border-orange-300",
      atrasado: "bg-red-100 text-red-800 border-red-300",
    };
    return colores[estado] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getIconoEstado = (estado) => {
    const iconos = {
      pagado: "✅",
      pendiente: "⏳",
      proximo: "⚠️",
      vence_hoy: "🔔",
      atrasado: "🔴",
    };
    return iconos[estado] || "⏳";
  };

  const getLabelEstado = (estado) => {
    const labels = {
      pagado: "Pagado",
      pendiente: "Pendiente",
      proximo: "Próximo (3 días)",
      vence_hoy: "Vence Hoy",
      atrasado: "Atrasado",
    };
    return labels[estado] || estado;
  };

  // Aplicar filtros
  const pagosFiltrados = pagosMes.filter((pago) => {
    if (categoriaFiltro && pago.categoria !== categoriaFiltro) return false;
    if (estadoFiltro && pago.estado !== estadoFiltro) return false;
    if (
      busqueda &&
      !pago.concepto.toLowerCase().includes(busqueda.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Separar pagos por tipo
  const pagosFijos = pagosFiltrados.filter(
    (p) => p.tipo_recurrencia === "fijo",
  );
  const pagosVariables = pagosFiltrados.filter(
    (p) => p.tipo_recurrencia === "variable",
  );

  // Calcular totales por tipo
  const totalFijos = pagosFijos.reduce(
    (sum, p) => sum + parseFloat(p.monto_programado || 0),
    0,
  );
  const totalFijosPagado = pagosFijos
    .filter((p) => p.estado === "pagado")
    .reduce((sum, p) => sum + parseFloat(p.monto_real || 0), 0);
  const totalFijosPendiente = pagosFijos
    .filter((p) => p.estado !== "pagado")
    .reduce((sum, p) => sum + parseFloat(p.monto_programado || 0), 0);

  const totalVariables = pagosVariables
    .filter((p) => p.estado === "pagado")
    .reduce((sum, p) => sum + parseFloat(p.monto_real || 0), 0);
  const totalVariablesPendiente = pagosVariables.filter(
    (p) => p.estado !== "pagado",
  ).length;

  // Calcular totales generales
  const totalPagado = totalFijosPagado + totalVariables;
  const totalPendiente = totalFijosPendiente;
  const totalMes = totalPagado + totalPendiente;
  const porcentajePagado = totalMes > 0 ? (totalPagado / totalMes) * 100 : 0;

  // Pagos venciendo pronto
  const pagosVenciendoProximos = pagosMes.filter(
    (p) =>
      (p.estado === "proximo" || p.estado === "vence_hoy") &&
      p.estado !== "pagado",
  );

  const pagosAtrasados = pagosMes.filter((p) => p.estado === "atrasado");

  // Comparación con mes anterior
  const diferenciaMesAnterior = totalMes - totalMesAnterior;
  const porcentajeDiferencia =
    totalMesAnterior > 0
      ? ((diferenciaMesAnterior / totalMesAnterior) * 100).toFixed(1)
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando egresos...</p>
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
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                💰 Egresos y Pagos
              </h1>
              <p className="text-gray-600">Control mensual de gastos</p>
            </div>
            <Link
              href="/admin/caja/egresos/nuevo"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Nuevo Egreso
            </Link>
          </div>
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
            <span className="font-medium text-gray-900">Egresos</span>
          </div>
        </div>

        {/* Alertas */}
        {(pagosAtrasados.length > 0 || pagosVenciendoProximos.length > 0) && (
          <div className="mb-6 space-y-3">
            {pagosAtrasados.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🔴</span>
                  <div>
                    <p className="font-semibold text-red-900">
                      {pagosAtrasados.length} pago
                      {pagosAtrasados.length !== 1 ? "s" : ""} atrasado
                      {pagosAtrasados.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-red-700">
                      {pagosAtrasados.map((p) => p.concepto).join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {pagosVenciendoProximos.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">⚠️</span>
                  <div>
                    <p className="font-semibold text-yellow-900">
                      {pagosVenciendoProximos.length} pago
                      {pagosVenciendoProximos.length !== 1 ? "s" : ""} venciendo
                      pronto
                    </p>
                    <p className="text-sm text-yellow-700">
                      {pagosVenciendoProximos.map((p) => p.concepto).join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resumen del Mes */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm uppercase tracking-wider mb-2 font-medium">
              Total del Mes
            </p>
            <p className="text-3xl font-bold text-blue-900">
              {formatPrice(totalMes)}
            </p>
            {totalMesAnterior > 0 && (
              <p className="text-xs text-blue-700 mt-2">
                {diferenciaMesAnterior >= 0 ? "📈" : "📉"}{" "}
                {porcentajeDiferencia}% vs mes anterior
              </p>
            )}
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm uppercase tracking-wider mb-2 font-medium">
              Pagado
            </p>
            <p className="text-3xl font-bold text-green-900">
              {formatPrice(totalPagado)}
            </p>
            <p className="text-xs text-green-700 mt-2">
              {porcentajePagado.toFixed(0)}% del total
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 border border-orange-200 rounded-lg">
            <p className="text-orange-800 text-sm uppercase tracking-wider mb-2 font-medium">
              Pendiente
            </p>
            <p className="text-3xl font-bold text-orange-900">
              {formatPrice(totalPendiente)}
            </p>
            <p className="text-xs text-orange-700 mt-2">
              {(100 - porcentajePagado).toFixed(0)}% del total
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 border border-purple-200 rounded-lg">
            <p className="text-purple-800 text-sm uppercase tracking-wider mb-2 font-medium">
              Total Pagos
            </p>
            <p className="text-3xl font-bold text-purple-900">
              {pagosFiltrados.length}
            </p>
            <p className="text-xs text-purple-700 mt-2">
              {pagosFiltrados.filter((p) => p.estado === "pagado").length}{" "}
              realizados
            </p>
          </div>
        </div>

        {/* Controles y Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Navegación de Mes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => cambiarMes(-1)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ◀
                </button>
                <div className="flex-1 text-center">
                  <p className="text-xl font-bold text-gray-900">
                    {getNombreMes(mesSeleccionado)} {anioSeleccionado}
                  </p>
                </div>
                <button
                  onClick={() => cambiarMes(1)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por concepto..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                {CATEGORIAS_EGRESO.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
                <option value="proximo">Próximo (3 días)</option>
                <option value="vence_hoy">Vence Hoy</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Gastos Fijos */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">💰 Gastos Fijos del Mes</h2>
              <p className="text-sm text-blue-100 mt-1">
                Monto programado cada período
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatPrice(totalFijos)}</p>
              <p className="text-xs text-blue-100">
                {pagosFijos.filter((p) => p.estado === "pagado").length} /{" "}
                {pagosFijos.length} pagados
              </p>
            </div>
          </div>

          {pagosFijos.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">
                No hay gastos fijos para este período
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
                      Concepto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
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
                  {pagosFijos.map((pago, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(pago.fecha_programada)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {pago.concepto}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getLabelCategoria(pago.categoria)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatPrice(pago.monto_real || pago.monto_programado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full border ${getColorEstado(
                            pago.estado,
                          )}`}
                        >
                          {getIconoEstado(pago.estado)}{" "}
                          {getLabelEstado(pago.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {pago.estado === "pagado" ? (
                          <Link
                            href={`/admin/caja/egresos/${pago.egreso_id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver →
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleAbrirModalPago(pago)}
                            disabled={procesando}
                            className="text-green-600 hover:text-green-900 font-medium disabled:text-gray-400"
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

        {/* Tabla de Gastos Variables */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                📊 Gastos Variables del Mes
              </h2>
              <p className="text-sm text-purple-100 mt-1">
                Monto varía cada período
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {formatPrice(totalVariables)}
              </p>
              <p className="text-xs text-purple-100">
                {pagosVariables.filter((p) => p.estado === "pagado").length}{" "}
                pagados, {totalVariablesPendiente} pendientes
              </p>
            </div>
          </div>

          {pagosVariables.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">
                No hay gastos variables para este período
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
                      Concepto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto Pagado
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
                  {pagosVariables.map((pago, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(pago.fecha_programada)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {pago.concepto}
                        </div>
                        <span className="text-xs text-purple-600 font-medium">
                          Variable
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getLabelCategoria(pago.categoria)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {pago.estado === "pagado" ? (
                          <span className="font-semibold text-gray-900">
                            {formatPrice(pago.monto_real)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">
                            A definir
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full border ${getColorEstado(
                            pago.estado,
                          )}`}
                        >
                          {getIconoEstado(pago.estado)}{" "}
                          {getLabelEstado(pago.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {pago.estado === "pagado" ? (
                          <Link
                            href={`/admin/caja/egresos/${pago.egreso_id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver →
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleAbrirModalPago(pago)}
                            disabled={procesando}
                            className="text-green-600 hover:text-green-900 font-medium disabled:text-gray-400"
                          >
                            Registrar
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

        {/* Modal de Pago */}
        {mostrarModalPago && pagoSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <form onSubmit={handleRegistrarPago}>
                {/* Header */}
                <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg">
                  <h3 className="text-lg font-semibold">Registrar Pago</h3>
                  <p className="text-sm text-green-100 mt-1">
                    {pagoSeleccionado.concepto}
                  </p>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fecha programada:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(pagoSeleccionado.fecha_programada)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Categoría:</span>
                      <span className="font-medium text-gray-900">
                        {getLabelCategoria(pagoSeleccionado.categoria)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Método de pago:</span>
                      <span className="font-medium text-blue-600">
                        Transferencia
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto del Pago *
                      {pagoSeleccionado.tipo_recurrencia === "variable" && (
                        <span className="ml-2 text-xs text-purple-600 font-normal">
                          (Gasto variable - ingresa el monto real)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        value={montoPago}
                        onChange={(e) => setMontoPago(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        required
                        autoFocus
                      />
                    </div>
                    {pagoSeleccionado.tipo_recurrencia === "fijo" &&
                      pagoSeleccionado.monto_programado > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Monto programado:{" "}
                          {formatPrice(pagoSeleccionado.monto_programado)}
                        </p>
                      )}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMostrarModalPago(false)}
                    disabled={procesando}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={procesando}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    {procesando ? "Procesando..." : "✓ Confirmar Pago"}
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
