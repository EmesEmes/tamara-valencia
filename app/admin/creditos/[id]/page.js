"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCreditoById, registrarPago } from "@/lib/supabase/creditos";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function DetalleCreditoPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("pago_regular");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const { data: credito, isLoading } = useQuery({
    queryKey: ["credito", resolvedParams.id],
    queryFn: () => getCreditoById(resolvedParams.id),
    staleTime: 1 * 60 * 1000,
  });

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

  const porcentajePagado = credito
    ? Math.round(
        ((credito.monto_total - credito.saldo_pendiente) /
          credito.monto_total) *
          100,
      )
    : 0;

  const handlePago = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      alert("Ingrese un monto válido");
      return;
    }
    if (parseFloat(monto) > parseFloat(credito.saldo_pendiente)) {
      alert("El monto no puede ser mayor al saldo pendiente");
      return;
    }
    if (
      !confirm(
        `¿Registrar ${tipo === "anticipo" ? "anticipo" : "pago"} de ${formatCurrency(parseFloat(monto))}?`,
      )
    )
      return;

    setGuardando(true);
    try {
      await registrarPago(resolvedParams.id, { monto, tipo, notas });
      setMonto("");
      setNotas("");
      queryClient.invalidateQueries({
        queryKey: ["credito", resolvedParams.id],
      });
      queryClient.invalidateQueries({ queryKey: ["creditos"] });
      alert("Pago registrado exitosamente");
    } catch (error) {
      console.error("Error al registrar pago:", error);
      alert("Error al registrar el pago: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!credito)
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p>Crédito no encontrado</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Volver a créditos
        </button>
      </div>

      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-8">
        Crédito Directo
      </h1>

      {/* Info del cliente */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Cliente
        </h2>
        <p className="text-xl font-light text-gray-900">
          {credito.cliente?.nombre}
        </p>
        {credito.cliente?.telefono && (
          <p className="text-sm text-gray-600 mt-1">
            {credito.cliente.telefono}
          </p>
        )}
        {credito.cliente?.cedula && (
          <p className="text-sm text-gray-600">
            Cédula: {credito.cliente.cedula}
          </p>
        )}
      </div>

      {/* Resumen del crédito */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Resumen del Crédito
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Monto Total
            </p>
            <p className="text-xl font-light text-gray-900">
              {formatCurrency(credito.monto_total)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Saldo Pendiente
            </p>
            <p className="text-xl font-light text-gray-900">
              {formatCurrency(credito.saldo_pendiente)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Cuota Mensual
            </p>
            <p className="text-xl font-light text-gray-900">
              {formatCurrency(credito.cuota_mensual)}
            </p>
            <p className="text-xs text-gray-500">
              Día {credito.dia_pago || 1} de cada mes
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Próximo Pago
            </p>
            <p className="text-xl font-light text-gray-900">
              {formatFecha(credito.fecha_proximo_pago)}
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Pagado {porcentajePagado}%</span>
            <span>
              {formatCurrency(credito.monto_total - credito.saldo_pendiente)} de{" "}
              {formatCurrency(credito.monto_total)}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2">
            <div
              className="bg-gray-900 h-2 transition-all duration-300"
              style={{ width: `${porcentajePagado}%` }}
            />
          </div>
        </div>

        {credito.meses_gracia > 0 && (
          <p className="text-xs text-gray-500 mt-3">
            Se aplicaron {credito.meses_gracia} meses de gracia. Inicio de
            pagos: {formatFecha(credito.fecha_inicio)}
          </p>
        )}

        <div className="mt-3">
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
        </div>
      </div>

      {/* Registrar pago */}
      {credito.estado === "activo" && (
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            Registrar Pago
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de pago
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTipo("pago_regular")}
                  className={`flex-1 py-2 text-sm uppercase tracking-wider transition-colors ${
                    tipo === "pago_regular"
                      ? "bg-gray-900 text-white"
                      : "border border-gray-300 text-gray-700 hover:border-gray-900"
                  }`}
                >
                  Pago normal
                </button>
                <button
                  onClick={() => setTipo("anticipo")}
                  className={`flex-1 py-2 text-sm uppercase tracking-wider transition-colors ${
                    tipo === "anticipo"
                      ? "bg-gray-900 text-white"
                      : "border border-gray-300 text-gray-700 hover:border-gray-900"
                  }`}
                >
                  Anticipo
                </button>
              </div>
              {tipo === "anticipo" && (
                <p className="text-xs text-gray-500 mt-1">
                  El anticipo recalculará la cuota mensual
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto a pagar
              </label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder={`Cuota: ${formatCurrency(credito.cuota_mensual)}`}
                min="0.01"
                max={credito.saldo_pendiente}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones del pago..."
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <button
            onClick={handlePago}
            disabled={guardando || !monto}
            className="w-full py-3 bg-gray-900 text-white text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {guardando ? "Registrando..." : "Registrar Pago"}
          </button>
        </div>
      )}

      {/* Historial de pagos */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Historial de Pagos
        </h2>

        {credito.pagos?.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay pagos registrados</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Monto
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Nueva cuota
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Notas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {credito.pagos
                ?.sort(
                  (a, b) => new Date(b.created_at) - new Date(a.created_at),
                )
                .map((pago) => (
                  <tr key={pago.id}>
                    <td className="px-4 py-2 text-gray-900">
                      {formatFecha(pago.fecha_pago)}
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {formatCurrency(pago.monto)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 text-xs uppercase tracking-wider ${
                          pago.tipo === "anticipo"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {pago.tipo === "anticipo" ? "Anticipo" : "Pago normal"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {pago.cuota_nueva &&
                      pago.cuota_nueva !== pago.cuota_anterior
                        ? formatCurrency(pago.cuota_nueva)
                        : "-"}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {pago.notas || "-"}
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
