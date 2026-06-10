"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getVentaById } from "@/lib/supabase/ventas";
import { formatPrice } from "@/utils/formatters";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const VIAS_LABEL = {
  showroom: "Showroom",
  redes: "Redes Sociales",
  contacto_directo: "Contacto Directo",
  referido: "Referido",
  distribuidora: "Distribuidora",
};

export default function DetalleVentaPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { data: venta, isLoading } = useQuery({
    queryKey: ["venta", resolvedParams.id],
    queryFn: () => getVentaById(resolvedParams.id),
  });

  const formatFecha = (fecha) =>
    new Date(fecha).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) return <LoadingSpinner />;
  if (!venta)
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p>Venta no encontrada</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Volver a ventas
        </button>
      </div>

      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-8">
        Detalle de Venta
      </h1>

      {/* Info general */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">
              Fecha
            </p>
            <p className="font-medium text-gray-900">
              {formatFecha(venta.fecha)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">
              Cliente
            </p>
            <p className="font-medium text-gray-900">
              {venta.cliente?.nombre || "Sin cliente"}
            </p>
            {venta.cliente?.telefono && (
              <p className="text-gray-600">{venta.cliente.telefono}</p>
            )}
          </div>
          <div>
            <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">
              Vía de venta
            </p>
            <p className="font-medium text-gray-900">{VIAS_LABEL[venta.via]}</p>
            {venta.distribuidora && (
              <p className="text-gray-600">{venta.distribuidora.nombre}</p>
            )}
          </div>
          <div>
            <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">
              Forma de pago
            </p>
            <span
              className={`px-2 py-1 text-xs uppercase tracking-wider ${
                venta.es_credito
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {venta.es_credito ? "Crédito" : "Contado"}
            </span>
          </div>
          {venta.comision_monto > 0 && (
            <div>
              <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">
                Comisión
              </p>
              <p className="font-medium text-gray-900">
                {formatPrice(venta.comision_monto)}
              </p>
              <span
                className={`text-xs ${venta.comision_pagada ? "text-green-600" : "text-red-600"}`}
              >
                {venta.comision_pagada ? "Pagada" : "Pendiente"}
              </span>
            </div>
          )}
          {venta.notas && (
            <div className="col-span-2 md:col-span-3">
              <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">
                Notas
              </p>
              <p className="text-gray-700">{venta.notas}</p>
            </div>
          )}
        </div>
      </div>

      {/* Productos */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 uppercase tracking-wider">
          Productos
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                Código
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                Producto
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                Precio
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                Cantidad
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {venta.detalle?.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-gray-600">
                  {item.producto?.codigo}
                </td>
                <td className="px-4 py-2 text-gray-900">
                  {item.producto?.nombre_comercial}
                </td>
                <td className="px-4 py-2 text-gray-900">
                  {formatPrice(item.precio_unitario)}
                </td>
                <td className="px-4 py-2 text-gray-900">{item.cantidad}</td>
                <td className="px-4 py-2 font-medium text-gray-900">
                  {formatPrice(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="max-w-xs ml-auto space-y-2 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>{formatPrice(venta.subtotal)}</span>
          </div>
          {venta.descuento > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>Descuento</span>
              <span>-{formatPrice(venta.descuento)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-medium text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>{formatPrice(venta.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
