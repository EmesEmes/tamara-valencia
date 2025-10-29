'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getFactorById, createFactor, updateFactor } from '@/lib/supabase/client';

export default function FactorForm({ factorId = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    valor: '',
  });

  const fetchFactor = useCallback(async () => {
    if (!factorId) return;
    
    try {
      const data = await getFactorById(factorId);
      setFormData({
        nombre: data.nombre,
        valor: data.valor.toString(),
      });
    } catch (error) {
      console.error('Error al cargar factor:', error);
      alert('Error al cargar el factor');
    }
  }, [factorId]);

  useEffect(() => {
    fetchFactor();
  }, [fetchFactor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre || !formData.valor) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const valor = parseFloat(formData.valor);
    if (isNaN(valor) || valor <= 0) {
      alert('El valor debe ser un número mayor a 0');
      return;
    }

    setLoading(true);

    try {
      const dataToSave = {
        nombre: formData.nombre,
        valor: valor,
      };

      if (factorId) {
        // Actualizar
        await updateFactor(factorId, dataToSave);
        alert('Factor actualizado exitosamente');
      } else {
        // Crear nuevo
        await createFactor(dataToSave);
        alert('Factor creado exitosamente');
      }

      router.push('/admin/factores');
    } catch (error) {
      console.error('Error al guardar factor:', error);
      alert('Error al guardar el factor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del Factor *
        </label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          placeholder="Ej: Joya de plata bañada en rodio"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          Nombre descriptivo del tipo de joya
        </p>
      </div>

      {/* Valor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Valor del Factor *
        </label>
        <input
          type="number"
          name="valor"
          value={formData.valor}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
          placeholder="Ej: 9.7"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          Este valor se multiplicará por el peso del producto para calcular el precio
        </p>
      </div>

      {/* Botones */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Guardando...' : (factorId ? 'Actualizar Factor' : 'Crear Factor')}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/factores')}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}