// ============================================================================
// API FUNCTIONS - EGRESOS RECURRENTES
// ============================================================================

import { supabase } from "@/lib/supabase/client";

/**
 * Crear un egreso recurrente
 * @param {Object} egresoData - Datos del egreso
 */
export async function crearEgreso(egresoData) {
  try {
    const { data: egreso, error: errorEgreso } = await supabase
      .from("egresos_recurrentes")
      .insert([
        {
          concepto: egresoData.concepto,
          categoria: egresoData.categoria,
          tipo_recurrencia: egresoData.tipo_recurrencia,
          monto_fijo:
            egresoData.tipo_recurrencia === "fijo"
              ? egresoData.monto_fijo
              : null,
          frecuencia: egresoData.frecuencia,
          dia_pago: egresoData.dia_pago,
          fecha_inicio: egresoData.fecha_inicio,
          fecha_fin: egresoData.fecha_fin || null,
          cantidad_pagos: egresoData.cantidad_pagos || null,
          activo: true,
          notas: egresoData.notas || null,
        },
      ])
      .select()
      .single();

    if (errorEgreso) throw errorEgreso;

    return { data: egreso, error: null };
  } catch (error) {
    console.error("Error al crear egreso:", error);
    return { data: null, error };
  }
}

/**
 * Obtener todos los egresos recurrentes
 * @param {boolean} soloActivos - Si true, solo devuelve egresos activos
 */
