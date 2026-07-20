import { supabase } from "./client";

// Registrar una venta completa con transacción
export const registrarVenta = async ({ venta, detalle, credito }) => {
  // 1. Crear la venta
  const { data: ventaData, error: ventaError } = await supabase
    .from("ventas")
    .insert([
      {
        fecha: new Date().toISOString(),
        id_cliente: venta.id_cliente || null,
        subtotal: venta.subtotal,
        descuento: venta.descuento || 0,
        total: venta.total,
        via: venta.via,
        id_distribuidora: venta.id_distribuidora || null,
        comision_monto: venta.comision_monto || 0,
        comision_pagada: false,
        es_credito: venta.es_credito || false,
        notas: venta.notas || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (ventaError) throw ventaError;

  // 2. Crear el detalle de la venta
  const detalleConVenta = detalle.map((item) => ({
    id_venta: ventaData.id,
    id_producto: item.id_producto,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    subtotal: item.precio_unitario * item.cantidad,
    created_at: new Date().toISOString(),
  }));

  const { error: detalleError } = await supabase
    .from("ventas_detalle")
    .insert(detalleConVenta);

  if (detalleError) throw detalleError;

  // 3. Descontar stock de cada producto
  for (const item of detalle) {
    const { data: producto, error: stockError } = await supabase
      .from("productos")
      .select("stock")
      .eq("id", item.id_producto)
      .single();

    if (stockError) throw stockError;

    const { error: updateError } = await supabase
      .from("productos")
      .update({ stock: producto.stock - item.cantidad })
      .eq("id", item.id_producto);

    if (updateError) throw updateError;
  }

  // 4. Crear crédito si aplica
  if (credito && venta.es_credito) {
    const ahora = new Date();
    const diaPago = credito.dia_pago || 1;
    // Meses a sumar: 1 (mes siguiente) + los meses de gracia
    const mesesASumar = 1 + (credito.meses_gracia || 0);

    // Construir la fecha del primer pago sin desfase por zona horaria
    let añoPago = ahora.getFullYear();
    let mesPago = ahora.getMonth() + mesesASumar;
    añoPago += Math.floor(mesPago / 12);
    mesPago = mesPago % 12;
    const ultimoDia = new Date(añoPago, mesPago + 1, 0).getDate();
    const diaReal = Math.min(diaPago, ultimoDia);
    const fechaPrimerPago = `${añoPago}-${String(mesPago + 1).padStart(2, "0")}-${String(diaReal).padStart(2, "0")}`;

    // Fecha de inicio: hoy (o cuando arranca a contar), en formato seguro
    const fechaInicioStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;

    const { error: creditoError } = await supabase.from("creditos").insert([
      {
        id_cliente: venta.id_cliente,
        id_venta: ventaData.id,
        monto_total: venta.total,
        saldo_pendiente: venta.total,
        cuota_mensual: credito.cuota_mensual,
        meses_plazo: credito.meses_plazo,
        meses_gracia: credito.meses_gracia || 0,
        dia_pago: diaPago,
        fecha_inicio: fechaInicioStr,
        fecha_proximo_pago: fechaPrimerPago,
        estado: "activo",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (creditoError) throw creditoError;
  }

  return ventaData;
};

// Obtener ventas con filtros
export const getVentas = async (filtros = {}) => {
  let query = supabase
    .from("ventas")
    .select(
      `
      *,
      cliente:clientes(nombre, telefono),
      distribuidora:distribuidoras(nombre)
    `,
    )
    .order("fecha", { ascending: false });

  if (filtros.fechaDesde) query = query.gte("fecha", filtros.fechaDesde);
  if (filtros.fechaHasta) query = query.lte("fecha", filtros.fechaHasta);
  if (filtros.via) query = query.eq("via", filtros.via);
  if (filtros.id_cliente) query = query.eq("id_cliente", filtros.id_cliente);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Obtener una venta por ID con su detalle
export const getVentaById = async (id) => {
  const { data, error } = await supabase
    .from("ventas")
    .select(
      `
      *,
      cliente:clientes(nombre, telefono),
      distribuidora:distribuidoras(nombre, porcentaje_comision),
      detalle:ventas_detalle(
        *,
        producto:productos(codigo, nombre_comercial, imagen_url)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Registrar una venta HISTÓRICA (migración desde Excel)
// No toca stock ni requiere productos del inventario.
// Puede incluir un crédito histórico con pagos ya realizados.
export const registrarVentaHistorica = async ({
  venta,
  credito,
  pagosPrevios,
}) => {
  // 1. Crear la venta con la fecha histórica
  const { data: ventaData, error: ventaError } = await supabase
    .from("ventas")
    .insert([
      {
        fecha: venta.fecha, // fecha real del pasado
        id_cliente: venta.id_cliente || null,
        subtotal: venta.total,
        descuento: 0,
        total: venta.total,
        via: venta.via,
        id_distribuidora: venta.id_distribuidora || null,
        comision_monto: venta.comision_monto || 0,
        comision_pagada: venta.comision_pagada || false,
        es_credito: venta.es_credito || false,
        notas: venta.notas
          ? `[HISTÓRICO] ${venta.notas}`
          : "[HISTÓRICO] Venta migrada del registro anterior",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (ventaError) throw ventaError;

  // 2. Si es crédito, crear el crédito histórico
  if (credito && venta.es_credito) {
    const { data: creditoData, error: creditoError } = await supabase
      .from("creditos")
      .insert([
        {
          id_cliente: venta.id_cliente,
          id_venta: ventaData.id,
          monto_total: credito.monto_total,
          saldo_pendiente: credito.saldo_pendiente,
          cuota_mensual: credito.cuota_mensual,
          meses_plazo: credito.meses_plazo,
          meses_gracia: 0,
          dia_pago: credito.dia_pago || 1,
          fecha_inicio: credito.fecha_inicio,
          fecha_proximo_pago: credito.fecha_proximo_pago,
          estado: credito.saldo_pendiente <= 0 ? "pagado" : "activo",
          notas: "[HISTÓRICO] Crédito migrado del registro anterior",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (creditoError) throw creditoError;

    // 3. Registrar los pagos que ya se hicieron en ese crédito
    if (pagosPrevios && pagosPrevios.length > 0) {
      const pagosInsert = pagosPrevios.map((pago) => ({
        id_credito: creditoData.id,
        fecha_pago: pago.fecha,
        monto: pago.monto,
        tipo: "pago_regular",
        cuota_anterior: credito.cuota_mensual,
        cuota_nueva: credito.cuota_mensual,
        notas: "[HISTÓRICO] Pago migrado del registro anterior",
        created_at: new Date().toISOString(),
      }));

      const { error: pagosError } = await supabase
        .from("pagos_credito")
        .insert(pagosInsert);

      if (pagosError) throw pagosError;
    }
  }

  return ventaData;
};
