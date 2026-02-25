"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { formatPrice } from "@/utils/formatters";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Image from "next/image";
import {
  TIPOS_PRODUCTO,
  CATEGORIAS_PRODUCTO,
  MATERIALES_PRODUCTO,
} from "@/lib/constants";

export default function ProductosAdminPage() {
  const [productos, setProductos] = useState([]);
  const [conjuntos, setConjuntos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Estado del modal de imagen
  const [modalImagen, setModalImagen] = useState(null); // { url, nombre }

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    tipo: "",
    categoria: "",
    material: "",
    conjuntoId: "",
    precioMin: "",
    precioMax: "",
  });

  useEffect(() => {
    fetchConjuntos();
  }, []);

  // Cerrar modal con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setModalImagen(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchConjuntos = async () => {
    try {
      const { data, error } = await supabase
        .from("conjuntos")
        .select("id, nombre")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setConjuntos(data || []);
    } catch (error) {
      console.error("Error al cargar conjuntos:", error);
    }
  };

  const calcularPrecio = (peso, factor) => {
    if (!peso || !factor || !factor.valor) return 0;
    return parseFloat(peso) * parseFloat(factor.valor);
  };

  const redondearPrecio = (precio) => {
    if (!precio || precio === 0) return 0;
    return Math.ceil(precio / 5) * 5;
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      setHasSearched(true);

      let allData = [];
      let from = 0;
      const pageSize = 1000;

      while (true) {
        let query = supabase
          .from("productos")
          .select(`*, conjunto:conjuntos(*), factor:factores(*)`)
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
        if (filtros.categoria) query = query.eq("categoria", filtros.categoria);
        if (filtros.material) query = query.eq("material", filtros.material);
        if (filtros.conjuntoId)
          query = query.eq("id_conjunto", filtros.conjuntoId);

        const { data, error } = await query;
        if (error) throw error;

        allData = [...allData, ...data];
        if (data.length < pageSize) break;
        from += pageSize;
      }

      // Filtrar por precio sobre TODOS los datos
      let productosFiltrados = allData;

      if (filtros.precioMin || filtros.precioMax) {
        productosFiltrados = allData.filter((producto) => {
          const precio = redondearPrecio(
            calcularPrecio(producto.peso, producto.factor),
          );
          const min = filtros.precioMin ? parseFloat(filtros.precioMin) : 0;
          const max = filtros.precioMax
            ? parseFloat(filtros.precioMax)
            : Infinity;
          return precio >= min && precio <= max;
        });
      }

      setProductos(productosFiltrados);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      alert("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipo: "",
      categoria: "",
      material: "",
      conjuntoId: "",
      precioMin: "",
      precioMax: "",
    });
    setProductos([]);
    setHasSearched(false);
  };

  const handleDelete = async (id, codigo) => {
    if (!confirm(`¿Estás seguro de eliminar el producto ${codigo}?`)) return;

    try {
      const { error } = await supabase.from("productos").delete().eq("id", id);
      if (error) throw error;
      alert("Producto eliminado exitosamente");
      fetchProductos();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert("Error al eliminar el producto");
    }
  };

  const toggleActivo = async (id, activo) => {
    try {
      const { error } = await supabase
        .from("productos")
        .update({ activo: !activo })
        .eq("id", id);
      if (error) throw error;
      fetchProductos();
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      alert("Error al actualizar el producto");
    }
  };

  return (
    <div className="mx-auto px-4 py-12">
      {/* Modal de imagen */}
      {modalImagen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setModalImagen(null)}
        >
          <div
            className="relative max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setModalImagen(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Imagen */}
            <div className="relative w-full aspect-square bg-gray-100">
              <Image
                src={modalImagen.url}
                alt={modalImagen.nombre}
                fill
                className="object-contain"
                sizes="(max-width: 672px) 100vw, 672px"
              />
            </div>

            {/* Nombre del producto */}
            <div className="bg-white px-4 py-3 text-center">
              <p className="text-sm text-gray-700 font-light tracking-wide">
                {modalImagen.nombre}
              </p>
              {modalImagen.codigo && (
                <p className="text-xs text-gray-400 mt-1">
                  {modalImagen.codigo}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="font-elegant text-4xl font-light text-gray-900">
          Productos
        </h1>
        <Link
          href="/admin/productos/nuevo"
          className="px-6 py-3 bg-gray-900 text-white text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors"
        >
          Nuevo Producto
        </Link>
      </div>

      {/* Sección de Filtros */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="font-elegant text-2xl font-light text-gray-900 mb-4">
          Filtros de Búsqueda
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          {/* Filtro Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => handleFiltroChange("tipo", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Todos los tipos</option>
              {TIPOS_PRODUCTO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={filtros.categoria}
              onChange={(e) => handleFiltroChange("categoria", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIAS_PRODUCTO.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material
            </label>
            <select
              value={filtros.material}
              onChange={(e) => handleFiltroChange("material", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Todos los materiales</option>
              {MATERIALES_PRODUCTO.map((mat) => (
                <option key={mat.value} value={mat.value}>
                  {mat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Conjunto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conjunto
            </label>
            <select
              value={filtros.conjuntoId}
              onChange={(e) => handleFiltroChange("conjuntoId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Todos los conjuntos</option>
              {conjuntos.map((conjunto) => (
                <option key={conjunto.id} value={conjunto.id}>
                  {conjunto.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Precio Mínimo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Mínimo
            </label>
            <input
              type="number"
              value={filtros.precioMin}
              onChange={(e) => handleFiltroChange("precioMin", e.target.value)}
              placeholder="$0.00"
              min="0"
              step="5"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          {/* Filtro Precio Máximo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Máximo
            </label>
            <input
              type="number"
              value={filtros.precioMax}
              onChange={(e) => handleFiltroChange("precioMax", e.target.value)}
              placeholder="$999.99"
              min="0"
              step="5"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4">
          <button
            onClick={fetchProductos}
            disabled={loading}
            className="px-6 py-3 bg-gray-900 text-white text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Buscando..." : "Buscar Productos"}
          </button>
          <button
            onClick={limpiarFiltros}
            className="px-6 py-3 border border-gray-300 text-gray-700 text-sm uppercase tracking-wider hover:bg-gray-50 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <LoadingSpinner />
      ) : !hasSearched ? (
        <div className="bg-white p-12 text-center border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-gray-600 text-lg mb-2">
            Utiliza los filtros para buscar productos
          </p>
          <p className="text-gray-500 text-sm">
            Selecciona uno o más filtros y presiona Buscar Productos
          </p>
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-white p-12 text-center border border-gray-200">
          <p className="text-gray-600 mb-4">
            No se encontraron productos con los filtros seleccionados
          </p>
          <button
            onClick={limpiarFiltros}
            className="text-gray-900 underline hover:no-underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Se encontraron{" "}
              <span className="font-medium text-gray-900">
                {productos.length}
              </span>{" "}
              {productos.length === 1 ? "producto" : "productos"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Imagen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Talla
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Peso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Factor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Precio Final
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Conjunto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productos.map((producto) => {
                  const precio = calcularPrecio(producto.peso, producto.factor);

                  return (
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="relative w-48 h-48 bg-gray-100">
                          {producto.imagen_url ? (
                            <>
                              <Image
                                src={producto.imagen_url}
                                alt={producto.nombre_comercial}
                                fill
                                className="object-cover"
                                sizes="192px"
                              />
                              {/* Overlay con lupa al hacer hover */}
                              <button
                                onClick={() =>
                                  setModalImagen({
                                    url: producto.imagen_url,
                                    nombre: producto.nombre_comercial,
                                    codigo: producto.codigo,
                                  })
                                }
                                className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all duration-200 flex items-center justify-center group"
                              >
                                <svg
                                  className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.5"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                  />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1"
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                ></path>
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {producto.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {producto.nombre_comercial}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {producto.descripcion}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {producto.material}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {producto.talla || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {producto.peso ? `${producto.peso}g` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {producto.factor?.nombre || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {precio > 0 ? formatPrice(precio) : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {precio > 0 ? (
                          <span className="text-green-700 bg-green-50 px-2 py-1 rounded">
                            {formatPrice(redondearPrecio(precio))}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs ${
                            producto.stock > 5
                              ? "bg-green-100 text-green-800"
                              : producto.stock > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {producto.stock}{" "}
                          {producto.stock === 1 ? "unidad" : "unidades"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {producto.conjunto?.nombre || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            toggleActivo(producto.id, producto.activo)
                          }
                          className={`px-3 py-1 text-xs uppercase tracking-wider ${
                            producto.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {producto.activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <Link
                          href={`/admin/productos/${producto.id}/editar`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(producto.id, producto.codigo)
                          }
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
