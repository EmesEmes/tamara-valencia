"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getProductoById,
  getProductosPorConjunto,
} from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/utils/formatters";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ProductCard from "./ProductCard";
import { useCartStore } from "@/lib/cartStore";

export default function ProductDetail({ productId }) {
  const router = useRouter();
  const [producto, setProducto] = useState(null);
  const [productosConjunto, setProductosConjunto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const addItem = useCartStore((state) => state.addItem);
  // Nos suscribimos a items directamente para reaccionar en tiempo real
  const items = useCartStore((state) => state.items);

  const calcularPrecio = (prod) => {
    if (!prod.peso || !prod.factor || !prod.factor.valor) return 0;
    return parseFloat(prod.peso) * parseFloat(prod.factor.valor);
  };

  const redondearPrecio = (precio) => {
    if (!precio || precio === 0) return 0;
    return Math.ceil(precio / 5) * 5;
  };

  const handleAgregar = () => {
    const agregado = addItem(producto);
    if (agregado) {
      setFeedback("¡Agregado al carrito!");
    } else {
      setFeedback("Ya tienes el máximo disponible");
    }
    setTimeout(() => setFeedback(""), 2000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productoData = await getProductoById(productId);
        setProducto(productoData);

        if (productoData.id_conjunto) {
          const otrosProductos = await getProductosPorConjunto(
            productoData.id_conjunto,
          );
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
        <div className="mb-8">
          <Link
            href="/catalogo"
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <button
          onClick={() => window.history.back()}
          className="text-gray-600 hover:text-gray-900 text-sm cursor-pointer bg-transparent border-none"
        >
          ← Volver al catálogo
        </button>
      </div>

      {/* Detalle del Producto */}
      <div className="grid md:grid-cols-2 gap-12 mb-16">
        {/* Imagen */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={`${producto.nombre_comercial} de ${producto.material} - Tamara Valencia Joyas, Quito`}
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
                />
              </svg>
            </div>
          )}
        </div>

        {/* Información */}
        <div className="space-y-6">
          {producto.conjunto && (
            <p className="text-sm text-gray-500 uppercase tracking-wider">
              Juego: {producto.conjunto.nombre}
            </p>
          )}

          <h1 className="font-elegant text-4xl md:text-5xl font-light text-gray-900">
            {producto.nombre_comercial}
          </h1>

          <div className="w-16 h-px bg-[#FFF2E0]" />

          <p className="text-3xl font-light text-gray-900">
            {formatPrice(redondearPrecio(calcularPrecio(producto)))}
          </p>

          <div className="space-y-3 text-gray-600">
            <p>
              <span className="font-medium">Código:</span> {producto.codigo}
            </p>
            <p>
              <span className="font-medium">Material:</span> {producto.material}
            </p>
            <p>
              <span className="font-medium">Categoría:</span>{" "}
              {producto.categoria}
            </p>
            {producto.talla && (
              <p>
                <span className="font-medium">Talla:</span> {producto.talla}
              </p>
            )}
            {producto.factor && (
              <p>
                <span className="font-medium">Acabado:</span>{" "}
                {producto.factor.nombre}
              </p>
            )}
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
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Descripción</h3>
            <p className="text-gray-600 leading-relaxed font-light">
              {producto.descripcion ||
                `${producto.nombre_comercial} de ${producto.material}, parte de nuestra colección disponible en Quito, Ecuador. Envíos a todo el país.`}
            </p>
          </div>

          {/* Botones de acción */}
          {(() => {
            const cantidadEnCarrito =
              items.find((item) => item.id === producto.id)?.quantity || 0;
            const sinStock = !producto.stock || producto.stock <= 0;
            const stockMaximoEnCarrito =
              !sinStock && cantidadEnCarrito >= producto.stock;
            const botonDeshabilitado = sinStock || stockMaximoEnCarrito;

            return (
              <div className="pt-6 space-y-4">
                {/* Indicador de que ya está en el carrito */}
                {cantidadEnCarrito > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 px-4 py-3">
                    <svg
                      className="w-4 h-4 text-gray-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Ya tienes {cantidadEnCarrito}{" "}
                    {cantidadEnCarrito === 1 ? "unidad" : "unidades"} en el
                    carrito
                  </div>
                )}

                {/* Botón agregar al carrito */}
                <button
                  onClick={handleAgregar}
                  disabled={botonDeshabilitado}
                  className={`w-full px-12 py-4 text-center font-light tracking-widest uppercase text-sm transition-all duration-300 ${
                    sinStock
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : stockMaximoEnCarrito
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-300"
                        : feedback
                          ? "bg-green-600 text-white"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {sinStock
                    ? "Agotado"
                    : stockMaximoEnCarrito
                      ? "Ya tienes todo el stock"
                      : feedback ||
                        (cantidadEnCarrito > 0
                          ? "Agregar otra unidad"
                          : "Agregar al carrito")}
                </button>

                {/* Botón WhatsApp */}
                <a
                  href={`https://wa.me/593998444531?text=${encodeURIComponent(
                    `Hola! Me interesa esta joya:\n\n` +
                      `*${producto.nombre_comercial}*\n` +
                      `Código: ${producto.codigo}\n` +
                      `Ver más: ${typeof window !== "undefined" ? window.location.origin : ""}/catalogo/${productId}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full px-12 py-4 border border-gray-900 text-gray-900 text-center font-light tracking-widest uppercase text-sm hover:bg-gray-50 transition-all duration-300"
                >
                  Consultar por WhatsApp
                </a>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Productos del mismo conjunto */}
      {productosConjunto.length > 0 && (
        <div className="border-t border-gray-200 pt-16">
          <div className="text-center mb-12">
            <h2 className="font-elegant text-3xl font-light text-gray-900 mb-2">
              Más piezas de {producto.conjunto?.nombre}
            </h2>
            <div className="w-16 h-px bg-[#FFF2E0] mx-auto mt-4" />
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
