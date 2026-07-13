"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useInventarioStats } from "@/lib/hooks/useInventarioStats";
import Link from "next/link";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalClientes: 0,
    totalConjuntos: 0,
    ventasMes: 0,
    montoMes: 0,
    creditosActivos: 0,
    montoPendiente: 0,
  });
  const [loading, setLoading] = useState(true);

  const { data: inventarioData, isLoading: inventarioLoading } =
    useInventarioStats();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Inicio y fin del mes actual
      const ahora = new Date();
      const inicioMes = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        1,
      ).toISOString();
      const finMes = new Date(
        ahora.getFullYear(),
        ahora.getMonth() + 1,
        0,
        23,
        59,
        59,
      ).toISOString();

      const [
        { count: totalProductos },
        { count: totalClientes },
        { count: totalConjuntos },
        { data: ventasMesData },
        { count: creditosActivos },
        { data: creditosPendientes },
      ] = await Promise.all([
        supabase
          .from("productos")
          .select("*", { count: "exact", head: true })
          .eq("activo", true),
        supabase
          .from("clientes")
          .select("*", { count: "exact", head: true })
          .eq("activo", true),
        supabase.from("conjuntos").select("*", { count: "exact", head: true }),
        supabase
          .from("ventas")
          .select("total")
          .gte("fecha", inicioMes)
          .lte("fecha", finMes),
        supabase
          .from("creditos")
          .select("*", { count: "exact", head: true })
          .eq("estado", "activo"),
        supabase
          .from("creditos")
          .select("saldo_pendiente")
          .eq("estado", "activo"),
      ]);

      const montoMes =
        ventasMesData?.reduce((sum, v) => sum + parseFloat(v.total), 0) || 0;
      const montoPendiente =
        creditosPendientes?.reduce(
          (sum, c) => sum + parseFloat(c.saldo_pendiente),
          0,
        ) || 0;

      setStats({
        totalProductos: totalProductos || 0,
        totalClientes: totalClientes || 0,
        totalConjuntos: totalConjuntos || 0,
        ventasMes: ventasMesData?.length || 0,
        montoMes,
        creditosActivos: creditosActivos || 0,
        montoPendiente,
      });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const mesActual = new Date().toLocaleDateString("es-EC", {
    month: "long",
    year: "numeric",
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-10">
        Dashboard
      </h1>

      {/* FILA 1: Números generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">
            Productos Activos
          </p>
          <p className="text-4xl font-light text-gray-900">
            {stats.totalProductos}
          </p>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">
            Clientes
          </p>
          <p className="text-4xl font-light text-gray-900">
            {stats.totalClientes}
          </p>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">
            Conjuntos
          </p>
          <p className="text-4xl font-light text-gray-900">
            {stats.totalConjuntos}
          </p>
        </div>
      </div>

      {/* FILA 2: Inventario (calculado y final) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6">
          <p className="text-blue-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Valor de Inventario (Calculado)
          </p>
          {inventarioLoading ? (
            <p className="text-2xl font-light text-blue-900">Cargando...</p>
          ) : (
            <>
              <p className="text-4xl font-light text-blue-900 mb-1">
                {formatCurrency(inventarioData?.valorCalculado || 0)}
              </p>
              <p className="text-xs text-blue-700">
                Basado en peso × factor × stock
              </p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 p-6">
          <p className="text-indigo-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Valor Final de Inventario
          </p>
          {inventarioLoading ? (
            <p className="text-2xl font-light text-indigo-900">Cargando...</p>
          ) : (
            <>
              <p className="text-4xl font-light text-indigo-900 mb-1">
                {formatCurrency(inventarioData?.valorFinal || 0)}
              </p>
              <p className="text-xs text-indigo-700">
                Con precio de venta (redondeado a múltiplo de 5)
              </p>
            </>
          )}
        </div>
      </div>

      {/* FILA 3: Ventas del mes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-6">
          <p className="text-green-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Ventas de {mesActual}
          </p>
          <p className="text-4xl font-light text-green-900 mb-1">
            {formatCurrency(stats.montoMes)}
          </p>
          <p className="text-xs text-green-700">
            {stats.ventasMes} {stats.ventasMes === 1 ? "venta" : "ventas"}{" "}
            registradas
          </p>
        </div>

        <div className="bg-white border border-gray-200 p-6 flex flex-col justify-center">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">
            Productos en Inventario
          </p>
          <p className="text-4xl font-light text-gray-900">
            {inventarioData?.totalProductos || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Activos y con stock</p>
        </div>
      </div>

      {/* FILA 3: Créditos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 p-6">
          <p className="text-yellow-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Créditos Activos
          </p>
          <p className="text-4xl font-light text-yellow-900">
            {stats.creditosActivos}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-6">
          <p className="text-orange-800 text-sm uppercase tracking-wider mb-2 font-medium">
            Monto Pendiente de Cobro
          </p>
          <p className="text-4xl font-light text-orange-900">
            {formatCurrency(stats.montoPendiente)}
          </p>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wider">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/ventas/nueva"
            className="p-6 bg-gray-900 text-white text-center hover:bg-gray-800 transition-colors"
          >
            <p className="text-lg font-light tracking-widest uppercase">
              Nueva Venta
            </p>
          </Link>

          <Link
            href="/admin/clientes/nuevo"
            className="p-6 border-2 border-gray-300 hover:border-gray-900 transition-colors text-center"
          >
            <p className="text-lg font-light text-gray-900">Nuevo Cliente</p>
          </Link>

          <Link
            href="/admin/productos/nuevo"
            className="p-6 border-2 border-gray-300 hover:border-gray-900 transition-colors text-center"
          >
            <p className="text-lg font-light text-gray-900">Nuevo Producto</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
