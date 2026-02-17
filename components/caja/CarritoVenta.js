"use client";

export default function CarritoVenta({
  productos,
  onEliminar,
  onCantidadChange,
}) {
  const calcularTotal = () => {
    return productos.reduce(
      (sum, p) => sum + p.precio_calculado * p.cantidad,
      0,
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  if (productos.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <p className="mt-4 text-gray-600">El carrito está vacío</p>
        <p className="text-sm text-gray-500 mt-1">
          Busca un producto para agregarlo
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Productos en Venta ({productos.length})
        </h3>
      </div>

      {/* Lista de productos */}
      <div className="divide-y divide-gray-200">
        {productos.map((producto, index) => (
          <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-4">
              {/* Imagen */}
              {producto.imagen_url && (
                <div className="flex-shrink-0">
                  <img
                    src={producto.imagen_url}
                    alt={producto.nombre_comercial}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Info del producto */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {producto.nombre_comercial}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Código: {producto.codigo}
                    </p>
                    {producto.talla && (
                      <p className="text-sm text-gray-500">
                        Talla: {producto.talla}
                      </p>
                    )}
                  </div>

                  {/* Precio unitario */}
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Precio unitario</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatPrice(producto.precio_calculado)}
                    </p>
                  </div>
                </div>

                {/* Cantidad y subtotal */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-700">Cantidad:</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onCantidadChange(
                            index,
                            Math.max(1, producto.cantidad - 1),
                          )
                        }
                        className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-600"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={producto.cantidad}
                        onChange={(e) =>
                          onCantidadChange(
                            index,
                            Math.max(1, parseInt(e.target.value) || 1),
                          )
                        }
                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max={producto.stock}
                      />
                      <button
                        onClick={() =>
                          onCantidadChange(
                            index,
                            Math.min(producto.stock, producto.cantidad + 1),
                          )
                        }
                        disabled={producto.cantidad >= producto.stock}
                        className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-600"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-gray-500">
                      (Stock: {producto.stock})
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Subtotal</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(
                          producto.precio_calculado * producto.cantidad,
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => onEliminar(index)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Eliminar"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-gray-900">Total:</span>
          <span className="text-2xl font-bold text-blue-600">
            {formatPrice(calcularTotal())}
          </span>
        </div>
      </div>
    </div>
  );
}
