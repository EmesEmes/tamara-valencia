import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import CatalogoContent from '@/components/catalogo/CatalogoContent';

export const metadata = {
  title: 'Catálogo - Tamara Valencia Joyas',
  description: 'Explora nuestra colección completa de joyería fina. Anillos, collares, aretes, pulseras y más. Oro, plata, perlas cultivadas y diseños personalizados. Envíos a todo Ecuador.',
  keywords: 'catálogo joyería, comprar joyas online, joyas ecuador, anillos de oro, collares de plata, aretes de perlas, pulseras elegantes, joyería fina, joyas quito',
}

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