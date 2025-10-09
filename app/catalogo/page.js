import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import CatalogoContent from '@/components/catalogo/CatalogoContent';

export const metadata = {
  title: 'Catálogo - Tamara Valencia',
  description: 'Explora nuestra colección de joyas elegantes',
};

export default function CatalogoPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-20">
        <CatalogoContent />
      </div>
      <Footer />
    </main>
  );
}