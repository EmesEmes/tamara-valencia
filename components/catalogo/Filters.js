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
  orden: "",
  talla: "",
};

const TALLAS_ANILLO = (() => {
  const opciones = [];
  for (let entero = 4; entero <= 12; entero++) {
    opciones.push({ value: entero, label: `${entero}` });
    if (entero < 12) {
      opciones.push({ value: entero + 0.25, label: `${entero} ¼` });
      opciones.push({ value: entero + 0.5, label: `${entero} ½` });
      opciones.push({ value: entero + 0.75, label: `${entero} ¾` });
    }
  }
  return opciones;
})();

export default function Filters({ filters, onFilterChange, onClearFilters }) {
  const [abierto, setAbierto] = useState(false);
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
    setLocalFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "tipo" && value !== "anillo" ? { talla: "" } : {}),
    }));
  };

  const handleBuscar = () => {
    onFilterChange(localFilters);
    setAbierto(false);
  };

  const handleEnterKey = (e) => {
    if (e.key === "Enter") handleBuscar();
  };

  const handleLimpiar = () => {
    setLocalFilters(FILTROS_VACIOS);
    onClearFilters();
    setAbierto(false);
  };

  const filtrosActivos = [
    "tipo",
    "categoria",
    "material",
    "conjunto",
    "codigo",
    "precioMin",
    "precioMax",
    "talla",
  ].filter((key) => filters[key] && filters[key] !== "").length;

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 uppercase tracking-wider underline"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filtros
        {filtrosActivos > 0 && ` (${filtrosActivos})`}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setAbierto(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-full max-w-sm bg-white z-50 shadow-xl transform transition-transform duration-300 overflow-y-auto ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-elegant text-2xl font-light text-gray-900">
              Filtros
            </h2>
            <button
              onClick={() => setAbierto(false)}
              className="text-gray-400 hover:text-gray-900 text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          <div className="space-y-5">
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

            {localFilters.tipo === "anillo" && (
              <div>
                <label className="block text-sm font-light text-gray-700 mb-2 uppercase tracking-wider">
                  Talla
                </label>
                <select
                  name="talla"
                  value={localFilters.talla}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 bg-white focus:outline-none focus:border-gray-500 text-sm"
                >
                  <option value="">Todas</option>
                  {TALLAS_ANILLO.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                  <option value="variable">Regulable</option>
                </select>
              </div>
            )}

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

            <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="flex flex-col items-center gap-3 mt-8">
            <button
              onClick={handleBuscar}
              className="w-full py-3 bg-gray-900 text-white text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              Buscar
            </button>

            {filtrosActivos > 0 && (
              <button
                onClick={handleLimpiar}
                className="text-sm text-gray-600 hover:text-gray-900 uppercase tracking-wider underline"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
