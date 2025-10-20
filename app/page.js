import Navbar from '@/components/ui/Navbar';
import Hero from '@/components/landing/Hero';
import About from '@/components/landing/About';
import Contact from '@/components/landing/Contact';
import Footer from '@/components/ui/Footer';
import ConjuntosGrid from '@/components/landing/ConjuntosGrid';

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