"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCreditos } from "@/lib/supabase/creditos";
import Link from "next/link";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function CreditosPage() {
  const [filtroEstado, setFiltroEstado] = useState("activo");
  const [busqueda, setBusqueda] = useState("");

  const { data: creditos = [], isLoading } = useQuery({
    queryKey: ["creditos", filtroEstado],
    queryFn: () => getCreditos({ estado: filtroEstado || undefined }),
    staleTime: 2 * 60 * 1000,
  });

  const creditosFiltrados = creditos.filter(
    (c) =>
      !busqueda ||
      c.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.cliente?.telefono?.includes(busqueda),
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const totalPendiente = creditosFiltrados.reduce(
    (sum, c) => sum + parseFloat(c.saldo_pendiente),
    0,
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-elegant text-4xl font-light text-gray-900">
          Créditos Directos
        </h1>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar cliente
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o teléfono..."
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <div className="flex gap-2">
              {[
                { value: "activo", label: "Activos" },
                { value: "pagado", label: "Pagados" },
                { value: "mora", label: "En mora" },
                { value: "", label: "Todos" },
              ].map((op) => (
                <button
                  key={op.value}
                  onClick={() => setFiltroEstado(op.value)}
                  className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
                    filtroEstado === op.value
                      ? "bg-gray-900 text-white"
                      : "border border-gray-300 text-gray-700 hover:border-gray-900"
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      {filtroEstado === "activo" && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">
              Créditos activos
            </p>
            <p className="text-3xl font-light text-gray-900">
              {creditosFiltrados.length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">
              Total pendiente
            </p>
            <p className="text-3xl font-light text-gray-900">
              {formatCurrency(totalPendiente)}
            </p>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Monto Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Saldo Pendiente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Cuota Mensual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Próximo Pago
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {creditosFiltrados.map((credito) => (
              <tr key={credito.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">
                    {credito.cliente?.nombre}
                  </p>
                  {credito.cliente?.telefono && (
                    <p className="text-xs text-gray-500">
                      {credito.cliente.telefono}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatCurrency(credito.monto_total)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {formatCurrency(credito.saldo_pendiente)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatCurrency(credito.cuota_mensual)}
                  <span className="text-xs text-gray-500 block">
                    Día {credito.dia_pago || 1} de cada mes
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatFecha(credito.fecha_proximo_pago)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs uppercase tracking-wider ${
                      credito.estado === "activo"
                        ? "bg-green-100 text-green-800"
                        : credito.estado === "pagado"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {credito.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <Link
                    href={`/admin/creditos/${credito.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {creditosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No hay créditos{" "}
              {filtroEstado ? `en estado "${filtroEstado}"` : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
