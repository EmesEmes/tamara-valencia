import { use } from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ConjuntoDetalle from '@/components/catalogo/ConjuntoDetalle';

export default function ConjuntoPage({ params }) {
  const resolvedParams = use(params);
  
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-20">
        <ConjuntoDetalle conjuntoId={resolvedParams.id} />
      </div>
      <Footer />
    </main>
  );
}