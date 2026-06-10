import { supabase } from "./client";

// Calcular fecha de pago respetando el último día del mes
const calcularFechaPago = (año, mes, diaPago) => {
  const ultimoDia = new Date(año, mes + 1, 0).getDate();
  const diaReal = Math.min(diaPago, ultimoDia);
  return new Date(año, mes, diaReal);
};

// Obtener todos los créditos con info del cliente
export const getCreditos = async (filtros = {}) => {
  let query = supabase
    .from("creditos")
    .select(
      `
      *,
      cliente:clientes(id, nombre, telefono),
      venta:ventas(id, fecha, total)
    `,
    )
    .order("created_at", { ascending: false });

  if (filtros.estado) query = query.eq("estado", filtros.estado);
  if (filtros.id_cliente) query = query.eq("id_cliente", filtros.id_cliente);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Obtener créditos de un cliente específico
export const getCreditosCliente = async (clienteId) => {
  const { data, error } = await supabase
    .from("creditos")
    .select(
      `
      *,
      venta:ventas(id, fecha, total),
      pagos:pagos_credito(*)
    `,
    )
    .eq("id_cliente", clienteId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Obtener un crédito por ID con sus pagos
export const getCreditoById = async (id) => {
  const { data, error } = await supabase
    .from("creditos")
    .select(
      `
      *,
      cliente:clientes(id, nombre, telefono, cedula),
      venta:ventas(
        id, fecha, total, subtotal, descuento,
        detalle:ventas_detalle(
          cantidad, precio_unitario,
          producto:productos(codigo, nombre_comercial)
        )
      ),
      pagos:pagos_credito(*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Registrar un pago de crédito
export const registrarPago = async (creditoId, { monto, tipo, notas }) => {
  // Obtener el crédito actual
  const { data: credito, error: creditoError } = await supabase
    .from("creditos")
    .select("*")
    .eq("id", creditoId)
    .single();

  if (creditoError) throw creditoError;

  const montoNum = parseFloat(monto);
  const nuevoSaldo = Math.max(
    0,
    parseFloat(credito.saldo_pendiente) - montoNum,
  );

  // Calcular nueva cuota si es anticipo
  let nuevaCuota = credito.cuota_mensual;
  if (tipo === "anticipo" && nuevoSaldo > 0) {
    // Recalcular cuota manteniendo el plazo restante
    const pagosRealizados = await supabase
      .from("pagos_credito")
      .select("id")
      .eq("id_credito", creditoId);
    const mesesPagados = pagosRealizados.data?.length || 0;
    const mesesRestantes = Math.max(1, credito.meses_plazo - mesesPagados);
    nuevaCuota = Math.ceil(nuevoSaldo / mesesRestantes);
  }

  // Calcular próximo pago
  const ahora = new Date();
  const proximoPago = calcularFechaPago(
    ahora.getMonth() === 11 ? ahora.getFullYear() + 1 : ahora.getFullYear(),
    ahora.getMonth() === 11 ? 0 : ahora.getMonth() + 1,
    credito.dia_pago || 1,
  );

  // Registrar el pago
  const { error: pagoError } = await supabase.from("pagos_credito").insert([
    {
      id_credito: creditoId,
      fecha_pago: new Date().toISOString(),
      monto: montoNum,
      tipo,
      cuota_anterior: credito.cuota_mensual,
      cuota_nueva: nuevaCuota,
      notas: notas || null,
      created_at: new Date().toISOString(),
    },
  ]);

  if (pagoError) throw pagoError;

  // Actualizar el crédito
  const nuevoEstado = nuevoSaldo === 0 ? "pagado" : credito.estado;
  const { error: updateError } = await supabase
    .from("creditos")
    .update({
      saldo_pendiente: nuevoSaldo,
      cuota_mensual: nuevaCuota,
      estado: nuevoEstado,
      fecha_proximo_pago:
        nuevoSaldo > 0 ? proximoPago.toISOString().split("T")[0] : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", creditoId);

  if (updateError) throw updateError;

  return { nuevoSaldo, nuevaCuota, nuevoEstado };
};
