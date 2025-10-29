import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========== FUNCIONES PARA PRODUCTOS ==========

// Obtener todos los productos activos con sus conjuntos
export const getProductos = async (filters = {}) => {
  let query = supabase
    .from('productos')
    .select('*, conjunto:conjuntos(*), factor:factores(*)')
    .eq('activo', true)
    .gt('stock', 0)
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

  // NO FILTRAR POR PRECIO EN LA QUERY - lo haremos después
  // porque el precio se calcula dinámicamente

  const { data, error } = await query;
  
  if (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
  
  // Filtrar por precio después de obtener los datos (ya que el precio se calcula)
  let productosFiltrados = data;
  
  if (filters.precioMin || filters.precioMax) {
    productosFiltrados = data.filter(producto => {
      // Calcular precio
      if (!producto.peso || !producto.factor || !producto.factor.valor) return false;
      
      const precioCalculado = parseFloat(producto.peso) * parseFloat(producto.factor.valor);
      const precioFinal = Math.ceil(precioCalculado / 5) * 5;
      
      // Aplicar filtros de precio
      if (filters.precioMin && precioFinal < parseFloat(filters.precioMin)) return false;
      if (filters.precioMax && precioFinal > parseFloat(filters.precioMax)) return false;
      
      return true;
    });
  }
  
  return productosFiltrados;
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
  
  // Convertir a array
  const conjuntosArray = Object.values(conjuntos);
  
  // Ordenar: conjuntos normales primero, charms al final
  conjuntosArray.sort((a, b) => {
    const aEsCharm = a.nombre.toLowerCase().includes('charm');
    const bEsCharm = b.nombre.toLowerCase().includes('charm');
    
    if (aEsCharm && !bEsCharm) return 1;  // a (charm) va después de b
    if (!aEsCharm && bEsCharm) return -1; // b (charm) va después de a
    return 0; // mantener orden original
  });
  
  return {
    conjuntos: conjuntosArray,
    productosSueltos
  };
};

// Obtener un producto por ID
export const getProductoById = async (id) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*, conjunto:conjuntos(*), factor:factores(*)')
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

// ========== FUNCIONES PARA FACTORES ==========

// Obtener todos los factores
export const getFactores = async () => {
  const { data, error } = await supabase
    .from('factores')
    .select('*')
    .eq('activo', true)  // Solo factores activos
    .order('nombre', { ascending: true });  // Ordenar por nombre, no por material

  if (error) {
    console.error('Error al obtener factores:', error);
    throw error;
  }

  return data;
};

// Obtener un factor por ID
export const getFactorById = async (id) => {
  const { data, error } = await supabase
    .from('factores')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al obtener factor:', error);
    throw error;
  }

  return data;
};

// Crear un nuevo factor
export const createFactor = async (factorData) => {
  const { data, error } = await supabase
    .from('factores')
    .insert([{
      nombre: factorData.nombre,  // Cambiar de material a nombre
      valor: factorData.valor,
      activo: true,  // Por defecto activo
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('Error al crear factor:', error);
    throw error;
  }

  return data;
};

// Actualizar un factor
export const updateFactor = async (id, factorData) => {
  const { data, error } = await supabase
    .from('factores')
    .update({
      valor: factorData.valor,
      nombre: factorData.nombre,  // Permitir actualizar nombre también
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar factor:', error);
    throw error;
  }

  return data;
};

// Eliminar un factor
export const deleteFactor = async (id) => {
  const { data, error } = await supabase
    .from('factores')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al eliminar factor:', error);
    throw error;
  }

  return data;
};