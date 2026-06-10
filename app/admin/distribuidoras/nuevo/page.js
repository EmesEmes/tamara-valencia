import DistribuidoraForm from "@/components/admin/DistribuidoraForm";
import Link from "next/link";

export default function NuevaDistribuidoraPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link
          href="/admin/distribuidoras"
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Volver a distribuidoras
        </Link>
      </div>
      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-8">
        Nueva Distribuidora
      </h1>
      <DistribuidoraForm />
    </div>
  );
}
