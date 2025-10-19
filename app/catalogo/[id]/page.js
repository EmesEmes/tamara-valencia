import { use } from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ProductDetail from '@/components/catalogo/ProductDetail';

export default function ProductoDetallePage({ params }) {
  const resolvedParams = use(params);
  
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-20">
        <ProductDetail productId={resolvedParams.id} />
      </div>
      <Footer />
    </main>
  );
}