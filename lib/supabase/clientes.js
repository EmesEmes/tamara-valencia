import { supabase } from "./client";

// Obtener todos los clientes activos
export const getClientes = async () => {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data;
};

// Obtener todos los clientes incluyendo inactivos (para admin)
export const getClientesAdmin = async () => {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data;
};

// Buscar clientes por nombre o teléfono (para el buscador en ventas)
export const buscarClientes = async (termino) => {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("activo", true)
    .or(`nombre.ilike.%${termino}%,telefono.ilike.%${termino}%`)
    .order("nombre", { ascending: true })
    .limit(10);

  if (error) throw error;
  return data;
};

// Obtener un cliente por ID
export const getClienteById = async (id) => {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Crear cliente
export const createCliente = async (clienteData) => {
  const { data, error } = await supabase
    .from("clientes")
    .insert([
      {
        nombre: clienteData.nombre,
        telefono: clienteData.telefono || null,
        email: clienteData.email || null,
        cedula: clienteData.cedula || null,
        notas: clienteData.notas || null,
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

// Actualizar cliente
export const updateCliente = async (id, clienteData) => {
  const { data, error } = await supabase
    .from("clientes")
    .update({
      nombre: clienteData.nombre,
      telefono: clienteData.telefono || null,
      email: clienteData.email || null,
      cedula: clienteData.cedula || null,
      notas: clienteData.notas || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Activar/desactivar cliente
export const toggleCliente = async (id, activo) => {
  const { data, error } = await supabase
    .from("clientes")
    .update({ activo: !activo, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
