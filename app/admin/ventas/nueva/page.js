"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { buscarClientes, createCliente } from "@/lib/supabase/clientes";
import { getDistribuidoras } from "@/lib/supabase/distribuidoras";
import { registrarVenta } from "@/lib/supabase/ventas";
import { formatPrice } from "@/utils/formatters";
import {
  TIPOS_PRODUCTO,
  CATEGORIAS_PRODUCTO,
  MATERIALES_PRODUCTO,
} from "@/lib/constants";
import Link from "next/link";

const VIAS_VENTA = [
  { value: "showroom", label: "Showroom" },
  { value: "redes", label: "Redes Sociales" },
  { value: "referido", label: "Referido" },
  { value: "distribuidora", label: "Distribuidora" },
  { value: "tvcj", label: "TVCJ" },
  { value: "cuenta_gerencia", label: "Cuenta Gerencia" },
];

export default function NuevaVentaPage() {
  const router = useRouter();

  // --- Estado de búsqueda de productos ---
  const [filtros, setFiltros] = useState({
    codigo: "",
    tipo: "",
    categoria: "",
    material: "",
    conjunto: "",
  });
  const [busquedaEjecutada, setBusquedaEjecutada] = useState(false);
  const [productosResultado, setProductosResultado] = useState([]);
  const [buscandoProductos, setBuscandoProductos] = useState(false);

  // --- Estado de productos seleccionados ---
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  // --- Estado de cliente ---
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientesEncontrados, setClientesEncontrados] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    cedula: "",
  });
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  // --- Estado de venta ---
  const [descuento, setDescuento] = useState("");
  const [via, setVia] = useState("");
  const [distribuidoraId, setDistribuidoraId] = useState("");
  const [esCredito, setEsCredito] = useState(false);
  const [cuotaMensual, setCuotaMensual] = useState("");
  const [mesesGracia, setMesesGracia] = useState(false);
  const [diaPago, setDiaPago] = useState("1");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Precarga cuando la venta viene de un préstamo (sacar para vender)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("prestamo_venta");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.productos?.length) {
        setProductosSeleccionados(data.productos);
      }
      if (data.distribuidoraId) {
        setVia("distribuidora");
        setDistribuidoraId(data.distribuidoraId);
      }
    } catch (e) {
      console.error("Error al precargar venta desde préstamo:", e);
    } finally {
      // Limpiar para que no se vuelva a precargar si recarga la página
      sessionStorage.removeItem("prestamo_venta");
    }
  }, []);

  // Cargar distribuidoras y conjuntos
  const { data: distribuidoras = [] } = useQuery({
    queryKey: ["distribuidoras-activas"],
    queryFn: getDistribuidoras,
    staleTime: 10 * 60 * 1000,
  });

  const { data: conjuntos = [] } = useQuery({
    queryKey: ["conjuntos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conjuntos")
        .select("id, nombre")
        .order("nombre");
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  // --- Helpers de precio ---
  const calcularPrecio = (producto) => {
    if (!producto.peso || !producto.factor?.valor) return 0;
    const precio =
      parseFloat(producto.peso) * parseFloat(producto.factor.valor);
    return Math.ceil(precio / 5) * 5;
  };

  // --- Búsqueda de productos ---
  const buscarProductos = async () => {
    setBuscandoProductos(true);
    setBusquedaEjecutada(true);
    try {
      let query = supabase
        .from("productos")
        .select("*, factor:factores(*), conjunto:conjuntos(*)")
        .eq("activo", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false })
        .limit(50);

      if (filtros.codigo) query = query.ilike("codigo", `%${filtros.codigo}%`);
      if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
      if (filtros.categoria) query = query.eq("categoria", filtros.categoria);
      if (filtros.material) query = query.eq("material", filtros.material);
      if (filtros.conjunto) query = query.eq("id_conjunto", filtros.conjunto);

      const { data, error } = await query;
      if (error) throw error;
      setProductosResultado(data || []);
    } catch (error) {
      console.error("Error al buscar productos:", error);
      alert("Error al buscar productos");
    } finally {
      setBuscandoProductos(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  // --- Agregar/quitar productos ---
  const agregarProducto = (producto) => {
    const precio = calcularPrecio(producto);
    const existe = productosSeleccionados.find(
      (p) => p.id_producto === producto.id,
    );
    if (existe) {
      if (existe.cantidad >= producto.stock) {
        alert(`Solo hay ${producto.stock} unidades disponibles`);
        return;
      }
      setProductosSeleccionados((prev) =>
        prev.map((p) =>
          p.id_producto === producto.id
            ? { ...p, cantidad: p.cantidad + 1 }
            : p,
        ),
      );
    } else {
      setProductosSeleccionados((prev) => [
        ...prev,
        {
          id_producto: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre_comercial,
          precio_unitario: precio,
          cantidad: 1,
          stock: producto.stock,
        },
      ]);
    }
  };

  const quitarProducto = (id_producto) => {
    setProductosSeleccionados((prev) =>
      prev.filter((p) => p.id_producto !== id_producto),
    );
  };

  const cambiarCantidad = (id_producto, cantidad) => {
    const producto = productosSeleccionados.find(
      (p) => p.id_producto === id_producto,
    );
    if (cantidad < 1) return;
    if (cantidad > producto.stock) {
      alert(`Solo hay ${producto.stock} unidades disponibles`);
      return;
    }
    setProductosSeleccionados((prev) =>
      prev.map((p) => (p.id_producto === id_producto ? { ...p, cantidad } : p)),
    );
  };

  // --- Cálculos de totales ---
  const subtotal = productosSeleccionados.reduce(
    (sum, p) => sum + p.precio_unitario * p.cantidad,
    0,
  );
  const descuentoNum = parseFloat(descuento) || 0;
  const total = Math.max(0, subtotal - descuentoNum);

  const distribuidoraSeleccionada = distribuidoras.find(
    (d) => d.id === distribuidoraId,
  );
  const comisionMonto = distribuidoraSeleccionada
    ? (total * distribuidoraSeleccionada.porcentaje_comision) / 100
    : 0;

  const mesesPlazo =
    cuotaMensual && parseFloat(cuotaMensual) > 0
      ? Math.ceil(total / parseFloat(cuotaMensual))
      : 0;

  // --- Búsqueda de clientes ---
  const handleBuscarCliente = async () => {
    if (!busquedaCliente.trim()) return;
    setBuscandoCliente(true);
    try {
      const data = await buscarClientes(busquedaCliente);
      setClientesEncontrados(data);
    } catch (error) {
      console.error("Error al buscar clientes:", error);
    } finally {
      setBuscandoCliente(false);
    }
  };

  const handleCrearCliente = async () => {
    if (!nuevoCliente.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    try {
      const cliente = await createCliente(nuevoCliente);
      setClienteSeleccionado(cliente);
      setMostrarFormCliente(false);
      setClientesEncontrados([]);
      setBusquedaCliente(cliente.nombre);
    } catch (error) {
      console.error("Error al crear cliente:", error);
      alert("Error al crear el cliente");
    }
  };

  // --- Confirmar venta ---
  const handleConfirmar = async () => {
    if (productosSeleccionados.length === 0) {
      alert("Debe agregar al menos un producto");
      return;
    }
    if (!via) {
      alert("Debe seleccionar la vía de venta");
      return;
    }
    if (via === "distribuidora" && !distribuidoraId) {
      alert("Debe seleccionar una distribuidora");
      return;
    }
    if (esCredito && (!cuotaMensual || parseFloat(cuotaMensual) <= 0)) {
      alert("Debe ingresar la cuota mensual");
      return;
    }
    if (esCredito && !clienteSeleccionado) {
      alert("Para ventas a crédito debe seleccionar un cliente");
      return;
    }

    if (!confirm("¿Confirmar la venta?")) return;

    setGuardando(true);
    try {
      await registrarVenta({
        venta: {
          id_cliente: clienteSeleccionado?.id || null,
          subtotal,
          descuento: descuentoNum,
          total,
          via,
          id_distribuidora: distribuidoraId || null,
          comision_monto: comisionMonto,
          es_credito: esCredito,
          notas,
        },
        detalle: productosSeleccionados.map((p) => ({
          id_producto: p.id_producto,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
        })),
        credito: esCredito
          ? {
              cuota_mensual: parseFloat(cuotaMensual),
              meses_plazo: mesesPlazo,
              meses_gracia: mesesGracia ? 3 : 0,
              dia_pago: parseInt(diaPago) || 1,
            }
          : null,
      });

      alert("Venta registrada exitosamente");
      router.push("/admin/ventas");
    } catch (error) {
      console.error("Error al registrar venta:", error);
      alert("Error al registrar la venta: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Volver a ventas
        </button>
      </div>

      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-10">
        Nueva Venta
      </h1>

      {/* SECCIÓN 1: BUSCAR PRODUCTOS */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wider">
          1. Buscar Productos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código
            </label>
            <input
              type="text"
              value={filtros.codigo}
              onChange={(e) => handleFiltroChange("codigo", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscarProductos()}
              placeholder="Ej: OANP..."
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => handleFiltroChange("tipo", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Todos</option>
              {TIPOS_PRODUCTO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={filtros.categoria}
              onChange={(e) => handleFiltroChange("categoria", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Todas</option>
              {CATEGORIAS_PRODUCTO.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material
            </label>
            <select
              value={filtros.material}
              onChange={(e) => handleFiltroChange("material", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Todos</option>
              {MATERIALES_PRODUCTO.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conjunto
            </label>
            <select
              value={filtros.conjunto}
              onChange={(e) => handleFiltroChange("conjunto", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Todos</option>
              {conjuntos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={buscarProductos}
          disabled={buscandoProductos}
          className="px-6 py-2 bg-gray-900 text-white text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-400"
        >
          {buscandoProductos ? "Buscando..." : "Buscar Productos"}
        </button>

        {busquedaEjecutada && (
          <div className="mt-4 overflow-x-auto">
            {productosResultado.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">
                No se encontraron productos
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      Código
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      Material
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      Precio
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      Stock
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productosResultado.map((producto) => {
                    const precio = calcularPrecio(producto);
                    const yaAgregado = productosSeleccionados.find(
                      (p) => p.id_producto === producto.id,
                    );
                    return (
                      <tr key={producto.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900">
                          {producto.codigo}
                        </td>
                        <td className="px-4 py-2 text-gray-900">
                          {producto.nombre_comercial}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {producto.material}
                        </td>
                        <td className="px-4 py-2 text-gray-900 font-medium">
                          {formatPrice(precio)}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {producto.stock}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => agregarProducto(producto)}
                            className="px-3 py-1 bg-gray-900 text-white text-xs uppercase tracking-wider hover:bg-gray-700 transition-colors"
                          >
                            {yaAgregado ? "Agregar más" : "Agregar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: PRODUCTOS SELECCIONADOS */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wider">
          2. Productos Seleccionados
        </h2>

        {productosSeleccionados.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No hay productos agregados aún
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Código
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Nombre
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Precio
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Cantidad
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Subtotal
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productosSeleccionados.map((p) => (
                <tr key={p.id_producto}>
                  <td className="px-4 py-2 text-gray-900">{p.codigo}</td>
                  <td className="px-4 py-2 text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-2 text-gray-900">
                    {formatPrice(p.precio_unitario)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          cambiarCantidad(p.id_producto, p.cantidad - 1)
                        }
                        className="w-7 h-7 border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-700"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{p.cantidad}</span>
                      <button
                        onClick={() =>
                          cambiarCantidad(p.id_producto, p.cantidad + 1)
                        }
                        className="w-7 h-7 border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-700"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {formatPrice(p.precio_unitario * p.cantidad)}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => quitarProducto(p.id_producto)}
                      className="text-red-600 hover:text-red-900 text-xs uppercase tracking-wider"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SECCIÓN 3: CLIENTE */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wider">
          3. Cliente
        </h2>

        {clienteSeleccionado ? (
          <div className="flex items-center justify-between bg-gray-50 p-4 border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">
                {clienteSeleccionado.nombre}
              </p>
              {clienteSeleccionado.telefono && (
                <p className="text-sm text-gray-600">
                  {clienteSeleccionado.telefono}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setClienteSeleccionado(null);
                setBusquedaCliente("");
              }}
              className="text-sm text-red-600 hover:text-red-900"
            >
              Cambiar cliente
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuscarCliente()}
                placeholder="Buscar por nombre o teléfono..."
                className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <button
                onClick={handleBuscarCliente}
                disabled={buscandoCliente}
                className="px-4 py-2 bg-gray-900 text-white text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {buscandoCliente ? "Buscando..." : "Buscar"}
              </button>
              <button
                onClick={() => setMostrarFormCliente(!mostrarFormCliente)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm uppercase tracking-wider hover:bg-gray-50 transition-colors"
              >
                Nuevo cliente
              </button>
            </div>

            {clientesEncontrados.length > 0 && (
              <div className="border border-gray-200 mb-4">
                {clientesEncontrados.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setClienteSeleccionado(c);
                      setClientesEncontrados([]);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <p className="font-medium text-gray-900">{c.nombre}</p>
                    {c.telefono && (
                      <p className="text-sm text-gray-600">{c.telefono}</p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {mostrarFormCliente && (
              <div className="border border-gray-200 p-4 bg-gray-50">
                <p className="font-medium text-gray-900 mb-4">Nuevo Cliente</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={nuevoCliente.nombre}
                      onChange={(e) =>
                        setNuevoCliente((prev) => ({
                          ...prev,
                          nombre: e.target.value,
                        }))
                      }
                      placeholder="Nombre completo"
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={nuevoCliente.telefono}
                      onChange={(e) =>
                        setNuevoCliente((prev) => ({
                          ...prev,
                          telefono: e.target.value,
                        }))
                      }
                      placeholder="0991234567"
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cédula
                    </label>
                    <input
                      type="text"
                      value={nuevoCliente.cedula}
                      onChange={(e) =>
                        setNuevoCliente((prev) => ({
                          ...prev,
                          cedula: e.target.value,
                        }))
                      }
                      placeholder="1234567890"
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCrearCliente}
                    className="px-6 py-2 bg-gray-900 text-white text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors"
                  >
                    Guardar Cliente
                  </button>
                  <button
                    onClick={() => setMostrarFormCliente(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 text-sm uppercase tracking-wider hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-2">
              El cliente es opcional para ventas de contado
            </p>
          </>
        )}
      </div>

      {/* SECCIÓN 4: DESCUENTO Y TOTAL */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wider">
          4. Descuento y Total
        </h2>

        <div className="max-w-sm space-y-4">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-gray-700 whitespace-nowrap">
              Descuento ($)
            </label>
            <input
              type="number"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
              placeholder="0.00"
              min="0"
              max={subtotal}
              step="0.01"
              className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="flex justify-between text-xl font-medium text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 5: VÍA DE VENTA */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wider">
          5. Vía de Venta
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {VIAS_VENTA.map((v) => (
            <button
              key={v.value}
              onClick={() => {
                setVia(v.value);
                if (v.value !== "distribuidora") setDistribuidoraId("");
              }}
              className={`py-3 px-4 border text-sm uppercase tracking-wider transition-colors ${
                via === v.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-900"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {via === "distribuidora" && (
          <div className="max-w-sm space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distribuidora
              </label>
              <select
                value={distribuidoraId}
                onChange={(e) => setDistribuidoraId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="">Seleccionar distribuidora</option>
                {distribuidoras.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.porcentaje_comision}%)
                  </option>
                ))}
              </select>
            </div>
            {comisionMonto > 0 && (
              <div className="bg-gray-50 p-3 border border-gray-200">
                <p className="text-sm text-gray-600">
                  Comisión ({distribuidoraSeleccionada?.porcentaje_comision}%):
                  <span className="font-medium text-gray-900 ml-2">
                    {formatPrice(comisionMonto)}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN 6: FORMA DE PAGO */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wider">
          6. Forma de Pago
        </h2>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setEsCredito(false)}
            className={`flex-1 py-4 border text-sm uppercase tracking-wider transition-colors ${
              !esCredito
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-900"
            }`}
          >
            Contado
          </button>
          <button
            onClick={() => setEsCredito(true)}
            className={`flex-1 py-4 border text-sm uppercase tracking-wider transition-colors ${
              esCredito
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-900"
            }`}
          >
            Crédito Directo
          </button>
        </div>

        {esCredito && (
          <div className="max-w-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuota mensual ($)
              </label>
              <input
                type="number"
                value={cuotaMensual}
                onChange={(e) => setCuotaMensual(e.target.value)}
                placeholder="Ej: 100"
                min="1"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            {mesesPlazo > 0 && (
              <div className="bg-gray-50 p-3 border border-gray-200">
                <p className="text-sm text-gray-600">
                  Plazo de pago:
                  <span className="font-medium text-gray-900 ml-2">
                    {mesesPlazo} {mesesPlazo === 1 ? "mes" : "meses"}
                  </span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Día de pago (cada mes)
              </label>
              <input
                type="number"
                value={diaPago}
                onChange={(e) => setDiaPago(e.target.value)}
                placeholder="Ej: 15"
                min="1"
                max="31"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                El cliente pagará cada mes en este día
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={mesesGracia}
                onChange={(e) => setMesesGracia(e.target.checked)}
                className="w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm font-medium text-gray-700">
                Aplicar 3 meses de gracia
              </span>
            </label>

            {mesesGracia && (
              <p className="text-xs text-gray-500">
                El cliente comenzará a pagar en 3 meses
              </p>
            )}
          </div>
        )}
      </div>

      {/* NOTAS */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-medium text-gray-900 mb-4 uppercase tracking-wider">
          Notas (opcional)
        </h2>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          placeholder="Observaciones adicionales sobre la venta..."
          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      {/* RESUMEN FINAL */}
      {productosSeleccionados.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4 uppercase tracking-wider">
            Resumen
          </h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium">Productos:</span>{" "}
              {productosSeleccionados.length}{" "}
              {productosSeleccionados.length === 1 ? "producto" : "productos"}
            </p>
            <p>
              <span className="font-medium">Cliente:</span>{" "}
              {clienteSeleccionado?.nombre || "Sin cliente"}
            </p>
            <p>
              <span className="font-medium">Subtotal:</span>{" "}
              {formatPrice(subtotal)}
            </p>
            {descuentoNum > 0 && (
              <p>
                <span className="font-medium">Descuento:</span> -
                {formatPrice(descuentoNum)}
              </p>
            )}
            <p className="text-base">
              <span className="font-medium">Total:</span> {formatPrice(total)}
            </p>
            <p>
              <span className="font-medium">Vía:</span>{" "}
              {VIAS_VENTA.find((v) => v.value === via)?.label || "-"}
            </p>
            {comisionMonto > 0 && (
              <p>
                <span className="font-medium">Comisión:</span>{" "}
                {formatPrice(comisionMonto)}
              </p>
            )}
            <p>
              <span className="font-medium">Forma de pago:</span>{" "}
              {esCredito
                ? `Crédito - ${mesesPlazo} meses de ${formatPrice(parseFloat(cuotaMensual) || 0)}/mes`
                : "Contado"}
            </p>
          </div>
        </div>
      )}

      {/* BOTÓN CONFIRMAR */}
      <button
        onClick={handleConfirmar}
        disabled={guardando || productosSeleccionados.length === 0}
        className="w-full py-5 bg-gray-900 text-white text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {guardando ? "Registrando venta..." : "Confirmar Venta"}
      </button>
    </div>
  );
}
