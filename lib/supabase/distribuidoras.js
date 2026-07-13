import { supabase } from "./client";

// Obtener todas las distribuidoras activas
export const getDistribuidoras = async () => {
  const { data, error } = await supabase
    .from("distribuidoras")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data;
};

// Obtener todas las distribuidoras incluyendo inactivas (para admin)
export const getDistribuidorasAdmin = async () => {
  const { data, error } = await supabase
    .from("distribuidoras")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data;
};

// Obtener una distribuidora por ID
export const getDistribuidoraById = async (id) => {
  const { data, error } = await supabase
    .from("distribuidoras")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Crear distribuidora
export const createDistribuidora = async (distribuidoraData) => {
  const { data, error } = await supabase
    .from("distribuidoras")
    .insert([
      {
        nombre: distribuidoraData.nombre,
        telefono: distribuidoraData.telefono || null,
        porcentaje_comision:
          parseFloat(distribuidoraData.porcentaje_comision) || 0,
        notas: distribuidoraData.notas || null,
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Actualizar distribuidora
export const updateDistribuidora = async (id, distribuidoraData) => {
  const { data, error } = await supabase
    .from("distribuidoras")
    .update({
      nombre: distribuidoraData.nombre,
      telefono: distribuidoraData.telefono || null,
      porcentaje_comision:
        parseFloat(distribuidoraData.porcentaje_comision) || 0,
      notas: distribuidoraData.notas || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Activar/desactivar distribuidora
export const toggleDistribuidora = async (id, activo) => {
  const { data, error } = await supabase
    .from("distribuidoras")
    .update({ activo: !activo, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Obtener las ventas de una distribuidora con info de comisiones
export const getVentasDistribuidora = async (idDistribuidora) => {
  const { data, error } = await supabase
    .from("ventas")
    .select(
      `
      id, fecha, total, comision_monto, comision_pagada,
      cliente:clientes(nombre),
      detalle:ventas_detalle(cantidad)
    `,
    )
    .eq("id_distribuidora", idDistribuidora)
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Marcar la comisión de una venta como pagada o pendiente
export const marcarComisionPagada = async (idVenta, pagada) => {
  const { data, error } = await supabase
    .from("ventas")
    .update({ comision_pagada: pagada, updated_at: new Date().toISOString() })
    .eq("id", idVenta)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Marcar todas las comisiones pendientes de una distribuidora como pagadas
export const marcarTodasComisionesPagadas = async (idDistribuidora) => {
  const { error } = await supabase
    .from("ventas")
    .update({ comision_pagada: true, updated_at: new Date().toISOString() })
    .eq("id_distribuidora", idDistribuidora)
    .eq("comision_pagada", false);

  if (error) throw error;
  return true;
};
