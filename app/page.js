import Navbar from '@/components/ui/Navbar';
import Hero from '@/components/landing/Hero';
import About from '@/components/landing/About';
import Contact from '@/components/landing/Contact';
import Footer from '@/components/ui/Footer';
import ConjuntosGrid from '@/components/landing/ConjuntosGrid';

export const metadata = {
  title: 'Tamara Valencia - Joyería Elegante en Oro y Plata | Ecuador',
  description: 'Descubre joyería elegante y exclusiva en Tamara Valencia. Anillos, collares, aretes y pulseras en oro, plata y perlas cultivadas. Diseños únicos hechos a mano en Ecuador.',
  keywords: 'joyería ecuador, joyas de plata, joyas de oro, anillos elegantes, collares exclusivos, aretes de perlas, pulseras de plata, joyería artesanal, Tamara Valencia, joyería Quito',
  openGraph: {
    title: 'Tamara Valencia - Joyería Elegante',
    description: 'Elegancia atemporal en cada pieza. Descubre joyas que cuentan historias.',
    type: 'website',
    locale: 'es_EC',
  },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <ConjuntosGrid />
      <About />
      <Contact />
      <Footer />
    </main>
  );
}