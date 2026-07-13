"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDistribuidoraById,
  getVentasDistribuidora,
  marcarComisionPagada,
  marcarTodasComisionesPagadas,
} from "@/lib/supabase/distribuidoras";
import { formatPrice } from "@/utils/formatters";
import Link from "next/link";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function DetalleDistribuidoraPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [procesando, setProcesando] = useState(false);

  const { data: distribuidora, isLoading: distLoading } = useQuery({
    queryKey: ["distribuidora", resolvedParams.id],
    queryFn: () => getDistribuidoraById(resolvedParams.id),
  });

  const { data: ventas = [], isLoading: ventasLoading } = useQuery({
    queryKey: ["ventas-distribuidora", resolvedParams.id],
    queryFn: () => getVentasDistribuidora(resolvedParams.id),
    staleTime: 1 * 60 * 1000,
  });

  const formatFecha = (fecha) =>
    new Date(fecha).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  // Cálculos de comisiones
  const comisionTotal = ventas.reduce(
    (sum, v) => sum + (parseFloat(v.comision_monto) || 0),
    0,
  );
  const comisionPagada = ventas
    .filter((v) => v.comision_pagada)
    .reduce((sum, v) => sum + (parseFloat(v.comision_monto) || 0), 0);
  const comisionPendiente = comisionTotal - comisionPagada;
  const hayPendientes = ventas.some(
    (v) => !v.comision_pagada && parseFloat(v.comision_monto) > 0,
  );

  const handleToggleComision = async (idVenta, estadoActual) => {
    setProcesando(true);
    try {
      await marcarComisionPagada(idVenta, !estadoActual);
      queryClient.invalidateQueries({
        queryKey: ["ventas-distribuidora", resolvedParams.id],
      });
    } catch (error) {
      console.error("Error al actualizar comisión:", error);
      alert("Error al actualizar la comisión: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const handlePagarTodas = async () => {
    if (
      !confirm(
        `¿Marcar todas las comisiones pendientes como pagadas? Total: ${formatPrice(comisionPendiente)}`,
      )
    )
      return;

    setProcesando(true);
    try {
      await marcarTodasComisionesPagadas(resolvedParams.id);
      queryClient.invalidateQueries({
        queryKey: ["ventas-distribuidora", resolvedParams.id],
      });
    } catch (error) {
      console.error("Error al pagar comisiones:", error);
      alert("Error al pagar las comisiones: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  if (distLoading) return <LoadingSpinner />;
  if (!distribuidora)
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p>Distribuidora no encontrada</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => router.push("/admin/distribuidoras")}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Volver a distribuidoras
        </button>
        <Link
          href={`/admin/distribuidoras/${resolvedParams.id}/editar`}
          className="text-blue-600 hover:text-blue-900 text-sm"
        >
          Editar datos
        </Link>
      </div>

      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-2">
        {distribuidora.nombre}
      </h1>
      <p className="text-gray-500 mb-8">
        {distribuidora.telefono && <span>{distribuidora.telefono} · </span>}
        Comisión: {distribuidora.porcentaje_comision}%
      </p>

      {/* Resumen de comisiones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">
            Comisión Total
          </p>
          <p className="text-3xl font-light text-gray-900">
            {formatPrice(comisionTotal)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-6">
          <p className="text-green-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Comisión Pagada
          </p>
          <p className="text-3xl font-light text-green-900">
            {formatPrice(comisionPagada)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-6">
          <p className="text-orange-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Comisión Pendiente
          </p>
          <p className="text-3xl font-light text-orange-900">
            {formatPrice(comisionPendiente)}
          </p>
        </div>
      </div>

      {/* Botón pagar todas */}
      {hayPendientes && (
        <div className="mb-6">
          <button
            onClick={handlePagarTodas}
            disabled={procesando}
            className="px-6 py-3 bg-gray-900 text-white text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {procesando ? "Procesando..." : "Marcar todas como pagadas"}
          </button>
        </div>
      )}

      {/* Ventas de la distribuidora */}
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
        Ventas Realizadas
      </h2>
      <div className="bg-white border border-gray-200 overflow-hidden">
        {ventasLoading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : ventas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Esta distribuidora no tiene ventas registradas
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Comisión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">
                    {formatFecha(venta.fecha)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {venta.cliente?.nombre || "Sin cliente"}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {formatPrice(venta.total)}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatPrice(venta.comision_monto || 0)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs uppercase tracking-wider ${
                        venta.comision_pagada
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {venta.comision_pagada ? "Pagada" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        handleToggleComision(venta.id, venta.comision_pagada)
                      }
                      disabled={procesando}
                      className={`text-sm ${
                        venta.comision_pagada
                          ? "text-gray-500 hover:text-gray-700"
                          : "text-blue-600 hover:text-blue-900"
                      } disabled:opacity-40`}
                    >
                      {venta.comision_pagada
                        ? "Marcar pendiente"
                        : "Marcar pagada"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ver detalle de venta */}
      <div className="mt-4">
        <Link
          href="/admin/ventas"
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          Ver todas las ventas →
        </Link>
      </div>
    </div>
  );
}
