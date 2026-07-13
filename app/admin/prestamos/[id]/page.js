"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPrestamoById,
  procesarItemsPrestamo,
  devolverTodo,
} from "@/lib/supabase/prestamos";
import { formatPrice } from "@/utils/formatters";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function DetallePrestamoPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [seleccionados, setSeleccionados] = useState([]);
  const [procesando, setProcesando] = useState(false);

  const { data: prestamo, isLoading } = useQuery({
    queryKey: ["prestamo", resolvedParams.id],
    queryFn: () => getPrestamoById(resolvedParams.id),
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

  const calcularPrecio = (producto) => {
    if (!producto?.peso || !producto?.factor?.valor) return 0;
    const precio =
      parseFloat(producto.peso) * parseFloat(producto.factor.valor);
    return Math.ceil(precio / 5) * 5;
  };

  // Solo los items que siguen prestados se pueden seleccionar
  const itemsPrestados =
    prestamo?.detalle?.filter((d) => d.estado_item === "prestado") || [];

  const toggleSeleccion = (itemId) => {
    setSeleccionados((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleTodos = () => {
    if (seleccionados.length === itemsPrestados.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(itemsPrestados.map((i) => i.id));
    }
  };

  const handleDevolver = async () => {
    if (seleccionados.length === 0) {
      alert("Seleccione al menos una joya");
      return;
    }
    if (
      !confirm(
        `¿Devolver ${seleccionados.length} joya(s) al inventario? El stock volverá a subir.`,
      )
    )
      return;

    setProcesando(true);
    try {
      await procesarItemsPrestamo(seleccionados, "devuelto");
      setSeleccionados([]);
      queryClient.invalidateQueries({
        queryKey: ["prestamo", resolvedParams.id],
      });
      queryClient.invalidateQueries({ queryKey: ["prestamos"] });
      alert("Joyas devueltas al inventario");
    } catch (error) {
      console.error("Error al devolver:", error);
      alert("Error al devolver las joyas: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleDevolverTodo = async () => {
    if (
      !confirm(
        "¿Devolver TODAS las joyas prestadas al inventario? El stock volverá a subir.",
      )
    )
      return;

    setProcesando(true);
    try {
      await devolverTodo(resolvedParams.id);
      setSeleccionados([]);
      queryClient.invalidateQueries({
        queryKey: ["prestamo", resolvedParams.id],
      });
      queryClient.invalidateQueries({ queryKey: ["prestamos"] });
      alert("Todas las joyas fueron devueltas al inventario");
    } catch (error) {
      console.error("Error al devolver todo:", error);
      alert("Error al devolver las joyas: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleVender = async () => {
    if (seleccionados.length === 0) {
      alert("Seleccione al menos una joya");
      return;
    }
    if (
      !confirm(
        `¿Sacar ${seleccionados.length} joya(s) para vender? Se registrará la venta a continuación.`,
      )
    )
      return;

    setProcesando(true);
    try {
      // Preparar los productos para precargar en la venta ANTES de procesar
      const itemsParaVender = itemsPrestados
        .filter((i) => seleccionados.includes(i.id))
        .map((i) => ({
          id_producto: i.producto.id,
          codigo: i.producto.codigo,
          nombre: i.producto.nombre_comercial,
          precio_unitario: calcularPrecio(i.producto),
          cantidad: i.cantidad,
          stock: i.producto.stock + i.cantidad, // el stock que tendrá tras devolverse
        }));

      // Sacar las joyas del préstamo (esto devuelve el stock al inventario)
      await procesarItemsPrestamo(seleccionados, "vendido");

      // Guardar en sessionStorage para precargar la venta
      const precarga = {
        productos: itemsParaVender,
        distribuidoraId: prestamo.distribuidora?.id || "",
      };
      sessionStorage.setItem("prestamo_venta", JSON.stringify(precarga));

      setSeleccionados([]);
      queryClient.invalidateQueries({
        queryKey: ["prestamo", resolvedParams.id],
      });
      queryClient.invalidateQueries({ queryKey: ["prestamos"] });

      // Ir a nueva venta
      router.push("/admin/ventas/nueva?desde_prestamo=1");
    } catch (error) {
      console.error("Error al procesar venta:", error);
      alert("Error al procesar la venta: " + error.message);
      setProcesando(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!prestamo)
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p>Préstamo no encontrado</p>
      </div>
    );

  const estadoLabel = {
    prestado: { text: "Prestado", cls: "bg-green-100 text-green-800" },
    devuelto: { text: "Devuelto", cls: "bg-gray-100 text-gray-600" },
    vendido: { text: "Vendido", cls: "bg-blue-100 text-blue-800" },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin/prestamos")}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Volver a préstamos
        </button>
      </div>

      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-8">
        Detalle del Préstamo
      </h1>

      {/* Info de la distribuidora */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">
              Distribuidora
            </p>
            <p className="font-medium text-gray-900">
              {prestamo.distribuidora?.nombre}
            </p>
            {prestamo.distribuidora?.telefono && (
              <p className="text-gray-600">{prestamo.distribuidora.telefono}</p>
            )}
          </div>
          <div>
            <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">
              Fecha del préstamo
            </p>
            <p className="font-medium text-gray-900">
              {formatFecha(prestamo.fecha_prestamo)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">
              Estado
            </p>
            <span
              className={`px-2 py-1 text-xs uppercase tracking-wider ${
                prestamo.estado === "activo"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {prestamo.estado}
            </span>
          </div>
          {prestamo.notas && (
            <div className="col-span-2 md:col-span-3">
              <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">
                Notas
              </p>
              <p className="text-gray-700">{prestamo.notas}</p>
            </div>
          )}
        </div>
      </div>

      {/* Acciones sobre joyas prestadas */}
      {itemsPrestados.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600">
              {seleccionados.length} seleccionada(s)
            </span>
            <button
              onClick={handleDevolver}
              disabled={procesando || seleccionados.length === 0}
              className="px-4 py-2 border border-gray-900 text-gray-900 text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Devolver seleccionadas
            </button>
            <button
              onClick={handleVender}
              disabled={procesando || seleccionados.length === 0}
              className="px-4 py-2 bg-gray-900 text-white text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Vender seleccionadas
            </button>
            <button
              onClick={handleDevolverTodo}
              disabled={procesando}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline ml-auto"
            >
              Devolver todo
            </button>
          </div>
        </div>
      )}

      {/* Lista de joyas */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-10">
                {itemsPrestados.length > 0 && (
                  <input
                    type="checkbox"
                    checked={
                      seleccionados.length === itemsPrestados.length &&
                      itemsPrestados.length > 0
                    }
                    onChange={toggleTodos}
                    className="w-4 h-4"
                  />
                )}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Joya
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Cantidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {prestamo.detalle?.map((item) => {
              const esPrestado = item.estado_item === "prestado";
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {esPrestado && (
                      <input
                        type="checkbox"
                        checked={seleccionados.includes(item.id)}
                        onChange={() => toggleSeleccion(item.id)}
                        className="w-4 h-4"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {item.producto?.codigo}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {item.producto?.nombre_comercial}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.cantidad}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs uppercase tracking-wider ${estadoLabel[item.estado_item].cls}`}
                    >
                      {estadoLabel[item.estado_item].text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
