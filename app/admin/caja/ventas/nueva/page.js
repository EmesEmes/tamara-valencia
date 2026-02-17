"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BuscadorProducto from "@/components/caja/BuscadorProducto";
import CarritoVenta from "@/components/caja/CarritoVenta";
import { crearVenta } from "@/lib/api/caja/ventas";
import { crearCredito } from "@/lib/api/caja/creditos";
import { getVendedores } from "@/lib/api/caja/vendedores";

export default function NuevaVentaPage() {
  const router = useRouter();

  // Estados del carrito
  const [productos, setProductos] = useState([]);

  // Estados del formulario
  const [tipoVenta, setTipoVenta] = useState("contado"); // 'contado' | 'credito'
  const [vendedorId, setVendedorId] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [notas, setNotas] = useState("");

  // Estados para crédito
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteCedula, setClienteCedula] = useState("");
  const [cuotaInicial, setCuotaInicial] = useState(0);
  const [numeroCuotas, setNumeroCuotas] = useState(1);
  const [fechaPrimerPago, setFechaPrimerPago] = useState("");
  const [descuentaInventario, setDescuentaInventario] = useState(true);

  // Estados de vendedores
  const [vendedores, setVendedores] = useState([]);
  const [loadingVendedores, setLoadingVendedores] = useState(true);

  // Estados de proceso
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);

  // Cargar vendedores al montar
  useEffect(() => {
    cargarVendedores();

    // Establecer fecha de primer pago por defecto (30 días desde hoy)
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 30);
    setFechaPrimerPago(fecha.toISOString().split("T")[0]);
  }, []);

  const cargarVendedores = async () => {
    try {
      const { data, error } = await getVendedores(true); // Solo activos
      if (error) throw error;
      setVendedores(data || []);
    } catch (err) {
      console.error("Error al cargar vendedores:", err);
    } finally {
      setLoadingVendedores(false);
    }
  };

  // Agregar producto al carrito
  const handleProductoEncontrado = (producto) => {
    const existe = productos.find((p) => p.id === producto.id);

    if (existe) {
      const nuevaCantidad = existe.cantidad + 1;
      if (nuevaCantidad <= producto.stock) {
        setProductos(
          productos.map((p) =>
            p.id === producto.id ? { ...p, cantidad: nuevaCantidad } : p,
          ),
        );
      } else {
        alert(
          `Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`,
        );
      }
    } else {
      if (producto.stock > 0) {
        setProductos([...productos, { ...producto, cantidad: 1 }]);
      } else {
        alert("Producto sin stock disponible");
      }
    }
  };

  // Eliminar producto del carrito
  const handleEliminarProducto = (index) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  // Cambiar cantidad de producto
  const handleCantidadChange = (index, nuevaCantidad) => {
    const producto = productos[index];

    if (nuevaCantidad > producto.stock) {
      alert(
        `Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`,
      );
      return;
    }

    if (nuevaCantidad < 1) {
      return;
    }

    setProductos(
      productos.map((p, i) =>
        i === index ? { ...p, cantidad: nuevaCantidad } : p,
      ),
    );
  };

  // Calcular totales
  const calcularTotal = () => {
    return productos.reduce(
      (sum, p) => sum + p.precio_calculado * p.cantidad,
      0,
    );
  };

  const calcularComision = () => {
    if (!vendedorId) return 0;
    const total = calcularTotal();
    return total * 0.1; // 10% de comisión
  };

  const calcularCuotaMensual = () => {
    const total = calcularTotal();
    const saldo = total - cuotaInicial;
    return numeroCuotas > 0 ? saldo / numeroCuotas : 0;
  };

  // Registrar venta
  const handleRegistrarVenta = async () => {
    setError(null);

    // Validaciones generales
    if (productos.length === 0) {
      setError("Agrega al menos un producto al carrito");
      return;
    }

    if (!metodoPago && tipoVenta === "contado") {
      setError("Selecciona un método de pago");
      return;
    }

    // Validaciones específicas para crédito
    if (tipoVenta === "credito") {
      if (!clienteNombre.trim()) {
        setError("El nombre del cliente es requerido para ventas a crédito");
        return;
      }

      if (cuotaInicial < 0 || cuotaInicial > calcularTotal()) {
        setError("La cuota inicial no es válida");
        return;
      }

      if (numeroCuotas < 1) {
        setError("El número de cuotas debe ser al menos 1");
        return;
      }

      if (!fechaPrimerPago) {
        setError("Selecciona la fecha del primer pago");
        return;
      }
    }

    // Confirmar
    const total = calcularTotal();
    const comision = calcularComision();

    let mensaje = `¿Confirmar venta por ${formatPrice(total)}?`;

    if (tipoVenta === "credito") {
      const cuotaMensual = calcularCuotaMensual();
      mensaje += `\n\n📋 CRÉDITO DIRECTO`;
      mensaje += `\nCliente: ${clienteNombre}`;
      mensaje += `\nCuota inicial: ${formatPrice(cuotaInicial)}`;
      mensaje += `\nSaldo a financiar: ${formatPrice(total - cuotaInicial)}`;
      mensaje += `\nNúmero de cuotas: ${numeroCuotas}`;
      mensaje += `\nCuota mensual: ${formatPrice(cuotaMensual)}`;
      mensaje += `\n${descuentaInventario ? "✓ Descuenta inventario ahora" : "⚠ NO descuenta inventario"}`;
    }

    if (vendedorId) {
      const vendedor = vendedores.find((v) => v.id === vendedorId);
      mensaje += `\n\nDistribuidora: ${vendedor?.nombre}`;
      mensaje += `\nComisión (10%): ${formatPrice(comision)}`;
    }

    if (!confirm(mensaje)) {
      return;
    }

    setProcesando(true);

    try {
      // Preparar datos de la venta
      const ventaData = {
        tipo: tipoVenta,
        total: total,
        metodo_pago: tipoVenta === "credito" ? "credito" : metodoPago,
        vendedor_id: vendedorId || null,
        comision_monto: comision,
        cliente_nombre: tipoVenta === "credito" ? clienteNombre : null,
        cliente_telefono: tipoVenta === "credito" ? clienteTelefono : null,
        cliente_cedula: tipoVenta === "credito" ? clienteCedula : null,
        notas: notas || null,
        es_prueba: false,
      };

      const productosVenta = productos.map((p) => ({
        producto_id: p.id,
        cantidad: p.cantidad,
        precio_unitario: p.precio_calculado,
      }));

      // Crear la venta
      const { data: venta, error: errorVenta } = await crearVenta(
        ventaData,
        productosVenta,
      );

      if (errorVenta) throw errorVenta;

      // Si es crédito, crear el registro de crédito
      if (tipoVenta === "credito") {
        const cuotaMensual = calcularCuotaMensual();

        const creditoData = {
          venta_id: venta.id,
          cliente_nombre: clienteNombre,
          cliente_telefono: clienteTelefono || null,
          cliente_cedula: clienteCedula || null,
          monto_total: total,
          cuota_inicial: cuotaInicial,
          cuota_mensual: cuotaMensual,
          plazo_meses: numeroCuotas,
          fecha_primer_pago: fechaPrimerPago,
          descuenta_inventario: descuentaInventario,
          notas: notas || null,
        };

        const { error: errorCredito } = await crearCredito(creditoData);

        if (errorCredito) throw errorCredito;
      }

      alert(
        tipoVenta === "credito"
          ? "¡Venta a crédito registrada exitosamente!"
          : "¡Venta registrada exitosamente!",
      );

      // Redirigir
      router.push("/admin/caja/ventas");
    } catch (err) {
      console.error("Error al registrar venta:", err);
      setError(err.message || "Error al registrar la venta");
    } finally {
      setProcesando(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Nueva Venta
              </h1>
              <p className="text-gray-600">
                Registra una venta de contado o a crédito
              </p>
            </div>
            <Link
              href="/admin/caja/ventas"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </div>

        {/* Navegación */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="flex gap-4 text-sm">
            <Link
              href="/admin/caja"
              className="text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <span className="text-gray-400">›</span>
            <Link
              href="/admin/caja/ventas"
              className="text-gray-600 hover:text-gray-900"
            >
              Ventas
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">Nueva</span>
          </div>
        </div>

        {/* Error General */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Búsqueda y Carrito */}
          <div className="lg:col-span-2 space-y-6">
            {/* Buscador */}
            <BuscadorProducto onProductoEncontrado={handleProductoEncontrado} />

            {/* Carrito */}
            <CarritoVenta
              productos={productos}
              onEliminar={handleEliminarProducto}
              onCantidadChange={handleCantidadChange}
            />
          </div>

          {/* Columna Derecha - Detalles de Venta */}
          <div className="space-y-6">
            {/* Tipo de Venta */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tipo de Venta
              </h3>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="contado"
                    checked={tipoVenta === "contado"}
                    onChange={(e) => setTipoVenta(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900">Contado</p>
                    <p className="text-sm text-gray-500">Pago inmediato</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="credito"
                    checked={tipoVenta === "credito"}
                    onChange={(e) => setTipoVenta(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900">Crédito Directo</p>
                    <p className="text-sm text-gray-500">Sin intereses</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Campos para Crédito */}
            {tipoVenta === "credito" && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📋 Datos del Crédito
                </h3>

                <div className="space-y-4">
                  {/* Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre completo"
                      required
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0987654321"
                    />
                  </div>

                  {/* Cédula */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cédula
                    </label>
                    <input
                      type="text"
                      value={clienteCedula}
                      onChange={(e) => setClienteCedula(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1234567890"
                    />
                  </div>

                  {/* Cuota Inicial */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cuota Inicial (opcional)
                    </label>
                    <input
                      type="number"
                      value={cuotaInicial}
                      onChange={(e) =>
                        setCuotaInicial(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      min="0"
                      max={calcularTotal()}
                      step="0.01"
                    />
                  </div>

                  {/* Número de Cuotas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Cuotas *
                    </label>
                    <input
                      type="number"
                      value={numeroCuotas}
                      onChange={(e) =>
                        setNumeroCuotas(parseInt(e.target.value) || 1)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1"
                      min="1"
                      required
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Cuota mensual: {formatPrice(calcularCuotaMensual())}
                    </p>
                  </div>

                  {/* Fecha Primer Pago */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Primer Pago *
                    </label>
                    <input
                      type="date"
                      value={fechaPrimerPago}
                      onChange={(e) => setFechaPrimerPago(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Descuenta Inventario */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="descuentaInventario"
                      checked={descuentaInventario}
                      onChange={(e) => setDescuentaInventario(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="descuentaInventario"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Descontar inventario ahora
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen de Venta */}
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen de Venta
              </h3>

              {/* Distribuidora */}
              {tipoVenta === "contado" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distribuidora (opcional)
                  </label>
                  {loadingVendedores ? (
                    <div className="text-sm text-gray-500">Cargando...</div>
                  ) : (
                    <select
                      value={vendedorId}
                      onChange={(e) => setVendedorId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sin distribuidora</option>
                      {vendedores.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                  {vendedorId && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Se calculará 10% de comisión
                    </p>
                  )}
                </div>
              )}

              {/* Método de Pago (solo para contado) */}
              {tipoVenta === "contado" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
              )}

              {/* Notas */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observaciones de la venta..."
                />
              </div>

              <div className="border-t pt-4 space-y-2">
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(calcularTotal())}
                  </span>
                </div>

                {/* Comisión */}
                {vendedorId && tipoVenta === "contado" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Comisión (10%):</span>
                    <span className="font-medium text-orange-600">
                      {formatPrice(calcularComision())}
                    </span>
                  </div>
                )}

                {/* Info Crédito */}
                {tipoVenta === "credito" && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cuota inicial:</span>
                      <span className="font-medium text-blue-600">
                        {formatPrice(cuotaInicial)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">A financiar:</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(calcularTotal() - cuotaInicial)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cuota mensual:</span>
                      <span className="font-medium text-blue-600">
                        {formatPrice(calcularCuotaMensual())} x {numeroCuotas}
                      </span>
                    </div>
                  </>
                )}

                {/* Total */}
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-blue-600">
                    {formatPrice(calcularTotal())}
                  </span>
                </div>
              </div>

              {/* Botón Registrar */}
              <button
                onClick={handleRegistrarVenta}
                disabled={procesando || productos.length === 0}
                className="w-full mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {procesando ? (
                  <span className="flex items-center justify-center gap-2">
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
                    Procesando...
                  </span>
                ) : (
                  `✓ Registrar Venta ${tipoVenta === "credito" ? "a Crédito" : ""}`
                )}
              </button>

              {productos.length === 0 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Agrega productos para continuar
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
