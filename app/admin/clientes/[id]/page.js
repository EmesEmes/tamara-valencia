"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getClienteById } from "@/lib/supabase/clientes";
import { getVentas } from "@/lib/supabase/ventas";
import { getCreditosCliente } from "@/lib/supabase/creditos";
import { formatPrice } from "@/utils/formatters";
import Link from "next/link";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const VIAS_LABEL = {
  showroom: "Showroom",
  redes: "Redes Sociales",
  referido: "Referido",
  distribuidora: "Distribuidora",
  tvcj: "TVCJ",
  cuenta_gerencia: "Cuenta Gerencia",
};

export default function DetalleClientePage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { data: cliente, isLoading: clienteLoading } = useQuery({
    queryKey: ["cliente", resolvedParams.id],
    queryFn: () => getClienteById(resolvedParams.id),
  });

  const { data: ventas = [], isLoading: ventasLoading } = useQuery({
    queryKey: ["ventas-cliente", resolvedParams.id],
    queryFn: () => getVentas({ id_cliente: resolvedParams.id }),
    staleTime: 1 * 60 * 1000,
  });

  const { data: creditos = [], isLoading: creditosLoading } = useQuery({
    queryKey: ["creditos-cliente", resolvedParams.id],
    queryFn: () => getCreditosCliente(resolvedParams.id),
    staleTime: 1 * 60 * 1000,
  });

  const formatFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Totales
  const totalComprado = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
  const creditosActivos = creditos.filter((c) => c.estado === "activo");
  const saldoPendienteTotal = creditosActivos.reduce(
    (sum, c) => sum + parseFloat(c.saldo_pendiente),
    0,
  );

  if (clienteLoading) return <LoadingSpinner />;
  if (!cliente)
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p>Cliente no encontrado</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => router.push("/admin/clientes")}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Volver a clientes
        </button>
        <Link
          href={`/admin/clientes/${resolvedParams.id}/editar`}
          className="text-blue-600 hover:text-blue-900 text-sm"
        >
          Editar datos
        </Link>
      </div>

      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-2">
        {cliente.nombre}
      </h1>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-500 mb-8 text-sm">
        {cliente.telefono && <span>{cliente.telefono}</span>}
        {cliente.cedula && <span>· Cédula: {cliente.cedula}</span>}
        {cliente.email && <span>· {cliente.email}</span>}
        {cliente.distribuidora?.nombre && (
          <span>· Atendido por: {cliente.distribuidora.nombre}</span>
        )}
      </div>

      {cliente.notas && (
        <div className="bg-gray-50 border border-gray-200 p-4 mb-8 text-sm text-gray-700">
          {cliente.notas}
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">
            Total Comprado
          </p>
          <p className="text-3xl font-light text-gray-900">
            {formatPrice(totalComprado)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {ventas.length} {ventas.length === 1 ? "compra" : "compras"}
          </p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">
            Créditos Activos
          </p>
          <p className="text-3xl font-light text-gray-900">
            {creditosActivos.length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-6">
          <p className="text-orange-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Saldo Pendiente
          </p>
          <p className="text-3xl font-light text-orange-900">
            {formatPrice(saldoPendienteTotal)}
          </p>
        </div>
      </div>

      {/* Créditos */}
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
        Créditos
      </h2>
      <div className="bg-white border border-gray-200 overflow-hidden mb-10">
        {creditosLoading ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : creditos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              Este cliente no tiene créditos
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Saldo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Cuota
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
              {creditos.map((credito) => (
                <tr key={credito.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">
                    {formatPrice(credito.monto_total)}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatPrice(credito.saldo_pendiente)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatPrice(credito.cuota_mensual)}
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
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/creditos/${credito.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Historial de compras */}
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
        Historial de Compras
      </h2>
      <div className="bg-white border border-gray-200 overflow-hidden">
        {ventasLoading ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : ventas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              Este cliente no tiene compras registradas
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
                  Vía
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Pago
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
                    {VIAS_LABEL[venta.via] || venta.via}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatPrice(venta.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs uppercase tracking-wider ${
                        venta.es_credito
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {venta.es_credito ? "Crédito" : "Contado"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/ventas/${venta.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
