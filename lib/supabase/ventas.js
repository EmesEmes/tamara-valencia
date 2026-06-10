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
    const fechaInicio = new Date();
    if (credito.meses_gracia > 0) {
      fechaInicio.setMonth(fechaInicio.getMonth() + credito.meses_gracia);
    }

    const { error: creditoError } = await supabase.from("creditos").insert([
      {
        id_cliente: venta.id_cliente,
        id_venta: ventaData.id,
        monto_total: venta.total,
        saldo_pendiente: venta.total,
        cuota_mensual: credito.cuota_mensual,
        meses_plazo: credito.meses_plazo,
        meses_gracia: credito.meses_gracia || 0,
        dia_pago: credito.dia_pago || 1,
        fecha_inicio: fechaInicio.toISOString().split("T")[0],
        fecha_proximo_pago: fechaInicio.toISOString().split("T")[0],
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
