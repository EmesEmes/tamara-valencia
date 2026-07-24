// Genera el PDF del estado de cuenta de un cliente.
// Usa jsPDF + autotable (requiere: npm install jspdf jspdf-autotable)

const formatMoneda = (valor) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor || 0);

const formatFecha = (fecha) => {
  if (!fecha) return "-";
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
};

const TIPO_LABEL = {
  cargo: "Compra",
  abono: "Pago",
  saldo_inicial: "Saldo inicial",
};

export const descargarEstadoCuenta = async ({
  cliente,
  cuenta,
  movimientos,
}) => {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  const anchoPagina = doc.internal.pageSize.getWidth();

  // Encabezado
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text("Tamara Valencia Joyas", anchoPagina / 2, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Estado de Cuenta", anchoPagina / 2, 28, { align: "center" });

  // Línea separadora
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 33, anchoPagina - 14, 33);

  // Datos del cliente
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  let y = 42;

  doc.setFont(undefined, "bold");
  doc.text("Cliente:", 14, y);
  doc.setFont(undefined, "normal");
  doc.text(cliente?.nombre || "-", 40, y);

  y += 6;
  if (cliente?.cedula) {
    doc.setFont(undefined, "bold");
    doc.text("Cédula:", 14, y);
    doc.setFont(undefined, "normal");
    doc.text(cliente.cedula, 40, y);
    y += 6;
  }
  if (cliente?.telefono) {
    doc.setFont(undefined, "bold");
    doc.text("Teléfono:", 14, y);
    doc.setFont(undefined, "normal");
    doc.text(cliente.telefono, 40, y);
    y += 6;
  }

  // Datos del acuerdo (columna derecha)
  let yDer = 42;
  const xDer = anchoPagina / 2 + 10;

  doc.setFont(undefined, "bold");
  doc.text("Cuota mensual:", xDer, yDer);
  doc.setFont(undefined, "normal");
  doc.text(formatMoneda(cuenta?.cuota_mensual), xDer + 38, yDer);

  yDer += 6;
  doc.setFont(undefined, "bold");
  doc.text("Día de pago:", xDer, yDer);
  doc.setFont(undefined, "normal");
  doc.text(`${cuenta?.dia_pago || 1} de cada mes`, xDer + 38, yDer);

  yDer += 6;
  doc.setFont(undefined, "bold");
  doc.text("Emitido:", xDer, yDer);
  doc.setFont(undefined, "normal");
  doc.text(new Date().toLocaleDateString("es-EC"), xDer + 38, yDer);

  y = Math.max(y, yDer) + 8;

  // Tabla de movimientos
  const filas = (movimientos || []).map((mov) => [
    formatFecha(mov.fecha),
    TIPO_LABEL[mov.tipo] || mov.tipo,
    mov.concepto || "",
    mov.tipo === "abono" ? "" : formatMoneda(mov.monto),
    mov.tipo === "abono" ? formatMoneda(mov.monto) : "",
    formatMoneda(mov.saldo_resultante),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Fecha", "Tipo", "Concepto", "Cargo", "Abono", "Saldo"]],
    body: filas,
    theme: "grid",
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8, textColor: [60, 60, 60] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 24 },
      3: { halign: "right", cellWidth: 24 },
      4: { halign: "right", cellWidth: 24 },
      5: { halign: "right", cellWidth: 26 },
    },
    margin: { left: 14, right: 14 },
  });

  // Saldo final destacado
  const yFinal = doc.lastAutoTable.finalY + 12;

  doc.setFillColor(31, 41, 55);
  doc.rect(anchoPagina - 90, yFinal - 7, 76, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("SALDO ACTUAL:", anchoPagina - 86, yFinal);
  doc.text(formatMoneda(cuenta?.saldo), anchoPagina - 18, yFinal, {
    align: "right",
  });

  // Pie de página
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text(
    "Este documento es un resumen informativo de la cuenta.",
    anchoPagina / 2,
    doc.internal.pageSize.getHeight() - 12,
    { align: "center" },
  );

  const nombreArchivo = `estado-cuenta-${(cliente?.nombre || "cliente")
    .toLowerCase()
    .replace(/\s+/g, "-")}.pdf`;

  doc.save(nombreArchivo);
};
