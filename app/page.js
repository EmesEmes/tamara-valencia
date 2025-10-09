import Navbar from '@/components/ui/Navbar';
import Hero from '@/components/landing/Hero';
import About from '@/components/landing/About';
import Contact from '@/components/landing/Contact';
import Footer from '@/components/ui/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <About />
      <Contact />
      <Footer />
    </main>
  );
}