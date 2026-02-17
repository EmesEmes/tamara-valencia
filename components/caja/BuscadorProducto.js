"use client";

import { useState } from "react";
import { buscarProductoPorCodigo } from "@/lib/api/caja/ventas";

export default function BuscadorProducto({ onProductoEncontrado }) {
  const [codigo, setCodigo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);

  const handleBuscar = async (e) => {
    e.preventDefault();

    if (!codigo.trim()) {
      setError("Ingresa un código de producto");
      return;
    }

    setBuscando(true);
    setError(null);

    try {
      const { data, error } = await buscarProductoPorCodigo(codigo.trim());

      if (error) {
        setError(error.message || "Producto no encontrado");
        return;
      }

      if (!data) {
        setError("Producto no encontrado");
        return;
      }

      // Calcular precio
      const precioCalculado = data.peso * data.factor.valor;
      const precioFinal = Math.ceil(precioCalculado / 5) * 5; // Redondear a múltiplo de 5

      // Enviar producto al padre
      onProductoEncontrado({
        ...data,
        precio_calculado: precioFinal,
      });

      // Limpiar búsqueda
      setCodigo("");
      setError(null);
    } catch (err) {
      console.error("Error al buscar producto:", err);
      setError("Error al buscar el producto");
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <form onSubmit={handleBuscar}>
        <div className="flex gap-4">
          <div className="flex-1">
            <label
              htmlFor="codigo"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Código del Producto
            </label>
            <input
              type="text"
              id="codigo"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value);
                setError(null);
              }}
              placeholder="Ej: TEST-001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              disabled={buscando}
              autoFocus
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={buscando || !codigo.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {buscando ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Buscando...
                </span>
              ) : (
                "🔍 Buscar"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          <p>
            💡 <strong>Tip:</strong> Puedes escanear el código o escribirlo
            manualmente
          </p>
        </div>
      </form>
    </div>
  );
}
