// ============================================================================
// API FUNCTIONS - VENTAS
// ============================================================================

import { supabase } from "@/lib/supabase/client";

/**
 * Buscar producto por código
 * @param {string} codigo - Código del producto
 */
export async function buscarProductoPorCodigo(codigo) {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select(
        `
        *,
        conjunto:conjuntos(nombre),
        factor:factores(valor)
      `,
      )
      .eq("codigo", codigo)
      .eq("activo", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: { message: "Producto no encontrado" } };
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error al buscar producto:", error);
    return { data: null, error };
  }
}

/**
 * Crear una nueva venta completa (venta + detalles + actualizar stock)
 * @param {Object} ventaData - Datos de la venta
 * @param {Array} productos - Array de productos [{producto_id, cantidad, precio_unitario}]
 */
export async function crearVenta(ventaData, productos) {
  try {
    // 1. Crear la venta
    const { data: venta, error: errorVenta } = await supabase
      .from("ventas")
      .insert([
        {
          tipo: ventaData.tipo || "contado",
          estado:
            ventaData.tipo === "credito" ? "credito_activo" : "completada",
          total: ventaData.total,
          metodo_pago: ventaData.metodo_pago,
          vendedor_id: ventaData.vendedor_id || null,
          comision_monto: ventaData.comision_monto || 0,
          comision_pagada: false,
          cliente_nombre: ventaData.cliente_nombre || null,
          cliente_telefono: ventaData.cliente_telefono || null,
          cliente_cedula: ventaData.cliente_cedula || null,
          notas: ventaData.notas || null,
          es_prueba: ventaData.es_prueba || false,
        },
      ])
      .select()
      .single();

    if (errorVenta) throw errorVenta;

    // 2. Crear los detalles de la venta
    const detalles = productos.map((p) => ({
      venta_id: venta.id,
      producto_id: p.producto_id,
      cantidad: p.cantidad,
      precio_unitario: p.precio_unitario,
      subtotal: p.cantidad * p.precio_unitario,
    }));

    const { error: errorDetalles } = await supabase
      .from("ventas_detalle")
      .insert(detalles);

    if (errorDetalles) throw errorDetalles;

    // 3. Actualizar stock de productos
    for (const producto of productos) {
      const { error: errorStock } = await supabase.rpc("restar_stock", {
        producto_id: producto.producto_id,
        cantidad_vendida: producto.cantidad,
      });

      // Si la función RPC no existe, usar UPDATE directo
      if (errorStock && errorStock.code === "42883") {
        const { error: errorUpdate } = await supabase
          .from("productos")
          .update({
            stock: supabase.raw(`stock - ${producto.cantidad}`),
          })
          .eq("id", producto.producto_id);

        if (errorUpdate) throw errorUpdate;
      } else if (errorStock) {
        throw errorStock;
      }
    }

    // 4. Crear movimiento de ingreso
    const { error: errorMovimiento } = await supabase
      .from("movimientos")
      .insert([
        {
          tipo: "ingreso",
          categoria: "venta",
          monto: ventaData.total,
          descripcion: `Venta ${venta.tipo} - ${productos.length} producto(s)`,
          metodo_pago: ventaData.metodo_pago,
          relacionado_tipo: "venta",
          relacionado_id: venta.id,
          es_prueba: ventaData.es_prueba || false,
        },
      ]);

    if (errorMovimiento) throw errorMovimiento;

    return { data: venta, error: null };
  } catch (error) {
    console.error("Error al crear venta:", error);
    return { data: null, error };
  }
}

/**
 * Obtener todas las ventas con paginación
 * @param {number} page - Página actual
 * @param {number} limit - Límite por página
 * @param {Object} filters - Filtros opcionales {tipo, estado, fecha_desde, fecha_hasta}
 */
