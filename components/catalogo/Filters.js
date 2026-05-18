"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TIPOS_PRODUCTO,
  CATEGORIAS_PRODUCTO,
  MATERIALES_PRODUCTO,
} from "@/lib/constants";
import { getConjuntos } from "@/lib/supabase/client";

export default function Filters({ filters, onFilterChange, onClearFilters }) {
  const [localFilters, setLocalFilters] = useState({
    ...filters,
    codigo: filters.codigo || "",
  });
  const isFirstRender = useRef(true);
  const previousFilters = useRef(filters);

  const { data: conjuntos = [] } = useQuery({
    queryKey: ["conjuntos"],
    queryFn: getConjuntos,
    staleTime: 10 * 60 * 1000,
  });

  // Debounce para precios y código
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousFilters.current = localFilters;
      return;
    }

    const filtersChanged =
      localFilters.precioMin !== previousFilters.current.precioMin ||
      localFilters.precioMax !== previousFilters.current.precioMax ||
      localFilters.codigo !== previousFilters.current.codigo;

    if (!filtersChanged) return;

    const timeoutId = setTimeout(() => {
      onFilterChange(localFilters);
      previousFilters.current = localFilters;
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, [
    localFilters.precioMin,
    localFilters.precioMax,
    localFilters.codigo,
    localFilters,
    onFilterChange,
  ]);

  useEffect(() => {
    setLocalFilters({ ...filters, codigo: filters.codigo || "" });
    previousFilters.current = filters;
  }, [filters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...localFilters, [name]: value };
    setLocalFilters(newFilters);

    // Selects aplican inmediatamente, precios y código tienen debounce
    if (name !== "precioMin" && name !== "precioMax" && name !== "codigo") {
      onFilterChange(newFilters);
      previousFilters.current = newFilters;
    }
  };

  const hasActiveFilters = Object.values(localFilters).some(
    (value) => value !== "",
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
            Buscar por Código
          </label>
          <input
            type="text"
            name="codigo"
            value={localFilters.codigo}
            onChange={handleChange}
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
            placeholder="$9999"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 bg-white focus:outline-none focus:border-gray-500 text-sm"
          />
        </div>
      </div>

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
