import { supabase } from "./client";

const redondear = (n) => Math.round(n * 100) / 100;

const hoyStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ============================================================
// DEVENGO DE COMISIÓN
// Se llama cada vez que un cliente paga (pago de crédito o venta de
// contado). Busca la distribuidora del cliente y le genera su comisión.
// ============================================================
export const devengarComision = async ({
  id_cliente,
  base,
  fecha = null,
  id_venta = null,
  id_movimiento = null,
  concepto = null,
}) => {
  if (!id_cliente) return null;

  // 1. Distribuidora del cliente
  const { data: cliente, error: cliError } = await supabase
    .from("clientes")
    .select("id_distribuidora")
    .eq("id", id_cliente)
    .single();

  if (cliError) throw cliError;
  if (!cliente.id_distribuidora) return null; // cliente sin distribuidora

  // 2. Porcentaje de la distribuidora
  const { data: dist, error: distError } = await supabase
    .from("distribuidoras")
    .select("porcentaje_comision")
    .eq("id", cliente.id_distribuidora)
    .single();

  if (distError) throw distError;

  const porcentaje = parseFloat(dist.porcentaje_comision) || 0;
  if (porcentaje <= 0) return null; // 0% (ej. TVCJ / Gerencia): no se genera nada

  const baseNum = redondear(parseFloat(base) || 0);
  const monto = redondear((baseNum * porcentaje) / 100);
  if (monto <= 0) return null;

  // 3. Registrar la comisión "por cobrar"
  const { data, error } = await supabase
    .from("comisiones")
    .insert([
      {
        id_distribuidora: cliente.id_distribuidora,
        id_cliente,
        id_venta,
        id_movimiento,
        base: baseNum,
        porcentaje,
        monto,
        fecha: fecha || hoyStr(),
        estado: "por_cobrar",
        notas: concepto,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================================
// CONSULTAS PARA LA PÁGINA DE LA DISTRIBUIDORA
// ============================================================

// Comisiones ya devengadas (por cobrar + pagadas) de una distribuidora
export const getComisionesDistribuidora = async (idDistribuidora) => {
  const { data, error } = await supabase
    .from("comisiones")
    .select(
      `
      *,
      cliente:clientes(id, nombre)
    `,
    )
    .eq("id_distribuidora", idDistribuidora)
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Comisión PENDIENTE: proyección del % sobre lo que los clientes de esta
// distribuidora todavía deben en sus cuentas.
export const getComisionPendiente = async (idDistribuidora) => {
  // Porcentaje de la distribuidora
  const { data: dist, error: distError } = await supabase
    .from("distribuidoras")
    .select("porcentaje_comision")
    .eq("id", idDistribuidora)
    .single();

  if (distError) throw distError;
  const porcentaje = parseFloat(dist.porcentaje_comision) || 0;
  if (porcentaje <= 0) return 0;

  // Clientes de esta distribuidora
  const { data: clientes, error: cliError } = await supabase
    .from("clientes")
    .select("id")
    .eq("id_distribuidora", idDistribuidora);

  if (cliError) throw cliError;
  const ids = (clientes || []).map((c) => c.id);
  if (ids.length === 0) return 0;

  // Saldos de sus cuentas activas
  const { data: cuentas, error: cuentaError } = await supabase
    .from("cuentas")
    .select("saldo")
    .in("id_cliente", ids)
    .eq("estado", "activa");

  if (cuentaError) throw cuentaError;

  const saldoTotal = (cuentas || []).reduce(
    (sum, c) => sum + parseFloat(c.saldo),
    0,
  );

  return redondear((saldoTotal * porcentaje) / 100);
};

// Resumen completo de comisiones de la distribuidora
export const getResumenComisiones = async (idDistribuidora) => {
  const [comisiones, pendiente] = await Promise.all([
    getComisionesDistribuidora(idDistribuidora),
    getComisionPendiente(idDistribuidora),
  ]);

  const porCobrar = comisiones
    .filter((c) => c.estado === "por_cobrar")
    .reduce((sum, c) => sum + parseFloat(c.monto), 0);

  const pagada = comisiones
    .filter((c) => c.estado === "pagada")
    .reduce((sum, c) => sum + parseFloat(c.monto), 0);

  return {
    pendiente: redondear(pendiente),
    porCobrar: redondear(porCobrar),
    pagada: redondear(pagada),
    comisiones,
  };
};

// ============================================================
// LIQUIDACIÓN (pagar comisiones a la distribuidora)
// ============================================================

// Marca una comisión concreta como pagada / por cobrar
export const marcarComision = async (idComision, pagada) => {
  const { error } = await supabase
    .from("comisiones")
    .update({
      estado: pagada ? "pagada" : "por_cobrar",
      fecha_pago: pagada ? hoyStr() : null,
    })
    .eq("id", idComision);

  if (error) throw error;
  return true;
};

// Liquida (marca pagadas) todas las comisiones por cobrar de la distribuidora
export const liquidarComisiones = async (idDistribuidora) => {
  const { error } = await supabase
    .from("comisiones")
    .update({ estado: "pagada", fecha_pago: hoyStr() })
    .eq("id_distribuidora", idDistribuidora)
    .eq("estado", "por_cobrar");

  if (error) throw error;
  return true;
};
