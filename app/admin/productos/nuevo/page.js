import ProductForm from '@/components/admin/ProductForm';
import Link from 'next/link';

export default function NuevoProductoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/admin/productos" className="text-gray-600 hover:text-gray-900 text-sm">
          ← Volver a productos
        </Link>
      </div>

      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-8">
        Nuevo Producto
      </h1>

      <ProductForm />
    </div>
  );
}