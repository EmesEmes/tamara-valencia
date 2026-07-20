"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { buscarClientes } from "@/lib/supabase/clientes";
import { getDistribuidoras } from "@/lib/supabase/distribuidoras";
import { registrarVentaHistorica } from "@/lib/supabase/ventas";
import { formatPrice } from "@/utils/formatters";

const VIAS_VENTA = [
  { value: "showroom", label: "Showroom" },
  { value: "redes", label: "Redes Sociales" },
  { value: "referido", label: "Referido" },
  { value: "distribuidora", label: "Distribuidora" },
  { value: "tvcj", label: "TVCJ" },
  { value: "cuenta_gerencia", label: "Cuenta Gerencia" },
];

export default function VentaHistoricaPage() {
  const router = useRouter();

  // Datos básicos de la venta
  const [fecha, setFecha] = useState("");
  const [total, setTotal] = useState("");
  const [via, setVia] = useState("");
  const [distribuidoraId, setDistribuidoraId] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Cliente
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientesEncontrados, setClientesEncontrados] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  // Crédito
  const [esCredito, setEsCredito] = useState(false);
  const [cuotaMensual, setCuotaMensual] = useState("");
  const [saldoPendiente, setSaldoPendiente] = useState("");
  const [diaPago, setDiaPago] = useState("1");
  const [fechaInicio, setFechaInicio] = useState("");

  // Pagos ya realizados
  const [pagosPrevios, setPagosPrevios] = useState([]);
  const [nuevoPagoFecha, setNuevoPagoFecha] = useState("");
  const [nuevoPagoMonto, setNuevoPagoMonto] = useState("");

  const [guardando, setGuardando] = useState(false);

  const { data: distribuidoras = [] } = useQuery({
    queryKey: ["distribuidoras-activas"],
    queryFn: getDistribuidoras,
    staleTime: 10 * 60 * 1000,
  });

  const distribuidoraSeleccionada = distribuidoras.find(
    (d) => d.id === distribuidoraId,
  );
  const totalNum = parseFloat(total) || 0;
  const comisionMonto = distribuidoraSeleccionada
    ? (totalNum * distribuidoraSeleccionada.porcentaje_comision) / 100
    : 0;

  // Plazo estimado del crédito
  const saldoNum = parseFloat(saldoPendiente) || 0;
  const cuotaNum = parseFloat(cuotaMensual) || 0;
  const mesesPlazo = cuotaNum > 0 ? Math.ceil(totalNum / cuotaNum) : 0;

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

  const agregarPago = () => {
    if (!nuevoPagoFecha || !nuevoPagoMonto || parseFloat(nuevoPagoMonto) <= 0) {
      alert("Ingrese fecha y monto del pago");
      return;
    }
    setPagosPrevios((prev) => [
      ...prev,
      { fecha: nuevoPagoFecha, monto: parseFloat(nuevoPagoMonto) },
    ]);
    setNuevoPagoFecha("");
    setNuevoPagoMonto("");
  };

  const quitarPago = (index) => {
    setPagosPrevios((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPagado = pagosPrevios.reduce((sum, p) => sum + p.monto, 0);

  const handleConfirmar = async () => {
    if (!fecha) {
      alert("Debe ingresar la fecha de la venta");
      return;
    }
    if (totalNum <= 0) {
      alert("Debe ingresar el monto total de la venta");
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
    if (esCredito) {
      if (!clienteSeleccionado) {
        alert("Para créditos debe seleccionar un cliente");
        return;
      }
      if (cuotaNum <= 0) {
        alert("Debe ingresar la cuota mensual del crédito");
        return;
      }
      if (!fechaInicio) {
        alert("Debe ingresar la fecha de inicio del crédito");
        return;
      }
    }

    if (
      !confirm("¿Confirmar el registro histórico? No afecta el inventario.")
    ) {
      return;
    }

    setGuardando(true);
    try {
      // Calcular próximo pago basado en la fecha de inicio y el día de pago
      let fechaProximoPago = null;
      if (esCredito && fechaInicio) {
        const inicio = new Date(fechaInicio);
        fechaProximoPago = new Date(
          inicio.getFullYear(),
          inicio.getMonth() + pagosPrevios.length + 1,
          Math.min(parseInt(diaPago) || 1, 28),
        )
          .toISOString()
          .split("T")[0];
      }

      await registrarVentaHistorica({
        venta: {
          fecha: new Date(fecha).toISOString(),
          id_cliente: clienteSeleccionado?.id || null,
          total: totalNum,
          via,
          id_distribuidora: distribuidoraId || null,
          comision_monto: comisionMonto,
          es_credito: esCredito,
          notas: descripcion,
        },
        credito: esCredito
          ? {
              monto_total: totalNum,
              saldo_pendiente: saldoNum,
              cuota_mensual: cuotaNum,
              meses_plazo: mesesPlazo,
              dia_pago: parseInt(diaPago) || 1,
              fecha_inicio: fechaInicio,
              fecha_proximo_pago: fechaProximoPago,
            }
          : null,
        pagosPrevios: esCredito ? pagosPrevios : [],
      });

      alert("Registro histórico guardado exitosamente");
      router.push("/admin/ventas");
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("Error al registrar: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Volver a ventas
        </button>
      </div>

      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-2">
        Registro Histórico
      </h1>
      <p className="text-gray-500 mb-10">
        Para registrar ventas y créditos anteriores al sistema. No afecta el
        inventario ni descuenta stock.
      </p>

      {/* DATOS DE LA VENTA */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wider">
          Datos de la Venta
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de la venta *
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto total ($) *
            </label>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción de las joyas (opcional)
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            placeholder="Ej: Aretes de oro, collar de perlas..."
            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>
      </div>

      {/* CLIENTE */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wider">
          Cliente
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
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
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
            </div>

            {clientesEncontrados.length > 0 && (
              <div className="border border-gray-200 mt-3">
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
            <p className="text-sm text-gray-500 mt-2">
              El cliente es opcional para ventas de contado, obligatorio para
              créditos
            </p>
          </>
        )}
      </div>

      {/* VÍA DE VENTA */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wider">
          Vía de Venta
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
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
          <div className="max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distribuidora
            </label>
            <select
              value={distribuidoraId}
              onChange={(e) => setDistribuidoraId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Seleccionar</option>
              {distribuidoras.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} ({d.porcentaje_comision}%)
                </option>
              ))}
            </select>
            {comisionMonto > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Comisión: {formatPrice(comisionMonto)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* FORMA DE PAGO */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wider">
          Forma de Pago
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo pendiente actual ($)
                </label>
                <input
                  type="number"
                  value={saldoPendiente}
                  onChange={(e) => setSaldoPendiente(e.target.value)}
                  placeholder="Cuánto falta por cobrar hoy"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Día de pago (cada mes)
                </label>
                <input
                  type="number"
                  value={diaPago}
                  onChange={(e) => setDiaPago(e.target.value)}
                  min="1"
                  max="31"
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de inicio del crédito
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>

            {mesesPlazo > 0 && (
              <div className="bg-gray-50 p-3 border border-gray-200 text-sm text-gray-600">
                Plazo estimado: {mesesPlazo}{" "}
                {mesesPlazo === 1 ? "mes" : "meses"}
              </div>
            )}

            {/* Pagos ya realizados */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Pagos ya realizados (opcional)
              </h3>

              {pagosPrevios.length > 0 && (
                <div className="mb-3 space-y-2">
                  {pagosPrevios.map((pago, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 text-sm"
                    >
                      <span>
                        {new Date(pago.fecha).toLocaleDateString("es-EC")} —{" "}
                        {formatPrice(pago.monto)}
                      </span>
                      <button
                        onClick={() => quitarPago(i)}
                        className="text-red-600 hover:text-red-900 text-xs"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <p className="text-sm text-gray-600 font-medium">
                    Total pagado: {formatPrice(totalPagado)}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="date"
                  value={nuevoPagoFecha}
                  onChange={(e) => setNuevoPagoFecha(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 text-sm"
                />
                <input
                  type="number"
                  value={nuevoPagoMonto}
                  onChange={(e) => setNuevoPagoMonto(e.target.value)}
                  placeholder="Monto"
                  min="0"
                  step="0.01"
                  className="w-32 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 text-sm"
                />
                <button
                  onClick={agregarPago}
                  className="px-4 py-2 border border-gray-900 text-gray-900 text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors"
                >
                  Agregar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Registra aquí los pagos que el cliente ya hizo antes de entrar
                al sistema
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMAR */}
      <button
        onClick={handleConfirmar}
        disabled={guardando}
        className="w-full py-5 bg-gray-900 text-white text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:bg-gray-400"
      >
        {guardando ? "Guardando..." : "Guardar Registro Histórico"}
      </button>
    </div>
  );
}
