"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getDistribuidoraById,
  createDistribuidora,
  updateDistribuidora,
} from "@/lib/supabase/distribuidoras";

export default function DistribuidoraForm({ distribuidoraId = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    porcentaje_comision: "",
    notas: "",
  });

  const fetchDistribuidora = useCallback(async () => {
    if (!distribuidoraId) return;
    try {
      const data = await getDistribuidoraById(distribuidoraId);
      setFormData({
        nombre: data.nombre,
        telefono: data.telefono || "",
        porcentaje_comision: data.porcentaje_comision.toString(),
        notas: data.notas || "",
      });
    } catch (error) {
      console.error("Error al cargar distribuidora:", error);
      alert("Error al cargar la distribuidora");
    }
  }, [distribuidoraId]);

  useEffect(() => {
    fetchDistribuidora();
  }, [fetchDistribuidora]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre) {
      alert("El nombre es obligatorio");
      return;
    }

    const comision = parseFloat(formData.porcentaje_comision);
    if (isNaN(comision) || comision < 0 || comision > 100) {
      alert("La comisión debe ser un número entre 0 y 100");
      return;
    }

    setLoading(true);
    try {
      if (distribuidoraId) {
        await updateDistribuidora(distribuidoraId, formData);
        alert("Distribuidora actualizada exitosamente");
      } else {
        await createDistribuidora(formData);
        alert("Distribuidora creada exitosamente");
      }
      router.push("/admin/distribuidoras");
    } catch (error) {
      console.error("Error al guardar distribuidora:", error);
      alert("Error al guardar la distribuidora: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre *
        </label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          placeholder="Nombre de la distribuidora"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Teléfono
        </label>
        <input
          type="text"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          placeholder="Ej: 0991234567"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comisión (%) *
        </label>
        <input
          type="number"
          name="porcentaje_comision"
          value={formData.porcentaje_comision}
          onChange={handleChange}
          step="0.01"
          min="0"
          max="100"
          required
          placeholder="Ej: 10"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          Porcentaje de comisión sobre el total de la venta
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas
        </label>
        <textarea
          name="notas"
          value={formData.notas}
          onChange={handleChange}
          rows={3}
          placeholder="Información adicional..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
        >
          {loading
            ? "Guardando..."
            : distribuidoraId
              ? "Actualizar"
              : "Crear Distribuidora"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/distribuidoras")}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
