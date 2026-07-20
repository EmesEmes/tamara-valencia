import { supabase } from "./client";

// Ventas por mes con desglose por vía
export const getVentasPorMes = async (año) => {
  const { data, error } = await supabase
    .from("ventas")
    .select(
      `
      fecha, total, via,
      detalle:ventas_detalle(
        cantidad,
        producto:productos(tipo)
      )
    `,
    )
    .gte("fecha", `${año}-01-01`)
    .lte("fecha", `${año}-12-31`);

  if (error) throw error;

  // Agrupar por mes
  const meses = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    nombre: new Date(año, i, 1).toLocaleDateString("es-EC", { month: "short" }),
    total: 0,
    showroom: 0,
    redes: 0,
    referido: 0,
    distribuidora: 0,
    tvcj: 0,
    cuenta_gerencia: 0,
    unidades: 0,
  }));

  data?.forEach((venta) => {
    const mes = new Date(venta.fecha).getMonth();
    meses[mes].total += parseFloat(venta.total);
    meses[mes][venta.via] =
      (meses[mes][venta.via] || 0) + parseFloat(venta.total);
    meses[mes].unidades +=
      venta.detalle?.reduce((sum, d) => sum + d.cantidad, 0) || 0;
  });

  return meses;
};

// Ventas por tipo de joya
export const getVentasPorTipo = async (año, mes = null) => {
  let query = supabase.from("ventas_detalle").select(`
      cantidad,
      producto:productos(tipo)
    `);

  if (mes) {
    const mesStr = mes.toString().padStart(2, "0");
    query = query
      .gte("created_at", `${año}-${mesStr}-01`)
      .lte("created_at", `${año}-${mesStr}-31`);
  } else {
    query = query
      .gte("created_at", `${año}-01-01`)
      .lte("created_at", `${año}-12-31`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Agrupar por tipo
  const tipos = {};
  data?.forEach((item) => {
    const tipo = item.producto?.tipo || "Sin tipo";
    tipos[tipo] = (tipos[tipo] || 0) + item.cantidad;
  });

  return Object.entries(tipos)
    .map(([tipo, cantidad]) => ({ tipo, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
};

// Pagos de créditos por mes
export const getPagosCreditosPorMes = async (año) => {
  const { data, error } = await supabase
    .from("pagos_credito")
    .select("monto, fecha_pago")
    .gte("fecha_pago", `${año}-01-01`)
    .lte("fecha_pago", `${año}-12-31`);

  if (error) throw error;

  const meses = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    nombre: new Date(año, i, 1).toLocaleDateString("es-EC", { month: "short" }),
    cobrado: 0,
  }));

  data?.forEach((pago) => {
    const mes = new Date(pago.fecha_pago).getMonth();
    meses[mes].cobrado += parseFloat(pago.monto);
  });

  return meses;
};

// Cartera de créditos (cobrado vs pendiente por mes)
export const getCarteraPorMes = async (año) => {
  const pagosPorMes = await getPagosCreditosPorMes(año);

  // Obtener saldo pendiente total actual
  const { data: creditos, error } = await supabase
    .from("creditos")
    .select("saldo_pendiente")
    .eq("estado", "activo");

  if (error) throw error;

  const totalPendiente =
    creditos?.reduce((sum, c) => sum + parseFloat(c.saldo_pendiente), 0) || 0;

  return { pagosPorMes, totalPendiente };
};

// Egresos mensuales
export const getEgresosMensuales = async (año) => {
  const { data, error } = await supabase
    .from("egresos_mensuales")
    .select("*")
    .eq("año", año)
    .order("mes", { ascending: true });

  if (error) throw error;
  return data || [];
};

// Guardar o actualizar egreso mensual
export const upsertEgreso = async (año, mes, monto, notas = "") => {
  const { data, error } = await supabase
    .from("egresos_mensuales")
    .upsert(
      [
        {
          año,
          mes,
          monto: parseFloat(monto),
          notas,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "año,mes" },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Resumen del mes actual
export const getResumenMes = async (año, mes) => {
  const mesStr = mes.toString().padStart(2, "0");
  const inicioMes = `${año}-${mesStr}-01`;
  const finMes = new Date(año, mes, 0).toISOString().split("T")[0];

  const [{ data: ventas }, { data: pagos }, { data: egreso }] =
    await Promise.all([
      supabase
        .from("ventas")
        .select("total")
        .gte("fecha", inicioMes)
        .lte("fecha", `${finMes}T23:59:59`),
      supabase
        .from("pagos_credito")
        .select("monto")
        .gte("fecha_pago", inicioMes)
        .lte("fecha_pago", `${finMes}T23:59:59`),
      supabase
        .from("egresos_mensuales")
        .select("monto")
        .eq("año", año)
        .eq("mes", mes)
        .maybeSingle(),
    ]);

  const totalVentas =
    ventas?.reduce((sum, v) => sum + parseFloat(v.total), 0) || 0;
  const totalPagos =
    pagos?.reduce((sum, p) => sum + parseFloat(p.monto), 0) || 0;
  const totalEgresos = egreso?.monto || 0;
  const totalIngresos = totalVentas + totalPagos;

  return {
    totalVentas,
    totalPagos,
    totalIngresos,
    totalEgresos,
    balance: totalIngresos - totalEgresos,
  };
};

// Reporte de ventas por distribuidora en un año
// Devuelve, por cada distribuidora que tuvo ventas: total vendido,
// número de ventas, unidades vendidas y comisión generada.
export const getReportePorDistribuidora = async (año, mes = null) => {
  let query = supabase
    .from("ventas")
    .select(
      `
      total, comision_monto, comision_pagada, fecha,
      distribuidora:distribuidoras(id, nombre),
      detalle:ventas_detalle(cantidad)
    `,
    )
    .eq("via", "distribuidora")
    .not("id_distribuidora", "is", null);

  if (mes) {
    const mesStr = mes.toString().padStart(2, "0");
    const finMes = new Date(año, mes, 0).getDate();
    query = query
      .gte("fecha", `${año}-${mesStr}-01`)
      .lte("fecha", `${año}-${mesStr}-${finMes}T23:59:59`);
  } else {
    query = query
      .gte("fecha", `${año}-01-01`)
      .lte("fecha", `${año}-12-31T23:59:59`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Agrupar por distribuidora
  const mapa = {};
  data?.forEach((venta) => {
    const dist = venta.distribuidora;
    if (!dist) return;

    if (!mapa[dist.id]) {
      mapa[dist.id] = {
        id: dist.id,
        nombre: dist.nombre,
        totalVendido: 0,
        numeroVentas: 0,
        unidades: 0,
        comisionTotal: 0,
        comisionPagada: 0,
        comisionPendiente: 0,
      };
    }

    const registro = mapa[dist.id];
    registro.totalVendido += parseFloat(venta.total);
    registro.numeroVentas += 1;
    registro.unidades +=
      venta.detalle?.reduce((sum, d) => sum + d.cantidad, 0) || 0;

    const comision = parseFloat(venta.comision_monto) || 0;
    registro.comisionTotal += comision;
    if (venta.comision_pagada) {
      registro.comisionPagada += comision;
    } else {
      registro.comisionPendiente += comision;
    }
  });

  // Convertir a array ordenado por total vendido (de mayor a menor)
  return Object.values(mapa).sort((a, b) => b.totalVendido - a.totalVendido);
};
