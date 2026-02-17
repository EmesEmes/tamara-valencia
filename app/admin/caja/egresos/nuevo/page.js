"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearEgreso } from "@/lib/api/caja/egresos";
import {
  CATEGORIAS_EGRESO,
  FRECUENCIAS_EGRESO,
  TIPOS_RECURRENCIA,
} from "@/lib/constants/caja";

export default function NuevoEgresoPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    concepto: "",
    categoria: "operacion",
    tipo_recurrencia: "fijo",
    monto_fijo: 0,
    frecuencia: "mensual",
    dia_pago: 1,
    fecha_inicio: "",
    fecha_fin: "",
    cantidad_pagos: "",
    notas: "",
  });

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.concepto.trim()) {
      setError("El concepto es requerido");
      return;
    }

    if (formData.tipo_recurrencia === "fijo" && formData.monto_fijo <= 0) {
      setError("El monto fijo debe ser mayor a 0");
      return;
    }

    if (!formData.fecha_inicio) {
      setError("La fecha de inicio es requerida");
      return;
    }

    if (formData.fecha_fin && formData.cantidad_pagos) {
      setError(
        "No puedes especificar fecha fin Y cantidad de pagos. Elige solo uno.",
      );
      return;
    }

    if (
      !confirm(
        `¿Crear egreso recurrente "${formData.concepto}"?\n\nFrecuencia: ${getLabelFrecuencia(formData.frecuencia)}\n${formData.tipo_recurrencia === "fijo" ? `Monto: $${formData.monto_fijo}` : "Monto variable"}`,
      )
    ) {
      return;
    }

    setProcesando(true);

    try {
      const { data, error } = await crearEgreso({
        ...formData,
        fecha_fin: formData.fecha_fin || null,
        cantidad_pagos: formData.cantidad_pagos
          ? parseInt(formData.cantidad_pagos)
          : null,
      });

      if (error) throw error;

      alert("Egreso creado correctamente");
      router.push("/admin/caja/egresos");
    } catch (err) {
      console.error("Error al crear egreso:", err);
      setError(err.message || "Error al crear el egreso");
    } finally {
      setProcesando(false);
    }
  };

  const getLabelFrecuencia = (frecuencia) => {
    const frec = FRECUENCIAS_EGRESO.find((f) => f.value === frecuencia);
    return frec?.label || frecuencia;
  };

  // Establecer fecha de inicio por defecto (hoy)
  useState(() => {
    if (!formData.fecha_inicio) {
      const hoy = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, fecha_inicio: hoy }));
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nuevo Egreso Recurrente
          </h1>
          <p className="text-gray-600">
            Registra un gasto recurrente del negocio
          </p>
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
              href="/admin/caja/egresos"
              className="text-gray-600 hover:text-gray-900"
            >
              Egresos
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">Nuevo</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="space-y-6">
            {/* Concepto */}
            <div>
              <label
                htmlFor="concepto"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Concepto *
              </label>
              <input
                type="text"
                id="concepto"
                name="concepto"
                value={formData.concepto}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Cuota préstamo banco, Arriendo local, etc."
                required
              />
            </div>

            {/* Categoría */}
            <div>
              <label
                htmlFor="categoria"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Categoría *
              </label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {CATEGORIAS_EGRESO.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Recurrencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Monto *
              </label>
              <div className="space-y-2">
                {TIPOS_RECURRENCIA.map((tipo) => (
                  <label
                    key={tipo.value}
                    className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="tipo_recurrencia"
                      value={tipo.value}
                      checked={formData.tipo_recurrencia === tipo.value}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 text-sm text-gray-900">
                      {tipo.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Monto Fijo (solo si es fijo) */}
            {formData.tipo_recurrencia === "fijo" && (
              <div>
                <label
                  htmlFor="monto_fijo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Monto Fijo *
                </label>
                <input
                  type="number"
                  id="monto_fijo"
                  name="monto_fijo"
                  value={formData.monto_fijo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            )}

            {/* Frecuencia */}
            <div>
              <label
                htmlFor="frecuencia"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Frecuencia de Pago *
              </label>
              <select
                id="frecuencia"
                name="frecuencia"
                value={formData.frecuencia}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {FRECUENCIAS_EGRESO.map((frec) => (
                  <option key={frec.value} value={frec.value}>
                    {frec.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Día de Pago */}
            <div>
              <label
                htmlFor="dia_pago"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Día de Pago
              </label>
              <input
                type="number"
                id="dia_pago"
                name="dia_pago"
                value={formData.dia_pago}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="31"
              />
              <p className="text-xs text-gray-500 mt-1">
                Día del mes en que se realiza el pago
              </p>
            </div>

            {/* Fecha de Inicio */}
            <div>
              <label
                htmlFor="fecha_inicio"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Fecha de Inicio *
              </label>
              <input
                type="date"
                id="fecha_inicio"
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Duración del Egreso */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-3">
                Duración del Egreso (opcional)
              </p>
              <p className="text-xs text-gray-600 mb-4">
                Puedes especificar una fecha fin O una cantidad de pagos, o
                dejarlo indefinido
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Fecha Fin */}
                <div>
                  <label
                    htmlFor="fecha_fin"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    id="fecha_fin"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Cantidad de Pagos */}
                <div>
                  <label
                    htmlFor="cantidad_pagos"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Cantidad de Pagos
                  </label>
                  <input
                    type="number"
                    id="cantidad_pagos"
                    name="cantidad_pagos"
                    value={formData.cantidad_pagos}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 12"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label
                htmlFor="notas"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Notas
              </label>
              <textarea
                id="notas"
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Información adicional..."
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={procesando}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {procesando ? "Creando..." : "✓ Crear Egreso"}
              </button>

              <Link
                href="/admin/caja/egresos"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