export async function getVentas(page = 1, limit = 20, filters = {}) {
  try {
    let query = supabase
      .from("ventas")
      .select(
        `
        *,
        vendedor:vendedores(nombre),
        detalle:ventas_detalle(
          *,
          producto:productos(codigo, nombre_comercial)
        )
      `,
        { count: "exact" },
      )
      .order("fecha", { ascending: false });

    // Aplicar filtros
    if (filters.tipo) {
      query = query.eq("tipo", filters.tipo);
    }

    if (filters.estado) {
      query = query.eq("estado", filters.estado);
    }

    if (filters.fecha_desde) {
      query = query.gte("fecha", filters.fecha_desde);
    }

    if (filters.fecha_hasta) {
      query = query.lte("fecha", filters.fecha_hasta);
    }

    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data,
      error: null,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return { data: null, error, pagination: null };
  }
}

/**
 * Obtener una venta por ID con todos sus detalles
 * @param {string} id - ID de la venta
 */
export async function getVenta(id) {
  try {
    const { data, error } = await supabase
      .from("ventas")
      .select(
        `
        *,
        vendedor:vendedores(nombre, telefono),
        detalle:ventas_detalle(
          *,
          producto:productos(codigo, nombre_comercial, imagen_url)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al obtener venta:", error);
    return { data: null, error };
  }
}

/**
 * Obtener ventas por distribuidora
 * @param {string} vendedorId - ID del vendedor
 * @param {boolean} soloPendientes - Si true, solo comisiones pendientes
 */
export async function getVentasPorVendedor(vendedorId, soloPendientes = false) {
  try {
    let query = supabase
      .from("ventas")
      .select(
        `
        *,
        detalle:ventas_detalle(cantidad, subtotal)
      `,
      )
      .eq("vendedor_id", vendedorId)
      .order("fecha", { ascending: false });

    if (soloPendientes) {
      query = query.eq("comision_pagada", false);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calcular totales
    const totalVentas = data.reduce((sum, v) => sum + parseFloat(v.total), 0);
    const totalComisiones = data.reduce(
      (sum, v) => sum + parseFloat(v.comision_monto),
      0,
    );
    const comisionesPendientes = data
      .filter((v) => !v.comision_pagada)
      .reduce((sum, v) => sum + parseFloat(v.comision_monto), 0);

    return {
      data,
      error: null,
      totales: {
        totalVentas,
        totalComisiones,
        comisionesPendientes,
        cantidadVentas: data.length,
      },
    };
  } catch (error) {
    console.error("Error al obtener ventas por vendedor:", error);
    return { data: null, error, totales: null };
  }
}

/**
 * Marcar comisión como pagada
 * @param {string} ventaId - ID de la venta
 */
export async function pagarComision(ventaId) {
  try {
    // 1. Actualizar venta
    const { data: venta, error: errorVenta } = await supabase
      .from("ventas")
      .update({ comision_pagada: true })
      .eq("id", ventaId)
      .select()
      .single();

    if (errorVenta) throw errorVenta;

    // 2. Crear movimiento de egreso
    const { error: errorMovimiento } = await supabase
      .from("movimientos")
      .insert([
        {
          tipo: "egreso",
          categoria: "comision",
          monto: venta.comision_monto,
          descripcion: `Pago de comisión - Venta ${venta.id}`,
          relacionado_tipo: "venta",
          relacionado_id: venta.id,
        },
      ]);

    if (errorMovimiento) throw errorMovimiento;

    return { data: venta, error: null };
  } catch (error) {
    console.error("Error al pagar comisión:", error);
    return { data: null, error };
  }
}

/**
 * Cancelar una venta (devuelve stock)
 * @param {string} ventaId - ID de la venta
 */
export async function cancelarVenta(ventaId) {
  try {
    // 1. Obtener detalles de la venta
    const { data: venta, error: errorVenta } = await getVenta(ventaId);
    if (errorVenta) throw errorVenta;

    // 2. Devolver stock
    for (const detalle of venta.detalle) {
      const { error: errorStock } = await supabase
        .from("productos")
        .update({
          stock: supabase.raw(`stock + ${detalle.cantidad}`),
        })
        .eq("id", detalle.producto_id);

      if (errorStock) throw errorStock;
    }

    // 3. Actualizar estado de venta
    const { data, error } = await supabase
      .from("ventas")
      .update({ estado: "cancelada" })
      .eq("id", ventaId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al cancelar venta:", error);
    return { data: null, error };
  }
}
