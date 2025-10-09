"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  TIPOS_PRODUCTO,
  CATEGORIAS_PRODUCTO,
  MATERIALES_PRODUCTO,
} from "@/lib/constants";
import ImageUploader from "./ImageUploader";

export default function ProductForm({ producto = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [conjuntos, setConjuntos] = useState([]);
  const [formData, setFormData] = useState({
    codigo: "",
    tipo: "",
    categoria: "",
    nombre_comercial: "",
    material: "",
    peso: "",
    precio: "",
    descripcion: "",
    id_conjunto: "",
    activo: true,
    imagen_url: "",
    imagen_public_id: "",
    stock: 1,
  });

  useEffect(() => {
    fetchConjuntos();
    if (producto) {
      setFormData({
        codigo: producto.codigo || "",
        tipo: producto.tipo || "",
        categoria: producto.categoria || "",
        nombre_comercial: producto.nombre_comercial || "",
        material: producto.material || "",
        peso: producto.peso || "",
        precio: producto.precio || "",
        descripcion: producto.descripcion || "",
        id_conjunto: producto.id_conjunto || "",
        activo: producto.activo ?? true,
        imagen_url: producto.imagen_url || "",
        imagen_public_id: producto.imagen_public_id || "",
        stock: producto.stock ?? 1,
      });
    }
  }, [producto]);

  const fetchConjuntos = async () => {
    try {
      const { data, error } = await supabase
        .from("conjuntos")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setConjuntos(data);
    } catch (error) {
      console.error("Error al cargar conjuntos:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageUpload = (imageUrl, publicId) => {
    setFormData({
      ...formData,
      imagen_url: imageUrl,
      imagen_public_id: publicId,
    });
  };

  const validateCodigo = async (codigo) => {
    // Si estamos editando y el código no cambió, no validar
    if (producto && producto.codigo === codigo) {
      return true;
    }

    const { data, error } = await supabase
      .from("productos")
      .select("codigo")
      .eq("codigo", codigo)
      .single();

    return !data; // Retorna true si NO existe
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar código duplicado
      const codigoValido = await validateCodigo(formData.codigo);
      if (!codigoValido) {
        alert("El código ya existe. Por favor, usa otro código.");
        setLoading(false);
        return;
      }

      const dataToSave = {
        ...formData,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        id_conjunto: formData.id_conjunto || null,
      };

      let error;

      if (producto) {
        // Actualizar
        const result = await supabase
          .from("productos")
          .update(dataToSave)
          .eq("id", producto.id);
        error = result.error;
      } else {
        // Crear
        const result = await supabase.from("productos").insert([dataToSave]);
        error = result.error;
      }

      if (error) throw error;

      alert(
        producto
          ? "Producto actualizado exitosamente"
          : "Producto creado exitosamente"
      );
      router.push("/admin/productos");
    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert("Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 border border-gray-200">
        <h2 className="text-xl font-light text-gray-900 mb-6">
          Información Básica
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
              Código *
            </label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
              placeholder="TV-001"
            />
          </div>

          <div>
            <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
              Nombre Comercial *
            </label>
            <input
              type="text"
              name="nombre_comercial"
              value={formData.nombre_comercial}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
              placeholder="Anillo de Perlas"
            />
          </div>

          <div>
            <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
              Tipo *
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
            >
              <option value="">Seleccionar</option>
              {TIPOS_PRODUCTO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
              Categoría *
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
            >
              <option value="">Seleccionar</option>
              {CATEGORIAS_PRODUCTO.map((categoria) => (
                <option key={categoria.value} value={categoria.value}>
                  {categoria.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
              Material *
            </label>
            <select
              name="material"
              value={formData.material}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
            >
              <option value="">Seleccionar</option>
              {MATERIALES_PRODUCTO.map((material) => (
                <option key={material.value} value={material.value}>
                  {material.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
              Conjunto
            </label>
            <select
              name="id_conjunto"
              value={formData.id_conjunto}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
            >
              <option value="">Sin conjunto</option>
              {conjuntos.map((conjunto) => (
                <option key={conjunto.id} value={conjunto.id}>
                  {conjunto.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
              Peso (gramos)
            </label>
            <input
              type="number"
              name="peso"
              value={formData.peso}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
              placeholder="2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
              Stock *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
              placeholder="1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Cantidad disponible en inventario
            </p>
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
              Precio * ($)
            </label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
              placeholder="150.00"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500 resize-none"
            placeholder="Descripción detallada del producto..."
          ></textarea>
        </div>

        <div className="mt-6 flex items-center">
          <input
            type="checkbox"
            name="activo"
            checked={formData.activo}
            onChange={handleChange}
            className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-0"
          />
          <label className="ml-2 text-sm text-gray-700">
            Producto activo (visible en el catálogo)
          </label>
        </div>
      </div>

      <div className="bg-white p-6 border border-gray-200">
        <h2 className="text-xl font-light text-gray-900 mb-6">
          Imagen del Producto
        </h2>
        <ImageUploader
          currentImage={formData.imagen_url}
          onImageUpload={handleImageUpload}
          productCode={formData.codigo}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.push("/admin/productos")}
          className="px-6 py-3 border border-gray-300 text-gray-700 text-sm uppercase tracking-wider hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gray-900 text-white text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading
            ? "Guardando..."
            : producto
            ? "Actualizar"
            : "Crear Producto"}
        </button>
      </div>
    </form>
  );
}
