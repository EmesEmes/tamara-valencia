'use client';
import { useState, useEffect, useRef } from 'react';
import { TIPOS_PRODUCTO, CATEGORIAS_PRODUCTO, MATERIALES_PRODUCTO } from '@/lib/constants';

export default function Filters({ filters, onFilterChange, onClearFilters }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const isFirstRender = useRef(true);

  // Debounce para precios
  useEffect(() => {
    // Evitar ejecutar en el primer render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      onFilterChange(localFilters);
    }, 1000); // Espera 800ms después de que el usuario deje de escribir

    return () => clearTimeout(timeoutId);
  }, [localFilters.precioMin, localFilters.precioMax, localFilters, onFilterChange]);

  // Actualizar filtros locales cuando cambien los externos (ej: al limpiar)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...localFilters,
      [name]: value
    };
    setLocalFilters(newFilters);

    // Para los selects (tipo, categoria, material), aplicar inmediatamente
    if (name !== 'precioMin' && name !== 'precioMax') {
      onFilterChange(newFilters);
    }
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== '');

  return (
    <div className="mb-12 bg-gray-50 p-6 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Filtro por Tipo */}
        <div>
          <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
            Tipo
          </label>
          <select
            name="tipo"
            value={localFilters.tipo}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 bg-white focus:outline-none focus:border-gray-500 text-sm"
          >
            <option value="">Todos</option>
            {TIPOS_PRODUCTO.map(tipo => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Categoría */}
        <div>
          <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
            Categoría
          </label>
          <select
            name="categoria"
            value={localFilters.categoria}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 bg-white focus:outline-none focus:border-gray-500 text-sm"
          >
            <option value="">Todas</option>
            {CATEGORIAS_PRODUCTO.map(categoria => (
              <option key={categoria.value} value={categoria.value}>
                {categoria.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Material */}
        <div>
          <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
            Material
          </label>
          <select
            name="material"
            value={localFilters.material}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 bg-white focus:outline-none focus:border-gray-500 text-sm"
          >
            <option value="">Todos</option>
            {MATERIALES_PRODUCTO.map(material => (
              <option key={material.value} value={material.value}>
                {material.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Precio Mínimo */}
        <div>
          <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
            Precio Mín.
          </label>
          <input
            type="number"
            name="precioMin"
            value={localFilters.precioMin}
            onChange={handleChange}
            placeholder="$0"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 bg-white focus:outline-none focus:border-gray-500 text-sm"
          />
        </div>

        {/* Filtro Precio Máximo */}
        <div>
          <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
            Precio Máx.
          </label>
          <input
            type="number"
            name="precioMax"
            value={localFilters.precioMax}
            onChange={handleChange}
            placeholder="$9999"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 bg-white focus:outline-none focus:border-gray-500 text-sm"
          />
        </div>
      </div>

      {/* Botón para limpiar filtros */}
      {hasActiveFilters && (
        <div className="mt-4 text-center">
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 uppercase tracking-wider underline"
          >
            Limpiar Filtros
          </button>
        </div>
      )}
    </div>
  );
}