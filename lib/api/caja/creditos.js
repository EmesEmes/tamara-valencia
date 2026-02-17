// ============================================================================
// API FUNCTIONS - CRÉDITOS
// ============================================================================

import { supabase } from "@/lib/supabase/client";

/**
 * Crear un crédito con sus cuotas
 * @param {Object} creditoData - Datos del crédito
 */
export async function crearCredito(creditoData) {
  try {
    // 1. Crear el registro de crédito
    const { data: credito, error: errorCredito } = await supabase
      .from("creditos")
      .insert([
        {
          venta_id: creditoData.venta_id,
          cliente_nombre: creditoData.cliente_nombre,
          cliente_telefono: creditoData.cliente_telefono || null,
          cliente_cedula: creditoData.cliente_cedula || null,
          monto_total: creditoData.monto_total,
          cuota_inicial: creditoData.cuota_inicial,
          saldo_pendiente: creditoData.monto_total - creditoData.cuota_inicial,
          cuota_mensual: creditoData.cuota_mensual,
          plazo_meses: creditoData.plazo_meses,
          fecha_primer_pago: creditoData.fecha_primer_pago,
          estado: "activo",
          dias_mora: 0,
          descuenta_inventario: creditoData.descuenta_inventario ?? true,
          notas: creditoData.notas || null,
        },
      ])
      .select()
      .single();

    if (errorCredito) throw errorCredito;

    // 2. Generar las cuotas mensuales
    const cuotas = [];
    const fechaPrimerPago = new Date(creditoData.fecha_primer_pago);

    for (let i = 0; i < creditoData.plazo_meses; i++) {
      const fechaCuota = new Date(fechaPrimerPago);
      fechaCuota.setMonth(fechaCuota.getMonth() + i);

      cuotas.push({
        credito_id: credito.id,
        numero_cuota: i + 1,
        fecha_programada: fechaCuota.toISOString(),
        monto_cuota: creditoData.cuota_mensual,
        estado: "pendiente",
      });
    }

    const { error: errorCuotas } = await supabase
      .from("pagos_credito")
      .insert(cuotas);

    if (errorCuotas) throw errorCuotas;

    return { data: credito, error: null };
  } catch (error) {
    console.error("Error al crear crédito:", error);
    return { data: null, error };
  }
}

/**
 * Obtener todos los créditos con paginación
 * @param {number} page - Página actual
 * @param {number} limit - Límite por página
 * @param {Object} filters - Filtros opcionales {estado}
 */
export async function getCreditos(page = 1, limit = 20, filters = {}) {
  try {
    let query = supabase
      .from("creditos")
      .select(
        `
        *,
        venta:ventas(
          id,
          fecha,
          total
        ),
        pagos:pagos_credito(
          id,
          numero_cuota,
          fecha_programada,
          fecha_pago_real,
          monto_pagado,
          estado
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    // Aplicar filtros
    if (filters.estado) {
      query = query.eq("estado", filters.estado);
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
    console.error("Error al obtener créditos:", error);
    return { data: null, error, pagination: null };
  }
}

/**
 * Obtener un crédito por ID con todos sus detalles
 * @param {string} id - ID del crédito
 */
export async function getCredito(id) {
  try {
    const { data, error } = await supabase
      .from("creditos")
      .select(
        `
        *,
        venta:ventas(
          id,
          fecha,
          total,
          vendedor:vendedores(nombre)
        ),
        pagos:pagos_credito(*)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al obtener crédito:", error);
    return { data: null, error };
  }
}

/**
 * Registrar pago de una cuota
 * @param {string} pagoId - ID del pago_credito
 * @param {number} montoPagado - Monto que se está pagando
 * @param {string} metodoPago - Método de pago usado
 */
export async function registrarPagoCuota(pagoId, montoPagado, metodoPago) {
  try {
    // 1. Actualizar el pago
    const { data: pago, error: errorPago } = await supabase
      .from("pagos_credito")
      .update({
        fecha_pago_real: new Date().toISOString(),
        monto_pagado: montoPagado,
        estado: "pagado",
        metodo_pago: metodoPago,
      })
      .eq("id", pagoId)
      .select()
      .single();

    if (errorPago) throw errorPago;

    // 2. Obtener el crédito
    const { data: credito, error: errorCredito } = await supabase
      .from("creditos")
      .select("*, pagos:pagos_credito(*)")
      .eq("id", pago.credito_id)
      .single();

    if (errorCredito) throw errorCredito;

    // 3. Actualizar saldo pendiente del crédito
    const nuevoSaldo = credito.saldo_pendiente - montoPagado;
    const todasPagadas = credito.pagos.every((p) => p.estado === "pagado");

    const { error: errorUpdate } = await supabase
      .from("creditos")
      .update({
        saldo_pendiente: nuevoSaldo,
        estado: todasPagadas ? "pagado" : "activo",
      })
      .eq("id", credito.id);

    if (errorUpdate) throw errorUpdate;

    // 4. Registrar movimiento de ingreso
    const { error: errorMovimiento } = await supabase
      .from("movimientos")
      .insert([
        {
          tipo: "ingreso",
          categoria: "pago_credito",
          monto: montoPagado,
          descripcion: `Pago cuota ${pago.numero_cuota} - ${credito.cliente_nombre}`,
          metodo_pago: metodoPago,
          relacionado_tipo: "credito",
          relacionado_id: credito.id,
        },
      ]);

    if (errorMovimiento) throw errorMovimiento;

    return { data: pago, error: null };
  } catch (error) {
    console.error("Error al registrar pago:", error);
    return { data: null, error };
  }
}

/**
 * Actualizar días de mora de un crédito
 * @param {string} creditoId - ID del crédito
 */
export async function actualizarMora(creditoId) {
  try {
    const { data: credito, error: errorCredito } = await supabase
      .from("creditos")
      .select("*, pagos:pagos_credito(*)")
      .eq("id", creditoId)
      .single();

    if (errorCredito) throw errorCredito;

    // Buscar cuotas vencidas y no pagadas
    const hoy = new Date();
    const cuotasAtrasadas = credito.pagos.filter((p) => {
      return p.estado === "pendiente" && new Date(p.fecha_programada) < hoy;
    });

    let diasMora = 0;
    let nuevoEstado = credito.estado;

    if (cuotasAtrasadas.length > 0) {
      // Calcular días de mora desde la cuota más antigua vencida
      const cuotaMasAntigua = cuotasAtrasadas.sort(
        (a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada),
      )[0];
      const fechaVencimiento = new Date(cuotaMasAntigua.fecha_programada);
      diasMora = Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24));
      nuevoEstado = "mora";

      // Actualizar estado de cuotas atrasadas
      for (const cuota of cuotasAtrasadas) {
        await supabase
          .from("pagos_credito")
          .update({ estado: "atrasado" })
          .eq("id", cuota.id);
      }
    }

    // Actualizar crédito
    const { data, error } = await supabase
      .from("creditos")
      .update({
        dias_mora: diasMora,
        estado: nuevoEstado,
      })
      .eq("id", creditoId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al actualizar mora:", error);
    return { data: null, error };
  }
}

/**
 * Cancelar un crédito
 * @param {string} creditoId - ID del crédito
 */
export async function cancelarCredito(creditoId) {
  try {
    const { data, error } = await supabase
      .from("creditos")
      .update({ estado: "cancelado" })
      .eq("id", creditoId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al cancelar crédito:", error);
    return { data: null, error };
  }
}
