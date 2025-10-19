"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { formatPrice } from "@/utils/formatters";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Image from "next/image";

export default function ProductosAdminPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("productos")
        .select(
          `
          *,
          conjunto:conjuntos(*),
          factor:factores(*)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProductos(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularPrecio = (peso, factor) => {
    if (!peso || !factor || !factor.valor) return 0;
    return parseFloat(peso) * parseFloat(factor.valor);
  };

  const redondearPrecio = (precio) => {
    if (!precio || precio === 0) return 0;
    // Redondear hacia arriba al múltiplo de 5 más cercano
    return Math.ceil(precio / 5) * 5;
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mx-auto px-4 py-12">
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

      {productos.length === 0 ? (
        <div className="bg-white p-12 text-center border border-gray-200">
          <p className="text-gray-600 mb-4">No hay productos registrados</p>
          <Link
            href="/admin/productos/nuevo"
            className="text-gray-900 underline"
          >
            Crear primer producto
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden">
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
                    Tipo
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
                    Observaciones
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
                        <div className="relative w-16 h-16 bg-gray-100">
                          {producto.imagen_url ? (
                            <Image
                              src={producto.imagen_url}
                              alt={producto.nombre_comercial}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
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
                        {producto.tipo}
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
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        {producto.observaciones ? (
                          <span
                            className="line-clamp-2"
                            title={producto.observaciones}
                          >
                            {producto.observaciones}
                          </span>
                        ) : (
                          "-"
                        )}
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
