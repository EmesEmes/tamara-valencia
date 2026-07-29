import { supabase } from "./client";
import { cargarVentaACuenta } from "./cuentas";
import { devengarComision } from "./comisiones";

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
        estado: venta.es_credito ? "en_proceso" : "cancelado",
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

  // 4. Si es a crédito, cargar el monto a la cuenta del cliente.
  //    La comisión del crédito se genera después, con cada pago.
  if (venta.es_credito && venta.id_cliente) {
    const cantidadItems = detalle.reduce((s, d) => s + d.cantidad, 0);
    await cargarVentaACuenta({
      id_cliente: venta.id_cliente,
      id_venta: ventaData.id,
      monto: venta.total,
      concepto: `Compra de ${cantidadItems} ${cantidadItems === 1 ? "pieza" : "piezas"}`,
      datosNuevaCuenta: credito
        ? {
            cuota_mensual: credito.cuota_mensual,
            dia_pago: credito.dia_pago || 1,
            fecha_primer_pago: credito.fecha_primer_pago,
          }
        : null,
    });
  }

  // 5. Si es de contado, el cliente pagó todo: se genera la comisión ya
  if (!venta.es_credito && venta.id_cliente) {
    try {
      await devengarComision({
        id_cliente: venta.id_cliente,
        base: venta.total,
        id_venta: ventaData.id,
        concepto: "Venta de contado",
      });
    } catch (e) {
      console.error("No se pudo generar la comisión de la venta:", e);
    }
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
// Registrar una venta HISTÓRICA (migración desde el registro anterior).
// No toca stock. Si es a crédito, carga el monto a la cuenta del cliente.
export const registrarVentaHistorica = async ({ venta, cuenta }) => {
  // 1. Crear la venta con la fecha real del pasado
  const { data: ventaData, error: ventaError } = await supabase
    .from("ventas")
    .insert([
      {
        fecha: venta.fecha,
        id_cliente: venta.id_cliente || null,
        subtotal: venta.total,
        descuento: 0,
        total: venta.total,
        via: venta.via,
        id_distribuidora: venta.id_distribuidora || null,
        comision_monto: venta.comision_monto || 0,
        comision_pagada: venta.comision_pagada || false,
        es_credito: venta.es_credito || false,
        estado: venta.estado || (venta.es_credito ? "en_proceso" : "cancelado"),
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

  // 2. Si fue a crédito, sumarla a la cuenta del cliente
  if (venta.es_credito && venta.id_cliente) {
    const fechaSolo = venta.fecha.split("T")[0];
    await cargarVentaACuenta({
      id_cliente: venta.id_cliente,
      id_venta: ventaData.id,
      monto: venta.total,
      concepto: venta.notas || "Compra anterior al sistema",
      fecha: fechaSolo,
      datosNuevaCuenta: cuenta
        ? {
            cuota_mensual: cuenta.cuota_mensual,
            dia_pago: cuenta.dia_pago || 1,
            fecha_primer_pago: cuenta.fecha_primer_pago,
          }
        : null,
    });
  }

  return ventaData;
};

// Cambiar el estado de una venta (en proceso / cancelado)
export const cambiarEstadoVenta = async (idVenta, estado) => {
  const { error } = await supabase
    .from("ventas")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", idVenta);

  if (error) throw error;
  return true;
};
