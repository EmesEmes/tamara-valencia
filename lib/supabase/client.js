import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========== HELPER DE ERRORES ==========

const handleSupabaseError = (context, error) => {
  console.error(`[Supabase] ${context}:`, error.message);
  throw new Error(`${context}: ${error.message}`);
};

// ========== FUNCIONES PARA PRODUCTOS ==========

// Obtener todos los productos activos con sus conjuntos
// FIX: Paginación para soportar más de 1,000 productos
export const getProductos = async (filters = {}) => {
  let allData = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    let query = supabase
      .from("productos")
      .select("*, conjunto:conjuntos(*), factor:factores(*)")
      .eq("activo", true)
      .gt("stock", 0)
      .order("id_conjunto", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (filters.tipo) query = query.eq("tipo", filters.tipo);
    if (filters.categoria) query = query.eq("categoria", filters.categoria);
    if (filters.material) query = query.eq("material", filters.material);
    if (filters.conjunto) query = query.eq("id_conjunto", filters.conjunto);

    const { data, error } = await query;
    if (error) handleSupabaseError("getProductos", error);

    allData = [...allData, ...data];
    if (data.length < pageSize) break;
    from += pageSize;
  }

  // Filtrar por precio después de obtener los datos (precio se calcula dinámicamente)
  if (filters.precioMin || filters.precioMax) {
    return allData.filter((producto) => {
      if (!producto.peso || !producto.factor?.valor) return false;

      const precioCalculado =
        parseFloat(producto.peso) * parseFloat(producto.factor.valor);
      const precioFinal = Math.ceil(precioCalculado / 5) * 5;

      if (filters.precioMin && precioFinal < parseFloat(filters.precioMin))
        return false;
      if (filters.precioMax && precioFinal > parseFloat(filters.precioMax))
        return false;

      return true;
    });
  }

  return allData;
};

// Obtener productos agrupados por conjunto
export const getProductosAgrupados = async (filters = {}) => {
  const productos = await getProductos(filters);

  const conjuntos = {};
  const productosSueltos = [];

  productos.forEach((producto) => {
    if (producto.id_conjunto && producto.conjunto) {
      const conjuntoId = producto.id_conjunto;
      if (!conjuntos[conjuntoId]) {
        conjuntos[conjuntoId] = {
          ...producto.conjunto,
          productos: [],
        };
      }
      conjuntos[conjuntoId].productos.push(producto);
    } else {
      productosSueltos.push(producto);
    }
  });

  const conjuntosArray = Object.values(conjuntos);

  // Ordenar: conjuntos normales primero, charms al final
  conjuntosArray.sort((a, b) => {
    const aEsCharm = a.nombre.toLowerCase().includes("charm");
    const bEsCharm = b.nombre.toLowerCase().includes("charm");

    if (aEsCharm && !bEsCharm) return 1;
    if (!aEsCharm && bEsCharm) return -1;
    return 0;
  });

  return {
    conjuntos: conjuntosArray,
    productosSueltos,
  };
};

// Obtener un producto por ID
export const getProductoById = async (id) => {
  const { data, error } = await supabase
    .from("productos")
    .select("*, conjunto:conjuntos(*), factor:factores(*)")
    .eq("id", id)
    .single();

  if (error) handleSupabaseError("getProductoById", error);
  return data;
};

// Obtener productos del mismo conjunto
// FIX: Agregado join con factor y conjunto para que el precio sea calculable
export const getProductosPorConjunto = async (conjuntoId) => {
  const { data, error } = await supabase
    .from("productos")
    .select("*, factor:factores(*), conjunto:conjuntos(*)")
    .eq("id_conjunto", conjuntoId)
    .eq("activo", true);

  if (error) handleSupabaseError("getProductosPorConjunto", error);
  return data;
};

// ========== FUNCIONES PARA CONJUNTOS ==========

export const getConjuntos = async () => {
  const { data, error } = await supabase
    .from("conjuntos")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  if (error) handleSupabaseError("getConjuntos", error);
  return data;
};

// FIX: Agregado join con factor para que los productos del conjunto tengan precio calculable
export const getConjuntoById = async (id) => {
  const { data, error } = await supabase
    .from("conjuntos")
    .select("*, productos:productos(*, factor:factores(*))")
    .eq("id", id)
    .single();

  if (error) handleSupabaseError("getConjuntoById", error);
  return data;
};

// ========== FUNCIONES PARA FACTORES ==========

export const getFactores = async () => {
  const { data, error } = await supabase
    .from("factores")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) handleSupabaseError("getFactores", error);
  return data;
};

export const getFactorById = async (id) => {
  const { data, error } = await supabase
    .from("factores")
    .select("*")
    .eq("id", id)
    .single();

  if (error) handleSupabaseError("getFactorById", error);
  return data;
};

export const createFactor = async (factorData) => {
  const { data, error } = await supabase
    .from("factores")
    .insert([
      {
        nombre: factorData.nombre,
        valor: factorData.valor,
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) handleSupabaseError("createFactor", error);
  return data;
};

export const updateFactor = async (id, factorData) => {
  const { data, error } = await supabase
    .from("factores")
    .update({
      valor: factorData.valor,
      nombre: factorData.nombre,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) handleSupabaseError("updateFactor", error);
  return data;
};

// FIX: Validación antes de borrar para evitar productos huérfanos sin factor
export const deleteFactor = async (id) => {
  // Verificar si hay productos usando este factor
  const { count, error: countError } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true })
    .eq("id_factor", id);

  if (countError)
    handleSupabaseError("deleteFactor (verificación)", countError);

  if (count > 0) {
    throw new Error(
      `No se puede eliminar este factor porque ${count} producto${count !== 1 ? "s lo usan" : " lo usa"}. Reasigna o elimina esos productos primero.`,
    );
  }

  const { data, error } = await supabase
    .from("factores")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) handleSupabaseError("deleteFactor", error);
  return data;
};
