"use client";
import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useRouter } from "next/navigation";

export default function EditarProductoPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const { data, error } = await supabase
          .from("productos")
          .select("*")
          .eq("id", resolvedParams.id)
          .single();

        if (error) throw error;
        setProducto(data);
      } catch (error) {
        console.error("Error al cargar producto:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducto();
  }, [resolvedParams.id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!producto) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-light text-gray-900 mb-4">
          Producto no encontrado
        </h2>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Volver a productos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Volver a productos
        </button>
      </div>

      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-8">
        Editar Producto
      </h1>

      <ProductForm producto={producto} />
    </div>
  );
}
