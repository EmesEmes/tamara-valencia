'use client';
import { TIPOS_PRODUCTO, CATEGORIAS_PRODUCTO, MATERIALES_PRODUCTO } from '@/lib/constants';

export default function Filters({ filters, onFilterChange, onClearFilters }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      [name]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

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
            value={filters.tipo}
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
            value={filters.categoria}
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
            value={filters.material}
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
            value={filters.precioMin}
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
            value={filters.precioMax}
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