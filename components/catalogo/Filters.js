"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TIPOS_PRODUCTO,
  CATEGORIAS_PRODUCTO,
  MATERIALES_PRODUCTO,
} from "@/lib/constants";
import { getConjuntos } from "@/lib/supabase/client";

const FILTROS_VACIOS = {
  tipo: "",
  categoria: "",
  material: "",
  conjunto: "",
  codigo: "",
  precioMin: "",
  precioMax: "",
};

export default function Filters({ filters, onFilterChange, onClearFilters }) {
  const [localFilters, setLocalFilters] = useState({
    ...FILTROS_VACIOS,
    ...filters,
  });
  useEffect(() => {
    setLocalFilters({ ...FILTROS_VACIOS, ...filters });
  }, [filters]);

  const { data: conjuntos = [] } = useQuery({
    queryKey: ["conjuntos"],
    queryFn: getConjuntos,
    staleTime: 10 * 60 * 1000,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuscar = () => {
    onFilterChange(localFilters);
  };

  const handleEnterKey = (e) => {
    if (e.key === "Enter") handleBuscar();
  };

  const handleLimpiar = () => {
    setLocalFilters(FILTROS_VACIOS);
    onClearFilters();
  };

  const hasActiveFilters = Object.values(localFilters).some(
    (value) => value !== "" && value != null,
  );

  return (
    <div className="mb-12 bg-gray-50 p-6 rounded-lg">
      {/* Fila 1: Selects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
            {TIPOS_PRODUCTO.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

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
            {CATEGORIAS_PRODUCTO.map((categoria) => (
              <option key={categoria.value} value={categoria.value}>
                {categoria.label}
              </option>
            ))}
          </select>
        </div>

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
            {MATERIALES_PRODUCTO.map((material) => (
              <option key={material.value} value={material.value}>
                {material.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
            Conjunto
          </label>
          <select
            name="conjunto"
            value={localFilters.conjunto}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 bg-white focus:outline-none focus:border-gray-500 text-sm"
          >
            <option value="">Todos</option>
            {conjuntos.map((conjunto) => (
              <option key={conjunto.id} value={conjunto.id}>
                {conjunto.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fila 2: Código y Precios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
            Buscar por Código
          </label>
          <input
            type="text"
            name="codigo"
            value={localFilters.codigo}
            onChange={handleChange}
            onKeyDown={handleEnterKey}
            placeholder="Ej: OANP, MA..."
            className="w-full px-4 py-2 border border-gray-300 bg-white focus:outline-none focus:border-gray-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
            Precio Mín.
          </label>
          <input
            type="number"
            name="precioMin"
            value={localFilters.precioMin}
            onChange={handleChange}
            onKeyDown={handleEnterKey}
            placeholder="$0"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 bg-white focus:outline-none focus:border-gray-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
            Precio Máx.
          </label>
          <input
            type="number"
            name="precioMax"
            value={localFilters.precioMax}
            onChange={handleChange}
            onKeyDown={handleEnterKey}
            placeholder="$9999"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 bg-white focus:outline-none focus:border-gray-500 text-sm"
          />
        </div>
      </div>

      {/* Botón de búsqueda */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleBuscar}
          className="w-full md:w-auto px-12 py-3 bg-gray-900 text-white text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Buscar
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleLimpiar}
            className="text-sm text-gray-600 hover:text-gray-900 uppercase tracking-wider underline"
          >
            Limpiar Filtros
          </button>
        )}
      </div>
    </div>
  );
}
