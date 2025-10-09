// app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-light tracking-widest text-gray-900">
              LUMIÈRE
            </Link>
            <div className="flex gap-12">
              <Link 
                href="/" 
                className="text-sm tracking-wide text-gray-900 hover:text-gray-600 transition-colors border-b border-gray-900"
              >
                INICIO
              </Link>
              <Link 
                href="/catalogo" 
                className="text-sm tracking-wide text-gray-900 hover:text-gray-600 transition-colors"
              >
                CATÁLOGO
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-6xl md:text-8xl font-extralight tracking-wider text-gray-900 mb-6">
            Elegancia Atemporal
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-light tracking-wide mb-12 max-w-2xl mx-auto">
            Piezas únicas diseñadas para momentos inolvidables
          </p>
          <Link 
            href="/catalogo"
            className="inline-block px-12 py-4 border border-gray-900 text-gray-900 tracking-widest text-sm hover:bg-gray-900 hover:text-white transition-all duration-300"
          >
            EXPLORAR COLECCIÓN
          </Link>
        </div>
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="w-px h-16 bg-gray-300 animate-bounce" />
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light tracking-wider text-gray-900 mb-4">
              Colección Destacada
            </h2>
            <div className="w-24 h-px bg-gray-900 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Anillos', desc: 'Diseños exclusivos' },
              { name: 'Collares', desc: 'Elegancia refinada' },
              { name: 'Aretes', desc: 'Detalles perfectos' }
            ].map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="aspect-square bg-gray-100 mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h3 className="text-xl tracking-wider text-gray-900 mb-2">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-500 tracking-wide">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light tracking-wider text-gray-900 mb-8">
            Crafted with Passion
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            Cada pieza es cuidadosamente diseñada y elaborada por artesanos expertos, 
            combinando técnicas tradicionales con diseño contemporáneo.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            Nuestra misión es crear joyas que cuenten historias y perduren generaciones.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { title: 'Calidad Premium', desc: 'Materiales nobles seleccionados' },
              { title: 'Diseño Único', desc: 'Piezas exclusivas y originales' },
              { title: 'Artesanía', desc: 'Elaboración manual detallada' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 border border-gray-300 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-900" />
                </div>
                <h3 className="text-xl tracking-wider text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 tracking-wide">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light tracking-wider mb-8">
            Encuentra Tu Pieza Perfecta
          </h2>
          <p className="text-lg text-gray-300 mb-12 tracking-wide">
            Explora nuestra colección completa y descubre la joya ideal para ti
          </p>
          <Link 
            href="/catalogo"
            className="inline-block px-12 py-4 border border-white text-white tracking-widest text-sm hover:bg-white hover:text-gray-900 transition-all duration-300"
          >
            VER CATÁLOGO
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-light tracking-widest text-gray-900 mb-4">
            LUMIÈRE
          </div>
          <p className="text-sm text-gray-500 tracking-wide">
            © 2025 Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}