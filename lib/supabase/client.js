import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========== FUNCIONES PARA PRODUCTOS ==========

// Obtener todos los productos activos con sus conjuntos
export const getProductos = async (filters = {}) => {
  let query = supabase
    .from('productos')
    .select('*, conjunto:conjuntos(*)')
    .eq('activo', true)
    .gt('stock', 0) // Solo productos con stock mayor a 0
    .order('id_conjunto', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  // Aplicar filtros si existen
  if (filters.tipo) {
    query = query.eq('tipo', filters.tipo);
  }
  
  if (filters.categoria) {
    query = query.eq('categoria', filters.categoria);
  }
  
  if (filters.material) {
    query = query.eq('material', filters.material);
  }

  if (filters.precioMin) {
    query = query.gte('precio', filters.precioMin);
  }

  if (filters.precioMax) {
    query = query.lte('precio', filters.precioMax);
  }

  if (filters.mostrarAgotados === false) {
    query = query.gt('stock', 0);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
  
  return data;
};

// Obtener productos agrupados por conjunto
export const getProductosAgrupados = async (filters = {}) => {
  const productos = await getProductos(filters);
  
  // Agrupar productos por conjunto
  const conjuntos = {};
  const productosSueltos = [];
  
  productos.forEach(producto => {
    if (producto.id_conjunto && producto.conjunto) {
      const conjuntoId = producto.id_conjunto;
      if (!conjuntos[conjuntoId]) {
        conjuntos[conjuntoId] = {
          ...producto.conjunto,
          productos: []
        };
      }
      conjuntos[conjuntoId].productos.push(producto);
    } else {
      productosSueltos.push(producto);
    }
  });
  
  return {
    conjuntos: Object.values(conjuntos),
    productosSueltos
  };
};

// Obtener un producto por ID
export const getProductoById = async (id) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*, conjunto:conjuntos(*)')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error al obtener producto:', error);
    throw error;
  }
  
  return data;
};

// Obtener productos del mismo conjunto
export const getProductosPorConjunto = async (conjuntoId) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id_conjunto', conjuntoId)
    .eq('activo', true);
  
  if (error) {
    console.error('Error al obtener productos del conjunto:', error);
    throw error;
  }
  
  return data;
};

// ========== FUNCIONES PARA CONJUNTOS ==========

export const getConjuntos = async () => {
  const { data, error } = await supabase
    .from('conjuntos')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error al obtener conjuntos:', error);
    throw error;
  }
  
  return data;
};

export const getConjuntoById = async (id) => {
  const { data, error } = await supabase
    .from('conjuntos')
    .select('*, productos:productos(*)')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error al obtener conjunto:', error);
    throw error;
  }
  
  return data;
};