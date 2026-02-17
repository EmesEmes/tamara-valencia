import { supabase } from "@/lib/supabase/client";

/**
 * Obtener todos los vendedores
 * @param {boolean} soloActivos - Si es true, solo devuelve vendedores activos
 */
export async function getVendedores(soloActivos = false) {
  try {
    let query = supabase
      .from("vendedores")
      .select("*")
      .order("nombre", { ascending: true });

    if (soloActivos) {
      query = query.eq("activo", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al obtener vendedores:", error);
    return { data: null, error };
  }
}

/**
 * Obtener un vendedor por ID
 * @param {string} id - ID del vendedor
 */
export async function getVendedor(id) {
  try {
    const { data, error } = await supabase
      .from("vendedores")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al obtener vendedor:", error);
    return { data: null, error };
  }
}

/**
 * Crear un nuevo vendedor
 * @param {Object} vendedorData - Datos del vendedor
 */
export async function createVendedor(vendedorData) {
  try {
    const { data, error } = await supabase
      .from("vendedores")
      .insert([vendedorData])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al crear vendedor:", error);
    return { data: null, error };
  }
}

/**
 * Actualizar un vendedor
 * @param {string} id - ID del vendedor
 * @param {Object} vendedorData - Datos a actualizar
 */
export async function updateVendedor(id, vendedorData) {
  try {
    const { data, error } = await supabase
      .from("vendedores")
      .update(vendedorData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al actualizar vendedor:", error);
    return { data: null, error };
  }
}

/**
 * Eliminar (desactivar) un vendedor
 * @param {string} id - ID del vendedor
 */
export async function deleteVendedor(id) {
  try {
    // En lugar de eliminar, desactivamos
    const { data, error } = await supabase
      .from("vendedores")
      .update({ activo: false })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al eliminar vendedor:", error);
    return { data: null, error };
  }
}

/**
 * Reactivar un vendedor
 * @param {string} id - ID del vendedor
 */
export async function activarVendedor(id) {
  try {
    const { data, error } = await supabase
      .from("vendedores")
      .update({ activo: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error al activar vendedor:", error);
    return { data: null, error };
  }
}