export async function getEgresos(soloActivos = false) {
  try {
    let query = supabase
      .from("egresos_recurrentes")
      .select(
        `
        *,
        pagos:pagos_egresos_recurrentes(*)
      `,
      )
      .order("created_at", { ascending: false });

    if (soloActivos) {
      query = query.eq("activo", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al obtener egresos:", error);
    return { data: null, error };
  }
}

/**
 * Obtener un egreso por ID con todos sus pagos
 * @param {string} id - ID del egreso
 */
export async function getEgreso(id) {
  try {
    const { data, error } = await supabase
      .from("egresos_recurrentes")
      .select(
        `
        *,
        pagos:pagos_egresos_recurrentes(*)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al obtener egreso:", error);
    return { data: null, error };
  }
}

/**
 * Actualizar un egreso recurrente
 * @param {string} id - ID del egreso
 * @param {Object} egresoData - Datos a actualizar
 */
export async function updateEgreso(id, egresoData) {
  try {
    const { data, error } = await supabase
      .from("egresos_recurrentes")
      .update(egresoData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al actualizar egreso:", error);
    return { data: null, error };
  }
}

/**
 * Activar/Desactivar un egreso
 * @param {string} id - ID del egreso
 * @param {boolean} activo - Nuevo estado
 */
export async function toggleEgreso(id, activo) {
  try {
    const { data, error } = await supabase
      .from("egresos_recurrentes")
      .update({ activo })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al cambiar estado del egreso:", error);
    return { data: null, error };
  }
}

/**
 * Registrar un pago de egreso
 * @param {Object} pagoData - Datos del pago
 */
export async function registrarPagoEgreso(pagoData) {
  try {
    // 1. Crear el registro de pago
    const { data: pago, error: errorPago } = await supabase
      .from("pagos_egresos_recurrentes")
      .insert([
        {
          egreso_recurrente_id: pagoData.egreso_recurrente_id,
          numero_pago: pagoData.numero_pago,
          fecha_programada: pagoData.fecha_programada,
          fecha_pago_real: new Date().toISOString(),
          monto_programado: pagoData.monto_programado,
          monto_real: pagoData.monto_real,
          estado: "pagado",
          metodo_pago: pagoData.metodo_pago,
          comprobante_url: pagoData.comprobante_url || null,
          notas: pagoData.notas || null,
        },
      ])
      .select()
      .single();

    if (errorPago) throw errorPago;

    // 2. Crear movimiento de egreso
    const { error: errorMovimiento } = await supabase
      .from("movimientos")
      .insert([
        {
          tipo: "egreso",
          categoria: "egreso_recurrente",
          monto: pagoData.monto_real,
          descripcion: `Pago #${pagoData.numero_pago} - ${pagoData.concepto}`,
          metodo_pago: pagoData.metodo_pago,
          relacionado_tipo: "egreso_recurrente",
          relacionado_id: pagoData.egreso_recurrente_id,
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
 * Obtener pagos de un período específico con su estado real
 * @param {number} mes - Mes (1-12)
 * @param {number} anio - Año
 */
export async function getPagosPeriodo(mes, anio) {
  try {
    const inicioMes = new Date(anio, mes - 1, 1);
    const finMes = new Date(anio, mes, 0);

    // Obtener egresos activos
    const { data: egresos, error } = await supabase
      .from("egresos_recurrentes")
      .select(
        `
        *,
        pagos:pagos_egresos_recurrentes(*)
      `,
      )
      .eq("activo", true);

    if (error) throw error;

    const pagosPeriodo = [];

    for (const egreso of egresos) {
      // Calcular cuántos pagos debe haber hasta este mes
      const fechaInicio = new Date(egreso.fecha_inicio);

      if (fechaInicio > finMes) {
        continue; // El egreso aún no ha comenzado
      }

      // Verificar si ya terminó por fecha fin
      if (egreso.fecha_fin && new Date(egreso.fecha_fin) < inicioMes) {
        continue;
      }

      // Verificar si ya completó todos los pagos programados
      const pagosPagados =
        egreso.pagos?.filter((p) => p.estado === "pagado").length || 0;
      if (egreso.cantidad_pagos && pagosPagados >= egreso.cantidad_pagos) {
        continue; // Ya completó todos los pagos
      }

      // Calcular la fecha de pago de este mes
      let fechaPagoMes = new Date(fechaInicio);

      while (fechaPagoMes < inicioMes) {
        switch (egreso.frecuencia) {
          case "mensual":
            fechaPagoMes.setMonth(fechaPagoMes.getMonth() + 1);
            break;
          case "quincenal":
            fechaPagoMes.setDate(fechaPagoMes.getDate() + 15);
            break;
          case "semanal":
            fechaPagoMes.setDate(fechaPagoMes.getDate() + 7);
            break;
          case "bimestral":
            fechaPagoMes.setMonth(fechaPagoMes.getMonth() + 2);
            break;
          case "trimestral":
            fechaPagoMes.setMonth(fechaPagoMes.getMonth() + 3);
            break;
          case "semestral":
            fechaPagoMes.setMonth(fechaPagoMes.getMonth() + 6);
            break;
          case "anual":
            fechaPagoMes.setFullYear(fechaPagoMes.getFullYear() + 1);
            break;
        }
      }

      // Verificar si este pago cae en el mes seleccionado
      if (fechaPagoMes >= inicioMes && fechaPagoMes <= finMes) {
        // Calcular número de pago basado en la fecha
        let numeroPago = 1;
        let fechaTemporal = new Date(egreso.fecha_inicio);

        while (fechaTemporal < fechaPagoMes) {
          numeroPago++;
          switch (egreso.frecuencia) {
            case "mensual":
              fechaTemporal.setMonth(fechaTemporal.getMonth() + 1);
              break;
            case "quincenal":
              fechaTemporal.setDate(fechaTemporal.getDate() + 15);
              break;
            case "semanal":
              fechaTemporal.setDate(fechaTemporal.getDate() + 7);
              break;
            case "bimestral":
              fechaTemporal.setMonth(fechaTemporal.getMonth() + 2);
              break;
            case "trimestral":
              fechaTemporal.setMonth(fechaTemporal.getMonth() + 3);
              break;
            case "semestral":
              fechaTemporal.setMonth(fechaTemporal.getMonth() + 6);
              break;
            case "anual":
              fechaTemporal.setFullYear(fechaTemporal.getFullYear() + 1);
              break;
          }
        }

        // Verificar si este número de pago ya excede la cantidad programada
        if (egreso.cantidad_pagos && numeroPago > egreso.cantidad_pagos) {
          continue; // Este pago ya no debería existir
        }

        // Buscar si ya existe este pago registrado
        const pagoExistente = egreso.pagos?.find(
          (p) =>
            new Date(p.fecha_programada).getMonth() ===
              fechaPagoMes.getMonth() &&
            new Date(p.fecha_programada).getFullYear() ===
              fechaPagoMes.getFullYear(),
        );

        const hoy = new Date();
        let estado = "pendiente";
        let diasParaVencer = Math.ceil(
          (fechaPagoMes - hoy) / (1000 * 60 * 60 * 24),
        );

        if (pagoExistente) {
          estado = pagoExistente.estado;
        } else {
          // Calcular estado basado en fecha
          if (diasParaVencer < 0) {
            estado = "atrasado";
          } else if (diasParaVencer === 0) {
            estado = "vence_hoy";
          } else if (diasParaVencer <= 3) {
            estado = "proximo";
          } else {
            estado = "pendiente";
          }
        }

        pagosPeriodo.push({
          egreso_id: egreso.id,
          concepto: egreso.concepto,
          categoria: egreso.categoria,
          tipo_recurrencia: egreso.tipo_recurrencia,
          monto_programado:
            egreso.tipo_recurrencia === "fijo" ? egreso.monto_fijo : 0,
          fecha_programada: fechaPagoMes.toISOString(),
          numero_pago: numeroPago,
          estado: estado,
          pago_id: pagoExistente?.id || null,
          monto_real: pagoExistente?.monto_real || null,
          fecha_pago_real: pagoExistente?.fecha_pago_real || null,
          dias_para_vencer: diasParaVencer,
        });
      }
    }

    // Ordenar por fecha
    pagosPeriodo.sort(
      (a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada),
    );

    return { data: pagosPeriodo, error: null };
  } catch (error) {
    console.error("Error al obtener pagos del período:", error);
    return { data: null, error };
  }
}

/**
 * Obtener próximos pagos pendientes
 * @param {number} dias - Número de días hacia adelante
 */
export async function getProximosPagos(dias = 30) {
  try {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();

    // Usar la función de período para obtener pagos
    const { data: todosPagos, error } = await getPagosPeriodo(mes, anio);

    if (error) throw error;

    // Filtrar solo los próximos días
    const futuro = new Date();
    futuro.setDate(futuro.getDate() + dias);

    const proximosPagos =
      todosPagos?.filter((pago) => {
        const fechaPago = new Date(pago.fecha_programada);
        return (
          fechaPago >= hoy && fechaPago <= futuro && pago.estado !== "pagado"
        );
      }) || [];

    return { data: proximosPagos, error: null };
  } catch (error) {
    console.error("Error al obtener próximos pagos:", error);
    return { data: null, error };
  }
}

/**
 * Obtener total de egresos del mes
 * @param {number} mes - Mes (1-12)
 * @param {number} anio - Año
 */
export async function getTotalEgresosMes(mes, anio) {
  try {
    const inicioMes = new Date(anio, mes - 1, 1);
    const finMes = new Date(anio, mes, 0);

    const { data, error } = await supabase
      .from("pagos_egresos_recurrentes")
      .select("monto_real")
      .eq("estado", "pagado")
      .gte("fecha_pago_real", inicioMes.toISOString())
      .lte("fecha_pago_real", finMes.toISOString());

    if (error) throw error;

    const total =
      data?.reduce((sum, p) => sum + parseFloat(p.monto_real), 0) || 0;

    return { data: total, error: null };
  } catch (error) {
    console.error("Error al obtener total de egresos:", error);
    return { data: 0, error };
  }
}

/**
 * Eliminar un egreso (solo si no tiene pagos)
 * @param {string} id - ID del egreso
 */
export async function deleteEgreso(id) {
  try {
    // Verificar si tiene pagos
    const { count } = await supabase
      .from("pagos_egresos_recurrentes")
      .select("*", { count: "exact", head: true })
      .eq("egreso_recurrente_id", id);

    if (count > 0) {
      return {
        data: null,
        error: {
          message:
            "No se puede eliminar un egreso que tiene pagos registrados. Puedes desactivarlo en su lugar.",
        },
      };
    }

    const { error } = await supabase
      .from("egresos_recurrentes")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error) {
    console.error("Error al eliminar egreso:", error);
    return { data: null, error };
  }
}
