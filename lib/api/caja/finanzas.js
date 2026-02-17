// ============================================================================
// API FUNCTIONS - FINANZAS (Balance de Ingresos y Egresos)
// ============================================================================

import { supabase } from "@/lib/supabase/client";

/**
 * Obtener resumen financiero de un período
 * @param {number} mes - Mes (1-12)
 * @param {number} anio - Año
 */
export async function getResumenFinanciero(mes, anio) {
  try {
    const inicioMes = new Date(anio, mes - 1, 1);
    const finMes = new Date(anio, mes, 0);

    // ========== INGRESOS ==========

    // Ventas del mes
    const { data: ventas, error: errorVentas } = await supabase
      .from("ventas")
      .select("id, tipo, total, fecha, comision_monto, comision_pagada")
      .gte("fecha", inicioMes.toISOString())
      .lte("fecha", finMes.toISOString())
      .neq("estado", "cancelada");

    if (errorVentas) throw errorVentas;

    const totalVentas =
      ventas?.reduce((sum, v) => sum + parseFloat(v.total), 0) || 0;
    const ventasContado = ventas?.filter((v) => v.tipo === "contado") || [];
    const ventasCredito = ventas?.filter((v) => v.tipo === "credito") || [];

    const totalContado = ventasContado.reduce(
      (sum, v) => sum + parseFloat(v.total),
      0,
    );
    const totalCredito = ventasCredito.reduce(
      (sum, v) => sum + parseFloat(v.total),
      0,
    );

    // Comisiones pendientes
    const comisionesPendientes =
      ventas
        ?.filter((v) => v.comision_monto > 0 && !v.comision_pagada)
        .reduce((sum, v) => sum + parseFloat(v.comision_monto), 0) || 0;

    // ========== EGRESOS ==========

    // Pagos realizados del mes
    const { data: pagosEgresos, error: errorPagos } = await supabase
      .from("pagos_egresos_recurrentes")
      .select("monto_real, egreso_recurrente:egresos_recurrentes(categoria)")
      .eq("estado", "pagado")
      .gte("fecha_pago_real", inicioMes.toISOString())
      .lte("fecha_pago_real", finMes.toISOString());

    if (errorPagos) throw errorPagos;

    const totalEgresos =
      pagosEgresos?.reduce((sum, p) => sum + parseFloat(p.monto_real), 0) || 0;

    // Agrupar egresos por categoría
    const egresosPorCategoria = {};
    pagosEgresos?.forEach((pago) => {
      const categoria = pago.egreso_recurrente?.categoria || "otros";
      if (!egresosPorCategoria[categoria]) {
        egresosPorCategoria[categoria] = 0;
      }
      egresosPorCategoria[categoria] += parseFloat(pago.monto_real);
    });

    // ========== BALANCE ==========

    const balance = totalVentas - totalEgresos;
    const porcentajeRentabilidad =
      totalVentas > 0 ? ((balance / totalVentas) * 100).toFixed(1) : 0;

    return {
      data: {
        // Ingresos
        ingresos: {
          total: totalVentas,
          contado: totalContado,
          credito: totalCredito,
          cantidadVentas: ventas?.length || 0,
          comisionesPendientes,
        },
        // Egresos
        egresos: {
          total: totalEgresos,
          porCategoria: egresosPorCategoria,
          cantidadPagos: pagosEgresos?.length || 0,
        },
        // Balance
        balance: {
          total: balance,
          porcentajeRentabilidad: parseFloat(porcentajeRentabilidad),
          estado: balance >= 0 ? "positivo" : "negativo",
        },
        // Período
        periodo: {
          mes,
          anio,
          nombre: getNombreMes(mes),
        },
      },
      error: null,
    };
  } catch (error) {
    console.error("Error al obtener resumen financiero:", error);
    return { data: null, error };
  }
}

/**
 * Obtener comparación de múltiples meses
 * @param {number} meses - Cantidad de meses hacia atrás
 */
export async function getComparacionMeses(meses = 6) {
  try {
    const hoy = new Date();
    const resultados = [];

    for (let i = meses - 1; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const mes = fecha.getMonth() + 1;
      const anio = fecha.getFullYear();

      const { data, error } = await getResumenFinanciero(mes, anio);

      if (error) continue;

      resultados.push(data);
    }

    return { data: resultados, error: null };
  } catch (error) {
    console.error("Error al obtener comparación:", error);
    return { data: null, error };
  }
}

/**
 * Obtener métricas clave del negocio
 */
export async function getMetricasNegocio(mes, anio) {
  try {
    const { data: resumen, error } = await getResumenFinanciero(mes, anio);

    if (error) throw error;

    // Calcular métricas adicionales
    const ticketPromedio =
      resumen.ingresos.cantidadVentas > 0
        ? resumen.ingresos.total / resumen.ingresos.cantidadVentas
        : 0;

    const egresoPromedioPorPago =
      resumen.egresos.cantidadPagos > 0
        ? resumen.egresos.total / resumen.egresos.cantidadPagos
        : 0;

    return {
      data: {
        ...resumen,
        metricas: {
          ticketPromedio,
          egresoPromedioPorPago,
        },
      },
      error: null,
    };
  } catch (error) {
    console.error("Error al obtener métricas:", error);
    return { data: null, error };
  }
}

// Helper
function getNombreMes(mes) {
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
}
