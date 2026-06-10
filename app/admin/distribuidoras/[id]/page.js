"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import DistribuidoraForm from "@/components/admin/DistribuidoraForm";
import Link from "next/link";

export default function EditarDistribuidoraPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Volver a distribuidoras
        </button>
      </div>
      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-8">
        Editar Distribuidora
      </h1>
      <DistribuidoraForm distribuidoraId={resolvedParams.id} />
    </div>
  );
}
