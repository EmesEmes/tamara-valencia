"use client";
import { useState, useEffect } from "react";
import {
  getProductoById,
  getProductosPorConjunto,
} from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/utils/formatters";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ProductCard from "./ProductCard";

export default function ProductDetail({ productId }) {
  const [producto, setProducto] = useState(null);
  const [productosConjunto, setProductosConjunto] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productoData = await getProductoById(productId);
        setProducto(productoData);

        // Si el producto pertenece a un conjunto, obtener los demás productos
        if (productoData.id_conjunto) {
          const otrosProductos = await getProductosPorConjunto(
            productoData.id_conjunto
          );
          // Filtrar el producto actual para no mostrarlo dos veces
          const filtrados = otrosProductos.filter((p) => p.id !== productId);
          setProductosConjunto(filtrados);
        }
      } catch (error) {
        console.error("Error al cargar producto:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!producto) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-light text-gray-900 mb-4">
          Producto no encontrado
        </h2>
        <Link
          href="/catalogo"
          className="text-gray-600 hover:text-gray-900 underline"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link
          href="/catalogo"
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Volver al catálogo
        </Link>
      </div>

      {/* Detalle del Producto */}
      <div className="grid md:grid-cols-2 gap-12 mb-16">
        {/* Imagen */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre_comercial}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-32 h-32 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="0.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
          )}
        </div>

        {/* Información */}
        <div className="space-y-6">
          {producto.conjunto && (
            <p className="text-sm text-gray-500 uppercase tracking-wider">
              Conjunto: {producto.conjunto.nombre}
            </p>
          )}

          <h1 className="font-elegant text-4xl md:text-5xl font-light text-gray-900">
            {producto.nombre_comercial}
          </h1>

          <div className="w-16 h-px bg-[#FFF2E0]"></div>

          <p className="text-3xl font-light text-gray-900">
            {formatPrice(producto.precio)}
          </p>

          <div className="space-y-3 text-gray-600">
            <p>
              <span className="font-medium">Código:</span> {producto.codigo}
            </p>
            <p>
              <span className="font-medium">Tipo:</span> {producto.tipo}
            </p>
            <p>
              <span className="font-medium">Material:</span> {producto.material}
            </p>
            <p>
              <span className="font-medium">Categoría:</span>{" "}
              {producto.categoria}
            </p>
            {producto.peso && (
              <p>
                <span className="font-medium">Peso:</span> {producto.peso}g
              </p>
            )}
          </div>
          <p>
            <span className="font-medium">Disponibilidad:</span>{" "}
            <span
              className={
                producto.stock > 5
                  ? "text-green-600"
                  : producto.stock > 0
                  ? "text-yellow-600"
                  : "text-red-600"
              }
            >
              {producto.stock > 0 ? `${producto.stock} en stock` : "Agotado"}
            </span>
          </p>
          {producto.descripcion && (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Descripción</h3>
              <p className="text-gray-600 leading-relaxed font-light">
                {producto.descripcion}
              </p>
            </div>
          )}

          <div className="pt-6">
            <a
              href={`https://wa.me/593999999999?text=Hola, estoy interesado en ${producto.nombre_comercial} (${producto.codigo})`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full md:w-auto px-12 py-4 bg-gray-900 text-white text-center font-light tracking-widest uppercase text-sm hover:bg-gray-800 transition-all duration-300"
            >
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Productos del mismo conjunto */}
      {productosConjunto.length > 0 && (
        <div className="border-t border-gray-200 pt-16">
          <div className="text-center mb-12">
            <h2 className="font-elegant text-3xl font-light text-gray-900 mb-2">
              Más piezas de {producto.conjunto?.nombre}
            </h2>
            <div className="w-16 h-px bg-[#FFF2E0] mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productosConjunto.map((prod) => (
              <ProductCard key={prod.id} producto={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
