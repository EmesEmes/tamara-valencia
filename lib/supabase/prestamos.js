import { supabase } from "./client";

// Obtener todos los préstamos activos con info de la distribuidora
export const getPrestamos = async (estado = "activo") => {
  let query = supabase
    .from("prestamos")
    .select(
      `
      *,
      distribuidora:distribuidoras(id, nombre, telefono),
      detalle:prestamos_detalle(id, cantidad, estado_item)
    `,
    )
    .order("fecha_prestamo", { ascending: false });

  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Obtener un préstamo por ID con todo su detalle y productos
export const getPrestamoById = async (id) => {
  const { data, error } = await supabase
    .from("prestamos")
    .select(
      `
      *,
      distribuidora:distribuidoras(id, nombre, telefono, porcentaje_comision),
      detalle:prestamos_detalle(
        id, cantidad, estado_item, fecha_resolucion,
        producto:productos(id, codigo, nombre_comercial, material, peso, stock, imagen_url, factor:factores(valor, nombre))
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Crear un préstamo y descontar stock de cada producto
export const registrarPrestamo = async ({ id_distribuidora, notas, items }) => {
  // 1. Crear la cabecera del préstamo
  const { data: prestamo, error: prestamoError } = await supabase
    .from("prestamos")
    .insert([
      {
        id_distribuidora,
        fecha_prestamo: new Date().toISOString(),
        estado: "activo",
        notas: notas || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (prestamoError) throw prestamoError;

  // 2. Crear el detalle
  const detalleConPrestamo = items.map((item) => ({
    id_prestamo: prestamo.id,
    id_producto: item.id_producto,
    cantidad: item.cantidad,
    estado_item: "prestado",
    created_at: new Date().toISOString(),
  }));

  const { error: detalleError } = await supabase
    .from("prestamos_detalle")
    .insert(detalleConPrestamo);

  if (detalleError) throw detalleError;

  // 3. Descontar stock de cada producto
  for (const item of items) {
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

  return prestamo;
};

// Procesar items de un préstamo: devolver o marcar como vendido
// accion = 'devuelto' | 'vendido'
// En ambos casos el stock vuelve a subir (en "vendido" luego lo descuenta la venta)
export const procesarItemsPrestamo = async (itemIds, accion) => {
  for (const itemId of itemIds) {
    // Obtener el item con su producto
    const { data: item, error: itemError } = await supabase
      .from("prestamos_detalle")
      .select("id, id_producto, cantidad, estado_item, id_prestamo")
      .eq("id", itemId)
      .single();

    if (itemError) throw itemError;

    // Solo procesar items que sigan prestados
    if (item.estado_item !== "prestado") continue;

    // Devolver el stock al inventario
    const { data: producto, error: stockError } = await supabase
      .from("productos")
      .select("stock")
      .eq("id", item.id_producto)
      .single();

    if (stockError) throw stockError;

    const { error: updateStockError } = await supabase
      .from("productos")
      .update({ stock: producto.stock + item.cantidad })
      .eq("id", item.id_producto);

    if (updateStockError) throw updateStockError;

    // Actualizar el estado del item
    const { error: updateItemError } = await supabase
      .from("prestamos_detalle")
      .update({
        estado_item: accion,
        fecha_resolucion: new Date().toISOString(),
      })
      .eq("id", itemId);

    if (updateItemError) throw updateItemError;
  }

  // Verificar si el préstamo debe cerrarse (todos los items resueltos)
  if (itemIds.length > 0) {
    const { data: primerItem } = await supabase
      .from("prestamos_detalle")
      .select("id_prestamo")
      .eq("id", itemIds[0])
      .single();

    if (primerItem) {
      await verificarCierrePrestamo(primerItem.id_prestamo);
    }
  }

  return true;
};

// Cierra el préstamo si ya no quedan items en estado "prestado"
export const verificarCierrePrestamo = async (idPrestamo) => {
  const { data: items, error } = await supabase
    .from("prestamos_detalle")
    .select("estado_item")
    .eq("id_prestamo", idPrestamo);

  if (error) throw error;

  const quedanPrestados = items.some((i) => i.estado_item === "prestado");

  if (!quedanPrestados) {
    await supabase
      .from("prestamos")
      .update({ estado: "finalizado", updated_at: new Date().toISOString() })
      .eq("id", idPrestamo);
  }
};

// Devolver todos los items prestados de un préstamo de una sola vez
export const devolverTodo = async (idPrestamo) => {
  const { data: items, error } = await supabase
    .from("prestamos_detalle")
    .select("id")
    .eq("id_prestamo", idPrestamo)
    .eq("estado_item", "prestado");

  if (error) throw error;

  const itemIds = items.map((i) => i.id);
  if (itemIds.length > 0) {
    await procesarItemsPrestamo(itemIds, "devuelto");
  }

  return true;
};
